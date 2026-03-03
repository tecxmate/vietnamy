"""
Parse Stardict dictionaries from the Open Vietnamese Dictionary Project
and import them into per-language SQLite databases.

Sources: /Users/niko/antigravity/vnme-data/Stardict - Open Vietnamese Dictionary Project/
Output DBs: /Users/niko/antigravity/vnme-app/server/databases/

Languages: Japanese (ja), French (fr), German (de), Russian (ru), Norwegian (no)
Also merges TrungViet (Chinese ZH supplement) into existing vn_zh_dictionary.db.

Usage:
  python3 server/scripts/import_stardict_multilang.py
  python3 server/scripts/import_stardict_multilang.py --lang ja
  python3 server/scripts/import_stardict_multilang.py --lang zh  (TrungViet merge only)
"""

import sqlite3
import struct
import gzip
import re
import os
import argparse
import sys

STARDICT_ROOT = "/Users/niko/antigravity/vnme-data/Stardict - Open Vietnamese Dictionary Project"
DB_DIR = "/Users/niko/antigravity/vnme-app/server/databases"

# Schema for each new per-language DB
SCHEMA = """
CREATE TABLE IF NOT EXISTS words (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    word TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_words_word ON words(word COLLATE NOCASE);

CREATE TABLE IF NOT EXISTS sources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS meanings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    word_id INTEGER NOT NULL REFERENCES words(id),
    source_id INTEGER NOT NULL REFERENCES sources(id),
    part_of_speech TEXT,
    meaning_text TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_meanings_word ON meanings(word_id);
"""

# Dict definitions: each entry maps to a target DB and source name
# headword_lang: the language of the entry headwords
DICTIONARIES = [
    # ── Japanese ──────────────────────────────────────────────────────────
    {
        "lang": "ja",
        "name": "NhatViet",
        "label": "Vietnamese-Japanese (NhatViet)",
        "idx": f"{STARDICT_ROOT}/NhatViet/star_nhatviet.idx",
        "dict": f"{STARDICT_ROOT}/NhatViet/star_nhatviet.dict",
        "headword_lang": "vi",
        "db": f"{DB_DIR}/vn_ja_dictionary.db",
    },
    # ── French ────────────────────────────────────────────────────────────
    {
        "lang": "fr",
        "name": "PhapViet",
        "label": "French-Vietnamese (PhapViet)",
        "idx": f"{STARDICT_ROOT}/PhapViet/dictd_phap-viet.idx",
        "dict": f"{STARDICT_ROOT}/PhapViet/dictd_phap-viet.dict.dz",
        "headword_lang": "fr",
        "db": f"{DB_DIR}/vn_fr_dictionary.db",
    },
    {
        "lang": "fr",
        "name": "VietPhap",
        "label": "Vietnamese-French (VietPhap)",
        "idx": f"{STARDICT_ROOT}/VietPhap/star_vietphap.idx",
        "dict": f"{STARDICT_ROOT}/VietPhap/star_vietphap.dict",
        "headword_lang": "vi",
        "db": f"{DB_DIR}/vn_fr_dictionary.db",
    },
    # ── German ────────────────────────────────────────────────────────────
    {
        "lang": "de",
        "name": "DucViet",
        "label": "German-Vietnamese (DucViet)",
        "idx": f"{STARDICT_ROOT}/DucViet/star_ducviet.idx",
        "dict": f"{STARDICT_ROOT}/DucViet/star_ducviet.dict",
        "headword_lang": "de",
        "db": f"{DB_DIR}/vn_de_dictionary.db",
    },
    {
        "lang": "de",
        "name": "VietDuc",
        "label": "Vietnamese-German (VietDuc)",
        "idx": f"{STARDICT_ROOT}/VietDuc/star_vietduc.idx",
        "dict": f"{STARDICT_ROOT}/VietDuc/star_vietduc.dict",
        "headword_lang": "vi",
        "db": f"{DB_DIR}/vn_de_dictionary.db",
    },
    # ── Russian ───────────────────────────────────────────────────────────
    {
        "lang": "ru",
        "name": "NgaViet",
        "label": "Russian-Vietnamese (NgaViet)",
        "idx": f"{STARDICT_ROOT}/NgaViet/star_ngaviet.idx",
        "dict": f"{STARDICT_ROOT}/NgaViet/star_ngaviet.dict",
        "headword_lang": "ru",
        "db": f"{DB_DIR}/vn_ru_dictionary.db",
    },
    {
        "lang": "ru",
        "name": "VietNga",
        "label": "Vietnamese-Russian (VietNga)",
        "idx": f"{STARDICT_ROOT}/VietNga/star_vietnga.idx",
        "dict": f"{STARDICT_ROOT}/VietNga/star_vietnga.dict",
        "headword_lang": "vi",
        "db": f"{DB_DIR}/vn_ru_dictionary.db",
    },
    # ── Norwegian ─────────────────────────────────────────────────────────
    {
        "lang": "no",
        "name": "NauyViet",
        "label": "Norwegian-Vietnamese (NauyViet)",
        "idx": f"{STARDICT_ROOT}/NauyViet/star_nauyviet.idx",
        "dict": f"{STARDICT_ROOT}/NauyViet/star_nauyviet.dict",
        "headword_lang": "no",
        "db": f"{DB_DIR}/vn_no_dictionary.db",
    },
    # ── Chinese supplement (merges into existing vn_zh_dictionary.db) ─────
    {
        "lang": "zh",
        "name": "TrungViet",
        "label": "Chinese-Vietnamese supplement (TrungViet)",
        "idx": f"{STARDICT_ROOT}/TrungViet/star_trungviet.idx",
        "dict": f"{STARDICT_ROOT}/TrungViet/star_trungviet.dict",
        "headword_lang": "zh",
        "db": f"{DB_DIR}/vn_zh_dictionary.db",
    },
    # ── Reverse direction: Viet → Target language ─────────────────────────
    {
        "lang": "ja",
        "name": "VietNhat",
        "label": "Vietnamese-Japanese (VietNhat)",
        "idx": f"{STARDICT_ROOT}/VietNhat/star_vietnhat.idx",
        "dict": f"{STARDICT_ROOT}/VietNhat/star_vietnhat.dict",
        "headword_lang": "vi",
        "db": f"{DB_DIR}/vn_ja_dictionary.db",
    },
    {
        "lang": "en",
        "name": "VietAnh_Stardict",
        "label": "Vietnamese-English (VietAnh Stardict)",
        "idx": f"{STARDICT_ROOT}/VietAnh/VietAnh/star_vietanh.idx",
        "dict": f"{STARDICT_ROOT}/VietAnh/VietAnh/star_vietanh.dict.dz",
        "headword_lang": "vi",
        "db": f"{DB_DIR}/vn_en_dictionary.db",
    },
    {
        "lang": "zh",
        "name": "VietHan",
        "label": "Vietnamese-Sino (VietHan)",
        "idx": f"{STARDICT_ROOT}/VietHan/star_viethan.idx",
        "dict": f"{STARDICT_ROOT}/VietHan/star_viethan.dict",
        "headword_lang": "vi",
        "db": f"{DB_DIR}/vn_zh_dictionary.db",
    },
    # ── Spanish (new language) ────────────────────────────────────────────
    {
        "lang": "es",
        "name": "VietTBN",
        "label": "Vietnamese-Spanish (VietTBN)",
        "idx": f"{STARDICT_ROOT}/VietTBN/star_viettbn.idx",
        "dict": f"{STARDICT_ROOT}/VietTBN/star_viettbn.dict",
        "headword_lang": "vi",
        "db": f"{DB_DIR}/vn_es_dictionary.db",
    },
    {
        "lang": "es",
        "name": "TBNViet",
        "label": "Spanish-Vietnamese (TBNViet)",
        "idx": f"{STARDICT_ROOT}/TBNViet/star_tbnviet.idx",
        "dict": f"{STARDICT_ROOT}/TBNViet/star_tbnviet.dict",
        "headword_lang": "es",
        "db": f"{DB_DIR}/vn_es_dictionary.db",
    },
]


def parse_stardict(idx_path, dict_path):
    """Parse StarDict .idx and .dict/.dict.dz file pair into (word, definition) tuples."""
    if not os.path.exists(idx_path):
        raise FileNotFoundError(f"IDX not found: {idx_path}")
    if not os.path.exists(dict_path):
        raise FileNotFoundError(f"DICT not found: {dict_path}")

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
        offset, size = struct.unpack('>II', idx_data[null_pos + 1:null_pos + 9])
        definition = dict_data[offset:offset + size].decode('utf-8', errors='replace')
        entries.append((word, definition))
        pos = null_pos + 9

    return entries


def clean_text(text):
    """Strip HTML tags and normalize whitespace."""
    # Remove style blocks
    text = re.sub(r'<style[^>]*>.*?</style>', '', text, flags=re.DOTALL | re.IGNORECASE)
    # Replace <br> with newlines
    text = re.sub(r'<br\s*/?>', '\n', text, flags=re.IGNORECASE)
    # Remove &nbsp;
    text = text.replace('&nbsp;', ' ')
    # Strip all remaining HTML tags
    text = re.sub(r'<[^>]+>', '', text)
    # Decode common HTML entities
    text = text.replace('&amp;', '&').replace('&lt;', '<').replace('&gt;', '>')
    text = text.replace('&quot;', '"').replace('&#39;', "'")
    # Collapse whitespace
    text = re.sub(r'[ \t]+', ' ', text)
    text = re.sub(r'\n\s*\n+', '\n', text)
    return text.strip()


def ensure_schema(conn):
    """Create tables if they don't exist. Skips if tables are already present."""
    tables = {row[0] for row in conn.execute("SELECT name FROM sqlite_master WHERE type='table'")}
    if 'words' in tables and 'meanings' in tables and 'sources' in tables:
        return  # Existing DB — don't touch the schema
    conn.executescript(SCHEMA)
    conn.commit()


def get_or_create_source(conn, name):
    row = conn.execute("SELECT id FROM sources WHERE name = ?", (name,)).fetchone()
    if row:
        return row[0]
    conn.execute("INSERT INTO sources (name) VALUES (?)", (name,))
    conn.commit()
    return conn.execute("SELECT id FROM sources WHERE name = ?", (name,)).fetchone()[0]


def build_word_lookup(conn):
    lookup = {}
    for row in conn.execute("SELECT id, word FROM words"):
        lookup[row[1].lower()] = row[0]
    return lookup


def import_dict(conn, d):
    """Parse and import one StarDict dictionary into the given connection."""
    name = d["name"]

    # Check if already imported
    source_id = get_or_create_source(conn, name)
    existing = conn.execute("SELECT COUNT(*) FROM meanings WHERE source_id = ?", (source_id,)).fetchone()[0]
    if existing > 0:
        print(f"  SKIP '{name}': {existing} meanings already present")
        return 0, 0

    print(f"  Parsing {d['label']}...")
    entries = parse_stardict(d["idx"], d["dict"])
    print(f"  Parsed {len(entries)} entries")

    word_lookup = build_word_lookup(conn)
    meanings_inserted = 0
    words_created = 0
    skipped = 0

    batch = []
    for word, raw_def in entries:
        # Skip metadata entries common in some StarDict files
        if word.startswith('00-database-') or word.startswith('00-info-'):
            continue

        word = word.strip()
        if not word or len(word) > 300:
            skipped += 1
            continue

        cleaned = clean_text(raw_def)
        if not cleaned or len(cleaned) < 2:
            skipped += 1
            continue

        word_key = word.lower()
        if word_key in word_lookup:
            word_id = word_lookup[word_key]
        else:
            cur = conn.execute("INSERT OR IGNORE INTO words (word) VALUES (?)", (word,))
            if cur.lastrowid:
                word_id = cur.lastrowid
            else:
                word_id = conn.execute("SELECT id FROM words WHERE word = ? COLLATE NOCASE", (word,)).fetchone()[0]
            word_lookup[word_key] = word_id
            words_created += 1

        batch.append((word_id, source_id, None, cleaned))
        meanings_inserted += 1

        if len(batch) >= 2000:
            conn.executemany(
                "INSERT INTO meanings (word_id, source_id, part_of_speech, meaning_text) VALUES (?, ?, ?, ?)",
                batch
            )
            conn.commit()
            batch = []

    if batch:
        conn.executemany(
            "INSERT INTO meanings (word_id, source_id, part_of_speech, meaning_text) VALUES (?, ?, ?, ?)",
            batch
        )
        conn.commit()

    print(f"  ✓ {meanings_inserted} meanings, {words_created} new words, {skipped} skipped")
    return meanings_inserted, words_created


def process_language(lang_code, dicts_for_lang):
    """Open the target DB(s) for a language and import all relevant dictionaries."""
    # Group by DB path
    by_db = {}
    for d in dicts_for_lang:
        by_db.setdefault(d["db"], []).append(d)

    total_m = 0
    total_w = 0

    for db_path, entries in by_db.items():
        is_existing = os.path.exists(db_path)
        label_suffix = "(existing DB — merging)" if is_existing else "(new DB)"
        print(f"\n  DB: {os.path.basename(db_path)} {label_suffix}")

        conn = sqlite3.connect(db_path)
        conn.execute("PRAGMA journal_mode=WAL")
        conn.execute("PRAGMA synchronous=NORMAL")
        ensure_schema(conn)

        for d in entries:
            m, w = import_dict(conn, d)
            total_m += m
            total_w += w

        conn.close()

    return total_m, total_w


def main():
    parser = argparse.ArgumentParser(description="Import Stardict multilingual dictionaries")
    parser.add_argument("--lang", help="Only import specific language (ja/fr/de/ru/no/zh)")
    args = parser.parse_args()

    # Group dictionaries by language
    by_lang = {}
    for d in DICTIONARIES:
        by_lang.setdefault(d["lang"], []).append(d)

    langs_to_process = [args.lang] if args.lang else list(by_lang.keys())

    grand_m = 0
    grand_w = 0

    for lang in langs_to_process:
        if lang not in by_lang:
            print(f"Unknown lang: {lang}. Available: {list(by_lang.keys())}")
            sys.exit(1)

        print(f"\n{'='*60}")
        print(f"  Language: {lang.upper()}")
        print(f"{'='*60}")

        m, w = process_language(lang, by_lang[lang])
        grand_m += m
        grand_w += w

    print(f"\n{'='*60}")
    print(f"  TOTAL: {grand_m} meanings inserted, {grand_w} new words created")
    print(f"{'='*60}")

    # Print final word counts per DB
    print("\nDB Summary:")
    reported = set()
    for d in DICTIONARIES:
        if d["lang"] in langs_to_process and d["db"] not in reported:
            reported.add(d["db"])
            if os.path.exists(d["db"]):
                conn = sqlite3.connect(d["db"])
                wc = conn.execute("SELECT COUNT(*) FROM words").fetchone()[0]
                mc = conn.execute("SELECT COUNT(*) FROM meanings").fetchone()[0]
                conn.close()
                print(f"  {os.path.basename(d['db'])}: {wc} words, {mc} meanings")


if __name__ == "__main__":
    main()
