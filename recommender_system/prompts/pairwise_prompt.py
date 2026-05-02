"""
prompts/pairwise_prompt.py
EAIN Recommender — Bilingual Pairwise Prompt (Sitting 9)

Given a user archetype + two items, the LLM decides:
  "Which item would this user prefer, and why?"

Output is a structured JSON label used as cold-start preference signal.
"""

# ─────────────────────────────────────────────────────────────────
#  SYSTEM PROMPT
# ─────────────────────────────────────────────────────────────────
SYSTEM_PROMPT = """You are an expert recommendation assistant for EAIN,
a Pakistani women's fashion and beauty marketplace.

Your task is to predict which of two items a user would prefer,
based on their shopping profile. You understand Pakistani fashion,
local cities, price sensitivity, and cultural preferences.

Always respond in valid JSON only. No extra text, no markdown."""


# ─────────────────────────────────────────────────────────────────
#  USER PROMPT TEMPLATE
# ─────────────────────────────────────────────────────────────────
PAIRWISE_PROMPT_TEMPLATE = """Given the following user profile and two items,
decide which item the user would prefer.

USER PROFILE:
- Archetype: {archetype_name}
- City: {city}
- Price preference: {price_band}
- Preferred categories: {preferred_categories}
- Style keywords: {style_keywords}

ITEM A:
- Title (English): {title_en_a}
- Title (Urdu): {title_ur_a}
- Category: {category_a}
- Price band: {price_band_a}
- Tags: {tags_a}
- Description: {description_a}

ITEM B:
- Title (English): {title_en_b}
- Title (Urdu): {title_ur_b}
- Category: {category_b}
- Price band: {price_band_b}
- Tags: {tags_b}
- Description: {description_b}

Respond in this exact JSON format:
{{
  "preferred": "A" or "B",
  "confidence": 0.0 to 1.0,
  "reason_en": "one sentence in English explaining why",
  "reason_ur": "ایک جملہ اردو میں وجہ بتاتے ہوئے",
  "preference_score_a": 0.0 to 1.0,
  "preference_score_b": 0.0 to 1.0
}}"""


# ─────────────────────────────────────────────────────────────────
#  FALLBACK PROMPT — simpler, for when LLM output is inconsistent
# ─────────────────────────────────────────────────────────────────
FALLBACK_PROMPT_TEMPLATE = """A woman from {city} who likes {preferred_categories}
with a {price_band} budget is choosing between:

Item A: {title_en_a} ({category_a}, {price_band_a} price, tags: {tags_a})
Item B: {title_en_b} ({category_b}, {price_band_b} price, tags: {tags_b})

Which item would she prefer? Reply in JSON only:
{{
  "preferred": "A" or "B",
  "confidence": 0.0 to 1.0,
  "reason_en": "brief reason"
}}"""


def build_pairwise_prompt(user_profile: dict, item_a: dict, item_b: dict,
                           use_fallback: bool = False) -> str:
    """
    Fill the pairwise prompt template with user + item data.

    Args:
        user_profile : dict from user_archetypes.json
        item_a, item_b : rows from eain_items.csv as dicts
        use_fallback  : use simpler prompt if full prompt gives bad outputs

    Returns:
        filled prompt string ready to send to LLM
    """
    template = FALLBACK_PROMPT_TEMPLATE if use_fallback else PAIRWISE_PROMPT_TEMPLATE

    tags_a = ", ".join(item_a.get("tags", [])) if isinstance(item_a.get("tags"), list) else str(item_a.get("tags", ""))
    tags_b = ", ".join(item_b.get("tags", [])) if isinstance(item_b.get("tags"), list) else str(item_b.get("tags", ""))

    return template.format(
        archetype_name      = user_profile.get("name", ""),
        city                = user_profile.get("city_preference", ""),
        price_band          = user_profile.get("price_band_bias", ""),
        preferred_categories= ", ".join(user_profile.get("preferred_categories", [])),
        style_keywords      = ", ".join(user_profile.get("tags_affinity", [])[:6]),
        title_en_a          = item_a.get("title_en", ""),
        title_ur_a          = item_a.get("title_ur", ""),
        category_a          = item_a.get("category", ""),
        price_band_a        = item_a.get("price_band", ""),
        tags_a              = tags_a,
        description_a       = str(item_a.get("description_en", ""))[:150],
        title_en_b          = item_b.get("title_en", ""),
        title_ur_b          = item_b.get("title_ur", ""),
        category_b          = item_b.get("category", ""),
        price_band_b        = item_b.get("price_band", ""),
        tags_b              = tags_b,
        description_b       = str(item_b.get("description_en", ""))[:150],
    )
