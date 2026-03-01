#!/usr/bin/env python3
"""
Mental Health Counseling Dataset Ingestion Script
================================================
Loads ALL downloaded Kaggle datasets into ChromaDB:
  - ml/datasets/archive/Dataset.csv          (Context, Response) ~6,300 rows
  - ml/datasets/archive/counselchat-data.csv (questionTitle, answerText) ~4,150 rows
  - ml/datasets/archive/counsel_chat2.csv    (questionTitle, answerText) ~3,400 rows
  - ml/datasets/combined_dataset.json        (JSONL, context/response)  ~3,500 rows

Usage:
    cd /Users/sahildevendramakhamale/Desktop/sathi/backend
    python ingest_counseling_data.py
"""
import os
import csv
import sys
import uuid
import json
import hashlib
import re
import logging
import chromadb
from chromadb import Documents, EmbeddingFunction, Embeddings

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

# Allow large CSV fields (some therapy responses are very long)
csv.field_size_limit(min(sys.maxsize, 2147483647))

CHROMA_PATH = "./chroma_data"
COLLECTION_NAME = "mental_health_counseling_kb"
BATCH_SIZE = 200

DATASET_FILES = [
    ("./ml/datasets/archive/Dataset.csv",         "context",       "response"),
    ("./ml/datasets/archive/counselchat-data.csv", "questionTitle", "answerText"),
    ("./ml/datasets/archive/counsel_chat2.csv",    "questionTitle", "answerText"),
]
JSONL_FILE = "./ml/datasets/combined_dataset.json"


# ── Embedding ----------------------------------------------------------------

class KeywordEmbeddingFunction(EmbeddingFunction):
    """Fast, dependency-free keyword hashing — no model download needed."""
    DIM = 384
    STOPWORDS = {"i", "me", "my", "the", "a", "an", "is", "it", "to",
                 "and", "or", "but", "of", "in", "on", "at", "so",
                 "do", "did", "am", "are", "was", "were", "be", "been"}

    def __call__(self, input: Documents) -> Embeddings:
        result = []
        for text in input:
            vec = [0.0] * self.DIM
            for word in re.findall(r"[a-z]+", text.lower()):
                if word in self.STOPWORDS:
                    continue
                idx = int(hashlib.md5(word.encode()).hexdigest(), 16) % self.DIM
                vec[idx] += 1.0
            norm = sum(x * x for x in vec) ** 0.5 or 1.0
            result.append([x / norm for x in vec])
        return result


# ── Built-in curated examples ------------------------------------------------

BUILTIN_EXAMPLES = [
    ("I feel so anxious all the time and I don't know why", "It sounds like you're experiencing persistent anxiety, which can be really exhausting. Anxiety often shows up without an obvious trigger. Let's try to gently explore when you tend to feel it most — is it in social situations, at night, or more spread throughout the day?"),
    ("I can't sleep, my mind just keeps racing", "Racing thoughts at night are really common when we're stressed. Your mind is trying to process a lot. A simple grounding trick is to focus on 5 things you can see in the room. Would you like to talk about what's been on your mind?"),
    ("I feel like nobody understands me", "Feeling misunderstood is one of the loneliest experiences. You don't have to explain yourself perfectly here — I'm just listening. What's something you wish people understood about you?"),
    ("I am so stressed about exams and college", "Academic pressure can feel overwhelming, especially when so much feels like it rides on these results. That stress is valid. Let's break it down — is it more about fear of failing, letting others down, or something else?"),
    ("I feel empty inside, like nothing matters", "That emptiness you're describing sounds heavy. It's different from just sadness — it's like a kind of numbness. Have you been feeling this way for a while, or did something happen recently?"),
    ("I had a panic attack today and I'm scared it will happen again", "Panic attacks are terrifying, especially the fear of them recurring. Know that you survived this one — that matters. Slow, deep breaths through the nose can help interrupt them. Are you in a safe place right now?"),
    ("I don't see the point in anything anymore", "When nothing feels worth it, that's a really important signal that you need some care right now. I'm glad you're talking. Have you had thoughts of hurting yourself, or is it more a feeling of being really worn out?"),
    ("My parents are always fighting and it stresses me out", "Living around constant conflict is really hard, even if it's not about you. It can affect your sleep, focus, and mood. You can't control their relationship, but we can think of ways to protect your own peace at home."),
    ("I feel like a failure", "The feeling of failure can be crushing. But feelings aren't facts — your worth isn't measured by your mistakes. What happened that brought this on? Sometimes talking it through helps separate the facts from the harsh stories we tell ourselves."),
    ("I miss someone who passed away", "Grief is one of the most painful things a person can carry. Missing someone doesn't follow a schedule. It's okay to feel whatever you're feeling — sadness, anger, confusion — all of it is a natural part of love after loss."),
    ("I feel lonely even when I'm around people", "That kind of loneliness — feeling disconnected even in a crowd — is one of the hardest kinds. It usually points to a longing for deeper connection, not just company. Is there anyone in your life you feel even a little understood by?"),
    ("I think I might be depressed", "It takes courage to name that. Depression looks different for everyone — it can be sadness, numbness, fatigue, or just a general heaviness. How long have you been feeling this way? And has it been affecting things like sleep or eating?"),
    ("I get angry so easily and I hate it", "Uncontrolled anger often has pain underneath it — frustration, feeling unheard, or old wounds. The fact that you hate this about yourself shows how much you care. What triggers it most often?"),
    ("I feel worthless", "You are not worthless — but I hear that it feels that way right now, and that's a real and painful experience. These feelings often come when we've been through something hard. Can you tell me more about what's been going on?"),
    ("I'm scared about the future", "Uncertainty about the future can feel paralyzing. Our brains can get stuck catastrophizing about things that haven't happened yet. It helps to gently bring your attention back to today — what's one small thing that's okay right now?"),
    ("I've been having thoughts of hurting myself", "Thank you for telling me this — that took real courage. I want you to know you don't have to carry this alone. Please reach out to a crisis line like iCall (9152987821) or share this with someone you trust. Are you safe right now?"),
    ("I feel like I'm not good enough", "That 'not good enough' feeling is so common, and so painful. It often comes from comparing our insides to other people's outsides. What would you say to a close friend who felt the way you do now?"),
    ("I have trouble talking to people", "Social anxiety is more common than most people think. The fear of saying the wrong thing, or being judged — it's very real. What situations feel hardest for you?"),
    ("I'm going through a breakup and it hurts so much", "Breakups can feel like a kind of grief — you're mourning a person, a future you imagined, and a version of yourself. All of that hurt makes complete sense. Give yourself permission to feel it without judgment."),
    ("I feel like I have to be perfect all the time", "Perfectionism is exhausting — it's like running a race with no finish line. Often underneath it is a fear: of being rejected, or not being lovable if we make mistakes. Where do you think that pressure comes from for you?"),
]


# ── Helpers ------------------------------------------------------------------

def get_collection(client: chromadb.PersistentClient):
    return client.get_or_create_collection(
        name=COLLECTION_NAME,
        embedding_function=KeywordEmbeddingFunction(),
        metadata={"description": "Mental health counseling Q&A pairs for RAG"}
    )


def batch_add(collection, docs, metas, ids):
    """Add in batches of BATCH_SIZE."""
    for i in range(0, len(docs), BATCH_SIZE):
        collection.add(
            documents=docs[i:i + BATCH_SIZE],
            metadatas=metas[i:i + BATCH_SIZE],
            ids=ids[i:i + BATCH_SIZE],
        )


def ingest_builtin(collection):
    logger.info(f"→ Ingesting {len(BUILTIN_EXAMPLES)} built-in examples...")
    docs, metas, ids = [], [], []
    for i, (ctx, resp) in enumerate(BUILTIN_EXAMPLES):
        docs.append(resp[:2000])
        metas.append({"context": ctx[:500], "source": "builtin"})
        ids.append(f"builtin_{i:04d}")
    batch_add(collection, docs, metas, ids)
    logger.info(f"  ✓ {len(docs)} built-in examples loaded.")
    return len(docs)


def ingest_csv(collection, csv_path: str, ctx_col: str, resp_col: str, source_tag: str):
    """Ingest a CSV, auto-detecting column names case-insensitively."""
    if not os.path.exists(csv_path):
        logger.warning(f"  File not found: {csv_path} — skipping.")
        return 0

    docs, metas, ids = [], [], []
    skipped = 0
    with open(csv_path, "r", encoding="utf-8", errors="ignore") as f:
        reader = csv.DictReader(f)
        col_map = {h.lower(): h for h in (reader.fieldnames or [])}
        ctx_key  = col_map.get(ctx_col.lower())
        resp_key = col_map.get(resp_col.lower())
        if not ctx_key or not resp_key:
            # Try fallback columns
            ctx_key  = col_map.get("context") or col_map.get("questiontext")
            resp_key = col_map.get("response") or col_map.get("answertext")
        if not ctx_key or not resp_key:
            logger.warning(f"  Could not find columns in {csv_path}. Columns: {list(col_map.keys())}")
            return 0

        for row in reader:
            ctx  = (row.get(ctx_key)  or "").strip()
            resp = (row.get(resp_key) or "").strip()
            if not ctx or not resp or len(resp) < 20:
                skipped += 1
                continue
            docs.append(resp[:2000])
            metas.append({"context": ctx[:500], "source": source_tag})
            ids.append(f"{source_tag}_{uuid.uuid4().hex[:10]}")

    if docs:
        batch_add(collection, docs, metas, ids)
    logger.info(f"  ✓ {len(docs)} rows from {os.path.basename(csv_path)} ({skipped} skipped).")
    return len(docs)


def ingest_jsonl(collection, jsonl_path: str):
    """Ingest JSONL or per-line JSON file."""
    if not os.path.exists(jsonl_path):
        logger.warning(f"  File not found: {jsonl_path} — skipping.")
        return 0

    docs, metas, ids = [], [], []
    skipped = 0
    with open(jsonl_path, "r", encoding="utf-8", errors="ignore") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                obj = json.loads(line)
            except json.JSONDecodeError:
                skipped += 1
                continue
            ctx  = (obj.get("context") or obj.get("questionTitle") or obj.get("question") or "").strip()
            resp = (obj.get("response") or obj.get("answerText") or obj.get("answer") or "").strip()
            if not ctx or not resp or len(resp) < 20:
                skipped += 1
                continue
            docs.append(resp[:2000])
            metas.append({"context": ctx[:500], "source": "combined_json"})
            ids.append(f"json_{uuid.uuid4().hex[:10]}")

    if docs:
        batch_add(collection, docs, metas, ids)
    logger.info(f"  ✓ {len(docs)} entries from combined_dataset.json ({skipped} skipped).")
    return len(docs)


# ── Main ---------------------------------------------------------------------

def main():
    logger.info("=" * 60)
    logger.info("Mental Health Counseling KB — Full Ingestion")
    logger.info("=" * 60)

    os.makedirs(CHROMA_PATH, exist_ok=True)
    client = chromadb.PersistentClient(path=CHROMA_PATH)
    collection = get_collection(client)

    existing = collection.count()
    logger.info(f"Existing entries in KB: {existing}")

    total = 0

    # 1. Built-in examples (always ensure they exist)
    if existing == 0:
        total += ingest_builtin(collection)

    # 2. Load all 3 CSVs
    logger.info("\n→ Loading Kaggle CSV datasets...")
    total += ingest_csv(collection, DATASET_FILES[0][0], DATASET_FILES[0][1], DATASET_FILES[0][2], "dataset_csv")
    total += ingest_csv(collection, DATASET_FILES[1][0], DATASET_FILES[1][1], DATASET_FILES[1][2], "counselchat_data")
    total += ingest_csv(collection, DATASET_FILES[2][0], DATASET_FILES[2][1], DATASET_FILES[2][2], "counsel_chat2")

    # 3. Load JSONL
    logger.info("\n→ Loading combined JSON dataset...")
    total += ingest_jsonl(collection, JSONL_FILE)

    final = collection.count()
    logger.info(f"\n{'='*60}")
    logger.info(f"✅ Ingestion complete! KB now has {final} total counseling examples.")
    logger.info(f"{'='*60}")


if __name__ == "__main__":
    main()
