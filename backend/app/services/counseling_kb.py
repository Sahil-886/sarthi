"""
Counseling Knowledge Base Service
Retrieves relevant mental health counseling examples from ChromaDB
to ground the AI companion's responses in real counselor expertise.
"""
try:
    import chromadb
    from chromadb import Documents, EmbeddingFunction, Embeddings
    CHROMA_AVAILABLE = True
except ImportError:
    CHROMA_AVAILABLE = False
    class EmbeddingFunction: pass

from app.core.config import settings
import logging
import os
import re

logger = logging.getLogger(__name__)

COLLECTION_NAME = "mental_health_counseling_kb"


class KeywordEmbeddingFunction(EmbeddingFunction):
    """Fast, dependency-free keyword hashing embeddings — no downloads needed."""
    DIM = 384
    STOPWORDS = {"i", "me", "my", "the", "a", "an", "is", "it", "to",
                 "and", "or", "but", "of", "in", "on", "at", "so",
                 "do", "did", "am", "are", "was", "were", "be", "been"}

    def __call__(self, input: Documents) -> Embeddings:
        embeddings = []
        for text in input:
            vec = [0.0] * self.DIM
            words = re.findall(r"[a-z]+", text.lower())
            for word in words:
                if word in self.STOPWORDS:
                    continue
                idx = int(hashlib.md5(word.encode()).hexdigest(), 16) % self.DIM
                vec[idx] += 1.0
            norm = sum(x * x for x in vec) ** 0.5 or 1.0
            embeddings.append([x / norm for x in vec])
        return embeddings


class CounselingKnowledgeBase:
    def __init__(self):
        self.collection = None
        if not CHROMA_AVAILABLE:
            logger.warning("ChromaDB not available — Counseling KB disabled.")
            return

        try:
            os.makedirs(settings.CHROMA_PATH, exist_ok=True)
            self.client = chromadb.PersistentClient(path=settings.CHROMA_PATH)
            self.collection = self.client.get_or_create_collection(
                name=COLLECTION_NAME,
                embedding_function=KeywordEmbeddingFunction(),
                metadata={"description": "Mental health counseling Q&A pairs for RAG"}
            )
            count = self.collection.count()
            logger.info(f"Counseling KB loaded with {count} examples.")
        except Exception as e:
            logger.error(f"Failed to initialize Counseling KB: {e}")

    def is_populated(self) -> bool:
        if not self.collection:
            return False
        return self.collection.count() > 0

    def retrieve_counseling_examples(self, query: str, n_results: int = 3) -> list:
        """Retrieve the most relevant counselor Q&A pairs for the user's message."""
        if not self.collection or not self.is_populated():
            return []
        try:
            count = self.collection.count()
            safe_n = min(n_results, count)
            results = self.collection.query(
                query_texts=[query],
                n_results=safe_n
            )
            examples = []
            if results and results.get("documents"):
                docs = results["documents"][0]
                metas = results["metadatas"][0] if results.get("metadatas") else [{}] * len(docs)
                for doc, meta in zip(docs, metas):
                    examples.append({
                        "context": meta.get("context", ""),
                        "response": doc
                    })
            return examples
        except Exception as e:
            logger.error(f"Error querying counseling KB: {e}")
            return []


counseling_kb = CounselingKnowledgeBase()
