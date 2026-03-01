import logging
import os
from app.core.config import settings

try:
    import chromadb
    CHROMA_AVAILABLE = True
except ImportError:
    CHROMA_AVAILABLE = False

logger = logging.getLogger(__name__)

class MemoryService:
    def __init__(self):
        self.collection = None
        if not CHROMA_AVAILABLE:
            logger.warning("ChromaDB not available — memory service disabled.")
            return

        try:
            os.makedirs(settings.CHROMA_PATH, exist_ok=True)
            self.client = chromadb.PersistentClient(path=settings.CHROMA_PATH)
            self.collection = self.client.get_or_create_collection(name="user_memories")
        except Exception as e:
            logger.error(f"Failed to initialize ChromaDB: {e}")

    def store_memory(self, user_id: int, text: str, metadata: dict = None):
        if not self.collection:
            return
            
        if metadata is None:
            metadata = {}
        metadata["user_id"] = user_id
        metadata["timestamp"] = time.time()
        
        doc_id = f"mem_{user_id}_{uuid.uuid4().hex[:8]}"
        
        try:
            self.collection.add(
                documents=[text],
                metadatas=[metadata],
                ids=[doc_id]
            )
        except Exception as e:
            logger.error(f"Error storing memory in ChromaDB: {e}")

    def retrieve_relevant_context(self, user_id: int, query_text: str, n_results: int = 3) -> list:
        if not self.collection:
            return []
            
        try:
            # We must gracefully handle if the collection has fewer items than n_results
            count = self.collection.count()
            if count == 0:
                return []
            
            safe_n_results = min(n_results, count)
            
            results = self.collection.query(
                query_texts=[query_text],
                n_results=safe_n_results,
                where={"user_id": user_id}
            )
            
            if results and results.get('documents') and len(results['documents']) > 0:
                return results['documents'][0]
            return []
        except Exception as e:
            logger.error(f"Error retrieving memory context: {e}")
            return []

memory_service = MemoryService()
