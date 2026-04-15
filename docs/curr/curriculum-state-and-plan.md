# VNME Curriculum Plan



## Current State

| What we have | Count | Notes |
|---|---|---|
| Phases | 10 | Sound Foundations → Social Life |
| Conversation lessons | 24 | Dialogue-based, 4 sessions each |
| Vocabulary items | 216 | Tied to lessons, auto-generate exercises |
| Grammar topics | 28 | All A1 level |
| Practice modules | 39 | Tones, vowels, marks, numbers, TELEX, pronouns, teen code, pitch + 14 drill modules |
| Vocabulary items (flashcards) | 90 | 15 categories (food, animals, objects, nature, people, body, clothing, colors, family, transport, weather, professions, emergency, time) |
| Reading articles | 13 | 3 levels, 6 categories |
| Exercise types | 10 | match, MCQ, listen, type, reorder, speak, fill-blank, picture, word-bank |
| Drill question types | 3 | mcq, fill_blank, listen_pick (data-driven, CMS-editable) |

---

## Architecture

### Node types

| Color | Type | Mechanism |
|---|---|---|
| Orange | **Conversation** | Dialogue scene → exercises (match → MCQ → listen → type → speak). 4 sessions to complete. |
| Purple | **Skill** | Focused drill (tones, vowels, numbers, etc). Interactive practice with immediate feedback. |
| Green | **Grammar** | Pattern explanation → example → mini-quiz. Teaches structural rules. |
| Red | **Test** | Module quiz (after each lesson) or Phase test (end of phase). Mixed exercises from all phase content. |

### Practice module types

| Engine | Data source | CMS-editable | Modules |
|---|---|---|---|
| **Custom components** | Hardcoded in JSX | No (code changes required) | Tones (4), Vowels (5), Numbers (3), TELEX (3), Teen Code (3), Pronouns (2), Pitch (2), Tone Marks (3) |
| **DrillPractice engine** | JSON in `src/data/drills/` | Yes (via `/admin/drills`) | Consonants, Classifiers (2), Particles (2), Question Words (2), Aspect Markers, Connectors, Intensifiers, Degree Adverbs, Quantifiers, Vision Verbs, Prepositions |

### Drill data format

Each drill module is a JSON file in `src/data/drills/`:

```json
{
    "id": "classifiers_basics",
    "title": "Classifiers: Basics",
    "description": "Match the right classifier to common nouns",
    "intro": "Intro text shown on start screen",
    "questions": [
        {
            "type": "mcq | fill_blank | listen_pick",
            "prompt": "What classifier for coffee? 'một ___ cà phê'",
            "correct": "ly",
            "options": ["ly", "cái", "con", "chai"],
            "explanation": "Shown after answering",
            "audio": "Vietnamese text for TTS (listen_pick only)"
        }
    ]
}
```

Teachers edit drills at `/admin/drills`. Edits save to localStorage (`vnme_cms_drill_{id}`) and override bundled defaults. Export/import JSON for collaboration.

### Design principles

1. **3-5 new concepts per sitting** — never more
2. **Sound before meaning** — hear it, then learn what it means
3. **Spiral progression** — revisit old items in new contexts
4. **Every lesson has a real-world scenario** — never abstract drills in isolation
5. **Test what you taught** — quiz immediately after, phase test at end

---

## Lesson mechanism detail

<details>
<summary><strong>Conversation lesson (orange)</strong></summary>

**Structure per lesson:**
1. **Scene intro** — 1-sentence context ("You're at a coffee shop in Hanoi")
2. **Dialogue** — 4-6 lines, Vietnamese + audio + translation toggle
3. **Vocabulary preview** — 5-8 new words with pronunciation
4. **Exercise sequence** (auto-generated, varies by session):
   - Session 0: Recognition (match pairs, picture choice, MCQ)
   - Session 1: Reinforcement (listen-choose, MCQ both directions)
   - Session 2: Production (type, word bank, reorder)
   - Session 3: Mastery (speak, fill-blank, listen-type)
5. **Retention queue** — missed items get re-tested at the end
6. **XP + SRS** — words added to spaced repetition deck

**What makes a lesson good:**
- Dialogue should feel like something you'd actually say
- New vocab max 8 words (5-6 ideal)
- At least 1 cultural note per lesson ("In Vietnam, you say X because...")
- Each lesson revisits 2-3 words from prior lessons as distractors

</details>

<details>
<summary><strong>Skill practice (purple)</strong></summary>

**Structure per module:**
1. **Intro screen** — explain what this skill trains + audio examples
2. **Interactive practice** — type-specific:
   - Tones: listen → pick the tone
   - Vowels: listen → pick the vowel + see mouth diagram
   - Numbers: hear number → type it / see number → say it
   - Tone marks: see base vowel + tone → pick the marked letter
   - TELEX: see target character → type the TELEX keystrokes
   - Pronouns: see family member → pick the correct pronoun pair
   - Teen code: decode/encode messages
   - Pitch: record your voice → compare contour to native
   - Drill modules: MCQ / fill-blank / listen-pick from JSON data
3. **Summary** — score + "Next" to continue roadmap

**Completion:**
- Finishing a session = 1/4 progress on the roadmap node
- 4 sessions = node complete → next node unlocks

</details>

<details>
<summary><strong>Grammar lesson (green)</strong></summary>

**Structure per lesson:**
1. **Pattern card** — the rule in a simple formula (e.g., "Subject + đã + verb = past tense")
2. **Examples** — 3-4 annotated Vietnamese sentences showing the pattern
3. **Contrast** — show what changes vs. the base form
4. **Mini-quiz** — 4-6 exercises testing the pattern
5. **FAQ** — "What about X?" common learner questions

**Current grammar topics (28 A1):**
- Sentence types: S+là+N, S+Adj, S+V, S+V+O
- Tenses: present, past (đã/rồi), future (sẽ/sắp), continuous (đang)
- Negation: không, chưa, không phải là
- Pronouns, plurals (những/các)

</details>

<details>
<summary><strong>Test (red)</strong></summary>

**Module quiz** (after each conversation lesson):
- 6-8 exercises from the lesson's vocabulary
- Must pass to continue

**Phase test** (end of each phase):
- 12-15 exercises drawing from all lessons + grammar in the phase
- Mixed exercise types
- Higher pass threshold

</details>

---

## 10-Phase Roadmap

### Phase 0: Sound Foundations

> Goal: Hear and write Vietnamese sounds before learning any words.

| # | Node | Type | Content | Route |
|---|---|---|---|---|
| 1 | Tones: Level & Rising | Skill | ngang + sắc | `/practice/tones-1` |
| 2 | Vowels: Basic | Skill | a, ă, â, e, ê, i, o, ô, ơ, u, ư, y | `/practice/vowels-single-1` |
| 3 | Tone Marks: Basics | Skill | Where to put the mark | `/practice/tonemarks-basic` |
| 4 | Consonants: Initial | Skill | b, c/k, d/gi, đ, g/gh, h, l, m, n, ng/ngh, nh, ph, qu, r, s, t, th, tr, v, x | `/practice/consonants` |
| 5 | Phase 0 Check | Test | | |

---

### Phase 1: First Words

> Goal: Say hello, introduce yourself, basic yes/no.

| # | Node | Type | Content | Route |
|---|---|---|---|---|
| 1 | Hello & Goodbye | Conv | xin chào, tạm biệt, dạ/vâng | `/lesson/lesson_001` |
| 2 | Greetings Quiz | Test | | |
| 3 | Tones: + Falling | Skill | + huyền | `/practice/tones-2` |
| 4 | My Name Is... | Conv | tên, là, bạn, tôi | `/lesson/lesson_002` |
| 5 | Introductions Quiz | Test | | |
| 6 | Vowels: Special | Skill | ơ, ư focus | `/practice/vowels-single-2` |
| 7 | Phase 1 Test | Test | | |

---

### Phase 2: Polite Survival

> Goal: Please, sorry, thank you, count to 10.

| # | Node | Type | Content | Route |
|---|---|---|---|---|
| 1 | Please & Sorry | Conv | xin, lỗi, cảm ơn, xin lỗi | `/lesson/lesson_003` |
| 2 | Polite Phrases Quiz | Test | | |
| 3 | Numbers: 0-10 | Skill | | `/practice/numbers-1` |
| 4 | 1 to 10 | Conv | Counting in context | `/lesson/lesson_004` |
| 5 | Numbers Quiz | Test | | |
| 6 | Tone Marks: Special | Skill | | `/practice/tonemarks-special` |
| 7 | Particles: Politeness | Skill | ạ, nhé, nha, đi — practice adding them to sentences | `/practice/particles-1` |
| 8 | Phase 2 Test | Test | | |

---

### Phase 3: Ordering & Cafe

> Goal: Order food and drinks.

| # | Node | Type | Content | Route |
|---|---|---|---|---|
| 1 | I Want... | Conv | cho tôi, muốn, cần | `/lesson/lesson_005` |
| 2 | Ordering Quiz | Test | | |
| 3 | Tones: + Dipping | Skill | + hỏi | `/practice/tones-3` |
| 4 | Cafe Ordering | Conv | cà phê, trà, nước | `/lesson/lesson_006` |
| 5 | Cafe Quiz | Test | | |
| 6 | Grammar: Subject + là | Grammar | Noun identification | `/grammar-lesson/p3_S2` |
| 7 | Classifiers: Basics | Skill | cái, con, ly, chai, tô, bát — match classifier to noun | `/practice/classifiers-1` |
| 8 | Phase 3 Test | Test | | |

---

### Phase 4: Food & Prices

> Goal: Food vocabulary, ask prices.

| # | Node | Type | Content | Route |
|---|---|---|---|---|
| 1 | Vietnamese Food | Conv | phở, bánh mì, cơm, bún | `/lesson/lesson_007` |
| 2 | Food Quiz | Test | | |
| 3 | TELEX: Tone Keys | Skill | | `/practice/telex-1` |
| 4 | How Much? | Conv | bao nhiêu, tiền, đồng | `/lesson/lesson_008` |
| 5 | Prices Quiz | Test | | |
| 6 | Vowels: Centering | Skill | | `/practice/vowels-diph-1` |
| 7 | Numbers: 11-99 | Skill | | `/practice/numbers-2` |
| 8 | Question Words | Skill | gì, ở đâu, bao nhiêu, mấy — focused drill | `/practice/question-words-1` |
| 9 | Phase 4 Test | Test | | |

---

### Phase 5: Market Life

> Goal: Describe things, negotiate prices.

| # | Node | Type | Content | Route |
|---|---|---|---|---|
| 1 | Colors & Descriptions | Conv | màu, đỏ, xanh, to, nhỏ | `/lesson/lesson_009` |
| 2 | Colors Quiz | Test | | |
| 3 | Tone Marks: Master | Skill | | `/practice/tonemarks-master` |
| 4 | Haggling | Conv | đắt, rẻ, giảm, được không | `/lesson/lesson_010` |
| 5 | Haggling Quiz | Test | | |
| 6 | Grammar: Questions | Grammar | Question sentence patterns | `/grammar-lesson/p5_S2` |
| 7 | Classifiers: Extended | Skill | chiếc, cuốn, quả, bức, đôi — more classifiers for market items | `/practice/classifiers-2` |
| 8 | Prepositions | Grammar | trong, trên, dưới, gần, xa, với, cho, từ, đến | `/practice/prepositions` |
| 9 | Phase 5 Test | Test | | |

---

### Phase 6: Numbers Advanced

> Goal: Handle large numbers, shopping math.

| # | Node | Type | Content | Route |
|---|---|---|---|---|
| 1 | Fruits & Vegetables | Conv | | `/lesson/lesson_011` |
| 2 | Fruits Quiz | Test | | |
| 3 | Numbers: Challenge | Skill | | `/practice/numbers-3` |
| 4 | Big Numbers | Conv | | `/lesson/lesson_012` |
| 5 | Big Numbers Quiz | Test | | |
| 6 | Vowels: Gliding Diph. | Skill | | `/practice/vowels-diph-2` |
| 7 | Pitch: Easy Tones | Skill | | `/practice/pitch-1` |
| 8 | Quantifiers | Skill | từng, mỗi, mọi, hàng — each/every distinctions | `/practice/quantifiers` |
| 9 | Phase 6 Test | Test | | |

---

### Phase 7: Getting Around

> Goal: Directions, transport, hotel, ask for help.

| # | Node | Type | Content | Route |
|---|---|---|---|---|
| 1 | Where To? | Conv | | `/lesson/lesson_013` |
| 2 | Directions Quiz | Test | | |
| 3 | TELEX: Vowel Mods | Skill | | `/practice/telex-2` |
| 4 | Taxi & Grab | Conv | | `/lesson/lesson_014` |
| 5 | Taxi Quiz | Test | | |
| 6 | Grammar: Directions | Grammar | | `/grammar-lesson/p7_S2` |
| 7 | At the Hotel | Conv | | `/lesson/lesson_015` |
| 8 | Hotel Quiz | Test | | |
| 9 | TELEX: Full Challenge | Skill | | `/practice/telex-3` |
| 10 | Asking for Help | Conv | | `/lesson/lesson_016` |
| 11 | Help Quiz | Test | | |
| 12 | Pitch: Hard Tones | Skill | | `/practice/pitch-2` |
| 13 | Question Words: Advanced | Skill | khi nào, tại sao, thế nào, bằng gì | `/practice/question-words-2` |
| 14 | Connectors | Grammar | và, còn, nhưng — linking and contrasting ideas | `/practice/connectors` |
| 15 | Phase 7 Test | Test | | |

---

### Phase 8: Daily Life

> Goal: Time, weather, family, home.

| # | Node | Type | Content | Route |
|---|---|---|---|---|
| 1 | Time & Schedule | Conv | | `/lesson/lesson_017` |
| 2 | Time Quiz | Test | | |
| 3 | Pronouns: Core | Skill | | `/practice/pronouns-1` |
| 4 | Weather & Seasons | Conv | | `/lesson/lesson_018` |
| 5 | Weather Quiz | Test | | |
| 6 | Grammar: Time Expressions | Grammar | | `/grammar-lesson/p8_S2` |
| 7 | Family | Conv | | `/lesson/lesson_019` |
| 8 | Family Quiz | Test | | |
| 9 | Pronouns: Extended | Skill | | `/practice/pronouns-2` |
| 10 | Around the House | Conv | | `/lesson/lesson_020` |
| 11 | House Quiz | Test | | |
| 12 | Vowels: Advanced | Skill | | `/practice/vowels-diph-3` |
| 13 | Aspect Markers | Skill | đã/rồi, đang, sẽ/sắp, vừa/mới — timeline drill | `/practice/aspect-markers` |
| 14 | Intensifiers | Grammar | rất, lắm, quá — placement, formality, negation rules | `/practice/intensifiers` |
| 15 | Phase 8 Test | Test | | |

---

### Phase 9: Social Life

> Goal: Hobbies, feelings, invitations, casual conversation.

| # | Node | Type | Content | Route |
|---|---|---|---|---|
| 1 | Hobbies & Interests | Conv | | `/lesson/lesson_021` |
| 2 | Hobbies Quiz | Test | | |
| 3 | Teen Code: Basics | Skill | | `/practice/teencode-1` |
| 4 | Feelings & Opinions | Conv | | `/lesson/lesson_022` |
| 5 | Feelings Quiz | Test | | |
| 6 | Tones: All 6 | Skill | | `/practice/tones-4` |
| 7 | Invitations | Conv | | `/lesson/lesson_023` |
| 8 | Invitations Quiz | Test | | |
| 9 | Grammar: Invitations | Grammar | | `/grammar-lesson/p9_S3` |
| 10 | Teen Code: People | Skill | | `/practice/teencode-2` |
| 11 | At the Party | Conv | | `/lesson/lesson_024` |
| 12 | Party Quiz | Test | | |
| 13 | Teen Code: Life | Skill | | `/practice/teencode-3` |
| 14 | Particles: Emotion | Skill | nhỉ, nhé, à, hả, chứ, mà — conversational particles | `/practice/particles-2` |
| 15 | Degree Adverbs | Grammar | khá, tương đối, hơi, đến nỗi — expressing fine degrees | `/practice/degree-adverbs` |
| 16 | Vision Verbs | Skill | xem, ngắm, nhìn, thấy, trông, gặp — 6 ways to see/look | `/practice/vision-verbs` |
| 17 | Final Test | Test | | |

---

## Drill Modules Summary

| Module | Phase | Data file | Questions | Types |
|---|---|---|---|---|
| **Consonants: Initial** | 0 | `consonants_initial.json` | 20 | listen_pick, mcq, fill_blank |
| **Particles: Politeness** | 2 | `particles_politeness.json` | 16 | mcq, fill_blank |
| **Classifiers: Basics** | 3 | `classifiers_basics.json` | 16 | mcq, fill_blank |
| **Question Words** | 4 | `question_words.json` | 16 | mcq, fill_blank |
| **Classifiers: Extended** | 5 | `classifiers_extended.json` | 16 | mcq, fill_blank |
| **Question Words: Advanced** | 7 | `question_words_advanced.json` | 16 | mcq, fill_blank |
| **Aspect Markers** | 8 | `aspect_markers.json` | 16 | mcq, fill_blank |
| **Particles: Emotion** | 9 | `particles_emotion.json` | 16 | mcq, fill_blank |
| **Prepositions** | 5 | `prepositions.json` | 16 | mcq, fill_blank |
| **Quantifiers** | 6 | `quantifiers.json` | 16 | mcq, fill_blank |
| **Connectors: Và/Còn/Nhưng** | 7 | `connectors.json` | 16 | mcq, fill_blank |
| **Intensifiers: Rất/Lắm/Quá** | 8 | `intensifiers.json` | 16 | mcq, fill_blank |
| **Degree Adverbs** | 9 | `degree_adverbs.json` | 16 | mcq, fill_blank |
| **Vision Verbs** | 9 | `vision_verbs.json` | 16 | mcq, fill_blank |

**Total nodes in roadmap: 101** (was 93, added 8 grammar drill nodes)

---

## Content Totals

| Category | Count |
|---|---|
| Phases | 10 |
| Conversation lessons (orange) | 24 |
| Skill practice nodes (purple) | 35 |
| Grammar lessons (green) | 11 |
| Tests (red) | 31 |
| **Total roadmap nodes** | **101** |
| Drill questions (CMS-editable) | 228 |
| Lesson vocabulary items | 216 |
| Flashcard vocabulary items | 90 |
| Grammar topics (A1) | 28 |
| Reading articles | 13 |

---

## Curriculum Resource Integration

The `docs/Curriculum/` folder contains reference materials used to build drill content:

| Source file | What was integrated |
|---|---|
| `03_Grammar/05_ELEMENTARY_VIETNAMESE_GRAMMAR.md` | Units 26-30 → 5 drill modules (quantifiers, connectors, intensifiers, degree adverbs, vision verbs) |
| `03_Grammar/03_Grammar.md` | Prepositions section → 1 drill module |
| `02_Vocabulary/05_500_Popular_Words.md` | 60 new flashcard items across 10 new categories |
| `01_Basics/01_Alphabet.md` | Already covered by existing tone/vowel/consonant modules |
| `03_Grammar/04_Verbs.md` | Already covered by aspect markers drill |

**Still available for future integration:**
- `02_Vocabulary/01_Adjectives.md` — adjective vocabulary drill
- `02_Vocabulary/02_Nouns.md` — noun categories drill
- `03_Grammar/01_Plural.md` — những/các patterns drill
- `03_Grammar/02_Gender.md` — gendered terms drill
- `04_Phrases_and_Practical/01_Phrases.md` — survival phrases drill
- `05_Misc/02_Learn_Southern_Vietnamese_with_a_Saigonese_For_Free.md` — dialect comparison content

---

## Future (A2 expansion)

- Comparatives & superlatives (hơn, nhất, bằng)
- Modal verbs (có thể, nên, phải, cần)
- Passive voice (bị, được)
- Southern dialect toggle (swap audio + pronoun system)
- Common idioms & proverbs
- Formal register (business Vietnamese)
- More reading articles (A2/B1 level)
- Dictation exercises (listen → write full sentence)
- Sentence-level listening comprehension

---

## Open Questions

1. **Dialect strategy** — Should the app support a Southern mode from the start? This affects audio recordings, pronoun defaults, and some vocabulary (e.g., "bố" vs "ba" for father). Recommendation: defer to A2 expansion, but record Southern audio alongside Northern from the beginning.

2. **Listening comprehension** — Current listening is word-level (hear one word, pick it). Should we add sentence-level listening (hear a full sentence at natural speed, answer a comprehension question)? Recommendation: yes, as a new exercise type in the exercise generator, not as a separate practice module.

3. **Cultural notes** — Where should cultural context live? Options: (a) inline in conversation lessons, (b) as separate "culture cards" in the library, (c) both. Recommendation: inline in lessons with a distinct UI treatment (colored sidebar or icon).

4. **Spaced repetition scope** — Currently SRS tracks vocabulary words. Should it also track grammar patterns and classifier knowledge? Recommendation: yes, add grammar flashcards to SRS.
