"""
recommender/hybrid_retriever.py
EAIN Recommender — Sitting 13 (v2 — improved)
Hybrid Retriever: FAISS (dense) + BM25 (sparse) + Popularity fallback
fused via weighted Reciprocal Rank Fusion (RRF).

Improvements over v1:
  1. Price band → natural language keywords in BM25 doc
  2. Transliterated tags added to bilingual text for better Urdu coverage
  3. rrf_k lowered to 30 (better for small 87-item catalog)
  4. Weighted RRF: FAISS=1.5, BM25=1.0, Popularity=0.5
"""

import numpy as np
import pickle
from pathlib import Path
from collections import defaultdict
from rank_bm25 import BM25Okapi


# ─────────────────────────────────────────────────────────────────
# Price band → natural language mapping
# ─────────────────────────────────────────────────────────────────
PRICE_BAND_KEYWORDS = {
    "low":  "budget affordable cheap low price inexpensive",
    "mid":  "mid range moderate reasonable average price",
    "high": "premium luxury expensive high end exclusive",
}


# ─────────────────────────────────────────────────────────────────
# Text builders
# ─────────────────────────────────────────────────────────────────
def build_item_text_en(row: dict) -> str:
    """
    English document for BM25 and dense encoding.
    FIX #2: price_band mapped to natural language keywords so
            "low price kurti" matches items with price_band=low.
    """
    tags = row.get("tags", [])
    if isinstance(tags, str):
        import ast
        try:
            tags = ast.literal_eval(tags)
        except:
            tags = []

    pb = str(row.get("price_band", "")).lower()
    pb_text = PRICE_BAND_KEYWORDS.get(pb, pb)

    parts = [
        str(row.get("title_en", "")),
        str(row.get("category", "")),
        str(row.get("subcategory", "")),
        str(row.get("city", "")),
        pb_text,
        " ".join(str(t) for t in tags),
        str(row.get("description_en", ""))[:200],
    ]
    return " ".join(p for p in parts if p.strip())


def build_item_text_bilingual(row: dict) -> str:
    """
    Bilingual (Urdu + English) string for FAISS dense encoding.
    FIX #1: tags added as transliteration bridge between Urdu and English.
    """
    tags = row.get("tags", [])
    if isinstance(tags, str):
        import ast
        try:
            tags = ast.literal_eval(tags)
        except:
            tags = []

    en = build_item_text_en(row)
    ur = f"{row.get('title_ur', '')} {str(row.get('description_ur', ''))[:100]}"
    transliterated = " ".join(str(t) for t in tags)
    return f"{en} {ur} {transliterated}".strip()


# ─────────────────────────────────────────────────────────────────
# Weighted RRF Fusion  (FIX #4)
# ─────────────────────────────────────────────────────────────────
def reciprocal_rank_fusion(ranked_lists: list,
                           weights: list = None,
                           k: int = 30) -> list:
    """
    Fuse multiple ranked lists using weighted Reciprocal Rank Fusion.

    ranked_lists : list of lists — each = [(item_id, score), ...]
    weights      : per-list multipliers (default 1.0 each)
                   recommended: [1.5, 1.0, 0.5] for [FAISS, BM25, Pop]
    k            : RRF constant. Lower = more weight to top ranks.
                   30 works better than 60 for small catalogs (87 items).
    returns      : sorted [(item_id, rrf_score), ...]
    """
    if weights is None:
        weights = [1.0] * len(ranked_lists)

    rrf_scores = defaultdict(float)
    for ranked, w in zip(ranked_lists, weights):
        for rank, (item_id, _) in enumerate(ranked):
            rrf_scores[item_id] += w / (k + rank + 1)

    return sorted(rrf_scores.items(), key=lambda x: x[1], reverse=True)


# ─────────────────────────────────────────────────────────────────
# HybridRetriever
# ─────────────────────────────────────────────────────────────────
class HybridRetriever:
    """
    FAISS + BM25 + Popularity hybrid retriever with weighted RRF fusion.

    Args:
        df_items          : DataFrame with item metadata
        embed_model_name  : sentence-transformers model for dense encoding
        rrf_k             : RRF constant (default 30 for small catalogs)
        faiss_weight      : RRF weight for FAISS signal (default 1.5)
        bm25_weight       : RRF weight for BM25 signal (default 1.0)
        pop_weight        : RRF weight for popularity signal (default 0.5)
        faiss_candidates  : candidates FAISS returns before RRF
        bm25_candidates   : candidates BM25 returns before RRF
    """

    def __init__(self, df_items,
                 embed_model_name: str = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2",
                 rrf_k: int = 30,
                 faiss_weight: float = 1.5,
                 bm25_weight: float = 1.0,
                 pop_weight: float = 0.5,
                 faiss_candidates: int = 50,
                 bm25_candidates: int = 50):

        self.df_items = df_items.copy()
        self.df_items["listing_id"] = self.df_items["listing_id"].astype(str)
        self.embed_model_name = embed_model_name
        self.rrf_k = rrf_k
        self.rrf_weights = [faiss_weight, bm25_weight, pop_weight]
        self.faiss_candidates = faiss_candidates
        self.bm25_candidates = bm25_candidates

        self.all_item_ids = self.df_items["listing_id"].tolist()
        self.item_lookup = {
            r["listing_id"]: r
            for _, r in self.df_items.iterrows()
        }

        self._faiss_index = None
        self._embeddings = None
        self._bm25 = None
        self._bm25_corpus = None
        self._pop_scores = {}
        self._embed_model = None

    # ── Build ─────────────────────────────────────────────────────
    def build(self, df_train=None, index_dir: Path = None):
        """Build all three indices. Loads from cache if available."""
        if index_dir and self._try_load(index_dir):
            print("  Loaded cached indices from", index_dir)
            self._build_popularity(df_train)
            return

        print("  Building FAISS dense index...")
        self._build_faiss()

        print("  Building BM25 sparse index...")
        self._build_bm25()

        print("  Building popularity scores...")
        self._build_popularity(df_train)

        if index_dir:
            self._save(index_dir)
            print(f"  Indices cached → {index_dir}")

    def _build_faiss(self):
        import faiss
        from sentence_transformers import SentenceTransformer

        self._embed_model = SentenceTransformer(self.embed_model_name)

        docs = [
            build_item_text_bilingual(row)
            for _, row in self.df_items.iterrows()
        ]
        print(f"    Encoding {len(docs)} items...")
        vecs = self._embed_model.encode(
            docs,
            show_progress_bar=True,
            batch_size=32,
            convert_to_numpy=True
        )
        vecs = vecs.astype("float32")
        faiss.normalize_L2(vecs)

        dim = vecs.shape[1]
        index = faiss.IndexFlatIP(dim)
        index.add(vecs)

        self._faiss_index = index
        self._embeddings = vecs
        print(f"    FAISS index: {index.ntotal} vectors, dim={dim}")

    def _build_bm25(self):
        self._bm25_corpus = [
            build_item_text_en(row).lower().split()
            for _, row in self.df_items.iterrows()
        ]
        self._bm25 = BM25Okapi(self._bm25_corpus)
        print(f"    BM25 index: {len(self._bm25_corpus)} documents")

    def _build_popularity(self, df_train=None):
        if df_train is not None:
            counts = df_train["listing_id"].astype(str).value_counts().to_dict()
        else:
            counts = {iid: 1 for iid in self.all_item_ids}
        max_c = max(counts.values()) if counts else 1
        self._pop_scores = {
            iid: counts.get(iid, 0) / max_c
            for iid in self.all_item_ids
        }

    # ── Save / Load ───────────────────────────────────────────────
    def _save(self, index_dir: Path):
        import faiss

        index_dir.mkdir(parents=True, exist_ok=True)
        faiss.write_index(self._faiss_index, str(index_dir / "faiss.index"))
        np.save(index_dir / "embeddings.npy", self._embeddings)
        with open(index_dir / "bm25.pkl", "wb") as f:
            pickle.dump(
                {
                    "bm25": self._bm25,
                    "corpus": self._bm25_corpus,
                },
                f
            )

    def _try_load(self, index_dir: Path) -> bool:
        import faiss

        fi = index_dir / "faiss.index"
        bi = index_dir / "bm25.pkl"
        ei = index_dir / "embeddings.npy"
        if not (fi.exists() and bi.exists() and ei.exists()):
            return False

        self._faiss_index = faiss.read_index(str(fi))
        self._embeddings = np.load(str(ei))
        with open(bi, "rb") as f:
            data = pickle.load(f)
        self._bm25 = data["bm25"]
        self._bm25_corpus = data["corpus"]

        from sentence_transformers import SentenceTransformer
        self._embed_model = SentenceTransformer(self.embed_model_name)
        return True

    # ── Query encoding ────────────────────────────────────────────
    def _encode_query(self, query: str) -> np.ndarray:
        import faiss

        vec = self._embed_model.encode([query], convert_to_numpy=True).astype("float32")
        faiss.normalize_L2(vec)
        return vec

    # ── Individual retrievers ─────────────────────────────────────
    def _faiss_retrieve(self, query: str, k: int) -> list:
        q_vec = self._encode_query(query)
        scores, indices = self._faiss_index.search(q_vec, k)
        return [
            (self.all_item_ids[int(i)], float(s))
            for i, s in zip(indices[0], scores[0]) if i >= 0
        ]

    def _bm25_retrieve(self, query: str, k: int) -> list:
        tokens = query.lower().split()
        scores = self._bm25.get_scores(tokens)
        top_k = np.argsort(scores)[::-1][:k]
        return [
            (self.all_item_ids[int(i)], float(scores[i]))
            for i in top_k
        ]

    def _popularity_retrieve(self, k: int) -> list:
        return sorted(
            self._pop_scores.items(),
            key=lambda x: x[1],
            reverse=True
        )[:k]

    # ── Main retrieve ─────────────────────────────────────────────
    def retrieve(self, query: str, top_k: int = 20,
                 use_popularity: bool = True,
                 exclude_ids: set = None) -> list:
        """
        Retrieve top_k items via weighted RRF(FAISS + BM25 + Popularity).

        Args:
            query          : text query — English or Urdu
            top_k          : number of final candidates
            use_popularity : include popularity as third signal
            exclude_ids    : item_ids to exclude (e.g. seen items)

        Returns:
            list of dicts with item_id, title_en, title_ur, category,
            city, price_band, rrf_score, faiss_score, bm25_score
        """
        k_cand = max(top_k * 3, self.faiss_candidates)

        faiss_res = self._faiss_retrieve(query, k_cand)
        bm25_res = self._bm25_retrieve(query, k_cand)

        ranked_lists = [faiss_res, bm25_res]
        weights = self.rrf_weights[:2]
        if use_popularity:
            ranked_lists.append(self._popularity_retrieve(k_cand))
            weights = self.rrf_weights

        fused = reciprocal_rank_fusion(
            ranked_lists,
            weights=weights,
            k=self.rrf_k
        )

        faiss_map = {iid: s for iid, s in faiss_res}
        bm25_map = {iid: s for iid, s in bm25_res}

        results = []
        for item_id, rrf_score in fused:
            if exclude_ids and item_id in exclude_ids:
                continue

            item = self.item_lookup.get(item_id, {})
            results.append({
                "item_id": item_id,
                "title_en": item.get("title_en", ""),
                "title_ur": item.get("title_ur", ""),
                "category": item.get("category", ""),
                "city": item.get("city", ""),
                "price_band": item.get("price_band", ""),
                "rrf_score": round(rrf_score, 6),
                "faiss_score": round(faiss_map.get(item_id, 0.0), 4),
                "bm25_score": round(bm25_map.get(item_id, 0.0), 4),
            })

            if len(results) >= top_k:
                break

        return results

    def retrieve_batch(self, queries: list, top_k: int = 20) -> dict:
        """Retrieve for a list of (user_id, query_text) tuples."""
        return {uid: self.retrieve(q, top_k) for uid, q in queries}