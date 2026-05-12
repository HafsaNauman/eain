"""
recommender/user_profiler.py
EAIN Recommender — Sitting 17
Converts user interaction history into compact LLM-generated preference profiles
plus per-dimension importance weights.
"""

from __future__ import annotations
import json, time, re
from pathlib import Path
from typing import Optional

import pandas as pd
from groq import Groq


# ─────────────────────────────────────────────────────────────────
# Profile dimensions
# ─────────────────────────────────────────────────────────────────
PROFILE_FIELDS = [
    "style_preference",
    "preferred_occasions",
    "category_affinity",
    "price_sensitivity",
    "cultural_orientation",
    "brand_cues",
    "inferred_archetype",
]

WEIGHT_FIELDS = [
    "style_weight",
    "occasion_weight",
    "category_weight",
    "price_weight",
    "cultural_weight",
    "brand_weight",
]

# ─────────────────────────────────────────────────────────────────
# System prompt
# ─────────────────────────────────────────────────────────────────
SYSTEM_PROMPT = """You are a user behavior analyst for EAIN, a Pakistani e-commerce platform
selling clothing, accessories, jewelry, beauty services, and wedding services.

Given a user's interaction history (items viewed/purchased/rated, with event weights),
return a JSON object with exactly these 8 fields:

Profile fields (7):
- style_preference      : 3-6 word descriptor (e.g. "ethnic bridal with modern touches")
- preferred_occasions   : 2-4 occasions as comma-separated STRING (e.g. "wedding, eid, formal dinner")
- category_affinity     : top 1-3 categories as comma-separated STRING (e.g. "Clothing, Accessories")
- price_sensitivity     : one of: budget-conscious | value-seeker | premium-buyer | luxury-buyer
- cultural_orientation  : cultural positioning (e.g. "Pakistani traditional", "modern urban")
- brand_cues            : 3-5 style signals as comma-separated STRING (e.g. "embroidered, festive, silk")
- inferred_archetype    : one compact label (e.g. "festive traditional shopper", "urban professional")

Weight object (1):
- importance_weights    : a nested object with keys:
    style_weight, occasion_weight, category_weight,
    price_weight, cultural_weight, brand_weight
  Each is a float between 0.0 and 1.0.
  All 6 weights must sum to exactly 1.0.
  Higher weight = that dimension drives this user's choices more.

Rules:
- Base all fields on actual items in the history. Do not invent preferences.
- price_sensitivity must exactly match one of the four allowed values.
- importance_weights must sum to 1.0 (round to 2 decimal places).
- ALL string fields must be plain strings, never JSON arrays or lists.
- Return ONLY valid JSON. No markdown fences. No explanation.
"""


# ─────────────────────────────────────────────────────────────────
# History builder
# ─────────────────────────────────────────────────────────────────
def _build_history_text(user_id, df_train: pd.DataFrame,
                        item_lookup: dict) -> str:
    rows = (df_train[df_train["user_id"] == user_id]
            .sort_values("event_weight", ascending=False)
            .head(20))

    if rows.empty:
        return "No interaction history available."

    lines = []
    for _, r in rows.iterrows():
        iid   = str(r["listing_id"])
        item  = item_lookup.get(iid, {})
        title = item.get("title_en", f"Item {iid}")
        cat   = item.get("category", "Unknown")
        price = item.get("price", 0)
        tags  = item.get("tags", [])
        if isinstance(tags, str):
            try:    tags = json.loads(tags.replace("'", '"'))
            except: tags = [t.strip() for t in tags.split(",")]
        tag_str = ", ".join(tags[:4]) if tags else ""
        ew      = float(r.get("event_weight", 1.0))
        event   = _weight_label(ew)

        try:
            price_str = f"PKR {float(price):,.0f}"
        except (ValueError, TypeError):
            price_str = f"PKR {price}"

        line = f"  [{event:10s} w={ew:.1f}]  {title} | {cat} | {price_str}"
        if tag_str:
            line += f" | tags: {tag_str}"
        lines.append(line)

    return "\n".join(lines)


def _weight_label(w: float) -> str:
    if w >= 4.0: return "purchased"
    if w >= 2.0: return "rated"
    if w >= 1.0: return "viewed"
    return "skipped"


def _build_user_prompt(user_id, history_text: str) -> str:
    return (
        f"User ID: {user_id}\n"
        "Interaction history (most engaged items first):\n"
        f"{history_text}\n"
        "\nGenerate profile JSON only."
    )


# ─────────────────────────────────────────────────────────────────
# JSON parsing + validation
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
            try: return json.loads(m.group())
            except: pass
    return None


def _normalise_to_str(val) -> str:
    """Ensure a field is always a plain string, never a list."""
    if isinstance(val, list):
        return ", ".join(str(v) for v in val)
    return str(val) if val else ""


def _validate_profile(p: dict, user_id) -> tuple[dict, dict]:
    PRICE_NORM = {
        "budget":  "budget-conscious",
        "low":     "budget-conscious",
        "mid":     "value-seeker",
        "value":   "value-seeker",
        "premium": "premium-buyer",
        "high":    "premium-buyer",
        "luxury":  "luxury-buyer",
    }
    defaults = {
        "style_preference":    "Pakistani fashion",
        "preferred_occasions": "casual, festive",
        "category_affinity":   "Clothing",
        "price_sensitivity":   "value-seeker",
        "cultural_orientation":"Pakistani",
        "brand_cues":          "traditional, colorful",
        "inferred_archetype":  "general fashion shopper",
    }

    # Fill missing fields
    for f, d in defaults.items():
        if f not in p or not p[f]:
            p[f] = d

    # Normalise list-type fields → comma-separated strings
    for list_field in ["category_affinity", "preferred_occasions", "brand_cues"]:
        p[list_field] = _normalise_to_str(p[list_field])

    # Normalise price_sensitivity
    ps = _normalise_to_str(p.get("price_sensitivity", "")).lower()
    matched = False
    for k, v in PRICE_NORM.items():
        if k in ps:
            p["price_sensitivity"] = v
            matched = True
            break
    if not matched:
        p["price_sensitivity"] = defaults["price_sensitivity"]

    # Extract / normalise importance_weights
    raw_w = p.pop("importance_weights", {})
    if not isinstance(raw_w, dict):
        raw_w = {}
    wkeys = ["style_weight", "occasion_weight", "category_weight",
             "price_weight", "cultural_weight", "brand_weight"]
    weights = {k: float(raw_w.get(k, 1 / 6)) for k in wkeys}
    total   = sum(weights.values())
    if total == 0:
        total = 1.0
    weights = {k: round(v / total, 4) for k, v in weights.items()}
    # Correct floating-point drift to ensure exact sum of 1.0
    diff = round(1.0 - sum(weights.values()), 4)
    weights[wkeys[0]] = round(weights[wkeys[0]] + diff, 4)

    profile = {f: _normalise_to_str(p.get(f, defaults[f])) for f in PROFILE_FIELDS}
    profile["user_id"] = str(user_id)
    return profile, {"user_id": str(user_id), **weights}


# ─────────────────────────────────────────────────────────────────
# Core profiler class
# ─────────────────────────────────────────────────────────────────
class UserProfiler:
    def __init__(self, groq_api_key: str,
                 model: str = "llama3-8b-8192",
                 delay: float = 0.5):
        self.client = Groq(api_key=groq_api_key)
        self.model  = model
        self.delay  = delay

    def profile_user(self, user_id,
                     df_train: pd.DataFrame,
                     item_lookup: dict) -> tuple[dict, dict]:
        history = _build_history_text(user_id, df_train, item_lookup)
        prompt  = _build_user_prompt(user_id, history)
        resp    = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user",   "content": prompt},
            ],
            temperature=0.2,
            max_tokens=400,
        )
        raw    = resp.choices[0].message.content or ""
        parsed = _parse_json(raw)
        if parsed is None:
            parsed = {}
        return _validate_profile(parsed, user_id)

    def profile_batch(self,
                      user_ids: list,
                      df_train: pd.DataFrame,
                      item_lookup: dict,
                      checkpoint_path: Optional[Path] = None,
                      checkpoint_every: int = 25) -> tuple[list, list]:
        profiles, weights = [], []
        total = len(user_ids)

        for i, uid in enumerate(user_ids):
            try:
                prof, wts = self.profile_user(uid, df_train, item_lookup)
                status = "ok"
            except Exception as e:
                prof, wts = _validate_profile({}, uid)
                status = f"error: {e}"

            profiles.append(prof)
            weights.append(wts)

            if (i + 1) % 10 == 0 or i == total - 1:
                arch = prof.get("inferred_archetype", "?")
                print(f"  [{i+1:>3}/{total}] User {str(uid):>6} → {arch[:40]:40s} | {status}")

            if checkpoint_path and (i + 1) % checkpoint_every == 0:
                _save_checkpoint(profiles, weights, checkpoint_path)

            time.sleep(self.delay)

        return profiles, weights


# ─────────────────────────────────────────────────────────────────
# Checkpoint helpers
# ─────────────────────────────────────────────────────────────────
def _save_checkpoint(profiles: list, weights: list, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    cp = {"profiles": profiles, "weights": weights}
    with open(path, "w", encoding="utf-8") as f:
        json.dump(cp, f, ensure_ascii=False, indent=2)


def load_profile_checkpoint(path: Path) -> tuple[list, list]:
    if not path.exists():
        return [], []
    with open(path, "r", encoding="utf-8") as f:
        cp = json.load(f)
    return cp.get("profiles", []), cp.get("weights", [])