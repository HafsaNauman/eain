"""
populate_synthetic_listings.py
EAIN Recommender — Synthetic Listing DB Sync

Fixes two bugs that appear after running the recommender:

  Bug 1 — Missing images on home-feed cards
    Synthetic items (IDs 76-109) exist in eain_items.csv / FAISS index
    but have NO row in the Postgres listings table.  getListingDetails()
    returns nothing → blank card image.

  Bug 2 — Card shows wrong title, tapping opens wrong detail page
    IDs 50-69 are placeholder DB rows ("Shoe Model 3", "Jewellery Piece 5")
    but the recommender's merged CSV has REAL synthetic titles at those IDs
    ("Portrait Photography Session", "Organic Rose Water", etc.).
    The card renders the recommender title but navigation opens the DB row
    → title/image mismatch.

Fix strategy:
  • For IDs in CSV but absent from DB  → INSERT with forced listing_id
  • For IDs in CSV where DB has a placeholder title → UPDATE title, category,
    description, price, tags, media (keep vendor_id / timestamps intact)
  • For IDs in CSV where DB has a real matching title → SKIP (no change)

Images are borrowed from existing real listings in the same category so
cards are never blank.  The sequence is updated at the end.

Usage:
    python populate_synthetic_listings.py          # live run
    python populate_synthetic_listings.py --dry-run  # preview only

Run from:  recommender_system/
"""

from __future__ import annotations

import ast
import csv
import json
import os
import re
import sys
from pathlib import Path

# ── Auto-install dependencies ──────────────────────────────────────
for pkg, import_name in [("psycopg2-binary", "psycopg2"), ("python-dotenv", "dotenv")]:
    try:
        __import__(import_name)
    except ImportError:
        import subprocess
        subprocess.check_call([sys.executable, "-m", "pip", "install", pkg])

import psycopg2
import psycopg2.extras
from dotenv import load_dotenv

# ── Config ────────────────────────────────────────────────────────
DRY_RUN = "--dry-run" in sys.argv

DATA = Path("data")
ITEMS_CSV = DATA / "eain_items.csv"

backend_env = Path(__file__).resolve().parent.parent / "backend" / ".env"
if backend_env.exists():
    load_dotenv(backend_env)
    print(f"  Loaded env from: {backend_env}")
else:
    load_dotenv()
    print("  Using system env variables")

DB_HOST = os.getenv("DB_HOST")
DB_USER = os.getenv("DB_USER")
DB_PASS = os.getenv("DB_PASS")
DB_NAME = os.getenv("DB_NAME")
DB_PORT = os.getenv("DB_PORT", "5432")

if not all([DB_HOST, DB_USER, DB_PASS, DB_NAME]):
    print("❌  Missing DB credentials.  Check .env file.")
    sys.exit(1)

# ── Placeholder pattern (matches Shoe Model N / Jewellery Piece N) ─
PLACEHOLDER_RE = re.compile(
    r"^(Jewellery Piece|Shoe Model|Test Item)\s*\d+$", re.IGNORECASE
)

# ── Category → vendor affinity (fallback when no DB vendor found) ──
# These are the real vendor_ids in the EAIN database.
CATEGORY_VENDOR_MAP: dict[str, int] = {
    "Clothing":                   42,
    "Bridal & Wedding":           42,
    "Fabric":                     42,
    "Jewelry":                    43,
    "Accessories":                47,
    "Makeup & Beauty Services":   55,
    "Hair & Salon Services":      55,
    "Mehndi Services":            55,
    "Beauty & Skincare":          55,
    "Photography":                56,
    "Food & Organic":             42,   # fallback
    "Home & Decor":               42,   # fallback
}
DEFAULT_VENDOR_ID = 42  # ultimate fallback


# ─────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────
def parse_tags(raw: str) -> list[str]:
    """Parse CSV tag string like \"['tag1', 'tag2']\" → Python list."""
    if not raw or raw.strip() in ("", "[]"):
        return []
    try:
        result = ast.literal_eval(raw)
        if isinstance(result, list):
            return [str(t) for t in result]
    except Exception:
        pass
    return []


def is_placeholder(title: str) -> bool:
    return bool(PLACEHOLDER_RE.match(title.strip()))


def build_image_pool(cur) -> dict[str, list[str]]:
    """
    Query all real DB listings that have at least one image.
    Returns {category: [url, url, ...]} — used to borrow images for
    synthetic items.
    """
    cur.execute("""
        SELECT category, media
        FROM   listings
        WHERE  media IS NOT NULL
          AND  media->'images' IS NOT NULL
          AND  jsonb_array_length(media->'images') > 0
    """)
    rows = cur.fetchall()

    pool: dict[str, list[str]] = {}
    for category, media in rows:
        try:
            if isinstance(media, str):
                media = json.loads(media)
            images = media.get("images", [])
            if images:
                pool.setdefault(category, []).extend(images)
        except Exception:
            continue
    return pool


# ── Static fallback images (used when DB has no images yet) ───────
# Public Unsplash photos — replace with your own Supabase URLs later.
FALLBACK_IMAGES: dict[str, str] = {
    "Clothing":                 "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=400",
    "Bridal & Wedding":         "https://images.unsplash.com/photo-1519741497674-611481863552?w=400",
    "Fabric":                   "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400",
    "Jewelry":                  "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400",
    "Accessories":              "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400",
    "Makeup & Beauty Services": "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=400",
    "Hair & Salon Services":    "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400",
    "Mehndi Services":          "https://images.unsplash.com/photo-1591784104291-2a5e79ef9ba5?w=400",
    "Beauty & Skincare":        "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400",
    "Photography":              "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400",
    "Food & Organic":           "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400",
    "Home & Decor":             "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400",
    "Catering":                 "https://images.unsplash.com/photo-1565538810643-b5bdb714032a?w=400",
    "Tailoring":                "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400",
}
DEFAULT_FALLBACK_IMAGE = "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=400"


def pick_image(pool: dict[str, list[str]], category: str, index: int) -> str | None:
    """
    Pick an image URL for the given category.
    Priority:
      1. Real DB image in same category
      2. Any real DB image
      3. Static Unsplash fallback for category
      4. Default fallback
    """
    # 1. Same-category DB image
    urls = pool.get(category)
    if urls:
        return urls[index % len(urls)]

    # 2. Any DB image
    for cat_urls in pool.values():
        if cat_urls:
            return cat_urls[index % len(cat_urls)]

    # 3. Static fallback by category
    if category in FALLBACK_IMAGES:
        return FALLBACK_IMAGES[category]

    # 4. Default
    return DEFAULT_FALLBACK_IMAGE


def get_vendor_id(cur, category: str) -> int:
    """
    Find a real vendor_id in DB for the given category.
    Falls back to the static map, then to the default.
    """
    # Try to find a vendor in the same category from real DB listings
    cur.execute("""
        SELECT vendor_id
        FROM   listings
        WHERE  category = %s
          AND  NOT (title_en ~ '^(Jewellery Piece|Shoe Model|Test Item) \\d+$')
        LIMIT  1
    """, (category,))
    row = cur.fetchone()
    if row:
        return row["vendor_id"]

    # Fallback to static map
    return CATEGORY_VENDOR_MAP.get(category, DEFAULT_VENDOR_ID)


# ─────────────────────────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────────────────────────
def main():
    print("=" * 65)
    print("EAIN — Populate Synthetic Listings into Postgres")
    if DRY_RUN:
        print("  *** DRY RUN — no changes will be written ***")
    print("=" * 65)

    # ── Load merged CSV ──────────────────────────────────────────
    if not ITEMS_CSV.exists():
        print(f"❌  {ITEMS_CSV} not found.  Run merge_listings.py first.")
        sys.exit(1)

    with open(ITEMS_CSV, encoding="utf-8") as f:
        csv_items = list(csv.DictReader(f))

    print(f"\n  Loaded {len(csv_items)} items from {ITEMS_CSV}")

    # ── Connect ──────────────────────────────────────────────────
    print(f"\n  Connecting to {DB_NAME}@{DB_HOST}:{DB_PORT} ...")
    try:
        conn = psycopg2.connect(
            host=DB_HOST, port=DB_PORT, dbname=DB_NAME,
            user=DB_USER, password=DB_PASS, sslmode="require",
        )
        conn.autocommit = False
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        print("  ✅  Connected")
    except Exception as e:
        print(f"❌  Connection failed: {e}")
        sys.exit(1)

    # ── Fetch existing listings ──────────────────────────────────
    cur.execute("SELECT listing_id, title_en FROM listings ORDER BY listing_id")
    db_rows = cur.fetchall()
    db_map: dict[str, str] = {str(r["listing_id"]): r["title_en"] for r in db_rows}
    print(f"  Found {len(db_map)} listings already in DB  "
          f"(IDs {min(int(k) for k in db_map)} – {max(int(k) for k in db_map)})")

    # ── Build image pool from real DB listings ───────────────────
    image_pool = build_image_pool(cur)
    pool_categories = list(image_pool.keys())
    total_pool_images = sum(len(v) for v in image_pool.values())
    print(f"\n  Image pool: {total_pool_images} URLs across {len(pool_categories)} categories")
    if total_pool_images == 0:
        print("  ⚠️   No images found in DB.  Synthetic items will have empty media.")
        print("       Upload at least one product image via the vendor dashboard first.")

    # ── Classify each CSV item ───────────────────────────────────
    to_insert: list[dict] = []
    to_update: list[dict] = []
    to_skip:   list[str]  = []

    for item in csv_items:
        lid = str(item["listing_id"])
        csv_title = item.get("title_en", "").strip()

        if lid not in db_map:
            to_insert.append(item)
        elif is_placeholder(db_map[lid]):
            to_update.append(item)
        else:
            to_skip.append(lid)

    print(f"\n  Classification:")
    print(f"    INSERT (not in DB)          : {len(to_insert)}")
    print(f"    UPDATE (placeholder in DB)  : {len(to_update)}")
    print(f"    SKIP   (real title in DB)   : {len(to_skip)}")

    if not to_insert and not to_update:
        print("\n  ✅  Nothing to do — DB is already in sync.")
        cur.close()
        conn.close()
        return

    # ── Process INSERTs ──────────────────────────────────────────
    inserted = 0
    insert_errors = 0

    print(f"\n── INSERT {len(to_insert)} synthetic listings ──────────────────────")

    for idx, item in enumerate(to_insert):
        lid        = int(item["listing_id"])
        title_en   = item.get("title_en", "").strip()
        title_ur   = item.get("title_ur", "").strip() or None
        category   = item.get("category", "")
        description = item.get("description_en", "").strip() or None
        price      = float(item.get("price", 0) or 0)
        currency   = item.get("currency", "PKR")
        listing_type = item.get("listing_type", "product")
        city       = item.get("city", "").strip() or "Karachi"
        tags       = parse_tags(item.get("tags", ""))
        stock_status = item.get("stock_status", "in_stock")

        # Image: borrow from same-category pool
        image_url = pick_image(image_pool, category, idx)
        media = {"images": [image_url]} if image_url else {"images": []}

        # Vendor
        vendor_id = get_vendor_id(cur, category)

        # Inventory
        is_service = listing_type == "service"
        track_inventory = not is_service
        stock_quantity  = None if is_service else 25
        reserved_qty    = 0

        try:
            pop = int(item.get("popularity_count", 0) or 0)
        except (ValueError, TypeError):
            pop = 0

        print(f"  [{idx+1:>3}/{len(to_insert)}] INSERT id={lid:>4}  {title_en[:45]:<45}  "
              f"cat={category[:20]:<20}  vendor={vendor_id}  "
              f"img={'✓' if image_url else '✗'}")

        if DRY_RUN:
            inserted += 1
            continue

        try:
            cur.execute("""
                INSERT INTO listings (
                    listing_id, vendor_id, listing_type,
                    title_en, title_ur, description_en,
                    price, currency, category, tags, media,
                    is_female_only, is_active,
                    stock_quantity, reserved_quantity, track_inventory,
                    city, popularity_count,
                    created_at, updated_at
                )
                OVERRIDING SYSTEM VALUE
                VALUES (
                    %s, %s, %s,
                    %s, %s, %s,
                    %s, %s, %s, %s, %s,
                    %s, %s,
                    %s, %s, %s,
                    %s, %s,
                    NOW(), NOW()
                )
                ON CONFLICT (listing_id) DO NOTHING
            """, (
                lid, vendor_id, listing_type,
                title_en, title_ur, description,
                price, currency, category,
                tags,                                        # psycopg2 → TEXT[]
                psycopg2.extras.Json(media),                 # JSONB
                False, True,                                 # is_female_only, is_active
                stock_quantity, reserved_qty, track_inventory,
                city, pop,
            ))
            inserted += 1
        except Exception as e:
            print(f"    ❌  Insert failed for id={lid}: {e}")
            insert_errors += 1

    # ── Process UPDATEs ──────────────────────────────────────────
    updated = 0
    update_errors = 0

    print(f"\n── UPDATE {len(to_update)} placeholder listings ─────────────────────")

    for idx, item in enumerate(to_update):
        lid        = int(item["listing_id"])
        title_en   = item.get("title_en", "").strip()
        title_ur   = item.get("title_ur", "").strip() or None
        category   = item.get("category", "")
        description = item.get("description_en", "").strip() or None
        price      = float(item.get("price", 0) or 0)
        currency   = item.get("currency", "PKR")
        listing_type = item.get("listing_type", "product")
        city       = item.get("city", "").strip() or "Karachi"
        tags       = parse_tags(item.get("tags", ""))

        image_url = pick_image(image_pool, category, idx)
        media = {"images": [image_url]} if image_url else {"images": []}

        is_service = listing_type == "service"
        track_inventory = not is_service
        stock_quantity  = None if is_service else 25

        old_title = db_map.get(str(lid), "?")
        print(f"  [{idx+1:>3}/{len(to_update)}] UPDATE id={lid:>4}  "
              f'"{old_title[:25]}"  →  "{title_en[:35]}"  '
              f"img={'✓' if image_url else '✗'}")

        if DRY_RUN:
            updated += 1
            continue

        try:
            cur.execute("""
                UPDATE listings SET
                    title_en         = %s,
                    title_ur         = %s,
                    description_en   = %s,
                    price            = %s,
                    currency         = %s,
                    category         = %s,
                    tags             = %s,
                    media            = %s,
                    listing_type     = %s,
                    track_inventory  = %s,
                    stock_quantity   = %s,
                    city             = %s,
                    is_active        = TRUE,
                    updated_at       = NOW()
                WHERE listing_id = %s
            """, (
                title_en, title_ur, description,
                price, currency, category,
                tags,
                psycopg2.extras.Json(media),
                listing_type, track_inventory, stock_quantity,
                city,
                lid,
            ))
            updated += 1
        except Exception as e:
            print(f"    ❌  Update failed for id={lid}: {e}")
            update_errors += 1

    # ── Reset sequence so future INSERTs don't collide ───────────
    if not DRY_RUN and (inserted > 0 or updated > 0):
        try:
            cur.execute("""
                SELECT setval(
                    pg_get_serial_sequence('listings', 'listing_id'),
                    (SELECT MAX(listing_id) FROM listings)
                )
            """)
            cur.execute("SELECT MAX(listing_id) FROM listings")
            new_max = cur.fetchone()["max"]
            print(f"\n  🔢  Sequence reset → next auto-id will be {new_max + 1}")
        except Exception as e:
            print(f"\n  ⚠️   Could not reset sequence: {e}")
            print("       Run manually:  SELECT setval(pg_get_serial_sequence('listings','listing_id'), (SELECT MAX(listing_id) FROM listings));")

    # ── Commit or rollback ────────────────────────────────────────
    if DRY_RUN:
        conn.rollback()
        print("\n  *** DRY RUN — rolled back, nothing written ***")
    elif insert_errors + update_errors == 0:
        conn.commit()
        print("\n  ✅  Committed successfully")
    else:
        conn.rollback()
        print(f"\n  ❌  Rolled back due to {insert_errors + update_errors} error(s).")
        print("       Fix the errors above and re-run.")

    cur.close()
    conn.close()

    # ── Summary ───────────────────────────────────────────────────
    print("\n" + "=" * 65)
    print("SUMMARY")
    print(f"  Inserted : {inserted}  (errors: {insert_errors})")
    print(f"  Updated  : {updated}   (errors: {update_errors})")
    print(f"  Skipped  : {len(to_skip)}")
    print("=" * 65)

    if not DRY_RUN and insert_errors + update_errors == 0:
        print("\n  Next steps:")
        print("  1. Hard-refresh the app (or clear AsyncStorage cache)")
        print("  2. The recommender will now serve images for all listed items")
        print("  3. Card titles and detail pages will be in sync")
        print("\n  ⚠️  Note: borrowed images mean multiple items may share")
        print("     the same photo.  Replace with real vendor images when")
        print("     synthetic vendors onboard onto the platform.")


if __name__ == "__main__":
    main()
