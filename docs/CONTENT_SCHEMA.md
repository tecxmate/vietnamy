# Vietnamy Content Schema — Canonical Reference Contract

**Status:** Draft 1 (specification only — no data files migrated yet)
**Audience:** Mobile app team, content authors, web app maintainers
**Companion docs:** [`database_schema.md`](./database_schema.md) (on-device SQLite storage layer)

---

## 1. Purpose

This document is the **single source of truth** for the *shape* of every piece of
content in Vietnamy. The mobile team builds their data models against this contract
and never has to track changes to internal file formats. Today the same concepts are
spelled six different ways across the data files (see §9); this contract collapses
them to one.

Two layers, one contract:

| Layer | Spec | Casing | Translations | Example artifact |
|---|---|---|---|---|
| **Content / API contract** (this doc) | `CONTENT_SCHEMA.md` | `camelCase` | flat `vi` / `en` / `zh` | authored JSON, app data models |
| **Storage / export** | `database_schema.md` | `snake_case` | normalized `translations[]` tables | `vietnamy.sqlite`, `unified_db.json` |

The mobile app references **this** contract. The normalized SQLite is an internal
export detail; the projection between the two is defined in §8.

---

## 2. Global conventions (apply to every type)

1. **Casing:** all field names are `camelCase`. No `snake_case` in the content contract.
2. **Localized text:** the Vietnamese surface form is always `vi` (required). Other
   languages are sibling keys `en`, `zh` (optional). Never `vietnamese`, `meaning`,
   `vi_text`, `word`, `definitions`, `translations[]` in the contract.
   - When a single field holds localized text (e.g. an article title), it is a
     **LocalizedText** object: `{ "vi": "...", "en": "...", "zh": "..." }`.
   - When the object *is* the text unit (a word, a sentence), `vi`/`en`/`zh` sit at the
     top level alongside `id`.
3. **IDs** are strings, stable, and **never the content text itself**. Format:
   `<type>_<scope?>_<seq>` — lowercase, sequence zero-padded to **4 digits**.
   Examples: `word_explore_0001`, `sent_explore_0042`, `conv_0007`, `gtag_001`,
   `drill_connectors`, `article_001`. IDs are immutable once published.
4. **References** use the `<entity>Id` (single) or `<entity>Ids` (array) suffix:
   `unitId`, `lessonId`, `grammarTagIds`.
5. **Controlled enums** (never free text):
   - `cefrLevel`: `"A1" | "A2" | "B1" | "B2" | "C1" | "C2"`
   - `dialect`: `"north" | "south" | "central" | "neutral"` — **a region, never a usage note**
   - `difficulty`: integer `1`–`5`
   - `pos`: `"noun" | "verb" | "adjective" | "adverb" | "pronoun" | "interjection" | "phrase" | "classifier" | "particle" | "preposition" | "conjunction" | "numeral"`
6. **Optional fields are omitted, not null.** Consumers treat a missing key as "no value."
7. **Media** is a URL or an `audioKey` (a stable string the app resolves to a TTS/audio
   asset). Never a raw local path like `/audio/foo.mp3`.

---

## 3. Lesson content (curriculum container)

A curriculum file is one learner mode (`explore_vietnam`, `professional`, `heritage`).
Top-level arrays are **normalized**: words/sentences/conversations live in their own
arrays and link back to a lesson by `lessonId`. This dedupes content and matches the
runtime/storage model.

```jsonc
{
  "meta": {
    "mode": "explore_vietnam",        // matches a learnerMode id
    "version": "1.0.0",
    "generated": "2026-04-20T15:00:20Z",
    "source": "vietnamese_curriculum_source.xlsx"
  },
  "units":         [ Unit ],
  "lessons":       [ Lesson ],
  "words":         [ Word ],
  "sentences":     [ Sentence ],
  "conversations": [ Conversation ],
  "grammarTags":   [ GrammarTag ]
}
```

### Unit
```jsonc
{
  "id": "unit_explore_01",
  "orderIndex": 1,                    // was: order / order_index
  "title": "Introduce Yourself",
  "description": "Basic greetings, names, nationalities.",
  "cefrLevel": "A1",                  // optional
  "icon": "👋"                        // optional (emoji or icon name)
}
```

### Lesson
```jsonc
{
  "id": "lesson_explore_001",
  "unitId": "unit_explore_01",        // was: unit / unit_id
  "orderIndex": 1,                    // was: nodeIndex / order_index
  "nodeId": "u1_L001",               // roadmap node, optional
  "quizId": "quiz_explore_001",      // optional
  "quizLabel": "Unit 1 Quiz",        // optional
  "title": "Say Hello",
  "topic": "greetings",
  "focus": ["greetings", "farewell"],// always an array
  "targets": ["chào", "tên"],        // optional learning targets
  "cefrLevel": "A1",                  // was: cefr / cefr_level
  "difficulty": 1,
  "exerciseProfileId": "beginner",   // optional; pins question-type recipe (see §7 Exercise profiles)
  "xpReward": 10,                     // was: xp / xp_reward
  "wordIds": ["word_explore_0001"],   // refs into words[]
  "sentenceIds": ["sent_explore_0001"],
  "conversationIds": ["conv_0001"]
}
```

### Word (vocabulary item)
```jsonc
{
  "id": "word_explore_0001",          // was: numeric id / it_w_0001
  "lessonId": "lesson_explore_001",   // back-ref, optional in authoring
  "vi": "chào",                       // was: vietnamese / vi_text / word
  "en": "hello / hi",                 // was: meaning / english / translations[]
  "zh": "你好",                        // optional
  "pos": "interjection",
  "emoji": "👋",                      // optional
  "cefrLevel": "A1",                  // optional
  "difficulty": 1,
  "frequencyRank": 1,                 // was: frequency / frequency_rank
  "dialect": "north",                 // enum — NOT a usage note
  "hasImage": false,
  "imageUrl": "https://…",            // optional
  "audioKey": "a_chao",               // optional
  "note": "Polite greeting"           // free-text usage note (where 'dialect' was misused)
}
```
> **Required field-set is uniform across all modes.** `explore_vietnam` words currently
> carry `emoji`/`dialect`/`hasImage` while `professional`/`heritage` omit them — under
> this contract the *shape* is identical (optional fields simply absent), so one mobile
> model fits all three modes.

### Sentence
```jsonc
{
  "id": "sent_explore_0001",
  "lessonId": "lesson_explore_001",
  "vi": "Xin chào.",
  "en": "Hello.",
  "zh": "你好。",                      // optional
  "accepted": ["Hello.", "Hi."],      // optional alternate correct answers
  "tokenCount": 2,                    // was: tokens / token_count
  "difficulty": 1,
  "grammarTagIds": ["gtag_001"],      // refs into grammarTags[]
  "ipa": "[sin¹] [càːw²]",            // optional
  "audioKey": "a_xin_chao"            // optional
}
```

### Conversation
```jsonc
{
  "id": "conv_0001",
  "lessonId": "lesson_explore_001",
  "title": "Meeting someone",         // plain scene label (often English-only)
  "context": "",                      // optional setting description
  "lines": [
    { "speaker": "A", "vi": "Xin chào.", "en": "Hello.", "audioKey": "a_xin_chao" }
  ]
}
```
> Conversation lines use the same `vi`/`en` keys as everything else. (In today's
> `unified_db.json`, vocab/sentences use `vi_text`+`translations[]` but conversation
> lines use inline `vi`/`en` — that internal inconsistency disappears here.)

### GrammarTag
```jsonc
{
  "id": "gtag_001",                   // was: GT001
  "name": "copula_là",                // optional machine name
  "category": "structure",            // structure | tense | question | …
  "description": "Subject-Verb-Object word order",
  "example": { "vi": "Tôi là David.", "en": "I am David." }  // LocalizedText, optional
}
```

---

## 4. Drills (practice quizzes)

Drills are already the most consistent data in the repo — this just formalizes them and
adds the optional `listen_pick` type used by the consonant drills.

```jsonc
{
  "id": "drill_connectors",           // was: "connectors"
  "title": "Connectors: Và, Còn, Nhưng",
  "description": "Master the three main Vietnamese connectors.",
  "color": "#4CAF50",
  "intro": "Vietnamese has three key connectors…",   // optional
  "questions": [
    {
      "type": "mcq",                  // "mcq" | "fill_blank" | "listen_pick"
      "prompt": "Which connector means 'and'?",
      "correct": "và",
      "options": ["và", "còn", "nhưng", "thì"],
      "explanation": "'và' = and. Used to connect…",
      "audioKey": "a_va"              // optional, used by listen_pick
    }
  ]
}
```

---

## 5. Grammar modules

**Consolidate to one file.** Today the same source content lives in
`grammar_modules.json` (processed `levels → modules → units`) **and**
`vn_grammar_bank_v2.json` (raw `items → sections`); the former references the latter via
`source_item_index`. Keep the structured `levels` shape as canonical, deprecate the raw
bank (or keep it only as an authoring input, never shipped).

```jsonc
{
  "version": "2.0",
  "levels": [
    {
      "id": "A1",
      "label": "Beginner",
      "description": "Foundation Vietnamese grammar.",
      "modules": [
        {
          "id": "A1_M01",
          "title": "Basic sentence structure",
          "description": "…",
          "mainPattern": "Subject + là + Noun",       // was: main_pattern
          "faqs": [ { "question": "…", "answer": "…" } ],
          "extractedPatterns": ["Subject + Verb"],     // was: extracted_patterns
          "units": [
            {
              "id": "A1_M01_U01",
              "title": "Subject + Noun (using là)",
              "pattern": "Subject + là + Noun",
              "explanation": "'Là' works like am/is/are…",
              "note": "Only before nouns.",
              "examples": [ { "vi": "Tôi là David.", "en": "I am David." } ]
            }
          ]
        }
      ]
    }
  ]
}
```

---

## 6. Articles (reading content)

```jsonc
{
  "id": "article_001",
  "title": { "vi": "Buổi Sáng Ở Hà Nội", "en": "Morning in Hanoi", "zh": "河内的早晨" },
  "category": "daily-life",
  "cefrLevel": "A1",                  // was: level: "beginner" — map to CEFR enum
  "imageUrl": "https://…",            // was: image
  "readingTimeMins": 2,
  "sentences": [
    { "vi": "Buổi sáng ở Hà Nội rất đẹp.", "en": "Mornings in Hanoi are beautiful.", "zh": "…" }
  ]
}
```
> `title_vi` / `title_en` / `title_zh` collapse into one `title` LocalizedText object.
> `level: "beginner"` maps to the `cefrLevel` enum (beginner→A1/A2, intermediate→B1/B2,
> advanced→C1/C2 — author decides the exact band).

---

## 7. Reference data

### DictionaryEntry (client contract)
```jsonc
{
  "id": "dict_0001",                  // was: the word string itself ("bạn") — now stable
  "vi": "bạn",                        // was: word
  "pos": ["noun"],                    // was: tags: ["N","N"] (deduped, mapped to enum)
  "definitions": { "en": "friend, you, …", "zh": "伴侣; 朋友" },  // LocalizedText
  "examples": [ { "vi": "đôi bạn thân", "en": "close friends" } ],
  "hanViet": { "char": "伴", "definition": "Hán Việt: bạn…" },   // was: han_viet
  "audioKey": "a_ban",                // optional
  "source": "sqlite_db"
}
```
> Note `zh` vs `cn`: the contract uses **`zh`** everywhere (ISO 639-1). The current
> `dictionary.json` and `lessons.json` use `cn` — rename on migration.

### Tones
```jsonc
{
  "tones": [
    {
      "id": "sac",                    // "ngang"|"huyen"|"sac"|"hoi"|"nga"|"nang"
      "name": "Sắc",
      "label": "Rising",
      "mark": "á",
      "color": "#2196F3",
      "description": "Rises sharply from mid to high",
      "contour": [-1.0, -0.8, /* … 20 normalized points */]
    }
  ],
  "practiceWords": [
    { "id": "tw_0001", "vi": "má", "toneId": "sac", "en": "mother / cheek" }
    // was: { word, tone, meaning }
  ]
}
```

### Kinship
```jsonc
{
  "id": "kin_gp1",                    // was: "gp1"
  "label": { "en": "Grandfather (Paternal)", "vi": "Ông nội" },  // add vi
  "relationType": "paternal_grandfather",
  "gender": "male",
  "generation": 2,
  "ageOffset": 60
}
```

### Exercise profiles
Named recipes controlling which question types a lesson generates (`content/exercise-profiles.json`, authoritative — hand-maintained, not generated). A lesson resolves its profile by: explicit `lesson.exerciseProfileId` → `levelDefaults[CEFR band]` → `defaultProfileId`.
```jsonc
{
  "version": "1.0.0",
  "defaultProfileId": "standard",
  "levelDefaults": { "A1": "beginner" },   // CEFR band → profile when lesson has none
  "profiles": [
    {
      "id": "beginner",
      "label": "Beginner (no typing)",
      "description": "Replaces 'type what you hear' with listen-and-choose.",
      "options": { "disableTyping": true }  // knobs passed to the exercise generator
    },
    { "id": "standard", "label": "Standard", "options": {} }
  ]
}
```

### Concept blocks
Short teaching screens ("tips") shown in a lesson's intro phase, before the vocab cards (`content/concepts.json`, authoritative). A concept declares the lesson it belongs to via `lessonId`, so attaching one never touches the generated curriculum bundle.
```jsonc
{
  "version": "1.0.0",
  "concepts": [
    {
      "id": "concept_tones_intro",
      "lessonId": "lesson_001a",          // which lesson shows this
      "title": "Vietnamese is tonal",
      "body": "Vietnamese has six tones. The same syllable means different things…",
      "examples": [                        // optional, tappable to hear
        { "vi": "ma", "en": "ghost" },
        { "vi": "má", "en": "mother" }
      ]
    }
  ]
}
```

---

## 8. Projection to the storage layer (`database_schema.md`)

The normalized SQLite store and this flat contract map deterministically:

| Content contract (camelCase, flat) | Storage (snake_case, normalized) |
|---|---|
| `vi` | `vi_text` (+ generated `vi_no_diacritics`) |
| `en` (string) | `translations` row `{ lang:"en", text, is_primary:true }` |
| `zh` (string) | `translations` row `{ lang:"zh", text, is_primary:true }` |
| `orderIndex` | `order_index` |
| `unitId` / `lessonId` | `unit_id` / `lesson_id` (FK) |
| `cefrLevel` | `cefr_level` |
| `xpReward` | `xp_reward` |
| `frequencyRank` | `frequency_rank` |
| `hasImage` / `imageUrl` | `image_url` (presence implies hasImage) |
| `audioKey` | `audio_url` (resolved) |
| `grammarTagIds` | `sentence_grammar_tags` junction rows |

A single `camelCase ↔ snake_case` + `flat ↔ translations[]` transform converts between
the two layers. **Keep one direction authoritative** (recommended: author in the flat
contract, generate the SQLite export) so the layers never drift.

---

## 9. Why this matters — current inconsistency inventory

The same concept, named many ways across live files:

| Concept | Names found today | Canonical |
|---|---|---|
| Vietnamese text | `vi`, `vietnamese`, `vi_text`, `word`, `title_vi`, `vietnamese_text` | **`vi`** |
| English text | `en`, `meaning`, `english`, `definitions.en`, `translations[].text`, `title_en`, `english_text`, `label` | **`en`** |
| Chinese text | `cn`, `zh`, `title_zh` | **`zh`** |
| Order | `order`, `nodeIndex`, `order_index` | **`orderIndex`** |
| CEFR | `cefr`, `cefr_level`, `level:"beginner"` | **`cefrLevel`** (enum) |
| XP | `xp`, `xp_reward` | **`xpReward`** |
| Frequency | `frequency`, `frequency_rank` | **`frequencyRank`** |
| Token count | `tokens`, `token_count` | **`tokenCount`** |
| Has image | `hasImage`, `has_image` | **`hasImage`** |
| Grammar tags | `grammarTags`, `grammar_tags` | **`grammarTagIds`** |
| Image | `image`, `image_url`, `imageUrl` | **`imageUrl`** |

Other issues this contract fixes:
- **Casing split:** curricula/JS files are camelCase; `unified_db.json`/grammar/server are snake_case.
- **`dialect` corruption:** `unified_db.json` stores usage notes (`"Polite greeting"`) in the
  `dialect` field meant for `north`/`south`. Usage notes move to `note`.
- **Internal split in `unified_db.json`:** vocab/sentences use `vi_text`+`translations[]`,
  conversation lines use inline `vi`/`en`.
- **Field-set drift:** `explore_vietnam` words have `emoji`/`dialect`/`hasImage`;
  `professional`/`heritage` omit them — same type, different shape.
- **Unstable IDs:** `dictionary.json` uses the Vietnamese word as its `id` (collides on
  homographs); zero-padding differs (`it_w_0001` vs `pr_w_001`).
- **Duplicate stores:** two grammar files (`grammar_modules.json` + `vn_grammar_bank_v2.json`)
  for one source; two dictionaries (client `dictionary.json` + server SQLite) with
  different schemas.
- **Three lesson generations:** legacy `lessons.json` (`vietnamese`/`meaning`),
  authoring `curricula/*.json` (`vi`/`en`), runtime `unified_db.json` (`vi_text`/`translations[]`).

---

## 10. Migration plan (proposed — not yet executed)

1. **Freeze** this contract with the mobile team (review §2–§7).
2. **Validate**: add JSON Schema files (`/schema/*.schema.json`) and a
   `scripts/validate-content.mjs` that lints every data file against them.
3. **Write converters** per source format (legacy lessons, curricula, unified_db, JS
   files) → canonical. One-shot, idempotent, with a diff report.
4. **Consolidate duplicates**: pick one grammar file, one dictionary store.
5. **Regenerate** the SQLite export from the canonical JSON via the §8 projection.
6. **Update consumers** (`lessonExerciseService`, `initialData`, `dictionaryLookup`,
   practice modules) to read canonical fields.
7. **Delete** legacy formats once consumers are migrated.

Steps 2–7 are deliberately out of scope for this spec-only deliverable.
