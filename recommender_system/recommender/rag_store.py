"""
recommender/rag_store.py
EAIN Recommender — Sitting 15
LangChain + FAISS vector store built from rag_corpus.json.
Uses local sentence-transformers (same model as HybridRetriever) — no API key needed.
"""

from __future__ import annotations
import json
from pathlib import Path
from typing import Optional

from langchain_community.vectorstores import FAISS
from langchain_community.embeddings   import HuggingFaceEmbeddings
from langchain_core.documents         import Document

# ─────────────────────────────────────────────────────────────────
# Embedding model (shared with HybridRetriever)
# ─────────────────────────────────────────────────────────────────
EMBED_MODEL = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"


def _load_embeddings() -> HuggingFaceEmbeddings:
    return HuggingFaceEmbeddings(
        model_name=EMBED_MODEL,
        model_kwargs={"device": "cpu"},
        encode_kwargs={"normalize_embeddings": True},
    )


# ─────────────────────────────────────────────────────────────────
# Build vector store
# ─────────────────────────────────────────────────────────────────
def build_vector_store(corpus: list[dict],
                       index_dir: Path) -> FAISS:
    """
    Build and persist LangChain FAISS vector store from corpus docs.
    Each doc gets its metadata attached for downstream filtering.
    """
    embeddings = _load_embeddings()

    lc_docs = [
        Document(
            page_content=doc["text"],
            metadata=doc["metadata"],
        )
        for doc in corpus
    ]

    print(f"  Building FAISS index over {len(lc_docs)} documents …")
    vs = FAISS.from_documents(lc_docs, embeddings)

    index_dir.mkdir(parents=True, exist_ok=True)
    vs.save_local(str(index_dir))
    print(f"  Saved vector store → {index_dir}/")
    return vs


# ─────────────────────────────────────────────────────────────────
# Load vector store
# ─────────────────────────────────────────────────────────────────
def load_vector_store(index_dir: Path) -> Optional[FAISS]:
    """Load persisted FAISS vector store. Returns None if not found."""
    faiss_file = index_dir / "index.faiss"
    if not faiss_file.exists():
        return None
    embeddings = _load_embeddings()
    return FAISS.load_local(str(index_dir),
                            embeddings,
                            allow_dangerous_deserialization=True)


# ─────────────────────────────────────────────────────────────────
# Retrieval helpers
# ─────────────────────────────────────────────────────────────────
def rag_retrieve(vs: FAISS, query: str, k: int = 5) -> list[dict]:
    """
    Retrieve top-k docs for query.
    Returns list of {item_id, title, score, text_snippet}.
    """
    results = vs.similarity_search_with_score(query, k=k)
    output  = []
    for doc, score in results:
        output.append({
            "item_id":      doc.metadata.get("item_id", ""),
            "title":        doc.metadata.get("title", ""),
            "category":     doc.metadata.get("category", ""),
            "score":        round(float(score), 4),
            "text_snippet": doc.page_content[:200],
        })
    return output


def rag_retrieve_by_item(vs: FAISS, item_text: str, k: int = 6) -> list[dict]:
    """
    Given an item's own document text, retrieve the k most similar items
    (used for item-based context enrichment in the reranker).
    Skips exact self-match if it appears in results.
    """
    return rag_retrieve(vs, item_text, k=k)
