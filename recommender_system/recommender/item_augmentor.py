"""
recommender/item_augmentor.py
EAIN Recommender — Sitting 16
RAG-grounded item augmentation using Groq LLM.
Enriches each item with recommender-friendly metadata fields.
"""

from __future__ import annotations
import json, time, re
from pathlib import Path
from typing import Optional

from groq import Groq


# ─────────────────────────────────────────────────────────────────
# Augmentation fields (7 fields per item)
# ─────────────────────────────────────────────────────────────────
AUGMENT_FIELDS = [
    "style_theme",
    "occasion",
    "target_buyer",
    "fabric_quality",
    "cultural_context",
    "price_appeal",
    "unique_attributes",
]

# ─────────────────────────────────────────────────────────────────
# Prompt
# ─────────────────────────────────────────────────────────────────
SYSTEM_PROMPT = """You are a product metadata expert for EAIN, a Pakistani e-commerce platform
selling clothing, accessories, jewelry, beauty services, and wedding services.

Your job: given an item's details and similar items for context, return a JSON object
with exactly these 7 fields:
- style_theme        : 2-5 word style label (e.g. "ethnic bridal luxury")
- occasion           : 1-3 specific occasions (e.g. "wedding, eid, formal dinner")
- target_buyer       : target demographic (e.g. "women 18-35, fashion-conscious")
- fabric_quality     : material/quality descriptor (use "N/A" for services)
- cultural_context   : cultural positioning (e.g. "Pakistani traditional", "modern urban fusion")
- price_appeal       : one of: budget-friendly | mid-market | premium | luxury
- unique_attributes  : 2-4 standout features as comma-separated phrases

Rules:
- Be specific to the item. Never use generic filler like "high quality" or "great product".
- For services (photography, makeup, mehndi), fabric_quality must be "N/A".
- price_appeal must exactly match one of the four allowed values.
- Return ONLY valid JSON. No markdown fences. No explanation text.
"""


def _build_user_prompt(item: dict, context_items: list[dict]) -> str:
    ctx_lines = []
    for c in context_items[:3]:
        ctx_lines.append(
            f"  - {c.get('title','')} ({c.get('category','')}) — {c.get('description_en','')[:80]}"
        )
    ctx_str = "\n".join(ctx_lines) if ctx_lines else "  (none)"

    tags = item.get("tags", [])
    if isinstance(tags, str):
        try:
            tags = json.loads(tags.replace("'", '"'))
        except Exception:
            tags = [t.strip() for t in tags.split(",")]

    # Pre-format price to avoid f-string format-spec conflicts
    price = item.get("price", 0)
    try:
        price_str = f"PKR {float(price):,.0f}"
    except (ValueError, TypeError):
        price_str = f"PKR {price}"

    price_band   = item.get("price_band", "mid")
    listing_id   = item.get("listing_id", "")
    title        = item.get("title_en", "")
    category     = item.get("category", "")
    listing_type = item.get("listing_type", "product")
    city         = item.get("city", "")
    desc         = str(item.get("description_en", "") or "")[:300]
    tags_str     = ", ".join(tags)

    return (
        "Item to augment:\n"
        f"  ID          : {listing_id}\n"
        f"  Title       : {title}\n"
        f"  Category    : {category}\n"
        f"  Type        : {listing_type}\n"
        f"  Price       : {price_str} ({price_band})\n"
        f"  City        : {city}\n"
        f"  Tags        : {tags_str}\n"
        f"  Description : {desc}\n"
        "\nSimilar items for context:\n"
        f"{ctx_str}\n"
        "\nReturn JSON only."
    )


# ─────────────────────────────────────────────────────────────────
# JSON parser (robust)
# ─────────────────────────────────────────────────────────────────
def _parse_json(raw: str) -> Optional[dict]:
    raw = raw.strip()
    raw = re.sub(r"^```(?:json)?\s*", "", raw)
    raw = re.sub(r"\s*```$", "", raw)
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        m = re.search(r"\{.*\}", raw, re.DOTALL)
        if m:
            try:
                return json.loads(m.group())
            except Exception:
                pass
    return None


def _validate_fields(aug: dict) -> dict:
    """Ensure all 7 fields present; fill missing with sensible defaults."""
    price_map = {
        "budget":  "budget-friendly",
        "low":     "budget-friendly",
        "mid":     "mid-market",
        "high":    "premium",
        "luxury":  "luxury",
    }
    defaults = {
        "style_theme":       "fashion",
        "occasion":          "casual",
        "target_buyer":      "women",
        "fabric_quality":    "N/A",
        "cultural_context":  "Pakistani",
        "price_appeal":      "mid-market",
        "unique_attributes": "stylish design",
    }
    for f in AUGMENT_FIELDS:
        if f not in aug or not aug[f]:
            aug[f] = defaults[f]
    pa = aug["price_appeal"].lower()
    for k, v in price_map.items():
        if k in pa:
            aug["price_appeal"] = v
            break
    return aug


# ─────────────────────────────────────────────────────────────────
# Core augmentor class
# ─────────────────────────────────────────────────────────────────
class ItemAugmentor:
    def __init__(self, groq_api_key: str,
                 model: str = "llama3-8b-8192",
                 delay: float = 0.5):
        self.client = Groq(api_key=groq_api_key)
        self.model  = model
        self.delay  = delay

    def augment_item(self, item: dict, context_items: list[dict]) -> dict:
        """Call LLM and return augmentation dict for one item."""
        prompt = _build_user_prompt(item, context_items)
        resp = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user",   "content": prompt},
            ],
            temperature=0.2,
            max_tokens=300,
        )
        raw = resp.choices[0].message.content or ""
        aug = _parse_json(raw)
        if aug is None:
            aug = {}
        return _validate_fields(aug)

    def augment_batch(self,
                      items: list[dict],
                      context_lookup: dict,
                      start_idx: int = 0,
                      checkpoint_path: Optional[Path] = None,
                      checkpoint_every: int = 25) -> list[dict]:
        """
        Augment a batch of items with progress + checkpointing.
        context_lookup: {item_id: [similar_item_dicts]}
        """
        results = []
        total   = len(items)

        for i, item in enumerate(items):
            iid     = str(item.get("listing_id", ""))
            ctx     = context_lookup.get(iid, [])
            abs_idx = start_idx + i

            try:
                aug    = self.augment_item(item, ctx)
                record = {"item_id": iid, "augmentation": aug, "status": "ok"}
            except Exception as e:
                record = {
                    "item_id":      iid,
                    "augmentation": _validate_fields({}),
                    "status":       f"error: {e}",
                }

            results.append(record)

            if (i + 1) % 10 == 0 or i == total - 1:
                title = item.get("title_en", "")[:45]
                print(f"  [{abs_idx+1:>3}] {title:45s} → {record['status']}")

            if checkpoint_path and (i + 1) % checkpoint_every == 0:
                _save_checkpoint(results, checkpoint_path)

            time.sleep(self.delay)

        return results


# ─────────────────────────────────────────────────────────────────
# Checkpoint helpers
# ─────────────────────────────────────────────────────────────────
def _save_checkpoint(results: list, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)


def load_checkpoint(path: Path) -> list[dict]:
    if not path.exists():
        return []
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def merge_augmented(items_df_records: list[dict],
                    aug_results: list[dict]) -> list[dict]:
    """Merge augmentation fields back into item records."""
    aug_map = {r["item_id"]: r["augmentation"] for r in aug_results}
    merged  = []
    for item in items_df_records:
        iid = str(item.get("listing_id", ""))
        aug = aug_map.get(iid, _validate_fields({}))
        merged.append({**item, **aug})
    return merged