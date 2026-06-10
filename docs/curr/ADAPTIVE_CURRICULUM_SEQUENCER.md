# Adaptive Curriculum Sequencer — Concept, Feasibility & Scope

**The idea:** one shared foundation, then the path *selectively and dynamically appends* the next lesson based on (a) the learner's purpose, (b) how well they're doing, and (c) eventually how engaged they are — Spotify-autoplay style. Don't author three diverging curricula; tag one pool and let the sequencer mix and match.

**Verdict up front:** the concept is sound and not too novel — but build it in *layers*, foundation first. The enabling work (standardized tags + a prerequisite graph) is low-risk data work worth doing now. The purpose-weighted sequencer is a transparent scoring function, also doable soon. The "enthusiasm-driven autoplay" is the speculative part: **instrument the signals now, act on them later.**

---

## 1. The one reframing that matters: a playlist *with rules*

Spotify autoplay works because **songs have no prerequisites** — any song can follow any song. Lessons are different: you cannot serve a lesson that *uses* past tense before past tense is *taught*. If you ignore this, the "dynamic mix" produces sequences that are subtly broken — a learner hits a sentence with grammar they've never seen and feels stupid, and you can't debug why.

So the correct mental model is **a recommender constrained by a prerequisite graph**: the algorithm is free to choose *among lessons whose prerequisites are already satisfied*, and it ranks those by purpose-fit, difficulty-fit, and review needs. Free choice *within* the rules; hard rules underneath. Everything below is built around that.

A second, softer rule from learning science (and from Duolingo's own evolution): **keep a visible path.** Fully dynamic, invisible sequencing robs the learner of the sense of a map, of progress, of "I'm 3 nodes from the next milestone." So: dynamic *selection* of what's coming, but always *rendered* as a coherent, visible path — not a slot machine that hands you one mystery lesson at a time.

---

## 2. You're closer to this than it feels

What already exists and supports the idea (so this is less work than authoring three curricula):

- **Modes already share a lesson pool**, filtered by a `topic` tag (`learnerModes.js`), not three separately-authored tracks. The skeleton of "one pool, per-purpose view" is already there.
- **Rich per-item metadata** already on every lesson: `cefr`, `difficulty`, `topic`, `focus`; per word `pos`/`frequency`/`dialect`; per sentence grammar `tags` (GT IDs) + `note`.
- **Per-word mastery already captured** across six skill dimensions (`wordGrades.js`: meaning recognition/production, listening, spelling, speaking, context — each with correct/wrong counts).
- **SRS already running** (`srs.js`: interval, due date, correct/wrong per item) — data is collected, just not surfaced.
- **Dormant adaptive plumbing already written but unused:** `getWeakItems()` / `getWeakestDimension()` (weakness detection), `getDueItems()` (review queue), `validateVocabPrerequisites()` (prerequisite checker). These are gifts — half the engine is already in the repo, switched off.
- **Exercise generation is already dynamic and session-aware** (`exerciseGenerator.js` session profiles 0–3 vary the mix on repeat). Lessons are assembled, not frozen.

What's genuinely missing:
- Tags are **inconsistent and incomplete** — no explicit multi-purpose tagging, no standard.
- The **prerequisite graph is empty** (`vocab_requires: []` everywhere; grammar-introduced-in linkage not built).
- **No engagement signals** — zero capture of response time, hesitation, quits, replays, completion speed.
- **Sequencing is hard-linear** (`getNextNode` = strictly next by index) with no branching seam.

---

## 3. The layered model (what to build, in order of safety)

Think of it as six layers, from "must stay fixed" to "speculative." Each is independently shippable.

| Layer | What it is | Build when | Risk |
|---|---|---|---|
| **0 — The Spine** | Foundations (tones/alphabet) + core A1 survival lessons. Same for everyone, hard-ordered. Tones come first regardless of purpose. | Exists. **Keep fixed.** | — |
| **1 — Standardized tags** | A consistent tag schema on every lesson so mixing is even possible. The enabling foundation. | **Now** | Low (data only) |
| **2 — Prerequisite graph** | Populate `requires_vocab` / `requires_grammar` so the sequencer can't violate prerequisites. Enforce the existing validator. | **Now** | Low (data + wiring) |
| **3 — Purpose-weighted selection** | After the spine, choose the next lesson from the shared pool by a transparent scoring function (purpose-fit + difficulty-fit + variety), filtered by Layer 2. | **Soon** | Medium |
| **4 — Performance-adaptive insertion** | Use captured right/wrong to insert review/remediation when mastery is low, and allow skip-ahead when high. Surfaces the dormant SRS/weak-item code. | **Soon** | Medium |
| **5 — Engagement ("enthusiasm")** | Use speed/hesitation/quits/replays to bias selection. | **Instrument now, act later** | High |

The crucial discipline: **don't build Layer 3+ on top of missing Layers 1–2.** A recommender over incomplete tags and an empty prerequisite graph will produce incoherent, un-debuggable sequences. Tags and the graph are the foundation that makes everything above it trustworthy.

---

## 4. Layer 1 — the standardized tag schema (the now-work)

The goal: tag each lesson with enough *context* that a sequencer can mix and match safely. Most of this already exists in scattered form; the job is to **standardize and complete it**, especially the bold (new) fields.

```jsonc
{
  "id": "lesson_014",
  "title": "Ordering at a café",

  // --- placement in the structure ---
  "spine": false,              // NEW: true = fixed lesson everyone does; false = pool/optional
  "cefr": "A1",                // exists
  "difficulty": 2,             // exists (1–5)

  // --- who is this for (replaces implicit topic→mode mapping) ---
  "purposes": [                // NEW: multi-purpose with weights (0–1)
    { "id": "travel", "weight": 1.0 },
    { "id": "general", "weight": 0.7 },
    { "id": "work",    "weight": 0.3 }
  ],
  "topic": "restaurant",       // exists — keep as the human-facing theme
  "setting": "cafe",           // NEW (optional): finer context for variety/matching
  "register": "polite",        // NEW (optional): formality, useful for work vs casual

  // --- the prerequisite substrate (Layer 2) ---
  "introduces_vocab":   ["it_w_0210", "it_w_0211"],   // exists (vocab_introduces)
  "requires_vocab":     ["it_w_0004", "it_w_0007"],   // POPULATE (currently empty)
  "introduces_grammar": ["GT012"],                     // NEW: derive from sentence tags
  "requires_grammar":   ["GT002"],                     // NEW: derive from sentence tags

  // --- what skills it trains (for remediation matching, Layer 4) ---
  "skills": ["listening", "meaning_production", "context"]  // NEW: derivable from exercise mix
}
```

Notes:
- **`purposes` is the heart of "don't author 3 curricula."** One lesson can serve travel strongly and work weakly. The sequencer weights candidates by overlap with the learner's purpose — you tag once, the path diverges by *weighting*, not by duplicate authoring.
- `introduces_grammar` / `requires_grammar` are **derivable** from the grammar `tags` already on sentences plus the order lessons currently appear — a one-time script can bootstrap them, then an editor refines.
- `skills` is **derivable** from which exercise types a lesson generates (the dimension mapping already exists in `wordGrades.js`).
- This should be **admin-editable** via the same CMS pattern as everything else (see the mascot-config spec) — and ideally validated on save by the existing `validateVocabPrerequisites()`.

---

## 5. Layer 2 — the prerequisite graph

The validator (`validateVocabPrerequisites`) already exists and is never called. Layer 2 is three steps:

1. **Bootstrap** `requires_vocab` / `requires_grammar` with a one-time script: walk lessons in current order; a lesson "requires" any vocab/grammar that appears in its sentences but was introduced in an earlier lesson.
2. **Enforce at selection time:** a lesson is only a *candidate* for "next" if every `requires_*` item has been introduced (and ideally minimally practiced) already. This is the hard filter under the recommender.
3. **Validate on author/edit:** run the validator on CMS save so new content can't silently break the graph.

This is what makes "dynamic mix-and-match" *safe* rather than *random*. It's mostly data + wiring of code that already exists.

---

## 6. Layer 3 — the sequencer (purpose-weighted selection)

Refactor the seam: today `getNextNode(nodeId)` returns "the next node by index." Introduce `getNextBestNode(learnerState)` that:

1. **Builds the candidate set** = pool lessons not yet done whose prerequisites (Layer 2) are satisfied.
2. **Scores each candidate** with a transparent, tunable function:

```
score(lesson) =
    wPurpose    * purposeMatch(lesson.purposes, learner.purpose)
  + wDifficulty * difficultyFit(lesson.difficulty, learner.estimatedLevel)
  + wVariety    * varietyBonus(lesson.topic, recentTopics)      // avoid 4 café lessons in a row
  + wReview     * reviewValue(lesson.introduces_vocab, dueSrsItems)   // Layer 4
  + wRemediate  * remediationValue(lesson.skills, learner.weakSkills) // Layer 4
```

3. **Picks the top candidate**, but on a fixed cadence **force-inserts** (a) the next *spine* milestone so the path still has structure, and (b) a pure SRS review session when enough items are due. This keeps the experience from drifting into endless similar lessons.

Two design rules that make this trustworthy:
- **Deterministic and explainable first, ML never (yet).** It must be possible to say "lesson X came next because purpose match 0.9, difficulty fit 0.7, two due reviews." If you can explain it, you can tune it and the learner can trust it.
- **Make the weights admin-tunable**, exactly like the mascot config — so you adjust behavior without code changes and can A/B the feel.

`estimatedLevel` and `weakSkills` come from data you already capture (`wordGrades` accuracy by dimension, streaks, SRS state). No new capture needed for Layers 3–4.

---

## 7. Layer 4 — performance-adaptive insertion ("how much right and wrong")

This is the half-built part — switch on the dormant code:

- **Remediation:** when accuracy on a skill dimension or a set of items drops below a threshold (`getWeakItems`, `getWeakestDimension` already compute this), insert a targeted review/easier lesson before advancing. The `reviewValue`/`remediationValue` terms in §6 handle this inside the scorer.
- **Surface SRS:** `getDueItems()` already returns due cards; there's just no UI. Add a review session type and let the sequencer schedule it. This alone is a big learning win that exists in data today.
- **Skip-ahead:** when mastery is consistently high, allow the scorer to pick a harder candidate or let the learner test out of a node (a placement check on a unit). Prevents boredom for fast learners.

All of this runs off **right/wrong you already record** — no new instrumentation required. This is the highest learning-value layer for the least new capture.

---

## 8. Layer 5 — engagement / "enthusiasm" (instrument now, act later)

This is the part of the vision to be most disciplined about, because **none of the signals exist today** and acting on noisy engagement data early will make the path feel random and erode trust.

Recommended two-step:

1. **Instrument now (cheap, low-risk):** extend the exercise recorder to log timestamps and events — per-exercise response time, hesitation (time-to-first-input), retries, lesson quits/abandons, voluntary replays, session length, time-of-day. Store alongside `wordGrades`. This is a small, additive change and starts accumulating the data you'd need.
2. **Act later (only once you have data):** *after* you can see what these signals actually correlate with (does fast-and-accurate mean "bored, accelerate" or "confident, hold steady"? does quitting mean "too hard" or "out of time"?), feed a conservative engagement term into the scorer. Until then, engagement data is for *analytics*, not for *driving the path*.

Treating "enthusiasm" as a research/instrumentation track rather than a launch feature is what keeps the sequencer from feeling erratic.

---

## 9. Recommended scope for *this* phase

**Build now (foundation — do this before more curriculum authoring):**
- **Layer 1:** define + apply the standardized tag schema to existing lessons (especially `purposes`, `spine`, `introduces/requires_grammar`, `skills`). Bootstrap with a script, refine in an admin editor.
- **Layer 2:** populate and enforce the prerequisite graph; turn on the existing validator at author time.

**Build soon (the visible payoff):**
- **Layer 3:** the `getNextBestNode` scorer with admin-tunable weights, rendered as a visible path.
- **Layer 4:** switch on weak-item remediation + an SRS review surface (mostly wiring dormant code).

**Defer (instrument, don't act):**
- **Layer 5:** add engagement logging now; postpone any engagement-driven sequencing until the data justifies it.

**Keep fixed:**
- **Layer 0:** the Foundations + core survival spine stays hard-ordered for everyone.

Why this split: Layers 1–2 are the thing you explicitly asked for ("tag each lesson with context," "share the same foundation"), they're low-risk data work, and **they're prerequisites for everything else**. They also immediately pay off by replacing per-mode authoring with one tagged pool. Layers 3–4 then ride almost entirely on data and code you already have. Layer 5 is where the genuine novelty/risk lives, so it's the one to de-risk by collecting data first.

---

## 10. Risks & guardrails (pin these to the wall)

- **Prerequisites are hard rules, not preferences.** The scorer chooses *within* the prerequisite-satisfied set, never around it. This is the non-negotiable difference from a music recommender.
- **Explainable before clever.** Ship a transparent weighted scorer you can debug and tune (and expose the weights to admin) before reaching for anything ML-shaped.
- **Keep the path visible.** Dynamic selection, static-feeling map. Preserve milestones, progress, and the sense of a journey — don't hand out one mystery lesson at a time.
- **Don't over-diverge content.** One tagged pool + per-purpose weighting beats three authored curricula. Resist re-authoring; invest in tags.
- **Engagement signals can mislead.** Fast ≠ bored; quitting ≠ too hard. Collect first, correlate, then (maybe) act.
- **Mastery, not just coverage.** Advancement should consider whether items are actually *retained* (SRS state), not merely *seen* — otherwise the path races ahead of real learning.
```
