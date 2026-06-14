# Vietnamy — Consistency & Polish Backlog

> **Living document.** Re-audited and re-ranked each pass. North star: the cleanest,
> most comprehensive, most intuitive Vietnamese-learning app — Duolingo-level polish,
> Apple-clean. Guiding principles: **fewer divergent data structures**, **fewest UI
> components**, **concise polished copy**, **most comprehensive content**.
>
> Status legend: `TODO` · `IN PROGRESS` · `DONE` · `WONTFIX` · `CONFIRM` (needs user call)
>
> Last full audit: **2026-06-09** (branch `main` @ `33775de`).

---

## Current app shape (ground truth)

A clean **3-tab** app: **Study** (roadmap), **Dictionary**, **Library**
(`src/App.jsx:150` `VALID_TABS = ['study','dictionary','library']`). 39 units / 140
lessons / 1,001 words / 479 sentences. Canonical content bundle at repo-root `content/`.

---

## Pass 1 — Safe cleanup (low risk, high visibility)

| # | Item | Principle | Status |
|---|------|-----------|--------|
| 1.1 | Delete orphaned tab components: `ReferenceHomeTab`, `CommunityTab.css` (0 refs) | clean | DONE |
| 1.2 | Delete recently-unwired tab components: `HomeTab`, `GrammarTab`, `SoundsTab` (+ their CSS) — cut in `33775de`, git-recoverable; `ToneLesson` preserved separately | clean | DONE |
| 1.3 | Delete `FlashcardsPage` (.jsx/.css) — route only redirects away, no importer | clean | DONE |
| 1.4 | Fix `AppTutorial` STEP_DEFS — remove 4 dead `home` steps (target deleted DOM), rescue the closing nav step onto `library` | clean + copy | DONE |
| 1.5 | Fix stale `app_tutorial_navigation_desc` (named a 6-tab bar that doesn't exist) → 3-tab concise copy | copy | DONE |
| 1.6 | Docs: delete superseded `docs/prd/{PROJECT_HANDOFF,user_flow_and_features,mockup-dictionary-vocab-library}.md` + `tone_marks_styles.patch` | clean | DONE |
| 1.7 | Docs: fix `README.md` + `.claude/CLAUDE.md` + wiki to the real 3-tab / ProgressContext / no-currency system | clean | DONE |
| 1.8 | Delete orphaned `src/pages/Practice/VocabPractice.css` (2026-06-14) — no `VocabPractice.jsx` exists, file imported nowhere, its `.voc-*` classes used in 0 files. 29→28 src CSS files. | clean | DONE |

---

## Pass 2 — Data-structure divergence (principle #1: fewer divergent structures)

> **Investigated 2026-06-10 — the initial audit mischaracterized the "easy" wins.**
> Ground truth: `src/data/*.json` files are the **authoring sources**; `build-canonical.mjs`
> generates the `content/` bundle **from** them (`content:build`). So `src/data/dictionary.json`,
> `grammar_modules.json`, `articleData` are **not orphans** — they're build inputs. The real
> divergence is "runtime reads the source, not the generated canonical." But several canonical
> bundles are **lossy**, so readers can't migrate until the generators are made lossless. This
> needs a deliberate, reviewed pipeline change (and `build-canonical.mjs` is near Codex's active
> TTS-migration area) — **NOT a safe autonomous change.** Decisions below need your call.

| # | Item | Reality found | Status |
|---|------|---------------|--------|
| 2.1 | **Grammar reader → canonical — DONE** (commit `dc1c9ec`). `grammarModulesDB.js` is now a thin adapter over `content/grammar.json`. The "lossy" fear was wrong on verification: `prerequisites` IS preserved (285 units), `mainPattern`/`extractedPatterns` present; the dropped fields are unused (`exercise_types` is comment-only — real types come from `GRAMMAR_SESSION_PROFILES`; `estimated_minutes`/`source_*` unused). No consumer reads snake module fields. Admin overrides are id-keyed → still merge. E2E-verified (Playwright `/grammar-unit/A1_M01_U01`: teaching + note + generated exercise render, 0 errors). `grammar_modules.json` stays as build source. | DONE |
| 2.2 | ~~Delete `src/data/dictionary.json`~~ — **NOT orphaned.** It's the authoring source `build-canonical.mjs:261` reads to generate `content/dictionary.json`. Don't delete. Real cleanup = canonicalize the source's own schema (legacy `word`-id/`cn`) — bigger, deferred. | WONTFIX (as stated) |
| 2.3 | Articles reader → `content/articles.json`: bundle is **lossy** (drops `partnerCta`/`createdAt` the web reader/ReferralModal use). Make generator lossless first. | CONFIRM |
| 2.4 | Retire `src/data/lessons.json` (only `lessonExerciseService.js`) — verify what it still supplies. | TODO |
| 2.5 | `unified_db.json` is both build-intermediate and runtime source — move web fully onto `content/curriculum.json`, keep `unified_db` build-only. | TODO |
| 2.6 | Canonicalize the **authoring sources'** schemas (`cn`→`zh`, snake_case) per `docs/CONTENT_SCHEMA.md §9`, then regen bundle. Deep. | TODO |
| 2.7 | `ToneWordEditor` hardcoded the `'vnme_cms_tonewords'` key literal that `toneContours.js` already exports as `TONEWORDS_CMS_KEY` — imported the constant so the key has one source of truth. | DONE |

**Recommended real path (needs your go):** for each domain — (1) make `build-canonical.mjs` generation **lossless** (stop dropping `exercise_types`/`prerequisites`/`partnerCta`/…), (2) regen + validate the bundle, (3) convert the runtime reader into a thin adapter over the canonical (proven pattern: `toneContours.js`), (4) leave admin editors on the source (overrides are id-keyed, so they still merge). This achieves "one canonical consumed everywhere" without deleting authoring sources or breaking the CMS.

---

## Pass 3 — UI component proliferation (principle: fewest components, Apple-clean)

> **Pass 3 changes how things LOOK** (unifying visual styles) — it gets a visual review before merge.

| # | Item | Impact | Status |
|---|------|--------|--------|
| 3.1 | **Modal primitive — DONE** (reviewed + merged). `src/components/Modal.jsx` (bottom-sheet shell on the existing `.modal-overlay`/`.slide-up` convention). Migrated `GrammarGuidebook` (no visual change; z 200→1000 so it clears the nav) + `DeckPickerModal` (floating blurred card → standard flush sheet — approved). | DONE |
| 3.1b | Migrate the remaining overlays to `<Modal>` once the look is approved: `ReferralModal` (centered variant — needs a `center` variant added), `WordPopup` (floating/positioned — may stay bespoke), `NotificationPanel` (slide-in — likely stays bespoke). Decide which truly share the primitive vs. stay distinct. | CONFIRM |
| 3.2 | **Button unification — canonical = the lesson feel** (user's call: the lesson's chunky 3D-press coral button). Turns out it already exists as `button.primary/.secondary/.ghost` (index.css) + `SoundButton`. **Chunk 1 DONE** (`aec2bf1`): practice primary buttons adopted it — `.practice-action-btn.primary` gold→coral edge + white text (~10 screens); `PracticeKit.PrimaryButton` flat-blue → canonical 3D+sound (4 screens). **Remaining:** ~80 inline `<button style>` (option/choice buttons etc.) still to sweep onto the standard. | IN PROGRESS |
| 3.2b | **Answer-tile + exercise-layout unification — DONE** (merged, `01d0ab6`). Across the lesson + Alphabet/Vowels/all ~12 drills: tiles uniform size, **mid-low thumb position** (`ExerciseColumn` / lesson grid bottom-anchored), adaptive 1-col for long text, lesson states (blue/green/red), no reflow (explanation moved into the feedback banner), speaker unified to the lesson's rounded-secondary 3D button + lowered next to the question, shared `<ProgressBar>`, action bar reserves feedback height so answers don't shift + CTA 3D shadow never clipped. | DONE |
| 3.3 | Extract `Feedback` + `Card` primitives (4 feedback / 6 card patterns today). | TODO |
| 3.4 | **Unified exercise layout rolled out** (mid-low tiles, OptionGrid lesson states, shared ProgressBar, feedback-in-banner, lesson action button) across: AlphabetLesson, VowelsPractice, all ~12 DrillPractice drills, **PronounsPractice**, **KinshipFoundation**, **ToneMarks**, plus the **LessonGame** engine (defined structure: viewport-height lesson · scrollable content · in-flow reserved action bar that collapses for the keyboard). | DONE |
| 3.4b | **Bespoke screens NOT converted** (don't fit the answer-tile pattern; their action buttons already use the unified lesson feel): **NumbersPractice** (tap-to-build word constructor), **TelexTyping** / **TeenCode** (multiple-choice + *typed* construction input). Converting them = per-screen redesign (OptionGrid for the MC parts + keyboard-safe input layout like the lesson's). Needs a design decision before investing. | CONFIRM |
| 3.5 | **z-index scale.** Verified chaos (values 10→10001; modal layers at 200/1000/2000/9999; toasts 8000s; tutorial 10000s). Define semantic tokens (`--z-nav/-modal/-toast/-menu/-tutorial`) preserving current order. Deferred: a global remap risks stacking regressions hard to verify headless → do with you watching. | TODO |

---

## Pass 4 — Concise, polished copy

| # | Item | Impact | Status |
|---|------|--------|--------|
| 4.1a | **GrammarGuidebook i18n** — was fully hardcoded EN (shown from Study tab); now wired to `t()` (header + 8 category labels, en/zh-s/zh-t). | DONE |
| 4.1b | **ReferralModal i18n — DONE** (commit `46ee633`). All 3 sub-components wired; 23 keys × en/zh-s/zh-t. ⚠️ Chinese is a faithful first pass — **review tone when convenient** (brand/referral copy). | DONE |
| 4.1c | "Translate this" ×3 fallbacks (LessonGame/GrammarLesson/UnitTest) — low-visibility, defer. | TODO |
| 4.2 | Tighten verbose copy. Done: 2 live strings (`app_tutorial_roadmap_desc`, `library_review_deck_count`). Note: many flagged ones (`home_welcome_subtitle`, `sounds_*`, `quick_search_desc`) are **dead keys** (see 4.4). | PARTIAL |
| 4.3 | Unify terminology — **DONE** (commit `46ee633`). Only one user-facing "module" string existed (it reflects a real Unit→Module→Lesson hierarchy, not a clash); changed it to "lesson" so learner vocab is Unit/Lesson. | DONE |
| 4.4 | **Dead i18n-key sweep — DONE (2026-06-14).** Removed **186 dead keys × 3 locales (558 lines)** orphaned by the Pass-1 deletions (HomeTab/SoundsTab/GrammarTab/FlashcardsPage) + the old dictionary UI + the removed tutorial steps — `home_*`/`tip_*`/`sounds_*`/`app_tutorial_{home,quick_search,progress,actions}_*`/dead `dict_*`/`error_*`, etc. Method (careful, not half-way): conservative whole-repo substring check (key string absent everywhere → unreachable) + protected the 8 **dynamic** template-literal families (`grammar_extra_`, `grammar_level_`, `learner_mode_`, `onboarding_goal_`, `roadmap_node/topic/unit_`, `home_push_label_`); confirmed **no concatenation-built keys exist**. Locale counts stay balanced (613→427 each); live keys (nav/feedback/roadmap_type/dict_mode/…) verified intact; lint clean. (Earlier chunk: the 18 `sounds_tone_*_desc` removed 2026-06-13.) | DONE |

---

## Consistency check — 2026-06-11 (post-adaptive/grammar/content arc)

4 parallel review agents (adaptive system, grammar system, content data, e2e flows) + inline verification.
**Data layer: fully consistent** (index counts, adaptive blocks 140/140, tag/vocab refs 0 dangling, concepts 1:1 with lessons, faqs uniform). **Flows: 0 page errors** across Study/lesson/Library/Grammar/Dictionary/nav-cycling.

| Finding | Verdict | Action |
|---|---|---|
| B2/C1/C2 grammar level descriptions missing from i18n | real | FIXED — added en/zh-s/zh-t keys |
| Lesson quit-modal copy hardcoded EN + "almost done" even at exercise 1 | real | FIXED — localized (5 keys × 3 langs) + progress-aware (≥50% → "almost done") |
| `GrammarTrack.jsx` dead (0 importers) | real | FIXED — deleted |
| "modeCompletedNodes creates unstable Set" | **false** (it's memoized) | none — agent over-claim |
| Mascot politeness intro on "Count to 5" deep-link | by design (lesson is in unit *Polite Survival*; intro = unit theme) | noted, no change |
| Library "Grammar" tab navigates away (vs siblings filtering in place); selection not remembered on back | known tradeoff (guide is a full-page reference) | accepted for now |
| Intro footer reads START on 1-step intros vs CONTINUE on multi-step | cosmetic | accepted |

---

## Pass 5 — Content comprehensiveness (the north star)

| # | Item | Impact | Status |
|---|------|--------|--------|
| 5.1 | **Grammar B2/C1/C2 authored** (was B1-only) — +22 modules / +105 units in canonical `grammar_modules.json` via author→native-review pipeline. Renders at `/grammar-unit/:unitId`. | HIGH | DONE (branch `audit/pass5-content`) |
| 5.1b | **Grammar browser migrated to canonical** — new `/grammar` index (all 6 levels A1–C2) + `GrammarList` now reads `grammarModulesDB` (modules→units→`/grammar-unit`); Library type-bar gained a **Grammar** tab; dead `GrammarBrowseView` removed. **Legacy `grammarDB`/`vn_grammar_bank_v2.json` now fully RETIRED** (~14K lines deleted: bank, grammarDB, GrammarLesson, GrammarDetail, admin GrammarEditor, dead `grammar_lesson` branches). Grammar is single-source (`grammar_modules.json`). | HIGH | DONE |
| 5.2 | **Every sentence grammar-tagged** (9% → 100%, 479/479; +9 from Unit 1 → 488/488) via 20-agent pass. Source: `unified_db.json`. | HIGH | DONE |
| 5.3 | **Concept cards: full A1–C2 coverage (140 cards)** — every curriculum lesson now has a KEY IDEA card (24 A1, 34 A2, 22 B1, 20 B2, 20 C1, 20 C2), all with VN examples, rendering in lesson intros. | HIGH | DONE |
| 5.4 | **Unit 1 expanded 7 → 17 words** + sentences (all 4 lessons now have vocab+sentences), global-deduped. | MED | DONE |
| 5.5 | 0 `audioKey` coverage (TTS-only) + ~5% images — add curated audio/images for core vocab. **Not AI-doable (asset creation); also near the Codex TTS-R2 work — leave.** | MED | TODO |
| 5.6 | `curriculum.json` is `mode:"all"` — the explore/professional/heritage split isn't implemented. | LOW/CONFIRM | TODO |

---

## Notes / watch-list
- `ReferralModal` is still reached via `TopBar`; `GrammarGuidebook` via `RoadmapTab` — neither was orphaned by the HomeTab deletion. The push-reminder helpers `HomeTab` used (`utils/pushNotifications`) may now be orphaned — verify before pruning.
- `HomeTab`/`GrammarTab`/`SoundsTab` were unwired only 1 day ago (`33775de`); if that cut was temporary, restore from git rather than rebuild.
- **Codex is mid-migration: TTS Supabase → Cloudflare R2** (script landed in `5591fad`, not yet executed). Do NOT touch TTS files/docs (`server` TTS code, `scripts/*tts*`, `docs/tts-cache.md`, README "TTS Bucket Cache", wiki `tts-pipeline`/`bucket-storage`/R2 docs) until that's done.
- Pass 1 lives on branch `audit/consistency-pass` (pushed, rebased on `origin/main`@`5591fad`). **Not merged to `main`** — awaiting review.
