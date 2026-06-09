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

---

## Pass 2 — Data-structure divergence (principle #1: fewer divergent structures)

| # | Item | Impact | Status |
|---|------|--------|--------|
| 2.1 | **Grammar: 3 sources of truth.** Web reads legacy snake_case `src/data/grammar_modules.json` + `vn_grammar_bank_v2.json`; canonical camelCase `content/grammar.json` is unused. Migrate readers (`grammarModulesDB.js`, `GrammarUnitLesson.jsx`, admin editors) → `content/grammar.json`; retire the two legacy files. | HIGH | TODO |
| 2.2 | Delete orphaned `src/data/dictionary.json` (legacy `word`-id / `cn` schema, 0 importers; app uses `content/dictionary.json`). Update `build-canonical.mjs` source if needed. | HIGH | TODO |
| 2.3 | Articles: switch `ReadingLibraryTab` off `src/data/articleData.js` onto canonical `content/articles.json`; delete the JS. (Check `partnerCta`/`createdAt` fields survive.) | MED | TODO |
| 2.4 | Retire `src/data/lessons.json` (vestigial; only `lessonExerciseService.js`). | MED | TODO |
| 2.5 | `unified_db.json` is both build-intermediate and runtime source — move web fully onto `content/curriculum.json`, keep `unified_db` build-only. | MED | TODO |
| 2.6 | Naming: kill remaining `cn`→`zh` and snake_case in legacy stores per `docs/CONTENT_SCHEMA.md §9`. | LOW | TODO |

---

## Pass 3 — UI component proliferation (principle: fewest components, Apple-clean)

| # | Item | Impact | Status |
|---|------|--------|--------|
| 3.1 | **31 CSS files / ~12,800 lines.** Extract a single `Modal` primitive (variants: bottom-sheet / centered / floating / slide-in) — replaces 5 ad-hoc modals (DeckPicker, Referral, GrammarGuidebook, WordPopup, NotificationPanel) and fixes z-index conflicts (200/1000/2000/9999). | HIGH | TODO |
| 3.2 | Extract `Button` primitive (variants primary/secondary/ghost) — replaces ~8 implementations + 80+ inline `<button style>`. | HIGH | TODO |
| 3.3 | Extract `Feedback` + `Card` primitives (4 feedback / 6 card patterns today). | MED | TODO |
| 3.4 | Adopt PracticeKit across all practice screens (~4 of ~47 today). May need `Tabs`/`StageNav` additions. | MED | TODO |
| 3.5 | Centralize a z-index token scale. | LOW | TODO |

---

## Pass 4 — Concise, polished copy

| # | Item | Impact | Status |
|---|------|--------|--------|
| 4.1 | i18n-ify hardcoded strings. **Found:** `ReferralModal` + `GrammarGuidebook` have **no `t()` wiring at all** (fully hardcoded EN) — full conversion needed, and ReferralModal is brand-voice referral copy → **needs user review of Chinese tone**. Plus "Translate this" ×3 fallbacks (low-visibility). | MED | CONFIRM |
| 4.2 | Tighten verbose strings (`home_welcome_subtitle` 267 chars; several `app_tutorial_*_desc`, `tip_body_*`). | MED | TODO |
| 4.3 | Unify terminology: **Lesson / Module / Unit** used interchangeably → pick one user-facing term. | MED | TODO |
| 4.4 | Prune i18n keys orphaned by Pass 1 (`app_tutorial_home_*`, `quick_search_*`, `progress_*`, `actions_*`). | LOW | TODO |

---

## Pass 5 — Content comprehensiveness (the north star)

| # | Item | Impact | Status |
|---|------|--------|--------|
| 5.1 | **Grammar stops at B1** — no B2/C1/C2 modules though lessons run to C2. Author upper-level grammar. | HIGH | TODO |
| 5.2 | Only **9% of sentences** carry `grammarTagIds` — tag the rest to light up grammar drills/links. | HIGH | TODO |
| 5.3 | **`concepts.json` is empty** — author teaching cards (the "why") for A1–B1 lessons. | HIGH | TODO |
| 5.4 | Thin early units (Unit 1 = 7 words) — rebalance the on-ramp. | MED | TODO |
| 5.5 | 0 `audioKey` coverage (TTS-only) + ~5% images — add curated audio/images for core vocab. | MED | TODO |
| 5.6 | `curriculum.json` is `mode:"all"` — the explore/professional/heritage split isn't implemented. | LOW/CONFIRM | TODO |

---

## Notes / watch-list
- `ReferralModal` is still reached via `TopBar`; `GrammarGuidebook` via `RoadmapTab` — neither was orphaned by the HomeTab deletion. The push-reminder helpers `HomeTab` used (`utils/pushNotifications`) may now be orphaned — verify before pruning.
- `HomeTab`/`GrammarTab`/`SoundsTab` were unwired only 1 day ago (`33775de`); if that cut was temporary, restore from git rather than rebuild.
- **Codex is mid-migration: TTS Supabase → Cloudflare R2** (script landed in `5591fad`, not yet executed). Do NOT touch TTS files/docs (`server` TTS code, `scripts/*tts*`, `docs/tts-cache.md`, README "TTS Bucket Cache", wiki `tts-pipeline`/`bucket-storage`/R2 docs) until that's done.
- Pass 1 lives on branch `audit/consistency-pass` (pushed, rebased on `origin/main`@`5591fad`). **Not merged to `main`** — awaiting review.
