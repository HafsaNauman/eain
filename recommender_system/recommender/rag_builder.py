"""
recommender/rag_builder.py
EAIN Recommender — Sitting 15
Builds rag_corpus.json and a LangChain/FAISS vector store from item metadata.
"""

import ast, json
from pathlib import Path

import pandas as pd
import numpy as np


# ─────────────────────────────────────────────────────────────────
# Document builder
# ─────────────────────────────────────────────────────────────────
_PRICE_BANDS = {"low": "budget", "mid": "mid-range", "high": "premium"}
_STOCK_LABELS = {"in_stock": "in stock", "out_of_stock": "out of stock",
                 "low_stock": "low stock"}

EXCLUDE_IDS = {"28", "29"}


def _safe_tags(raw) -> list:
    if isinstance(raw, list): return raw
    if isinstance(raw, str):
        try:   return ast.literal_eval(raw)
        except: return [t.strip() for t in raw.split(",") if t.strip()]
    return []


def build_corpus_doc(row: dict) -> dict:
    """
    Build one structured document per item.
    Returns dict with keys: item_id, text, metadata.
    """
    iid      = str(row.get("listing_id", ""))
    title    = str(row.get("title_en", "") or "").strip()
    cat      = str(row.get("category", "") or "").strip()
    tags     = _safe_tags(row.get("tags", []))
    desc     = str(row.get("description_en", "") or "").strip()
    city     = str(row.get("city", "") or "").strip()
    price    = row.get("price", 0)
    band     = _PRICE_BANDS.get(str(row.get("price_band", "mid")), "mid-range")
    ltype    = str(row.get("listing_type", "product"))
    stock    = _STOCK_LABELS.get(str(row.get("stock_status", "in_stock")), "in stock")
    pop      = int(row.get("popularity_count", 0))

    # Enrich category label for Jewelry items misclassified as Clothing
    JEWELRY_IDS = {"24", "25", "26", "27", "77", "84"}
    if iid in JEWELRY_IDS: cat = "Jewelry"

    tag_str = ", ".join(tags) if tags else "fashion"

    # Natural-language document — used for dense embedding + BM25
    parts = [
        f"{title} is a {ltype} in the {cat} category.",
    ]
    if desc and desc.lower() not in ("nan", "none", ""):
        parts.append(desc)
    if tag_str:
        parts.append(f"Style keywords: {tag_str}.")
    if city:
        parts.append(f"Available in {city}, Pakistan.")
    parts.append(f"Price: PKR {price:,.0f} ({band} segment).")
    parts.append(f"Stock: {stock}. Popularity score: {pop}.")

    text = " ".join(parts)

    metadata = {
        "item_id":    iid,
        "title":      title,
        "category":   cat,
        "tags":       tags,
        "price":      float(price),
        "price_band": band,
        "city":       city,
        "listing_type": ltype,
        "stock_status": stock,
        "popularity": pop,
    }
    return {"item_id": iid, "text": text, "metadata": metadata}


def build_rag_corpus(df_items: pd.DataFrame) -> list[dict]:
    """Build corpus docs for all active, non-excluded items."""
    docs = []
    for _, row in df_items.iterrows():
        iid = str(row.get("listing_id", ""))
        if iid in EXCLUDE_IDS:
            continue
        if not row.get("is_active", True):
            continue
        docs.append(build_corpus_doc(row.to_dict()))
    return docs


def save_corpus(docs: list[dict], out_path: Path) -> None:
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(docs, f, ensure_ascii=False, indent=2)
    print(f"  Saved {len(docs)} documents → {out_path}")


def load_corpus(path: Path) -> list[dict]:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)
