"""
recommender/plotting.py
EAIN Recommender — Reusable plot helpers.
Updated in Sitting 14: added recall curve and pool size ablation plots.
"""

import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path


def plot_ablation_bar(df_abl, out_path: Path):
    """
    Bar chart comparing Recall@5, Recall@10, Recall@50 across ablation conditions.
    """
    metrics = ["Recall@5", "Recall@10", "Recall@50"]
    conds   = df_abl.index.tolist()
    colors  = ["#6366f1", "#ef4444", "#22c55e"]
    x, w    = np.arange(len(metrics)), 0.25

    sns.set_style("whitegrid")
    fig, ax = plt.subplots(figsize=(10, 5))

    for i, (cond, color) in enumerate(zip(conds, colors)):
        vals = [df_abl.loc[cond, m] for m in metrics]
        bars = ax.bar(x + i*w, vals, w, label=cond,
                      color=color, alpha=0.88, edgecolor="white", linewidth=0.8)
        for bar, val in zip(bars, vals):
            ax.text(bar.get_x() + bar.get_width()/2,
                    bar.get_height() + 0.005,
                    f"{val:.3f}", ha="center", va="bottom",
                    fontsize=8.5, fontweight="bold")

    base_r10 = df_abl.loc[conds[0], "Recall@10"]
    ax.axhline(y=base_r10, color="gray", linestyle="--",
               alpha=0.5, linewidth=1)
    ax.set_xlabel("Metric", fontsize=12)
    ax.set_ylabel("Score", fontsize=12)
    ax.set_title("Phase 2 Ablation — Effect of Augmentation on Recall\n"
                 "(higher is better)", fontsize=13)
    ax.set_xticks(x + w)
    ax.set_xticklabels(metrics, fontsize=11)
    ax.legend(loc="upper left", fontsize=10)
    ax.set_ylim(0, min(1.0, df_abl[metrics].values.max() * 1.30))
    plt.tight_layout()
    plt.savefig(out_path, dpi=150)
    plt.close()


def plot_retrieval_recall_curves(summary_df, out_path: Path):
    """
    Line chart: Recall@K for FAISS-only vs Hybrid across K values (Sitting 14).
    """
    methods = summary_df["method"].unique().tolist()
    colors  = {"FAISS Only": "#ef4444", "Hybrid": "#6366f1"}

    sns.set_style("whitegrid")
    fig, ax = plt.subplots(figsize=(9, 5))

    for method in methods:
        sub = summary_df[summary_df["method"] == method].sort_values("K")
        ax.plot(sub["K"], sub["Recall"], marker="o", linewidth=2.2,
                label=method, color=colors.get(method, "gray"))
        for _, row in sub.iterrows():
            ax.annotate(f"{row['Recall']:.3f}",
                        xy=(row["K"], row["Recall"]),
                        xytext=(4, 6), textcoords="offset points",
                        fontsize=8.5, color=colors.get(method, "gray"))

    ax.set_xlabel("Candidate Pool Size (K)", fontsize=12)
    ax.set_ylabel("Recall@K", fontsize=12)
    ax.set_title("Retrieval Recall Curves — FAISS-only vs Hybrid", fontsize=13)
    ax.legend(loc="lower right", fontsize=10)
    ax.set_ylim(0, 1.05)
    plt.tight_layout()
    plt.savefig(out_path, dpi=150)
    plt.close()


def plot_pool_size_ablation(pool_df, optimal_k: int, out_path: Path):
    """
    Bar + line chart: Recall and marginal gain vs pool size (Sitting 14).
    Marks the optimal K for reranking.
    """
    sns.set_style("whitegrid")
    fig, ax1 = plt.subplots(figsize=(9, 5))
    ax2 = ax1.twinx()

    x      = range(len(pool_df))
    labels = [str(int(ps)) for ps in pool_df["PoolSize"]]

    bars = ax1.bar(x, pool_df["Recall"], color="#6366f1", alpha=0.75,
                   label="Recall@K", width=0.4)
    ax2.plot(x, pool_df["gain_vs_prev"], color="#ef4444", marker="o",
             linewidth=2, label="Marginal gain")

    for bar, val in zip(bars, pool_df["Recall"]):
        ax1.text(bar.get_x() + bar.get_width()/2,
                 bar.get_height() + 0.005,
                 f"{val:.3f}", ha="center", va="bottom", fontsize=9)

    # Mark optimal K
    opt_rows = pool_df[pool_df["PoolSize"] == optimal_k]
    if not opt_rows.empty:
        pos = pool_df.index.get_loc(opt_rows.index[0])
        ax1.axvline(x=pos, color="#22c55e", linestyle="--",
                    linewidth=1.5, label=f"Optimal K={optimal_k}")

    ax1.set_xticks(list(x))
    ax1.set_xticklabels(labels, fontsize=11)
    ax1.set_xlabel("Pool Size", fontsize=12)
    ax1.set_ylabel("Recall@K", fontsize=12)
    ax2.set_ylabel("Marginal Gain", fontsize=12)
    ax1.set_title("Pool Size Ablation — Hybrid Retrieval", fontsize=13)

    lines1, labels1 = ax1.get_legend_handles_labels()
    lines2, labels2 = ax2.get_legend_handles_labels()
    ax1.legend(lines1 + lines2, labels1 + labels2, loc="lower right", fontsize=9)
    plt.tight_layout()
    plt.savefig(out_path, dpi=150)
    plt.close()