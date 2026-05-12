"""
recommender/evaluation.py
EAIN Recommender — Evaluation Harness (Sitting 6)
All metrics: HR@K, NDCG@K, Recall@K, UniqueTop1, Gini, Cohen's d
"""
import numpy as np


def hit_rate_at_k(recs: dict, gt: dict, k: int = 10) -> float:
    """Fraction of users with ≥1 relevant item in top-K."""
    hits, total = 0, 0
    for user, true_items in gt.items():
        if not true_items:
            continue
        if any(i in true_items for i in recs.get(user, [])[:k]):
            hits += 1
        total += 1
    return hits / total if total > 0 else 0.0


def ndcg_at_k(recs: dict, gt: dict, k: int = 10) -> float:
    """Normalized Discounted Cumulative Gain at K."""
    scores = []
    for user, true_items in gt.items():
        if not true_items:
            continue
        r = recs.get(user, [])[:k]
        dcg  = sum(1.0 / np.log2(rank + 2)
                   for rank, item in enumerate(r) if item in true_items)
        idcg = sum(1.0 / np.log2(i + 2)
                   for i in range(min(len(true_items), k)))
        scores.append(dcg / idcg if idcg > 0 else 0.0)
    return float(np.mean(scores)) if scores else 0.0


def recall_at_k(recs: dict, gt: dict, k: int = 10) -> float:
    """Average fraction of relevant items captured in top-K."""
    scores = []
    for user, true_items in gt.items():
        if not true_items:
            continue
        r = set(recs.get(user, [])[:k])
        scores.append(len(r & true_items) / len(true_items))
    return float(np.mean(scores)) if scores else 0.0


def recall_at_k_curve(recs: dict, gt: dict,
                      ks: list = [1, 5, 10, 20, 50]) -> dict:
    """Return Recall@K for multiple K values."""
    return {k: round(recall_at_k(recs, gt, k), 6) for k in ks}


def unique_top1(recs: dict, n_users: int) -> float:
    """Fraction of unique items appearing as #1 recommendation."""
    top1 = {v[0] for v in recs.values() if v}
    return len(top1) / max(n_users, 1)


def gini_coefficient(recs: dict, all_items: list, k: int = 10) -> float:
    """
    Measures recommendation concentration.
    0 = all items recommended equally (diverse)
    1 = one item recommended to everyone (popularity bias)
    """
    counts = {iid: 0 for iid in all_items}
    for user_recs in recs.values():
        for item in user_recs[:k]:
            if item in counts:
                counts[item] += 1
    c = sorted(counts.values())
    n, S = len(c), sum(c)
    if S == 0:
        return 0.0
    return float(
        (2 * np.sum(np.arange(1, n + 1) * np.array(c)) - (n + 1) * S) / (n * S)
    )


def per_user_hits(recs: dict, gt: dict, k: int = 10) -> list:
    """Per-user binary hit scores — used for Cohen's d comparisons."""
    return [
        1.0 if any(i in true_items for i in recs.get(u, [])[:k]) else 0.0
        for u, true_items in gt.items() if true_items
    ]


def cohens_d(scores_a: list, scores_b: list) -> float:
    """
    Effect size between two models' per-user score distributions.
    > 0.2 = small, > 0.5 = medium, > 0.8 = large improvement
    """
    a, b = np.array(scores_a), np.array(scores_b)
    pooled = np.sqrt((np.var(a, ddof=1) + np.var(b, ddof=1)) / 2)
    return float((np.mean(a) - np.mean(b)) / pooled) if pooled > 0 else 0.0


def evaluate_model(recs: dict, gt: dict, all_items: list,
                   name: str = "Model") -> dict:
    """Run all metrics and return as a flat dict."""
    return {
        "model":        name,
        "HR@5":         round(hit_rate_at_k(recs, gt, 5),  4),
        "HR@10":        round(hit_rate_at_k(recs, gt, 10), 4),
        "NDCG@5":       round(ndcg_at_k(recs, gt, 5),  4),
        "NDCG@10":      round(ndcg_at_k(recs, gt, 10), 4),
        "Recall@5":     round(recall_at_k(recs, gt, 5),  4),
        "Recall@10":    round(recall_at_k(recs, gt, 10), 4),
        "UniqueTop1":   round(unique_top1(recs, len(gt)), 4),
        "Gini@10":      round(gini_coefficient(recs, all_items, 10), 4),
    }
