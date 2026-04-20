# Vietnamy Unified Database Schema

## Overview

This schema combines:
- **Legacy data**: Rich topic coverage, emojis, dialect notes, lesson progression
- **Curriculum data**: POS, grammar tags, accepted translations, conversations

Designed for:
1. **Claude generation**: Clear JSON structure, easy to extend
2. **Mobile integration**: Exports to SQLite, normalized tables
3. **Dev team**: Type-safe, well-documented

---

## Core Tables

### 1. `units`
```sql
CREATE TABLE units (
  id TEXT PRIMARY KEY,           -- "unit_01"
  order_index INTEGER NOT NULL,  -- 1, 2, 3...
  title TEXT NOT NULL,           -- "First Words"
  description TEXT,              -- "Basic greetings and introductions"
  cefr_level TEXT,               -- "A1.1"
  icon TEXT                      -- "👋" or icon name
);
```

### 2. `lessons`
```sql
CREATE TABLE lessons (
  id TEXT PRIMARY KEY,           -- "lesson_001"
  unit_id TEXT NOT NULL,         -- FK → units
  order_index INTEGER NOT NULL,  -- Order within unit
  title TEXT NOT NULL,           -- "Say Hello"
  description TEXT,
  difficulty INTEGER DEFAULT 1,  -- 1-10
  xp_reward INTEGER DEFAULT 10,
  topic TEXT,                    -- "greetings", "food", etc.
  focus TEXT,                    -- JSON array: ["greetings", "farewell"]
  FOREIGN KEY (unit_id) REFERENCES units(id)
);
```

### 3. `vocabulary`
```sql
CREATE TABLE vocabulary (
  id TEXT PRIMARY KEY,           -- "vocab_0001"
  lesson_id TEXT NOT NULL,       -- FK → lessons
  vi_text TEXT NOT NULL,         -- "xin chào"
  vi_no_diacritics TEXT,         -- "xin chao"
  pos TEXT,                      -- "noun", "verb", "phrase", etc.
  emoji TEXT,                    -- "👋"
  difficulty INTEGER DEFAULT 1,
  frequency_rank INTEGER,        -- 1 = most common
  dialect TEXT DEFAULT 'both',   -- "north", "south", "both"
  audio_url TEXT,
  image_url TEXT,
  FOREIGN KEY (lesson_id) REFERENCES lessons(id)
);
```

### 4. `translations`
```sql
CREATE TABLE translations (
  id INTEGER PRIMARY KEY,
  vocab_id TEXT NOT NULL,        -- FK → vocabulary
  lang TEXT NOT NULL,            -- "en", "zh", etc.
  text TEXT NOT NULL,            -- "hello"
  is_primary BOOLEAN DEFAULT 1,  -- Primary translation shown first
  FOREIGN KEY (vocab_id) REFERENCES vocabulary(id)
);
```

### 5. `sentences`
```sql
CREATE TABLE sentences (
  id TEXT PRIMARY KEY,           -- "sent_0001"
  lesson_id TEXT NOT NULL,       -- FK → lessons
  vi_text TEXT NOT NULL,         -- "Xin chào!"
  vi_no_diacritics TEXT,
  token_count INTEGER,
  difficulty INTEGER DEFAULT 1,
  grammar_note TEXT,             -- "tên là = 'is named'"
  audio_url TEXT,
  FOREIGN KEY (lesson_id) REFERENCES lessons(id)
);
```

### 6. `sentence_translations`
```sql
CREATE TABLE sentence_translations (
  id INTEGER PRIMARY KEY,
  sentence_id TEXT NOT NULL,     -- FK → sentences
  lang TEXT NOT NULL,            -- "en"
  text TEXT NOT NULL,            -- "Hello!"
  is_primary BOOLEAN DEFAULT 1,
  FOREIGN KEY (sentence_id) REFERENCES sentences(id)
);
```

### 7. `grammar_tags`
```sql
CREATE TABLE grammar_tags (
  id TEXT PRIMARY KEY,           -- "GT001"
  name TEXT NOT NULL,            -- "copula_là"
  category TEXT,                 -- "structure", "tense", "question"
  description TEXT,
  example TEXT
);
```

### 8. `sentence_grammar_tags` (junction)
```sql
CREATE TABLE sentence_grammar_tags (
  sentence_id TEXT NOT NULL,
  tag_id TEXT NOT NULL,
  PRIMARY KEY (sentence_id, tag_id),
  FOREIGN KEY (sentence_id) REFERENCES sentences(id),
  FOREIGN KEY (tag_id) REFERENCES grammar_tags(id)
);
```

### 9. `conversations`
```sql
CREATE TABLE conversations (
  id TEXT PRIMARY KEY,           -- "conv_001"
  lesson_id TEXT NOT NULL,       -- FK → lessons
  title TEXT,                    -- "At the café"
  context TEXT,                  -- Setting description
  FOREIGN KEY (lesson_id) REFERENCES lessons(id)
);
```

### 10. `conversation_lines`
```sql
CREATE TABLE conversation_lines (
  id INTEGER PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  speaker TEXT,                  -- "A", "B", "Waiter"
  vi_text TEXT NOT NULL,
  en_text TEXT,
  audio_url TEXT,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id)
);
```

### 11. `path_nodes` (roadmap structure)
```sql
CREATE TABLE path_nodes (
  id TEXT PRIMARY KEY,           -- "u1_L001"
  unit_id TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  node_type TEXT NOT NULL,       -- "lesson", "quiz", "skill", "test"
  module_type TEXT,              -- "orange", "purple", "blue", "green", "test"
  label TEXT,                    -- Display label
  lesson_id TEXT,                -- FK → lessons (for lesson nodes)
  skill_route TEXT,              -- "/practice/tones-1" (for skill nodes)
  grammar_unit_id TEXT,          -- "A1_M01_U01" (for grammar nodes)
  difficulty INTEGER DEFAULT 1,
  unlock_requires TEXT,          -- JSON array of node IDs
  FOREIGN KEY (unit_id) REFERENCES units(id),
  FOREIGN KEY (lesson_id) REFERENCES lessons(id)
);
```

---

## JSON Export Format (for Claude generation)

Claude generates this JSON, which gets imported into SQLite:

```json
{
  "version": "1.0",
  "generated": "2026-04-21T00:00:00Z",
  "units": [...],
  "lessons": [...],
  "vocabulary": [...],
  "sentences": [...],
  "grammar_tags": [...],
  "conversations": [...],
  "path_nodes": [...]
}
```

---

## Workflow

```
┌─────────────────┐     ┌─────────────────┐
│  Claude Desktop │     │  Excel/Sheets   │
│  (generates)    │     │  (curriculum)   │
└────────┬────────┘     └────────┬────────┘
         │                       │
         ▼                       ▼
    claude_gen.json        curriculum.xlsx
         │                       │
         └───────────┬───────────┘
                     ▼
            ┌────────────────┐
            │  merge-db.js   │
            │  (combines)    │
            └────────┬───────┘
                     ▼
            unified_db.json
                     │
         ┌───────────┴───────────┐
         ▼                       ▼
    vietnamy.sqlite         db.js (web)
    (mobile app)            (React app)
```

---

## Example: Lesson with Full Data

```json
{
  "id": "lesson_001",
  "unit_id": "unit_01",
  "order_index": 1,
  "title": "Say Hello",
  "topic": "greetings",
  "difficulty": 1,
  "xp_reward": 10,
  "vocabulary": [
    {
      "id": "vocab_0001",
      "vi_text": "xin chào",
      "pos": "phrase",
      "emoji": "👋",
      "dialect": "both",
      "frequency_rank": 1,
      "translations": [
        { "lang": "en", "text": "hello (polite)", "is_primary": true },
        { "lang": "en", "text": "hi", "is_primary": false },
        { "lang": "zh", "text": "你好", "is_primary": true }
      ]
    }
  ],
  "sentences": [
    {
      "id": "sent_0001",
      "vi_text": "Xin chào!",
      "token_count": 2,
      "grammar_tags": ["GT001"],
      "translations": [
        { "lang": "en", "text": "Hello!", "is_primary": true },
        { "lang": "en", "text": "Hi!", "is_primary": false }
      ]
    }
  ],
  "conversations": [
    {
      "id": "conv_001",
      "title": "Meeting someone",
      "lines": [
        { "speaker": "A", "vi_text": "Xin chào!", "en_text": "Hello!" },
        { "speaker": "B", "vi_text": "Chào bạn!", "en_text": "Hi!" }
      ]
    }
  ]
}
```

---

## For Dev Team: Mobile Integration

1. **Export**: `node scripts/export-sqlite.js` → `vietnamy.sqlite`
2. **Import in mobile app**: Use SQLite library
3. **Sync**: Version field allows incremental updates
4. **Offline-first**: Full database bundled with app

---

## For Claude: Generating New Content

When asked to add lessons, Claude outputs JSON matching this schema:

```
"Add a lesson about ordering coffee"

→ Claude generates:
{
  "lessons": [{
    "id": "lesson_new_001",
    "title": "Order Coffee",
    "topic": "restaurant",
    ...
  }],
  "vocabulary": [...],
  "sentences": [...],
  ...
}
```

Dev team runs merge script to integrate.
