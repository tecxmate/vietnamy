#!/usr/bin/env python3
"""
Add pinyin data to HanViet entries in vn_zh_dictionary.db.
Uses pypinyin library for comprehensive character→pinyin mapping.
"""

import sqlite3
from pypinyin import pinyin, Style

DB_PATH = "/Users/niko/antigravity/vnme-app/server/databases/vn_zh_dictionary.db"

def is_cjk(ch):
    """Check if character is a CJK ideograph."""
    cp = ord(ch)
    return (0x4E00 <= cp <= 0x9FFF or 0x3400 <= cp <= 0x4DBF or
            0x20000 <= cp <= 0x2A6DF or 0x2A700 <= cp <= 0x2EBEF or
            0xF900 <= cp <= 0xFAFF)

def get_pinyin(text):
    """Get pinyin for Chinese text using pypinyin."""
    cjk_chars = [ch for ch in text if is_cjk(ch)]
    if not cjk_chars:
        return None
    result = pinyin(''.join(cjk_chars), style=Style.TONE, heteronym=False)
    return ' '.join([r[0] for r in result])

def main():
    print(f"Updating database: {DB_PATH}")
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    # Get all HanViet meanings
    cur.execute("""
        SELECT m.id, m.meaning_text
        FROM meanings m
        JOIN sources s ON m.source_id = s.id
        WHERE s.name = 'HanViet'
    """)
    rows = cur.fetchall()
    print(f"  Found {len(rows)} HanViet meanings")

    updated = 0
    for meaning_id, meaning_text in rows:
        # meaning_text format: "智 — wisdom, knowledge, intelligence"
        # or "体/體 — body; group, class"
        # or just "𩵜" (rare char, no definition)
        parts = meaning_text.split(' — ', 1)
        chinese_part = parts[0].strip()

        # Handle "体/體" format — use first variant
        first_variant = chinese_part.split('/')[0].strip()

        py = get_pinyin(first_variant)
        if py:
            cur.execute("UPDATE meanings SET part_of_speech = ? WHERE id = ?", (py, meaning_id))
            updated += 1

    conn.commit()
    print(f"  Updated {updated} / {len(rows)} meanings with pinyin")

    # Verify
    cur.execute("""
        SELECT w.word, m.part_of_speech, m.meaning_text
        FROM words w
        JOIN meanings m ON w.id = m.word_id
        JOIN sources s ON m.source_id = s.id
        WHERE s.name = 'HanViet' AND m.part_of_speech != ''
        AND w.word IN ('cá', 'thể', 'trí', 'hôn', 'nhân', 'học', 'quốc', 'gia', 'đình', 'vật')
        ORDER BY w.word
    """)
    print("\nVerification samples:")
    for word, pos, meaning in cur.fetchall():
        print(f"  {word}: [{pos}] {meaning}")

    # Count coverage
    cur.execute("""
        SELECT COUNT(*) FROM meanings m
        JOIN sources s ON m.source_id = s.id
        WHERE s.name = 'HanViet' AND m.part_of_speech != '' AND m.part_of_speech IS NOT NULL
    """)
    count = cur.fetchone()[0]
    print(f"\nTotal with pinyin: {count} / {len(rows)}")

    conn.close()
    print("Done!")

if __name__ == '__main__':
    main()
