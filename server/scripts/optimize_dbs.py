"""
Optimize dictionary databases for deployment:
1. Drop definitions_raw table (bulk of the size)
2. Remove orphan words (no meanings)
3. Clean up orphaned word_metrics and pronunciations
4. VACUUM to reclaim space
"""
import sqlite3
import os

def optimize(db_path, label):
    print(f"\n{'='*60}")
    print(f"Optimizing: {label}")
    print(f"  Path: {db_path}")
    size_before = os.path.getsize(db_path)
    print(f"  Size before: {size_before / 1024 / 1024:.1f} MB")

    conn = sqlite3.connect(db_path)

    # 1. Drop definitions_raw
    print("  Dropping definitions_raw...")
    conn.execute("DROP TABLE IF EXISTS definitions_raw")
    conn.commit()

    # 2. Find orphan words (no meanings)
    orphan_count = conn.execute("""
        SELECT COUNT(*) FROM words w
        WHERE NOT EXISTS (SELECT 1 FROM meanings m WHERE m.word_id = w.id)
    """).fetchone()[0]
    print(f"  Removing {orphan_count} orphan words...")

    # Delete orphaned examples (meanings that reference orphan words — shouldn't exist but just in case)
    conn.execute("""
        DELETE FROM examples WHERE meaning_id IN (
            SELECT m.id FROM meanings m
            JOIN words w ON m.word_id = w.id
            WHERE NOT EXISTS (SELECT 1 FROM meanings m2 WHERE m2.word_id = w.id)
        )
    """)

    # Delete orphaned word_metrics
    conn.execute("""
        DELETE FROM word_metrics WHERE word_id IN (
            SELECT w.id FROM words w
            WHERE NOT EXISTS (SELECT 1 FROM meanings m WHERE m.word_id = w.id)
        )
    """) if table_exists(conn, 'word_metrics') else None

    # Delete orphaned pronunciations
    conn.execute("""
        DELETE FROM pronunciations WHERE word_id IN (
            SELECT w.id FROM words w
            WHERE NOT EXISTS (SELECT 1 FROM meanings m WHERE m.word_id = w.id)
        )
    """) if table_exists(conn, 'pronunciations') else None

    # Delete orphan words
    conn.execute("""
        DELETE FROM words WHERE id NOT IN (
            SELECT DISTINCT word_id FROM meanings
        )
    """)
    conn.commit()

    # 3. VACUUM
    print("  VACUUMing...")
    conn.execute("VACUUM")
    conn.close()

    size_after = os.path.getsize(db_path)
    print(f"  Size after: {size_after / 1024 / 1024:.1f} MB")
    print(f"  Saved: {(size_before - size_after) / 1024 / 1024:.1f} MB ({(1 - size_after/size_before)*100:.0f}% reduction)")

def table_exists(conn, name):
    return conn.execute(
        "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name=?", (name,)
    ).fetchone()[0] > 0

if __name__ == "__main__":
    en_path = "/Users/niko/antigravity/vnme-app/server/databases/vn_en_dictionary.db"
    zh_path = "/Users/niko/antigravity/vnme-app/server/databases/vn_zh_dictionary.db"

    optimize(en_path, "EN Dictionary")
    optimize(zh_path, "ZH Dictionary")

    total = os.path.getsize(en_path) + os.path.getsize(zh_path)
    print(f"\nTotal combined size: {total / 1024 / 1024:.1f} MB")
