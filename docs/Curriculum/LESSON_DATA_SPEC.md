# VNME Lesson Data Specification v2

> Source of truth for mass lesson data generation. All new lessons must conform to this spec.

## 1. The Closed-Loop Model

```
INPUT (words to teach)
    ↓
LESSON BLUEPRINT (1-2 words + 1 sentences)
    ↓
┌─────────────────────────────────────────────────┐
│  Lần 1: Recognition (session 0)                 │
│  → match_pairs, picture_choice, mcq_to_en       │
│  → Introduces words 1-2 with image + audio      │
├─────────────────────────────────────────────────┤
│  Lần 2: Reinforcement (session 1)               │
│  → listen_choose, mcq_to_vi, fill_blank         │
│  →                                              │
├─────────────────────────────────────────────────┤
│  Lần 3: Production (session 2)                  │
│  → word_bank, reorder, listen_type, speak       │
│  → 
├─────────────────────────────────────────────────┤
│  TEST (session 3)                               │
│  → All exercise types, no new words             │
│  → Must score ≥80% to unlock next lesson        │
│  → No hearts consumed (test mode)               │
└─────────────────────────────────────────────────┘
    ↓
RESULTS: per-word, per-exercise-type grading
    ↓
f(n): SRS updates → weak words prioritized in next iterations
```

## 2. Item Schema (Canonical)

Every vocabulary item in `db.js → items[]` must have ALL required fields:

```javascript
{
  id: "it_w_XXXX",              // REQUIRED: Unique ID. Prefix: it_w_ (word), it_p_ (phrase), it_s_ (sentence)
  item_type: "word",            // REQUIRED: "word" | "phrase" | "sentence"
  vi_text: "xin chào",          // REQUIRED: Vietnamese text with diacritics
  vi_text_no_diacritics: "xin chao",  // REQUIRED: Vietnamese text without diacritics (for fuzzy matching)
  audio_key: "a_xin_chao",      // REQUIRED: Audio asset key (maps to TTS or pre-recorded audio)
  dialect: "both",              // REQUIRED: "both" | "north" | "south"
  image_key: "img_xin_chao",   // OPTIONAL: Image asset key (for picture_choice exercises)
  ipa: "[sin¹ càːw²]"          // OPTIONAL: IPA pronunciation guide
}
```

### ID Conventions

| Prefix | Type | Range | Example |
|--------|------|-------|---------|
| `it_w_` | word | 0001-9999 | `it_w_0045` (phở) |
| `it_p_` | phrase | 0001-9999 | `it_p_0010` (tôi tên là {NAME}) |
| `it_s_` | sentence | 0001-9999 | `it_s_0012` (Bạn tên là gì?) |

### Rules
- IDs must be globally unique across all lessons
- Numbering does NOT need to be contiguous (gaps are fine)
- Phrases use `{PLACEHOLDER}` for variable parts — these are excluded from certain exercise types (word_bank, listen_type)
- Sentences must have ≥3 words to qualify for reorder/word_bank exercises

## 3. Translation Schema

Every item must have a corresponding translation entry:

```javascript
{
  item_id: "it_w_0045",    // REQUIRED: References items[].id
  lang: "en",              // REQUIRED: "en" (future: "cn", "ko", "ja")
  text: "pho (noodle soup)" // REQUIRED: English translation
}
```

### Rules
- Every item ID in `items[]` must have exactly one translation with `lang: "en"`
- Translation text should be concise (1-5 words for single words, full sentence for sentences)
- Include disambiguation in parentheses where needed: "orange" → "orange (fruit)" vs "orange (color)"

## 4. Lesson Blueprint Schema

```javascript
{
  lesson_id: "lesson_025",             // REQUIRED: References lessons[].id
  focus: ["topic_tag_1", "topic_tag_2"], // REQUIRED: Curriculum tags for grouping
  introduced_items: [                   // REQUIRED: Ordered list of item IDs
    // Words first (4-6 words), then sentences (2-3 sentences)
    "it_w_0300", "it_w_0301", "it_w_0302", "it_w_0303", "it_w_0304",
    "it_s_0305", "it_s_0306"
  ]
}
```

### Blueprint Size Rules

| Field | Min | Max | Ideal |
|-------|-----|-----|-------|
| Words | 4 | 6 | 5 |
| Sentences | 2 | 3 | 2 |
| Total items | 6 | 9 | 7 |

### Session Pacing (ITEMS_PER_SESSION = 2)

| Session | New Items | Review Items | Total Pool |
|---------|-----------|-------------|------------|
| Lần 1 (session 0) | items[0:2] | — | 2 |
| Lần 2 (session 1) | items[2:4] | items[0:2] | 4 |
| Lần 3 (session 2) | items[4:6] | items[0:4] | 6 |
| TEST (session 3) | items[6:] (sentences) | items[0:6] | 7-9 |

### Rules
- **Order matters**: Words first, sentences last. The generator slices by index.
- Every item ID in `introduced_items` MUST exist in `items[]` AND `translations[]`
- No item should appear in more than one blueprint's `introduced_items`
- Sentences should use words from the same blueprint (enables fill_blank exercises)

## 5. Lesson Metadata Schema

```javascript
{
  id: "lesson_025",                    // REQUIRED: Unique lesson ID
  course_id: "course_vi_en_v1",       // REQUIRED: Always this value
  skill_id: "skill_topic_1",          // REQUIRED: References skills[].id
  lesson_index: 1,                     // REQUIRED: Position within skill (usually 1)
  title: "Short Lesson Title",        // REQUIRED: User-facing title (2-5 words)
  target_xp: 10                        // REQUIRED: XP reward (10-24)
}
```

## 6. Path Node Schema

Each lesson needs a lesson node + a test node on the roadmap:

```javascript
// Lesson node
{
  id: "pX_LYYY",                       // Convention: p{phase}_L{lesson_number}
  course_id: "course_vi_en_v1",
  unit_id: "phase_X_topic",
  node_index: N,                        // Sequential within unit
  node_type: "lesson",
  module_type: "orange",
  lesson_id: "lesson_YYY",
  unlock_rule: { requires: [{ type: "node_completed", node_id: "previous_node_id" }] }
}

// Test node (immediately after lesson node)
{
  id: "pX_QYYY",                       // Convention: p{phase}_Q{lesson_number}
  course_id: "course_vi_en_v1",
  unit_id: "phase_X_topic",
  node_index: N+1,
  node_type: "test",
  module_type: "test",
  label: "Topic Quiz",
  test_scope: "module",
  source_node_id: "pX_LYYY",           // Points to the lesson this tests
  unlock_rule: { requires: [{ type: "node_completed", node_id: "pX_LYYY" }] }
}
```

## 7. Exercise Types (Canonical 10)

The exercise generator produces these types automatically from item data. You do NOT need to write exercises manually.

| # | Type | Requires | Tests | Difficulty |
|---|------|----------|-------|------------|
| 1 | `match_pairs` | ≥2 word items | Vocab recognition | Easy |
| 2 | `picture_choice` | word + image_key | Vocab + visual | Easy |
| 3 | `mcq_translate_to_en` | word + ≥2 distractors | Meaning recognition | Easy |
| 4 | `listen_choose` | word + audio | Listening recognition | Easy |
| 5 | `mcq_translate_to_vi` | word + ≥2 distractors | Meaning production | Medium |
| 6 | `listen_type` | non-templated word | Listening + spelling | Medium |
| 7 | `fill_blank` | sentence containing word | Context understanding | Medium |
| 8 | `translation_word_bank` | sentence ≥2 words | Sentence construction | Hard |
| 9 | `reorder_words` | sentence ≥2 words | Word order mastery | Hard |
| 10 | `speak_sentence` | non-templated sentence | Speaking production | Hard |

### What data enables which exercises

- **All items**: match_pairs, mcq (both), listen_choose
- **Items with image_key**: picture_choice
- **Non-templated items**: listen_type, speak_sentence
- **Sentences ≥3 words**: word_bank, reorder, fill_blank
- **Word + sentence containing that word**: fill_blank (word-in-context variant)

This means: **if you want all 10 exercise types to work for a lesson, each blueprint needs non-templated words WITH image keys, AND sentences that contain those words.**

## 8. Per-Word Grading Schema (NEW — needs implementation)

After each exercise, store a result per word per exercise dimension:

```javascript
// localStorage key: vnme_word_grades
{
  "it_w_0045": {
    meaning_recognition: { correct: 5, wrong: 1, last: "2026-03-16" },  // mcq_to_en, match_pairs
    meaning_production:  { correct: 3, wrong: 2, last: "2026-03-16" },  // mcq_to_vi, word_bank
    listening:           { correct: 4, wrong: 0, last: "2026-03-15" },  // listen_choose, listen_type
    spelling:            { correct: 2, wrong: 3, last: "2026-03-15" },  // listen_type (typing accuracy)
    speaking:            { correct: 1, wrong: 0, last: "2026-03-14" },  // speak_sentence
    context:             { correct: 3, wrong: 1, last: "2026-03-16" }   // fill_blank, reorder
  }
}
```

### Exercise → Dimension Mapping

| Exercise Type | Dimensions Updated |
|--------------|-------------------|
| match_pairs | meaning_recognition |
| picture_choice | meaning_recognition |
| mcq_translate_to_en | meaning_recognition |
| mcq_translate_to_vi | meaning_production |
| listen_choose | listening |
| listen_type | listening + spelling |
| fill_blank | context |
| translation_word_bank | meaning_production + context |
| reorder_words | context |
| speak_sentence | speaking |

### SRS Integration

The SRS interval for a word advances only when ALL dimensions have `correct > wrong` (i.e., net positive). If any dimension is net negative, the word stays at the current interval and gets prioritized in the next lesson session.

## 9. Data Generation Checklist

When generating a new lesson batch, produce these in order:

1. **Items**: 4-6 words + 2-3 sentences per lesson (all fields filled)
2. **Translations**: 1 English translation per item
3. **Blueprint**: `introduced_items` list referencing the item IDs (words first, sentences last)
4. **Lesson metadata**: id, skill_id, title, target_xp
5. **Path nodes**: lesson node + test node with correct unlock rules

### Validation Rules (run before committing)

- [ ] Every `introduced_items` ID exists in `items[]`
- [ ] Every `introduced_items` ID exists in `translations[]`
- [ ] Blueprint has 4-6 words + 2-3 sentences (6-9 total)
- [ ] No item ID appears in multiple blueprints
- [ ] Sentences use words from the same blueprint (for fill_blank)
- [ ] At least 2 items have image_key (for picture_choice)
- [ ] No templated items in first 4 slots (they break listen_type)
- [ ] ID numbering doesn't collide with existing items
- [ ] Path node unlock_rule references an existing node

## 10. Current Inconsistencies to Fix

### Orphaned Items (in items[] but not in any blueprint)
- `it_w_0002` (chào), `it_w_0005` (vâng), `it_w_0006` (dạ), `it_w_0008` (tôi)
- `it_w_0036` (cho), `it_s_0037` (Cảm ơn!), `it_w_0068` (đẹp), `it_w_0069` (xấu)
- `it_w_0168` (vợ), `it_w_0169` (chồng)

**Action**: Either add these to appropriate blueprints or remove them from items[].

### Oversized Blueprints (>6 words)
- `lesson_004`: 8 words (numbers 1-10, should be split into two lessons)
- `lesson_009`: 8+2 items (colors, should be split)
- `lesson_010`: 6+2+2 items (haggling, borderline)
- `lesson_011`: 8 items (fruits, should be split)
- `lesson_013`: 7+1 items (directions, borderline)
- `lesson_017`: 8+1 items (time, should be split)
- `lesson_019`: 8+2 items (family, should be split)

**Action**: Split oversized lessons or accept 8 as max and adjust ITEMS_PER_SESSION.

### Missing image_key on all items
No items currently have `image_key`. The `picture_choice` exercise type relies on a runtime lookup against `vocabWords.js` which is disconnected from the item system.

**Action**: Add `image_key` to word items that have visual representations.

### SRS recordReview() never called
`LessonGame.jsx` calls `addItemsFromLesson()` on completion but never calls `recordReview()` during gameplay.

**Action**: After each exercise, call `recordReview(itemId, correct)` for every item tested in that exercise.

### Test nodes have no pass/fail gate
Test nodes run the same code as lesson nodes with no score threshold.

**Action**: Add `pass_threshold: 0.8` to test path_nodes and enforce in LessonGame.
