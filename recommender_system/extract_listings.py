"""
extract_listings.py
Extracts product/service listings from the Neon PostgreSQL database
and writes them to data/eain_items.csv in the format expected by
the recommender system.

Usage:   python extract_listings.py
Run from: recommender_system/
"""

import csv, os, sys
from pathlib import Path

try:
    import psycopg2
except ImportError:
    print("Installing psycopg2-binary...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "psycopg2-binary"])
    import psycopg2

try:
    from dotenv import load_dotenv
except ImportError:
    print("Installing python-dotenv...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "python-dotenv"])
    from dotenv import load_dotenv

# ── Load DB credentials from backend/.env ────────────────────────
backend_env = Path(__file__).resolve().parent.parent / "backend" / ".env"
if backend_env.exists():
    load_dotenv(backend_env)
    print(f"Loaded env from: {backend_env}")
else:
    # Fallback: try local .env
    load_dotenv()
    print("Using local/system env variables")

DB_HOST = os.getenv("DB_HOST")
DB_USER = os.getenv("DB_USER")
DB_PASS = os.getenv("DB_PASS")
DB_NAME = os.getenv("DB_NAME")
DB_PORT = os.getenv("DB_PORT", "5432")

if not all([DB_HOST, DB_USER, DB_PASS, DB_NAME]):
    print("❌ Missing database credentials. Check your .env file.")
    sys.exit(1)

# ── Output path ──────────────────────────────────────────────────
OUTPUT = Path("data") / "eain_items.csv"
OUTPUT.parent.mkdir(exist_ok=True)

# ── CSV columns (must match what run_sitting9.py expects) ────────
CSV_COLUMNS = [
    "listing_id", "title_en", "title_ur", "category", "tags",
    "price", "city", "listing_type", "price_band", "currency",
    "is_active", "popularity_count", "vendor_id", "stock_status",
    "description_en",
]


def get_price_band(price):
    """Classify price into low/mid/high bands (PKR)."""
    if price is None:
        return "mid"
    price = float(price)
    if price <= 1000:
        return "low"
    elif price <= 7000:
        return "mid"
    else:
        return "high"


def get_stock_status(stock_qty, track_inventory, reserved_qty=0):
    """Derive stock status from inventory fields."""
    if not track_inventory or stock_qty is None:
        return "in_stock"  # services / untracked
    available = stock_qty - (reserved_qty or 0)
    if available <= 0:
        return "out_of_stock"
    elif available <= 5:
        return "low_stock"
    return "in_stock"


def format_tags(tags_raw):
    """
    Convert Postgres TEXT[] into Python list string format.
    psycopg2 returns it as a Python list already.
    """
    if not tags_raw:
        return "[]"
    if isinstance(tags_raw, list):
        return repr(tags_raw)
    # fallback: already a string
    return str(tags_raw)


# ── Connect & query ──────────────────────────────────────────────
print(f"\nConnecting to {DB_NAME}@{DB_HOST}:{DB_PORT} ...")

try:
    conn = psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASS,
        sslmode="require",
    )
    print("✅ Connected to database\n")
except Exception as e:
    print(f"❌ Connection failed: {e}")
    sys.exit(1)

QUERY = """
    SELECT
        listing_id,
        title_en,
        title_ur,
        category,
        tags,
        price,
        city,
        listing_type,
        currency,
        is_active,
        popularity_count,
        vendor_id,
        stock_quantity,
        reserved_quantity,
        track_inventory,
        description_en
    FROM listings
    ORDER BY listing_id
"""

try:
    cur = conn.cursor()
    cur.execute(QUERY)
    rows = cur.fetchall()
    col_names = [desc[0] for desc in cur.description]
    print(f"Fetched {len(rows)} listings from database\n")
except Exception as e:
    print(f"❌ Query failed: {e}")
    conn.close()
    sys.exit(1)

# ── Build CSV rows ───────────────────────────────────────────────
csv_rows = []
for row in rows:
    rec = dict(zip(col_names, row))
    csv_row = {
        "listing_id":       rec["listing_id"],
        "title_en":         rec["title_en"] or "",
        "title_ur":         rec["title_ur"] or "",
        "category":         rec["category"] or "",
        "tags":             format_tags(rec["tags"]),
        "price":            rec["price"] if rec["price"] is not None else 0,
        "city":             rec["city"] or "",
        "listing_type":     rec["listing_type"] or "product",
        "price_band":       get_price_band(rec["price"]),
        "currency":         rec["currency"] or "PKR",
        "is_active":        rec["is_active"],
        "popularity_count": rec["popularity_count"] or 0,
        "vendor_id":        rec["vendor_id"],
        "stock_status":     get_stock_status(
                                rec["stock_quantity"],
                                rec["track_inventory"],
                                rec["reserved_quantity"],
                            ),
        "description_en":   rec["description_en"] or "",
    }
    csv_rows.append(csv_row)

conn.close()

# ── Write CSV ────────────────────────────────────────────────────
with open(OUTPUT, "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=CSV_COLUMNS)
    writer.writeheader()
    writer.writerows(csv_rows)

print(f"✅ Wrote {len(csv_rows)} listings → {OUTPUT}")

# ── Quick summary ────────────────────────────────────────────────
categories = {}
types = {"product": 0, "service": 0}
for r in csv_rows:
    cat = r["category"] or "Uncategorized"
    categories[cat] = categories.get(cat, 0) + 1
    lt = r["listing_type"]
    if lt in types:
        types[lt] += 1

print(f"\nBreakdown:")
print(f"  Products : {types['product']}")
print(f"  Services : {types['service']}")
print(f"  Categories: {len(categories)}")
for cat, cnt in sorted(categories.items(), key=lambda x: -x[1]):
    print(f"    {cat:<30} {cnt:>3}")
