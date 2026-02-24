"""
Parse StarDict dictionaries and integrate into the EN dictionary database.
Handles: Vietnamese-Japanese, Vietnamese-French, German-Vietnamese
"""
import sqlite3
import struct
import gzip
import re

DB_PATH = "/Users/niko/antigravity/vnme-app/server/databases/vn_en_dictionary.db"

DICTIONARIES = [
    {
        "name": "JaViDic_VJ",
        "label": "Vietnamese-Japanese",
        "idx": "/tmp/vj_extract/var/mobile/Library/Dictionary/JavidicVJ/JaViDic_Vietnamese_Japanese.idx",
        "dict": "/tmp/vj_extract/var/mobile/Library/Dictionary/JavidicVJ/JaViDic_Vietnamese_Japanese.dict.dz",
        "headword_lang": "vi",  # headwords are Vietnamese
    },
    {
        "name": "mtBab_VF",
        "label": "Vietnamese-French",
        "idx": "/Users/niko/antigravity/vnme-data/raw/vi-others-data/mtBab_VF/mtBab_VF2.idx",
        "dict": "/Users/niko/antigravity/vnme-data/raw/vi-others-data/mtBab_VF/mtBab_VF2.dict.dz",
        "headword_lang": "vi",
    },
    {
        "name": "DucViet",
        "label": "German-Vietnamese",
        "idx": "/Users/niko/antigravity/vnme-data/raw/vi-others-data/DucViet/ducviet3.idx",
        "dict": "/Users/niko/antigravity/vnme-data/raw/vi-others-data/DucViet/ducviet3.dict.dz",
        "headword_lang": "de",  # headwords are German
    },
]


def parse_stardict(idx_path, dict_path):
    """Parse StarDict .idx and .dict files."""
    with open(idx_path, 'rb') as f:
        idx_data = f.read()

    if dict_path.endswith('.dz'):
        with gzip.open(dict_path, 'rb') as f:
            dict_data = f.read()
    else:
        with open(dict_path, 'rb') as f:
            dict_data = f.read()

    entries = []
    pos = 0
    while pos < len(idx_data):
        null_pos = idx_data.index(b'\x00', pos)
        word = idx_data[pos:null_pos].decode('utf-8', errors='replace')
        offset, size = struct.unpack('>II', idx_data[null_pos+1:null_pos+9])
        definition = dict_data[offset:offset+size].decode('utf-8', errors='replace')
        entries.append((word, definition))
        pos = null_pos + 9

    return entries


def clean_html(text):
    """Strip HTML tags, CSS, and clean up whitespace."""
    # Remove style blocks
    text = re.sub(r'<style[^>]*>.*?</style>', '', text, flags=re.DOTALL | re.IGNORECASE)
    # Remove CSS rules at the start (common in mtBab)
    text = re.sub(r'#\w+\{[^}]+\}', '', text)
    # Replace <br> with newlines
    text = re.sub(r'<br\s*/?>', '\n', text, flags=re.IGNORECASE)
    # Remove &nbsp;
    text = text.replace('&nbsp;', ' ')
    # Remove HTML tags
    text = re.sub(r'<[^>]+>', '', text)
    # Decode HTML entities
    text = text.replace('&amp;', '&').replace('&lt;', '<').replace('&gt;', '>')
    # Clean up whitespace
    text = re.sub(r'[ \t]+', ' ', text)
    text = re.sub(r'\n\s*\n', '\n', text)
    text = text.strip()
    return text


def split_definitions(cleaned_text):
    """Split a cleaned definition text into individual meaning entries."""
    # If it's short enough, keep as one meaning
    if len(cleaned_text) < 300:
        return [cleaned_text] if cleaned_text else []

    # Try splitting on numbered patterns or line breaks with clear separators
    lines = [l.strip() for l in cleaned_text.split('\n') if l.strip()]

    if len(lines) <= 1:
        return [cleaned_text] if cleaned_text else []

    # Group lines into logical definitions
    # Each definition starts at a line break — keep as single block for simplicity
    return [cleaned_text] if cleaned_text else []


def integrate_dict(conn, dict_config, word_lookup):
    """Integrate one StarDict dictionary into the database."""
    name = dict_config["name"]
    headword_lang = dict_config["headword_lang"]

    # Create or get source
    existing = conn.execute("SELECT id FROM sources WHERE name = ?", (name,)).fetchone()
    if existing:
        source_id = existing[0]
        count = conn.execute("SELECT COUNT(*) FROM meanings WHERE source_id = ?", (source_id,)).fetchone()[0]
        if count > 0:
            print(f"  SKIP: {count} meanings already exist for '{name}'")
            return 0, 0
    else:
        conn.execute("INSERT INTO sources (name) VALUES (?)", (name,))
        conn.commit()
        source_id = conn.execute("SELECT id FROM sources WHERE name = ?", (name,)).fetchone()[0]

    print(f"  Source '{name}' id={source_id}")

    # Parse StarDict files
    entries = parse_stardict(dict_config["idx"], dict_config["dict"])
    print(f"  Parsed {len(entries)} entries")

    meanings_inserted = 0
    words_created = 0
    skipped = 0

    for word, raw_def in entries:
        # Skip metadata entries
        if word.startswith('00-database-'):
            continue

        word = word.strip()
        if not word or len(word) > 200:
            skipped += 1
            continue

        # Clean definition
        cleaned = clean_html(raw_def)
        if not cleaned or len(cleaned) < 2:
            skipped += 1
            continue

        # For German-Vietnamese dict, headwords are German — but we index by Vietnamese word
        # For VJ and VF, headwords are Vietnamese
        # We store all in the EN database indexed by the headword
        word_key = word.lower()
        if word_key in word_lookup:
            word_id = word_lookup[word_key]
        else:
            cur = conn.execute("INSERT INTO words (word) VALUES (?)", (word,))
            word_id = cur.lastrowid
            word_lookup[word_key] = word_id
            words_created += 1

        # Insert as single meaning
        conn.execute(
            "INSERT INTO meanings (word_id, source_id, part_of_speech, meaning_text) VALUES (?, ?, ?, ?)",
            (word_id, source_id, None, cleaned)
        )
        meanings_inserted += 1

    conn.commit()
    return meanings_inserted, words_created


def main():
    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA journal_mode=WAL")

    # Build word lookup
    word_lookup = {}
    for row in conn.execute("SELECT id, word FROM words"):
        word_lookup[row[1].lower()] = row[0]

    print(f"Existing words: {len(word_lookup)}")

    total_meanings = 0
    total_words = 0

    for d in DICTIONARIES:
        print(f"\n--- {d['label']} ({d['name']}) ---")
        m, w = integrate_dict(conn, d, word_lookup)
        total_meanings += m
        total_words += w
        print(f"  Meanings: {m}, New words: {w}")

    # Summary
    print(f"\n{'='*50}")
    print(f"Total meanings inserted: {total_meanings}")
    print(f"Total new words created: {total_words}")

    # New word coverage
    for d in DICTIONARIES:
        source = conn.execute("SELECT id FROM sources WHERE name = ?", (d['name'],)).fetchone()
        if source:
            only_this = conn.execute("""
                SELECT COUNT(DISTINCT m.word_id) FROM meanings m
                WHERE m.source_id = ?
                AND NOT EXISTS (
                    SELECT 1 FROM meanings m2 WHERE m2.word_id = m.word_id AND m2.source_id != ?
                )
            """, (source[0], source[0])).fetchone()[0]
            print(f"  {d['name']}: {only_this} words with definitions from this source only")

    conn.close()

if __name__ == "__main__":
    main()
