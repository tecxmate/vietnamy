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
| 2.1 | **Grammar reader → canonical.** `grammarModulesDB.js` reads source `grammar_modules.json`; could read `content/grammar.json` via a thin adapter (like `toneContours.js`). **BLOCKER:** the canonical bundle **drops** unit-level `exercise_types` (exercise generation) + `prerequisites` (gating) + `estimated_minutes` — used at `grammarModulesDB.js:115,182`. Must make `build-canonical.mjs` grammar gen lossless first, then adapt the reader. Does **not** delete any file (`grammar_modules.json` stays as build source; `vn_grammar_bank_v2.json` stays for the separate `grammarDB`/`GrammarEditor` bank system). | CONFIRM |
| 2.2 | ~~Delete `src/data/dictionary.json`~~ — **NOT orphaned.** It's the authoring source `build-canonical.mjs:261` reads to generate `content/dictionary.json`. Don't delete. Real cleanup = canonicalize the source's own schema (legacy `word`-id/`cn`) — bigger, deferred. | WONTFIX (as stated) |
| 2.3 | Articles reader → `content/articles.json`: bundle is **lossy** (drops `partnerCta`/`createdAt` the web reader/ReferralModal use). Make generator lossless first. | CONFIRM |
| 2.4 | Retire `src/data/lessons.json` (only `lessonExerciseService.js`) — verify what it still supplies. | TODO |
| 2.5 | `unified_db.json` is both build-intermediate and runtime source — move web fully onto `content/curriculum.json`, keep `unified_db` build-only. | TODO |
| 2.6 | Canonicalize the **authoring sources'** schemas (`cn`→`zh`, snake_case) per `docs/CONTENT_SCHEMA.md §9`, then regen bundle. Deep. | TODO |

**Recommended real path (needs your go):** for each domain — (1) make `build-canonical.mjs` generation **lossless** (stop dropping `exercise_types`/`prerequisites`/`partnerCta`/…), (2) regen + validate the bundle, (3) convert the runtime reader into a thin adapter over the canonical (proven pattern: `toneContours.js`), (4) leave admin editors on the source (overrides are id-keyed, so they still merge). This achieves "one canonical consumed everywhere" without deleting authoring sources or breaking the CMS.

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
| 4.1a | **GrammarGuidebook i18n** — was fully hardcoded EN (shown from Study tab); now wired to `t()` (header + 8 category labels, en/zh-s/zh-t). | DONE |
| 4.1b | **ReferralModal i18n** — fully hardcoded EN (≈276 lines, reached via TopBar). Brand-voice referral copy → **needs your review of Chinese tone** before I convert it. | CONFIRM |
| 4.1c | "Translate this" ×3 fallbacks (LessonGame/GrammarLesson/UnitTest) — low-visibility, defer. | TODO |
| 4.2 | Tighten verbose copy. Done: 2 live strings (`app_tutorial_roadmap_desc`, `library_review_deck_count`). Note: many flagged ones (`home_welcome_subtitle`, `sounds_*`, `quick_search_desc`) are **dead keys** (see 4.4). | PARTIAL |
| 4.3 | Unify terminology: **Lesson / Module / Unit** used interchangeably → pick one user-facing term. (Needs your preferred word.) | CONFIRM |
| 4.4 | **Dead i18n-key sweep.** Pass 1's deletions (HomeTab/SoundsTab/GrammarTab/FlashcardsPage) orphaned a whole set of keys (verified: the 12 tutorial keys + `home_welcome_subtitle`, `sounds_alphabet_intro`, `sounds_tones_intro`, `quick_search_desc`, … all 0 live refs). Worth a sweep, but must guard against dynamic keys (`t(\`tip_body_${n}\`)`) — do carefully, not half-way. | TODO |

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
