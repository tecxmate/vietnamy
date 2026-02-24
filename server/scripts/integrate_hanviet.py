"""
Parse hanviet.csv (Hán Việt / Sino-Vietnamese dictionary) and integrate into the EN dictionary.
22,031 entries mapping Chinese characters → Vietnamese Han Viet readings with rich definitions.
"""
import sqlite3
import re

DB_PATH = "/Users/niko/antigravity/vnme-app/server/databases/vn_en_dictionary.db"
CSV_PATH = "/Users/niko/antigravity/vnme-data/raw/vi-zh-data/csv_dict/hanviet.csv"
SOURCE_NAME = "Hán Việt"

# Circled number pattern for splitting numbered definitions
CIRCLED_NUM_PATTERN = re.compile(r'<font color=red>([①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳㉑㉒㉓㉔㉕㉖㉗㉘㉙㉚㉛㉜㉝㉞㉟㊱㊲㊳㊴㊵㊶㊷㊸㊹㊺㊻㊼㊽㊾㊿]+)</font>\s*')

def clean_html(text):
    """Strip HTML tags and clean up whitespace."""
    text = re.sub(r'<br\s*/?>', ' ', text)
    text = re.sub(r'<[^>]+>', '', text)
    text = re.sub(r'\s+', ' ', text)
    text = text.strip().rstrip(';').strip()
    return text

def extract_metadata(html):
    """Extract pinyin, radical, stroke count from definition HTML."""
    pinyin = None
    radical = None
    strokes = None

    m = re.search(r'\[([a-zA-ZāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜüÜ\s\.\…,]+)\]', html)
    if m:
        pinyin = m.group(1).strip()

    m = re.search(r'Bộ thủ:\s*</b>\s*([^<\n]+)', html)
    if m:
        radical = m.group(1).strip()

    m = re.search(r'Số nét:\s*</b>\s*(\d+)', html)
    if m:
        strokes = int(m.group(1))

    return pinyin, radical, strokes

def parse_definitions(html):
    """Extract individual definitions from the HTML content."""
    # Check if there are numbered definitions
    parts = CIRCLED_NUM_PATTERN.split(html)

    if len(parts) > 1:
        # parts = [header, num1, def1, num2, def2, ...]
        defs = []
        i = 1
        while i < len(parts) - 1:
            num_marker = parts[i]
            def_text = clean_html(parts[i + 1])
            if def_text:
                defs.append(def_text)
            i += 2
        return defs if defs else None

    # No numbered definitions — extract the definition part after the header
    # Strip the header (everything before the first <br> after metadata)
    # Look for content after the last metadata tag
    text = html
    # Remove the bold title and metadata lines
    text = re.sub(r'^.*?<tvc>', '', text, flags=re.DOTALL)  # Remove up to <tvc> tag
    if not text or text == html:
        # Try alternative: remove up to the last <br> in the header
        text = re.sub(r'^.*?<br>\s*(?:(?:<b>.*?</b>.*?<br>)*)', '', html, count=1, flags=re.DOTALL)

    cleaned = clean_html(text)
    if cleaned and len(cleaned) > 3:
        return [cleaned]
    return None

def main():
    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA journal_mode=WAL")

    # Create or get the source
    existing = conn.execute("SELECT id FROM sources WHERE name = ?", (SOURCE_NAME,)).fetchone()
    if existing:
        source_id = existing[0]
        # Check if we already have meanings
        count = conn.execute("SELECT COUNT(*) FROM meanings WHERE source_id = ?", (source_id,)).fetchone()[0]
        if count > 0:
            print(f"WARNING: {count} meanings already exist for '{SOURCE_NAME}'. Skipping.")
            conn.close()
            return
    else:
        conn.execute("INSERT INTO sources (name) VALUES (?)", (SOURCE_NAME,))
        conn.commit()
        source_id = conn.execute("SELECT id FROM sources WHERE name = ?", (SOURCE_NAME,)).fetchone()[0]

    print(f"Source '{SOURCE_NAME}' id={source_id}")

    # Build word lookup: vietnamese_word → word_id
    word_lookup = {}
    for row in conn.execute("SELECT id, word FROM words"):
        word_lookup[row[1].lower()] = row[0]

    print(f"Existing words in DB: {len(word_lookup)}")

    # Read and parse CSV
    with open(CSV_PATH, 'r', encoding='utf-8') as f:
        text = f.read()

    rows = re.split(r'\n(?=\d+,\')', text.strip())
    print(f"CSV entries: {len(rows)}")

    meanings_inserted = 0
    examples_inserted = 0
    words_created = 0
    entries_skipped = 0
    parse_errors = 0

    for row in rows:
        match = re.match(r"(\d+),'([^']+)','(.*)'$", row, re.DOTALL)
        if not match:
            parse_errors += 1
            continue

        rid, w_field, html = match.groups()

        if '|' not in w_field:
            parse_errors += 1
            continue

        chinese, vietnamese = w_field.split('|', 1)
        vietnamese = vietnamese.strip()
        chinese = chinese.strip()

        if not vietnamese or not chinese:
            entries_skipped += 1
            continue

        # Skip pattern entries like "一…一…"
        if '…' in vietnamese:
            entries_skipped += 1
            continue

        # Look up or create the Vietnamese word
        word_key = vietnamese.lower()
        if word_key in word_lookup:
            word_id = word_lookup[word_key]
        else:
            cur = conn.execute("INSERT INTO words (word) VALUES (?)", (vietnamese,))
            word_id = cur.lastrowid
            word_lookup[word_key] = word_id
            words_created += 1

        # Extract metadata
        pinyin, radical, strokes = extract_metadata(html)

        # Build POS tag: Chinese character + pinyin
        pos_tag = chinese
        if pinyin:
            pos_tag = f"{chinese} [{pinyin}]"

        # Parse definitions
        defs = parse_definitions(html)
        if not defs:
            # Fallback: just clean the whole HTML
            fallback = clean_html(html)
            if fallback and len(fallback) > 10:
                defs = [fallback]
            else:
                entries_skipped += 1
                continue

        for def_text in defs:
            if not def_text or len(def_text) < 2:
                continue

            cur = conn.execute(
                "INSERT INTO meanings (word_id, source_id, part_of_speech, meaning_text) VALUES (?, ?, ?, ?)",
                (word_id, source_id, pos_tag, def_text)
            )
            meaning_id = cur.lastrowid
            meanings_inserted += 1

            # Extract Chinese examples from definition (pattern: Chinese Vietnamese)
            # Examples are embedded in the text as: 中文 Vietnamese translation
            # We skip example extraction for now as they're inline with definitions

    conn.commit()

    # Stats
    final_meanings = conn.execute("SELECT COUNT(*) FROM meanings WHERE source_id = ?", (source_id,)).fetchone()[0]
    new_word_coverage = conn.execute("""
        SELECT COUNT(DISTINCT m.word_id) FROM meanings m
        WHERE m.source_id = ?
        AND NOT EXISTS (
            SELECT 1 FROM meanings m2 WHERE m2.word_id = m.word_id AND m2.source_id != ?
        )
    """, (source_id, source_id)).fetchone()[0]

    print(f"\nDone!")
    print(f"  Meanings inserted: {meanings_inserted}")
    print(f"  Words created: {words_created}")
    print(f"  Entries skipped: {entries_skipped}")
    print(f"  Parse errors: {parse_errors}")
    print(f"  Total meanings for '{SOURCE_NAME}': {final_meanings}")
    print(f"  Words with definitions that had none before: {new_word_coverage}")

    conn.close()

if __name__ == "__main__":
    main()
