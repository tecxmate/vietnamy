# Project Handoff: Language Learning App Template

> This document is written for the **next AI agent** who will clone this project to create a new app (e.g., English for Chinese/Taiwanese speakers). Read this before touching any code.

---

## What This App Is

**Vietnamy Education** is a mobile-first language learning app built with React + Vite. It teaches Vietnamese to English/Chinese speakers through interactive lessons, spaced repetition, a dictionary, grammar drills, and gamification (virtual currency, streaks, roadmap progression).

The architecture is designed to be **cloned and adapted** for other language pairs. The core systems (lesson engine, SRS, gamification, dictionary, admin CMS) are language-agnostic. What you need to swap out is the **content data** and **language-specific modules**.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, React Router 6 |
| Build | Vite 7 |
| Backend | Express.js (dictionary API only) |
| Database | SQLite (dictionary), localStorage (everything else) |
| Icons | Lucide React |
| Styling | CSS variables, mobile-first, dark/light mode |
| Chinese support | OpenCC-JS (simplified ↔ traditional conversion) |

---

## Project Structure

```
├── src/
│   ├── App.jsx                    # Router & main layout
│   ├── main.jsx                   # React entry point
│   ├── index.css                  # Global CSS variables & theme
│   ├── App.css                    # Layout styles
│   │
│   ├── context/                   # Global state (React Context + localStorage)
│   │   ├── UserContext.jsx        # User profile (name, age, level, goal)
│   │   ├── DongContext.jsx        # Currency, streaks, progress, unlocks
│   │   └── LanguageContext.jsx    # UI language toggle
│   │
│   ├── components/
│   │   ├── BottomNav.jsx          # Tab bar (5 tabs)
│   │   ├── TopBar.jsx             # Header with stats, settings modal
│   │   ├── LessonGame.jsx         # Core lesson engine (exercises)
│   │   ├── Onboarding/            # First-launch setup flow
│   │   └── Tabs/                  # One component per tab
│   │       ├── RoadmapTab.jsx     # Lesson path (Duolingo-style)
│   │       ├── PracticeTab.jsx    # Practice module grid
│   │       ├── DictionaryTab.jsx  # Word lookup
│   │       ├── ReadingLibraryTab.jsx
│   │       └── CommunityTab.jsx
│   │
│   ├── pages/
│   │   ├── GrammarLesson.jsx      # Grammar lesson player
│   │   ├── UnitTest.jsx           # Unit quiz
│   │   ├── Practice/              # All practice modules
│   │   │   ├── TonePractice.jsx   # Vietnamese-specific
│   │   │   ├── NumbersPractice.jsx
│   │   │   ├── FlashcardsPage.jsx # SRS flashcard review
│   │   │   └── ...more modules
│   │   └── Admin/                 # Content management system
│   │       ├── LessonBuilder.jsx
│   │       ├── RoadmapMapper.jsx
│   │       ├── GrammarEditor.jsx
│   │       └── ...more editors
│   │
│   ├── lib/
│   │   ├── db.js                  # Mock database (localStorage)
│   │   ├── srs.js                 # Spaced repetition algorithm
│   │   ├── grammarDB.js           # Grammar data manager
│   │   └── vocabLibrary.js        # Saved words & decks
│   │
│   ├── data/                      # Static content (JSON/JS)
│   │   ├── vocabWords.js          # Vocabulary with categories
│   │   ├── articleData.js         # Reading articles
│   │   ├── toneContours.js        # Vietnamese tone data
│   │   └── vn_grammar_bank_v2.json
│   │
│   └── utils/
│       ├── speak.js               # Browser TTS wrapper
│       ├── pitchDetector.js       # Audio pitch analysis
│       └── pronounLogic.js        # Vietnamese pronoun rules
│
├── server/
│   ├── server.js                  # Express API (dictionary search + suggest)
│   ├── databases/
│   │   ├── vn_en_dictionary.db    # SQLite: EN definitions (~464K entries)
│   │   └── vn_zh_dictionary.db    # SQLite: ZH definitions
│   └── scripts/                   # Data import & AI generation pipelines
│
├── public/                        # Static assets
├── vite.config.js                 # Dev proxy: /api → localhost:3001
└── package.json
```

---

## Core Systems (Language-Agnostic — Keep These)

### 1. Lesson Engine (`LessonGame.jsx`)
Renders exercises sequentially with:
- **5-heart system** — lose a heart on wrong answer, game over at 0
- **Streak tracking** — consecutive correct answers
- **Score calculation** — accuracy + streak bonuses
- **SRS integration** — adds learned vocab to spaced repetition on completion

Exercise types supported:
- `multiple_choice` — pick the correct translation
- `listen_tap` — hear audio, tap the word
- `speaking_repeat` — repeat after audio
- `reorder_words` — arrange tokens into correct sentence
- Easily extendable with new types

### 2. Roadmap & Progression (`RoadmapTab.jsx`)
Duolingo-style skill tree:
- **Units** contain **nodes** (lesson, skill, grammar, test)
- Each node has an `unlock_rule` specifying prerequisite nodes
- Node status: `locked` → `active` → `completed`
- Color-coded by type: lesson(yellow), skill(purple), grammar(green), test(orange)

### 3. Gamification (`DongContext.jsx`)
Virtual currency "₫" (Dong) system:
- Earn currency by completing lessons (formula: base + accuracy bonus + streak bonus)
- Spend currency to unlock practice modules
- Daily streak tracker with multiplier bonuses
- Replay penalty (50% rewards on repeat)

### 4. Spaced Repetition (`srs.js`)
SM-2 inspired algorithm:
- Intervals: 1 → 3 → 7 → 14 → 30 days
- Items added automatically from completed lessons
- `getDueItems()` returns cards ready for review
- FlashcardsPage provides the study UI

### 5. Dictionary (`DictionaryTab.jsx` + `server/server.js`)
Multi-source, multi-language dictionary:
- Server indexes SQLite databases on startup
- `/api/suggest?q=...` — fuzzy autocomplete (8 results)
- `/api/search?q=...&lang=en|zh` — full definitions with examples
- Handles diacritics (searching without tone marks works)
- Sources: VE, Wiktionary, FVDP, AI-generated, HanViet
- FVDP entries use a custom HTML parser (`parseFVDP()`) for clean rendering

### 6. Admin CMS (`/admin/*`)
Content management dashboard:
- RoadmapMapper — visual node editor
- LessonBuilder — create lessons + exercises
- GrammarEditor — manage grammar by CEFR level
- ArticleEditor, VocabEditor, ToneWordEditor, KinshipEditor

---

## Data Layer

### Client-Side (localStorage)

All lesson content, progress, and user data lives in localStorage:

| Key | Content |
|-----|---------|
| `vnme_mock_db_v5` | Full database: units, skills, lessons, exercises, items, path_nodes |
| `vnme_user_profile` | User profile (name, age, level, dialect, goal) |
| `vietnamy_dong` | Currency balance, streak, completed nodes, unlocked modules |
| `vnme_srs` | Spaced repetition card states |
| `vnme_saved_words` | Saved vocabulary IDs |
| `vnme_custom_decks` | Custom flashcard decks |
| `vnme_grammar_bank` | Grammar items |
| `vnme_settings` | TTS speed, font size, reminders |
| `vnme_onboarding_completed` | Boolean |
| `vietnamy_language` | UI language preference |

### Server-Side (SQLite)

Dictionary data only. Schema per database:

```sql
words       (id, word)
meanings    (id, word_id, source_id, part_of_speech, meaning_text)
sources     (id, name)
examples    (id, meaning_id, vietnamese_text, english_text)
word_metrics(word_id, subt_freq, mi, ipa, subt_disp)
```

### Data Structures

**Unit:**
```js
{ id: "unit_1_basics", unit_index: 1, title: "Unit 1 — Basics" }
```

**Path Node:**
```js
{
  id: "node_001", unit_id: "unit_1_basics", node_index: 1,
  node_type: "lesson",     // "lesson" | "skill" | "test"
  lesson_id: "lesson_001",
  label: "Hello & Goodbye",
  unlock_rule: { requires: [{ type: "node_completed", node_id: "node_prev" }] }
}
```

**Exercise:**
```js
{
  id: "ex_001", lesson_id: "lesson_001",
  exercise_type: "multiple_choice",
  prompt: {
    vi_text: "How do you say 'hello'?",
    choices: [
      { id: "c1", vi_text: "Xin chào", correct: true },
      { id: "c2", vi_text: "Tạm biệt" }
    ]
  }
}
```

**Vocab Item:**
```js
{
  id: "it_w_0001", item_type: "word",
  vi_text: "xin chào", audio_key: "a_xin_chao", dialect: "both"
}
```

---

## Styling System

Mobile-first (max-width: 480px), dark/light mode via CSS variables:

```css
:root {
  --primary-color: #FFB703;    /* Brand yellow */
  --secondary-color: #118AB2;  /* Blue accent */
  --success-color: #06D6A0;    /* Green */
  --danger-color: #EF476F;     /* Red */
  --bg-color: #121212;         /* Dark background */
  --surface-color: #1E1E1E;    /* Card background */
  --text-main: #FFFFFF;
  --text-muted: #A0A0A0;
  --border-color: #2C2C2C;
  --spacing-1 to --spacing-12; /* 4px to 48px */
  --radius-sm/md/lg/full;
}
```

Light mode overrides via `@media (prefers-color-scheme: light)`.

---

## How to Run

```bash
# Install
npm install
cd server && npm install && cd ..

# Development (both frontend + backend)
npm run dev:all

# Frontend only: localhost:5173
npm run dev

# Backend only: localhost:3001
npm run dev:server

# Production build
npm run build && npm start
```

---

## How to Clone for a New Language App

### Step 1: What to Keep (language-agnostic)
- Lesson engine (`LessonGame.jsx`)
- Roadmap system (`RoadmapTab.jsx`, path node logic)
- Gamification (`DongContext.jsx`)
- SRS system (`srs.js`, `FlashcardsPage.jsx`)
- Dictionary infrastructure (`DictionaryTab.jsx` shell, `server.js` API)
- Admin CMS
- Styling system & CSS variables
- Onboarding flow structure

### Step 2: What to Replace (language-specific content)
- **`src/lib/db.js`** — Replace all Vietnamese lesson content (units, lessons, exercises, vocab items) with your target language
- **`src/data/vocabWords.js`** — Replace vocabulary list
- **`src/data/articleData.js`** — Replace reading articles
- **`src/data/vn_grammar_bank_v2.json`** — Replace grammar items
- **`src/data/toneContours.js`** — Remove or replace (Vietnamese-specific)
- **`src/data/kinshipData.js`** — Remove or replace (Vietnamese-specific)
- **`server/databases/*.db`** — Replace with your language pair dictionary databases

### Step 3: What to Remove or Adapt (Vietnamese-specific modules)
- `TonePractice.jsx` — Vietnamese 6-tone system (remove or adapt for Mandarin 4 tones)
- `TonePitchTraining.jsx` — Pitch contour training (adapt for target language)
- `ToneMarks.jsx` — Vietnamese diacritics (remove for English)
- `TelexTyping.jsx` — Vietnamese TELEX input (remove)
- `VowelsPractice.jsx` — Vietnamese vowel system (adapt)
- `PronounsPractice.jsx` — Vietnamese pronoun system (adapt)
- `pronounLogic.js` — Vietnamese pronoun conjugation rules
- `FamilyTree.jsx` — Vietnamese kinship system (remove)

### Step 4: What to Rebrand
- App name: "Vietnamy Education" → your app name
- Currency name: "Dong ₫" → your currency
- `TopBar.jsx` credits section — update developer info
- `index.html` — update title, meta tags, favicon
- Color scheme in `index.css` if desired
- localStorage key prefixes (`vnme_*`, `vietnamy_*`) — rename to avoid conflicts

### Step 5: Dictionary Setup (for English↔Chinese)
For an English teaching app for Chinese speakers:
1. Source an EN↔ZH dictionary dataset (StarDict, CC-CEDICT, etc.)
2. Import into SQLite with the same schema (`words`, `meanings`, `sources`, `examples`)
3. Update `DictionaryTab.jsx` MODES and SOURCE_LABELS
4. Update `server.js` database paths
5. The FVDP parser (`parseFVDP()`) is specific to that source — you'll need equivalent parsers for your dictionary format

---

## Important Gotchas

1. **No backend auth** — All user data is in localStorage. There are no user accounts.
2. **No audio files in repo** — `audio_key` fields reference external audio. You need to provide your own TTS or audio assets.
3. **Dictionary databases are large** — The SQLite files are 100MB+. They're not committed to git; you'll need to generate/import your own.
4. **The "mock database" in db.js is the real database** — Despite the name, `vnme_mock_db_v5` in localStorage IS the production data store. It seeds from the hardcoded default in `db.js` on first load.
5. **Admin CMS writes to localStorage** — Content edits via `/admin` modify the same localStorage database that users read from. Good for single-device authoring, not multi-user.
6. **Browser TTS** — The app uses `window.speechSynthesis` for pronunciation. Quality varies by browser and OS. Vietnamese voices are available on most modern devices.
7. **No test framework** — There's ESLint but no Jest/Vitest. Add tests if you're building something production-grade.
8. **Settings modal in TopBar.jsx** — Contains credits, legal links, TTS settings, dialect preference, font size, reset button. Update the credits and legal URLs for your brand.

---

## Quick Reference: Adding Common Things

**New lesson:**
1. Add exercises to `db.js` → `exercises` array
2. Add lesson blueprint to `lesson_blueprints`
3. Add path node to `path_nodes` with `unlock_rule`

**New practice module:**
1. Create component in `src/pages/Practice/`
2. Add route in `App.jsx`
3. Add to grid in `PracticeTab.jsx`

**New tab:**
1. Create component in `src/components/Tabs/`
2. Add to `renderTab()` in `App.jsx`
3. Add to `BottomNav.jsx`
4. Add to `TAB_META` in `TopBar.jsx`

**New grammar content:**
Use `/admin/grammar` or edit `vn_grammar_bank_v2.json`

---

## Credits

Developed by [TECXMATE.COM](https://tecxmate.com)
Built with Claude Opus 4.6 (Anthropic)
