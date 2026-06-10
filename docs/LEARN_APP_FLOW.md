# Vietnamy — Learn App: User Flow & Lesson Design

**Scope:** The Duolingo-style *Learn* app only (`/learn` shell). The Dictionary/tools/flashcards app (`/dictionary` shell) is intentionally out of scope here.
**Target learner:** A total beginner who knows zero Vietnamese and may not even know it is a tonal language.
**Design principle:** Reuse the existing engine, exercise types, and data shapes. Re-sequence the curriculum and build the two missing surfaces (a Foundations bootcamp and an in-lesson tip/notebook). No ground-up rewrite.

---

## 1. The core problem

The app is not short on features — it has 140 lessons, 10 exercise types, an SRS engine, pronunciation scoring, a roadmap with unlock gating, and 45+ practice drills. What it lacks is a **pedagogical spine**: a single, deliberate answer to "what does a brand-new person see, in what order, and why."

Three concrete symptoms of the missing spine:

1. **No on-ramp for tones or script.** Lesson 1 (`lesson_001`, "Hello! My name is") opens directly on the vocab `Chào`, `Tôi`, `Bạn`. A beginner has no idea Vietnamese has six tones that change meaning, what the diacritics do, or how to physically produce them. They are asked to recognize and reproduce words before they can hear the system those words live in. This is the single biggest leak in the funnel.

2. **Grammar and tips exist in the data but never reach the learner mid-lesson.** Sentences already carry a `note` field (`"tên là = 'is named'"`) and grammar `tags` (`["GT002"]`), and there's a `getConceptsForLesson()` hook — but none of it renders during exercises. The learner does drills with no explanation of *why* the answer is right. Grammar is locked away in a separate guidebook they have to leave the lesson to find.

3. **Too many entry points, no obvious path.** Practice modules (tones, vowels, pronouns, classifiers, telex…) live as a flat pile of 45 drills. A beginner can't tell what's foundational vs. advanced, or when they're "supposed to" do each one. They need a single line to walk, with side-quests offered at the right moment — not a buffet.

The good news: the fix is mostly **sequencing and surfacing**, not building. Everything below maps onto code that already exists.

---

## 2. What makes Vietnamese different (and what the sequence must respect)

A generic Duolingo clone fails for Vietnamese because the hard parts are front-loaded and structural, not vocabulary volume. The curriculum order must be built around these four realities:

- **Tones are meaning, not accent.** `ma` (ghost), `má` (mother/cheek), `mà` (but), `mả` (tomb), `mã` (horse/code), `mạ` (rice seedling) are six different words. A learner who can't *hear* the difference can't learn anything else reliably. Tones must come first and be trained by ear, not just by sight.
- **The script is Latin but the diacritics do double duty.** Some marks are vowel quality (`ơ`, `ư`, `ê`, `ô`, `ă`, `â`), others are tone (`á à ả ã ạ`). Beginners conflate them. They need to learn to read the two layers separately before they trust the spelling.
- **There is almost no inflection.** No verb conjugation, no plurals, no gendered articles. This is a *gift* — once a learner has words and word order, they can build sentences fast. The curriculum should cash this in early to create momentum after the hard tone on-ramp: "you already know enough to say real things."
- **Pronouns and classifiers are the real grammar.** "I/you" depends on the relative age and relationship of the speakers (`anh/chị/em/cô/chú/...`), and counting nouns requires classifiers (`con`, `cái`, `chiếc`...). These are the conceptual mountains, not tense. They deserve dedicated, well-placed lessons rather than being scattered.

**The spine in one sentence:** *Hear the tones → read the script → say a few real phrases fast → then build outward topic by topic, introducing pronouns and classifiers as explicit milestones.*

---

## 3. The revised learner journey (top to bottom)

```
First open
  └─ Onboarding (who are you, why, which voice)
        └─ 60-second "Can you hear it?" tone teaser   ← NEW, before any account friction pays off
              └─ FOUNDATIONS bootcamp (Unit 0)         ← NEW
                    ├─ 0.1 The 6 tones by ear
                    ├─ 0.2 Tone marks (reading them)
                    ├─ 0.3 Vietnamese vowels
                    ├─ 0.4 How to play (exercise-type tutorial woven in)
                    └─ 0.5 Checkpoint: hear + read 6 tones
                          └─ Unit 1: Introduce Yourself   ← existing content starts here
                                └─ Unit 2 … Unit 9 (reordered, see §5)
```

The key move: insert **Unit 0 (Foundations)** between onboarding and the existing Unit 1, and put a tiny tone teaser *inside* onboarding so the learner feels the core challenge before they've invested anything.

---

## 4. Onboarding → first lesson (the first five minutes)

The existing 5-step onboarding (sign-in → name → goal → dialect/voice → level/daily-goal) is solid and should stay. Two changes:

**4a. Move "level" from self-assessment to a behavior.** A total beginner doesn't know if they're "beginner" or "elementary." Replace the self-rated level step with a 3-question *placement micro-quiz* (or keep it but default everyone who can't answer a single A1 question into Unit 0). The goal is that *true zeros always land in Foundations*, and only people who demonstrably know the alphabet/tones can skip it.

**4b. Add a 60-second tone teaser as the last onboarding screen.** Before the roadmap appears, play two near-identical syllables (`ma` vs `mà`) and ask "did these mean the same thing?" Reveal that they're different words. This is the hook: it tells the learner *what this app is really teaching* and earns the Foundations unit instead of making it feel like a chore. It reuses the existing TTS pipeline (`buildTtsUrl`) and the tone audio already in the Sounds modules.

**The handoff:** onboarding completes → land on the roadmap with **Unit 0, Lesson 0.1 pulsing as the only available node**. The `AppTutorial` overlay fires here and is rewritten to point at that first node ("Tap to start — let's learn to hear Vietnamese"). One clear call to action, nothing else tappable.

---

## 5. The beginner curriculum sequence

### Unit 0 — Foundations *(new; assembled from existing Practice modules)*

This is not new content — it's the existing Sounds/Practice drills, promoted into the main path and given a teaching order. Each becomes a roadmap node with the same look as a lesson.

| Node | Title | Built from | Goal |
|------|-------|-----------|------|
| 0.1 | Hear the 6 tones | `ToneMarksBasic` + `ToneLesson`/`PitchGraph` | Distinguish the 6 tones by ear in minimal pairs (`ma/má/mà/mả/mã/mạ`). Recognition only. |
| 0.2 | Read the tone marks | `ToneMarksSpecial`/`Master` | Map each mark (´ ` ̉ ̃ ̣) to its sound. Connect symbol → tone. |
| 0.3 | Vietnamese vowels | `VowelsSingle1/2` | The vowels that don't exist in English: `ơ ư ê ô ă â`. Quality, not tone. |
| 0.4 | Your first words + how to play | New micro-lesson (uses `lesson_001` vocab) | Teach the exercise *mechanics* (match, MCQ, listen-tap, word-bank) on 3 already-familiar tone syllables, so the game UI is learned before real content. |
| 0.5 | Foundations checkpoint | Mini-test (`test` node type) | Hear a tone + pick its mark; pick the word from audio. Gate to Unit 1. |

Rationale for this order: **ear before eye before mechanics.** Recognition (0.1) precedes production. Reading (0.2) attaches symbols to sounds already heard. Vowels (0.3) finish the phonetic picture. Only at 0.4 do we introduce the *game itself*, on safe familiar material, so the first "real" lesson isn't fighting two new things at once (content + UI). 0.5 proves readiness and unlocks the existing curriculum.

> Keep it short. Five nodes, ~3–4 minutes each. The risk of Foundations is that it feels like eating vegetables before the meal; the teaser in §4b and tight length are what keep people moving.

### Units 1–9 — the existing Explore Vietnam track, lightly reordered

The current order (`explore_vietnam.json`) is already sensible. One adjustment for a beginner: **numbers should come earlier**, because they unlock prices, time, ages, and quantities everywhere, and they're a confidence win (low ambiguity, instant payoff). Recommended order:

1. **Introduce Yourself** — greetings, names, `tôi`/`bạn`. *First milestone: basic pronouns introduced here, gently.*
2. **Numbers & Well-being** — 0–10, "how are you." (already #2; good.)
3. **Family & People** *(moved up from #4)* — because this is where **kinship pronouns** (`anh/chị/em/cô/chú`) belong, and pronouns are needed for almost every later sentence. Promote this as an explicit **"Pronoun milestone"** node with a concept card.
4. **Restaurant** — ordering, paying. First place **classifiers** (`một cái`, `hai ly`) appear naturally → explicit **"Classifier milestone."**
5. **Time & Dates** — past `đã`, future `sẽ`, progressive `đang`. The tense markers, taught as "time words you add," not conjugation.
6. **Shopping** — colors, sizes, comparatives (`hơn`, `nhất`).
7. **Transportation & Directions** — `có thể` (can), `phải` (must).
8. **Hotel & Accommodation** — conditionals (`nếu…thì`).
9. **Weather & Daily Life** — frequency adverbs.

The only structural change is promoting **Family** ahead of **Restaurant** so kinship pronouns land before the learner needs them, and tagging two nodes (Family → pronouns, Restaurant → classifiers) as **milestone concepts** that get a richer intro card. Everything else is the existing data.

### Side-quests (optional, offered at the right moment, not on the main line)

Telex typing, teencode, advanced kinship calculator, and the deeper grammar drills stay as **optional branches** off the roadmap, surfaced contextually — e.g. after Unit 1, offer "Want to type Vietnamese on your keyboard? Try Telex." This keeps the main spine clean while making the 45 drills discoverable when relevant.

---

## 6. Anatomy of a lesson (and where tips/notebook live)

A single lesson should always have the same three-act shape so the learner builds a reliable mental model:

```
┌── ACT 1: TEACH (new material, low pressure) ────────────┐
│  • Concept card (if milestone)  ← getConceptsForLesson() │
│  • Vocab intro cards: word + image + audio (tap to hear) │
└──────────────────────────────────────────────────────────┘
┌── ACT 2: PRACTICE (the drills) ─────────────────────────┐
│  10–15 generated exercises, easy → hard:                 │
│  match_pairs → mcq → listen_choose → word_bank →         │
│  reorder → fill_blank → speak_sentence                   │
│  with the TIP CHIP + NOTEBOOK available throughout  ← NEW │
└──────────────────────────────────────────────────────────┘
┌── ACT 3: SEAL (consolidate + reward) ───────────────────┐
│  • Summary of words learned → added to SRS               │
│  • XP / streak / coin reward                             │
│  • "What you can now say" recap → next node              │
└──────────────────────────────────────────────────────────┘
```

The engine (`LessonGame.jsx`) already does Act 1 (intro cards) and Act 3 (SRS add + reward). The missing piece is **the tip/notebook layer in Act 2.**

### 6a. The Tip Chip (in-context, lightweight)

When an exercise involves a sentence that carries a `note` or grammar `tag`, show a small **💡 tip chip** under the exercise. Tapping it slides up a short explanation — *not* a wall of grammar. Example, on the `Tôi tên là ___` exercise, the chip reads "Tip" and expands to: *"`tên là` literally means 'is named.' Vietnamese skips 'my' — `Tôi tên là Anna` = 'I named-is Anna.'"* That text is **already in the data** (`note: "tên là = 'is named'"` plus the `GT002` grammar tag's description).

Rules for the tip chip:
- Appears only when the current item has a `note` or `tag`. No chip = no clutter.
- Default collapsed. One tap to expand, never blocks the answer.
- Pulls from `note` first, falls back to the grammar tag's `description`/`example` (the canonical `grammarTags` in `curriculum.json`).
- First time a given grammar tag appears, auto-expand once so it's not missed; thereafter collapsed by default.

### 6b. The Notebook (persistent, per-lesson)

A 📓 **Notebook** button in the lesson header opens a slide-over panel showing *everything taught in this lesson so far*: the vocab list (with audio), and every grammar point/tip encountered, accumulated. It's the "I forgot what `đã` meant three questions ago" rescue. Because the lesson already knows its words (`getLessonBlueprint`) and its sentences' `tags`/`notes`, the notebook is a **read-only assembly of data the lesson already holds** — no new content authoring.

Two scopes worth supporting:
- **Lesson notebook** (this lesson's items) — always available in-lesson.
- **Grammar journal** (cumulative across lessons) — every tag the learner has ever met, growing over time, viewable from the roadmap. This is the bridge to the existing `GrammarGuidebook` without making the learner leave the lesson.

### 6c. Hearts / pressure

Hearts are currently set to `Infinity` (gating removed). For a beginner that's the right call — keep the first ~Unit 0 and Unit 1 fully pressure-free. Consider reintroducing a gentle heart/streak system *only* from Unit 2 onward, once the learner is hooked, and never on tone-listening exercises (failing to hear a tone shouldn't punish — it should replay).

---

## 7. Mapping to the codebase (what to reuse, what to build)

| Need | Already exists | Work required |
|------|----------------|---------------|
| Tone/vowel teaching content | `ToneMarks*`, `Vowels*`, `ToneLesson`, `PitchGraph` in `src/pages/Practice/` | **Wire** them as Unit 0 roadmap nodes; add ordering + unlock rules in `db.js`/curriculum. |
| Foundations as a unit | `path_nodes`, `unlock_rule`, `test` node type | **Author** Unit 0 node list (5 nodes) + checkpoint test. Data only, no new components. |
| Tone teaser in onboarding | `OnboardingFlow.jsx`, `buildTtsUrl`, tone audio | **Add** one screen (Screen 5) with an A/B "same or different?" tap. |
| Placement instead of self-rated level | Onboarding step 4 | **Replace** level select with 3-question micro-quiz → default to Unit 0. |
| Concept/milestone cards | `getConceptsForLesson(lessonId)` (infra present, unused) | **Populate** concepts for Family (pronouns) and Restaurant (classifiers); render in Act 1. |
| In-lesson tip chip | `note` + `tags` on sentences; `grammar_tags.json` | **Build** a `<TipChip>` component in `LessonGame.jsx` Act 2. |
| In-lesson notebook | `getLessonBlueprint`, sentence `tags`/`notes`, `GrammarGuidebook` | **Build** a `<LessonNotebook>` slide-over; assemble from existing data. |
| Reordered curriculum | `explore_vietnam.json` units | **Swap** order of Family ↔ Restaurant; tag 2 milestone nodes. |
| Cumulative grammar journal | `GrammarGuidebook`, progress tracking | **Add** a "seen tags" set to progress; filter the guidebook by it. |

Nothing in the right column is a rewrite. The two genuinely new components are `<TipChip>` and `<LessonNotebook>`, both of which read data the app already loads.

---

## 8. Suggested build order (phased)

**Phase 1 — The on-ramp (highest impact on retention).**
Build Unit 0 (wire existing tone/vowel drills as 5 nodes + checkpoint), add the onboarding tone teaser, and make true beginners always land in Unit 0. This closes the biggest funnel leak: people bouncing because lesson 1 was incomprehensible.

**Phase 2 — In-lesson understanding.**
Build `<TipChip>` and `<LessonNotebook>`, rendering the `note`/`tags` data that's already there. This is what turns "drilling" into "learning" and is the feature you specifically asked for.

**Phase 3 — Curriculum polish.**
Reorder Family ahead of Restaurant; author the pronoun and classifier milestone concept cards; add the cumulative grammar journal. Surface the side-quest drills (Telex, etc.) contextually.

**Phase 4 — Gentle stakes.**
Reintroduce hearts/streak from Unit 2 onward; tune the reward/recap "Seal" screen; add the placement micro-quiz to replace self-rated level.

Each phase ships independently and is testable on its own.

---

## 9. Open questions to resolve before building

1. **Tone production vs. recognition in Unit 0** — do you want the learner to *speak* tones in Foundations (using the existing pitch detector / pronunciation scoring), or recognition-only first with production deferred to Unit 1? Recommendation: recognition-only in 0.1–0.3, first production attempt in 0.4, kept low-stakes.
2. **Northern vs. Southern from day one** — the learner picks a voice in onboarding, but the curriculum data is largely tagged `dialect: north`. Do you teach one dialect cleanly first, or expose both? Recommendation: teach the chosen dialect only through Unit 9; flag dialect differences as optional notes, not core content.
3. **How aggressive is the placement skip?** — should anyone be able to skip Foundations, or only via a demonstrated quiz pass? Recommendation: gate the skip behind the same 0.5 checkpoint, so skippers still prove they can hear/read tones.
4. **Notebook scope** — ship the per-lesson notebook first (Phase 2) and the cumulative grammar journal later (Phase 3), or build both together?
```
