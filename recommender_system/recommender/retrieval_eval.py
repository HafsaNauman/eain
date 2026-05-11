"""
recommender/retrieval_eval.py
EAIN Recommender — Sitting 14
Retrieval evaluation logic: FAISS-only vs Hybrid, Recall@K, pool size ablation.
"""

import numpy as np
import pandas as pd
from collections import defaultdict


# ─────────────────────────────────────────────────────────────────
# Ground truth builder
# ─────────────────────────────────────────────────────────────────
def build_ground_truth(df_test, user2idx):
    """Returns {user_id: set(item_ids)} for users present in user2idx."""
    gt = defaultdict(set)
    for _, row in df_test.iterrows():
        uid = row["user_id"]
        iid = str(row["listing_id"])
        if uid in user2idx:
            gt[uid].add(iid)
    return dict(gt)


# ─────────────────────────────────────────────────────────────────
# Recall@K evaluator
# ─────────────────────────────────────────────────────────────────
def recall_at_k(retrieved: list, relevant: set, k: int) -> float:
    """Recall@K for a single user."""
    if not relevant:
        return 0.0
    hits = len(set(r["item_id"] for r in retrieved[:k]) & relevant)
    return hits / len(relevant)


# ─────────────────────────────────────────────────────────────────
# FAISS-only retrieval (bypasses BM25 + popularity)
# ─────────────────────────────────────────────────────────────────
def faiss_only_retrieve(retriever, query: str, k: int) -> list:
    """Retrieve using FAISS dense index only — no BM25, no popularity."""
    results = retriever._faiss_retrieve(query, k)
    return [{"item_id": iid, "score": s} for iid, s in results]


# ─────────────────────────────────────────────────────────────────
# User query builder from interaction history
# ─────────────────────────────────────────────────────────────────
def build_user_query(user_id, df_train, item_lookup):
    """
    Build a text query for a user from their interaction history.
    Concatenates title_en + category of their top-3 interacted items.
    """
    user_items = (df_train[df_train["user_id"] == user_id]
                  .sort_values("event_weight", ascending=False)
                  .head(3)["listing_id"].astype(str).tolist())

    parts = []
    for iid in user_items:
        item = item_lookup.get(iid, {})
        t = str(item.get("title_en", ""))
        c = str(item.get("category", ""))
        if t: parts.append(t)
        if c: parts.append(c)
    return " ".join(parts) if parts else "Pakistani fashion clothing accessories"


# ─────────────────────────────────────────────────────────────────
# Main evaluation: FAISS-only vs Hybrid across Ks
# ─────────────────────────────────────────────────────────────────
def evaluate_retrieval_methods(retriever, df_train, df_test,
                                user2idx, item_lookup,
                                K_values=(50, 200, 1000)):
    """
    Compare FAISS-only vs Hybrid retrieval across multiple K values.
    Returns DataFrame with columns: [Method, K, Recall, n_users]
    """
    ground_truth = build_ground_truth(df_test, user2idx)
    max_k = max(K_values)
    rows  = []

    for user_id, relevant in ground_truth.items():
        query = build_user_query(user_id, df_train, item_lookup)

        # FAISS-only (no BM25, no popularity)
        faiss_res = faiss_only_retrieve(retriever, query, max_k)

        # Hybrid (FAISS + BM25 + Popularity via RRF)
        hybrid_res = retriever.retrieve(query, top_k=max_k)

        for k in K_values:
            rows.append({
                "user_id":    user_id,
                "method":     "FAISS Only",
                "K":          k,
                "recall":     recall_at_k(faiss_res,  relevant, k),
            })
            rows.append({
                "user_id":    user_id,
                "method":     "Hybrid",
                "K":          k,
                "recall":     recall_at_k(hybrid_res, relevant, k),
            })

    df = pd.DataFrame(rows)
    summary = (df.groupby(["method", "K"])["recall"]
                 .agg(["mean", "std", "count"])
                 .reset_index()
                 .rename(columns={"mean": "Recall", "std": "Std", "count": "n_users"}))
    summary["Recall"] = summary["Recall"].round(4)
    summary["Std"]    = summary["Std"].round(4)
    return summary


# ─────────────────────────────────────────────────────────────────
# Pool size ablation
# ─────────────────────────────────────────────────────────────────
def evaluate_pool_sizes(retriever, df_train, df_test,
                         user2idx, item_lookup,
                         pool_sizes=(100, 200, 500, 1000)):
    """
    Evaluate Recall@K for different candidate pool sizes (hybrid only).
    Answers: "what is the minimum pool size before recall plateaus?"
    Returns DataFrame with columns: [PoolSize, Recall, gain_vs_prev]
    """
    ground_truth = build_ground_truth(df_test, user2idx)
    max_pool     = max(pool_sizes)
    user_recalls = {ps: [] for ps in pool_sizes}

    for user_id, relevant in ground_truth.items():
        query = build_user_query(user_id, df_train, item_lookup)
        results = retriever.retrieve(query, top_k=max_pool)

        for ps in pool_sizes:
            user_recalls[ps].append(recall_at_k(results, relevant, ps))

    rows = []
    prev_recall = 0.0
    for ps in sorted(pool_sizes):
        r = round(float(np.mean(user_recalls[ps])), 4)
        rows.append({
            "PoolSize":      ps,
            "Recall":        r,
            "gain_vs_prev":  round(r - prev_recall, 4),
        })
        prev_recall = r

    return pd.DataFrame(rows)


# ─────────────────────────────────────────────────────────────────
# Optimal K recommendation
# ─────────────────────────────────────────────────────────────────
def recommend_optimal_k(pool_df, min_gain_threshold=0.01):
    prev_k = None
    for _, row in pool_df.iterrows():
        if prev_k is not None and row["gain_vs_prev"] < min_gain_threshold:
            return int(prev_k)   # return the K BEFORE gain dropped
        prev_k = row["PoolSize"]
    return int(pool_df["PoolSize"].max())