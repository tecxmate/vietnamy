# Teach-before-practice LEARN flow — pilot spec

Pilot the "teach then practice" lesson flow from the design mockups, starting
with **one Unit 1 module end-to-end** (Subject + Verb + Object — "Tôi ăn cơm").

## Decisions (locked with Niko)
- **Intensity dial:** curriculum caps *plus* a learner **Light / Standard / Deep**
  toggle that shows/hides the compressible layer (insight cards + extra examples).
- **Content model:** define a typed LEARN-step schema now, hand-author Unit 1,
  build the admin editor later.
- **Dose per module (conservative):** 1 pattern · **≤4 new words** · 1 core
  insight · ~4 practice items. Spread thin → more small modules per unit.
- **Sequence:** one module end-to-end first, lock the flow, then replicate.

## Architecture: extend LessonGame, don't add a new engine
The design's single progress bar (LEARN 1/9 → PRACTICE 5/9) already matches
`LessonGame`, which builds one `steps[]` array = teaching steps + exercise steps
with one progress bar. We add richer **LEARN step types** to the front of that
array. No new route, no 4th teaching system.

## LEARN-step schema (new: content/learn_modules.json)
A module's teaching phase is an ordered list of typed steps. `depth` gates
visibility against the learner toggle.

```jsonc
{
  "module_id": "a1_svo",
  "unit_id": "phase_1_first_words",
  "title_vi": "Chủ ngữ + Động từ + Tân ngữ",
  "title_en": "Subject + Verb + Object",
  "est_minutes": 6, "cefr": "A1.2", "difficulty": 2,
  "learn": [
    { "type": "objective", "depth": "core",
      "can_do": ["Say what you are doing to something — Tôi ăn cơm",
                 "Order food and drink without pointing",
                 "Recognise the pattern in 4 everyday verbs"],
      "already_know": { "title_vi": "Chủ ngữ + Động từ", "note": "Subject + Verb — done earlier. This adds the object." } },

    { "type": "pattern", "depth": "core",
      "slots": [ {"label":"SUBJECT","color":"navy"}, {"label":"VERB","color":"pink"}, {"label":"OBJECT","color":"teal"} ],
      "example": { "vi": "Tôi ăn cơm", "en": "I eat rice", "slot_map": ["Tôi","ăn","cơm"] },
      "note": "Add an object the same way as in English.",
      "examples": [ {"vi":"Anh ấy uống nước","en":"He drinks water"}, {"vi":"Chúng tôi đọc sách","en":"We read a book"} ] },

    { "type": "insight", "depth": "core",   "kicker": "The question everyone asks",
      "headline": "Vietnamese is SVO — like English",
      "body": "Sentences are Subject + Verb + Object, exactly like English — you already have the instinct." },
    { "type": "insight", "depth": "deep",   "kicker": "Not like English",
      "headline": "No verb conjugation. ăn is ăn — always.",
      "body": "Present simple is the default. Time is carried by adverbs (đang, in a later module), not the verb." },
    { "type": "insight", "depth": "deep",   "kicker": "Watch out",
      "headline": "A counter can sit before the object",
      "body": "Con mèo bắt con chuột — 'con' is the counter for animals, not part of the noun. Counters come later." },

    { "type": "vocab", "depth": "core", "words": [
        {"vi":"ăn","en":"to eat","pos":"verb","example":{"vi":"ăn cơm","en":"eat rice"}},
        {"vi":"uống","en":"to drink","pos":"verb","note":"Takes a liquid object directly — no preposition.","example":{"vi":"uống nước","en":"drink water"}},
        {"vi":"đọc","en":"to read","pos":"verb","example":{"vi":"đọc sách","en":"read a book"}},
        {"vi":"cơm","en":"rice (cooked)","pos":"noun","example":{"vi":"ăn cơm","en":"eat rice"}}
    ] }
  ]
}
```

Conservative trims the design's 6 words → **4** (ăn, uống, đọc, cơm); `nghe`,
`bắt` move to a later module. Two of the three insights are `deep` (hidden at
Light/Standard core view unless the learner opts into Deep).

## Depth toggle (the adjustable dial)
- Setting `learnDepth`: `light` | `standard` (default) | `deep`.
- Filter rule for LEARN steps:
  - **light** → show only `depth:"core"` steps; pattern shows 1 example; skip extra `examples[]`.
  - **standard** → all `core` steps, pattern shows 2–3 examples.
  - **deep** → everything, including `depth:"deep"` insights and all examples.
- Curriculum cap stays authored (≤4 words etc.); the toggle only compresses the
  explanatory layer, never changes which words/pattern are taught.

## Renderers (LessonGame)
Add step components for `objective`, `pattern`, `insight`, `vocab` (carousel),
styled to the Tạp Chí theme (navy/pink/teal/gold, Finesse). Existing exercise
steps (mcq_translate_to_en, etc.) follow unchanged. One progress bar over the
whole sequence.

## Practice phase (~4 items, reuse existing types)
mcq_translate_to_en (Tôi ăn cơm → I eat rice), listen_choose, match_pairs
(verb→object), speak_sentence. Drawn only from the pattern + 4 words taught.

## Admin — a teacher (no tech skill) must be able to edit this
New admin editor **"Lesson Modules"** (`/admin/learn`, sidebar entry), following
the ConceptEditor pattern but deliberately friendlier. Requirements:
- **No JSON.** Every field is a labelled form input. Schema maps 1:1 to fields:
  - Module header: title (VI/EN), unit dropdown, minutes, CEFR, difficulty.
  - Objective: a bullet list of "By the end you can…" (add/remove rows) + the
    "You already know" bridge (one line).
  - Pattern: slot chips (label + colour picker), the example (VI/EN + which word
    maps to which slot), and an add/remove list of extra examples (VI/EN).
  - Insight: kicker + headline + body, and a **plain-language "Show to"** selector
    — *Everyone (Light) · Most learners (Standard) · Advanced (Deep)* — NOT the
    raw core/deep tokens.
  - Vocab: word rows (VI, EN, part of speech, note, example VI/EN) with add/remove.
  - Practice: pick from a simple exercise-type menu; author prompt + answers.
- **Live phone-frame preview** beside the form, rendering the exact learner view
  (reuses the same LEARN renderers) so the teacher sees what they build.
- **Attach to a roadmap node** via a dropdown (like concepts attach to a lesson).
- Saves to `localStorage` (`vnme_cms_learn_modules`) overriding the baked bundle,
  consistent with every other editor; included in Export/Import curriculum JSON.
- Reuse shared inputs; keep labels in plain teacher language, add helper text.

## Build order
Phase A — learner flow (locks the shape the teacher will edit):
1. `content/learn_modules.json` + `src/lib/learnModules.js` loader (bundle +
   localStorage override, mirrors concepts.js).
2. LessonGame: build LEARN steps from a module's `learn[]`, filtered by depth,
   and practice from `practice[]`.
3. Four LEARN renderers (objective / pattern / insight / vocab).
4. `learnDepth` setting + toggle in Settings (Light/Standard/Deep).
5. Author the SVO pilot module (learn + 4 practice) and make it launchable.
6. Playwright: walk Light vs Deep; screenshot each LEARN step.

Phase B — admin (immediately after A, not deferred):
7. "Lesson Modules" editor per the section above, with live preview.
