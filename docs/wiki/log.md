# Wiki Log

Append-only. Newest entries at the bottom. Standard prefix: `## [YYYY-MM-DD] <kind> | <subject>`.

`<kind>` ∈ `ingest | decision | chat | lint | external`.

Quick recent log: `grep "^## \[" docs/wiki/log.md | tail -10`.

<!-- Agent: append entries. The first entry should be the bootstrap ingest after BOOTSTRAP.md is followed. -->

## [2026-05-13] decision | Root drive folder for media sync
attributed_to: [tecxmate]   belongs_to: [drive-media-sync]
- Added a root `drive/` placeholder for project-specific Google Drive media synchronization.
- Documented that `drive/` is ignored media/reference storage, not source code.
- Pages: [decision](decisions/2026-05-13-root-drive-folder.md), [topic](topics/tech/drive-media-sync.md), [stakeholder](stakeholders/tecxmate.md).

## [2026-05-13] decision | Publish template repository
attributed_to: [tecxmate]   belongs_to: [repository-publishing]
- Tecxmate requested that this template folder become a Git repository, be committed, and be pushed to GitHub.
- Pages: [decision](decisions/2026-05-13-publish-template-repo.md), [topic](topics/tech/repository-publishing.md).

## [2026-05-13] ingest | GitHub repository published
attributed_to: [codex]   belongs_to: [repository-publishing]
- Created and pushed the GitHub repository at `https://github.com/nikolasdoan/tecx`.
- `main` now tracks `origin/main`.

## [2026-05-13] decision | Adaptive software automation vision
attributed_to: [tecxmate]   belongs_to: [adaptive-software-automation]
- Tecxmate described the long-term goal of using in-app feedback, Google Forms, GA4, GitHub Actions, cron jobs, and AI agents to generate fix PRs for human review.
- Documented feasibility as assisted repair with human merge/deploy review, not unsupervised production changes.
- Pages: [decision](decisions/2026-05-13-adaptive-software-automation-vision.md), [topic](topics/tech/adaptive-software-automation.md).

## [2026-05-13] decision | Lowercase drive folder name
attributed_to: [tecxmate]   belongs_to: [drive-media-sync]
- Tecxmate clarified that the synced media folder should be named `drive/` with a lowercase `d`.
- Renamed the tracked placeholder folder and updated template documentation to match.

## [2026-05-13] decision | drive symlink shortcut
attributed_to: [tecxmate]   belongs_to: [drive-media-sync]
- Tecxmate asked for a shortcut from the template `drive/` folder to a separately synchronized Google Drive location.
- Added `scripts/link-drive.sh` to create ignored symlinks such as `drive/sync`.
- Pages: [decision](decisions/2026-05-13-drive-symlink-shortcut.md), [topic](topics/tech/drive-media-sync.md).

## [2026-05-23] decision | Two-tier TTS cache (source + derived)
attributed_to: [claude-opus, niko]   belongs_to: [tts-pipeline]
- Split `tts-cache` bucket into `source/<voice>/<sha1>.pcm` (raw Azure PCM, unversioned) and `<TTS_CACHE_VERSION>/<voice>/<sha1>.wav` (post-processed, served).
- Bumping the version env var now re-derives WAVs from source locally — zero Azure calls.
- Shipped in commit `91608cf`. One-time source backfill ran the same day (~$3 on Azure S0).
- Pages: [decision](decisions/2026-05-23-two-tier-tts-cache.md), [topic](topics/tech/tts-pipeline.md).

## [2026-05-23] decision | Azure Speech F0 → S0 pricing tier
attributed_to: [niko]   belongs_to: [tts-pipeline]
- F0 free tier (500K chars/month) exhausted mid-warmup, started returning 429s.
- Niko upgraded the Azure Speech resource (`VNME-Asia`) to S0 in the Azure Portal. $200 credit absorbs charges.
- No code change. Future organic monthly spend expected at cents, not dollars.
- Pages: [decision](decisions/2026-05-23-azure-s0-pricing-tier.md).

## [2026-05-23] decision | Pronunciation assessment for grading
attributed_to: [niko]   belongs_to: [pronunciation-assessment]
- Replaced browser STT with Azure Pronunciation Assessment as the primary grading signal for `speak_sentence`. Threshold: pronunciation >= 70.
- Browser STT now runs in parallel as fallback. If Azure is down, lessons grade by fuzzy text match against the transcript.
- New endpoint `POST /api/pronunciation`. New client recorder `src/utils/recordPCM.js`.
- Spawned Tone Trainer practice module using the same endpoint for single-word tonal scoring.
- Shipped in commits `8a20317` (initial), `998fa8a` (parallel STT fallback), `7ed8df2` (Tone Trainer).
- Pages: [decision](decisions/2026-05-23-pronunciation-assessment-for-grading.md), [topic](topics/tech/pronunciation-assessment.md), [topic](topics/tech/tone-trainer.md).

## [2026-05-23] decision | Three learner paths (Professional + Heritage)
attributed_to: [niko]   belongs_to: [curriculum-paths]
- Authored 60 new lessons across Professional and Heritage paths (A1 / A2/B1 / B2/C1).
- 30 lessons per path; 240 words, 120 sentences, 30 conversations each.
- Flipped `enabled: false` → `true` in `src/data/learnerModes.js`.
- Shipped in commits `38a7b94` (A1), `60d60ce` (A2/B1), `84bf3c3` (B2/C1).
- Pages: [decision](decisions/2026-05-23-three-learner-paths.md), [topic](topics/tech/curriculum-paths.md).

## [2026-05-24] decision | Rename v9-nam-minh-lower → v9-processed
attributed_to: [niko]   belongs_to: [tts-pipeline]
- Renamed the active TTS_CACHE_VERSION folder for naming clarity (describes processing state, not voice).
- New script `scripts/rename-tts-version.mjs` bulk-moves files via Supabase Storage move API (no re-upload).
- 14,007 files migrated in ~5 min. 1 collision cleaned up.
- Shipped in commit `26c6c3c`.
- Pages: [decision](decisions/2026-05-24-v9-processed-rename.md).

## [2026-05-24] chat | Mobile strategy — Capacitor path
attributed_to: [niko]   belongs_to: [mobile-strategy]
- Decided to defer native mobile until web is feature-complete, then wrap PWA via Capacitor.
- ~95% code reuse. Verified `MediaRecorder`/`AudioContext` works in iOS WebView during prior pronunciation work.
- Recorded architectural guardrails (relative API paths, no browser-only APIs, etc.).
- Pages: [decision](decisions/2026-05-24-capacitor-mobile-path.md), [topic](topics/tech/mobile-strategy.md).

## [2026-05-24] chat | Payment strategy — IAP via RevenueCat
attributed_to: [niko]   belongs_to: [payment-strategy]
- Native subscriptions will use IAP via RevenueCat SDK (Apple/Google 15–30% + RevenueCat 1% over $2.5K MRR).
- Web subscriptions via Stripe (2.9% + 30¢).
- Long-term hybrid: higher in-app sticker price + lower web price (Tinder/Audible pattern).
- No code today; decision recorded for monetization launch.
- Pages: [decision](decisions/2026-05-24-iap-via-revenuecat.md), [topic](topics/business/payment-strategy.md).

## [2026-05-24] decision | Migrate TTS bucket to Cloudflare R2 within 1 month
attributed_to: [niko]   belongs_to: [bucket-storage]
- Bucket at ~1.4 GB; over Supabase free tier (1 GB storage, 5 GB egress/month).
- Target: R2 migration by 2026-06-24. Tracked as GitHub issue #17.
- New scripts during cleanup-prep: `scripts/cleanup-legacy-tts.mjs`, `scripts/mirror-bucket.mjs` (full-bucket mirror for home-PC cron).
- Deleted ~21K orphaned files from old voice iterations (`v3-trim/`, `v4-trim-loudness/`) and the `migrate-source/` throwaway.
- Pages: [decision](decisions/2026-05-24-cloudflare-r2-migration-pending.md), [topic](topics/tech/bucket-storage.md), [topic](topics/tech/backups-recovery.md).

## [2026-05-24] ingest | Wiki bootstrap for Vietnamy project
attributed_to: [claude-opus]   belongs_to: [vietnamy-app]
- Populated the wiki with Vietnamy-specific stakeholders ([niko], [claude-opus]) and a baseline topic graph: [vietnamy-app], [tts-pipeline], [pronunciation-assessment], [curriculum-paths], [skill-tree], [tone-trainer], [bucket-storage], [backups-recovery], [mobile-strategy], [payment-strategy].
- Migrated content from `docs/tts-cache.md` and the in-conversation context. The deep TTS doc stays canonical; topic pages summarize and link to it.
- Recorded 8 decisions covering all major architectural choices made in the 2026-05-23/24 working session.

## [2026-05-29] ingest | Pitch deck research compiled to wiki
attributed_to: [niko]   belongs_to: [vietnamy-app]
- Compiled market and competitive research from Vietnamy pitch deck build (NTU AI Builders Challenge + Shark Tank TW prep).
- 5 new topic pages: tw-vn-business-corridor, han-viet-moat, pricing-and-unit-economics, competitive-landscape, customer-pipeline.
- Key facts captured: $42.37B TW FDI in VN across 3,457 projects, 50-70% Vietnamese vocab is Sino-derived, CTBC Bank + 5 NTU classes confirmed inbound as flagship B2B pilots.
- Deck delivered: `Vietnamy_Pitch_Deck_2026.pptx` (17 slides, bilingual EN+繁中, NT$5M/8% ask).

## [2026-05-30] ingest | Tone lesson rebuilt + pooled training-data pipeline
attributed_to: [niko]   belongs_to: [tone-trainer, tone-training-data]
- Replaced the standalone Tone Trainer and orphaned `/practice/tones*`, `/practice/pitch*`, `/practice/tone-trainer` routes with a Sounds-tab Learn→Identify→Speak lesson (`src/components/Sounds/ToneLesson.jsx`, `PitchGraph.jsx`).
- Speak step extracts the learner's pitch contour client-side (autocorrelation F0 in `src/utils/pitch.js`), overlays it on the target, and judges by contour-shape classification — after confirming Azure vi-VN recognition is too lenient about tone and Azure Pronunciation Assessment doesn't support Vietnamese.
- Decided F0-template scoring can't be robust (glottalization, dialect, timing); collecting self-labeled samples toward a small learned model instead.
- Added `/api/tone-samples` (SQLite at `TONE_DB_PATH`): POST ingest, public stats, token-gated export. Samples stored locally (JSON export) + pooled to backend; no raw audio, contour features only.
- Deploy note: set `TONE_EXPORT_TOKEN` (export is 403 without it) and point `TONE_DB_PATH` at a persistent volume (Zeabur fs is ephemeral). Runtime DB files gitignored.
- Shipped to `main` (commit ab68731) for phone-deployment testing.
- Pages: [topic](topics/tech/tone-trainer.md), [topic](topics/tech/tone-training-data.md).

## [2026-06-10] decision | Supabase ops store and Vercel API cutover
attributed_to: [niko, codex]   belongs_to: [backend-ops-store]
- Supabase SQL migration `202606100001_app_ops.sql` was run successfully for operational tables: email logs, message events, push subscriptions/events, feedback reports, and notifications.
- Vercel Production env was corrected and redeployed with Supabase, Resend, public base URL, VAPID, and Azure Speech vars.
- Lightweight Vercel API routes now serve ops/email/message/notification endpoints without bundling the large dictionary SQLite databases.
- Production smoke passed: `/api/mail/config`, `/api/notifications`, `/api/feedback`, and Supabase `feedback_reports` verification.
- Next backend milestone is Supabase Auth, canonical profile rows, replacing anonymous `userId`, RLS, and progress/saved-word sync.
- Pages: [decision](decisions/2026-06-10-supabase-ops-store-vercel-api.md), [topic](topics/tech/backend-ops-store.md).

## [2026-06-10] ingest | Supabase identity and progress sync
attributed_to: [niko, codex]   belongs_to: [backend-ops-store]
- Removed the production smoke feedback row from `feedback_reports` so admin feedback stays clean.
- Added migration `202606100002_identity_progress.sql` for `profiles`, `user_progress`, `saved_words`, and authenticated own-row RLS policies.
- Client auth now creates/links a `profiles` row on session/login and syncs local progress/saved-word state under `auth.users.id`.
- Notification read/update APIs now require a Supabase JWT and derive `recipientId` from the authenticated user instead of trusting arbitrary `userId`.
- Pages: [topic](topics/tech/backend-ops-store.md).

## [2026-06-11] ingest | Pass 5 content depth, grammar consolidation, adaptive sequencer
attributed_to: [niko, claude-opus]   belongs_to: [grammar-system, adaptive-sequencer, curriculum-paths]
- **Pass 5 content** (merged): concept "Key Idea" cards now cover **every A1–C2 lesson (140)**, `concepts.json` was empty before; **sentence grammar-tagging 9%→100%** (488/488, source `unified_db.json`); **Unit 1 expanded 7→17 words**. All via multi-agent passes (Workflow tool).
- **Grammar B2/C1/C2 authored** (+22 modules / +105 units) via author→native-review pipeline; all grammar readers migrated to canonical `grammarModulesDB`; the legacy `vn_grammar_bank_v2.json` dataset (12.7K lines) + its consumers (`grammarDB`, `GrammarLesson`/`GrammarDetail`/admin `GrammarEditor`, dead `grammar_lesson` branches) **fully retired** — grammar is now single-source.
- **Grammar Guide restored** at `/grammar` (the old 5-tab blue `GrammarTab`), canonical-fed A1–C2, scroll fixed, level colors harmonized for dark mode. Reached via Library → Grammar.
- **Adaptive sequencer Layers 1–3 built** (additive, non-destructive): generated `adaptive` tag/prerequisite block per lesson in `content/curriculum.json`; pure engine `src/lib/sequencer.js`; wired as a "Recommended for you" row atop the Study roadmap. Linear roadmap unchanged. Next: Layer 4 (requires_vocab/skills + review/remediation), make-primary, Layer 5 engagement.
- Pages: [grammar-system](topics/tech/grammar-system.md), [adaptive-sequencer](topics/tech/adaptive-sequencer.md). Backlog: `docs/AUDIT.md` (Pass 5 rows done). Design: `docs/ADAPTIVE_CURRICULUM_SEQUENCER.md`.

## [2026-06-11] decision | Chinese pronunciation explanations are curriculum (Bopomofo / Pinyin)
attributed_to: [niko]   belongs_to: [curriculum-paths]
- VN pronunciation explanations anchor to English words ("as in father") — useless to Chinese speakers; re-author against Bopomofo (zh-t) / Pinyin (zh-s).
- Curriculum, not translation: ư, â/ơ (schwa), and tones ngã/nặng have no Mandarin equivalent — give "closest + adjust"; validate before shipping.
- Needs a per-language `sound` field on alphabet/vowels + tone descriptions. Status: proposed.
- Pages: [decision](decisions/2026-06-11-chinese-pronunciation-curriculum.md).

## [2026-06-11] ingest | Adaptive sequencer completion: remediation, Continue, Layer 5
attributed_to: [niko, claude-opus]   belongs_to: [adaptive-sequencer]
- Review/remediation went **item-based** via generated `adaptive.usesVocab` (vocab reused by a lesson's sentences) — the skill-based matching could never discriminate (134/140 lessons word-heavy).
- The **Continue button is now sequencer-primary for lesson nodes** (shared `src/lib/recommendations.js`); foundations/grammar/test nodes keep their hard order.
- **Layer 5 engagement capture** landed (capture-only): `src/lib/engagement.js` ring buffer; LessonGame logs exercise response times, quits, completes. Nothing acts on it yet by design.
- Pages: [adaptive-sequencer](topics/tech/adaptive-sequencer.md).

## [2026-06-11] ingest | TTS cold-synth latency mitigations + southern voice off by default
attributed_to: [niko, claude-opus]   belongs_to: [tts-pipeline]
- Diagnosed: slowness is the cache-miss path — Azure neural synth ~1.66s vs Google ~0.73s for a brand-new sentence; **not** network distance (Tokyo server ↔ eastasia Azure ~50ms). Warm/preloaded clips are instant.
- Shipped (commit `b04452e`): per-text loading spinner via `useSpeakingState`; `preloadSpeak` on Reading Library / Word Popup / Dictionary; fixed `prebuild-tts.mjs` to send the app's `ck` cache version (was warming the wrong slot) and default to `azure-north`.
- Earlier in session: `azure-south` disabled by default (unstable) + Admin → Voice Settings toggle (`src/data/ttsVoices.js`); Google always on.
- Pages: [tts-pipeline](topics/tech/tts-pipeline.md).

## [2026-06-11] decision | R2 public URL via tts.tecxmate.com custom domain
attributed_to: [niko]   belongs_to: [bucket-storage]
- Found `R2_PUBLIC_BASE_URL` set to the private S3 endpoint → R2 cache-hits 302 to a 400; masked because hot strings still resolve to Supabase. Blocks the pre-warm.
- Decided: bind `tts.tecxmate.com` R2 custom domain (zone already in the same Cloudflare account as the bucket) + bucket CORS; set env in Zeabur. Rejected r2.dev (rate-limited) and reverting to Supabase. Implementation pending on Niko.
- Pages: [decision](decisions/2026-06-11-r2-public-url-custom-domain.md), [bucket-storage](topics/tech/bucket-storage.md).

## [2026-06-11] ingest | Goal-shaped roadmap + topic re-tagging
attributed_to: [niko, claude-opus]   belongs_to: [curriculum-paths, adaptive-sequencer]
- The learning-goal selector now **gates the visible path** (was shallow: chips/progress/sequencer only). `isVisibleRoadmapNode` filters topic-bearing nodes by the goal's topics; per-goal unlock re-derivation keeps the path continuous; chips remain the finer in-goal filter. (`bca924f`)
- **57 catch-all "basics" lessons re-tagged** to goal topics by unit content → Explore 85 / Professional 73 / Heritage 78 lessons (shared core 48). Verified per goal: Job Interview P-only, Tết + Cuisine H-only, Doctor Visits E-only. (`cf6b90a`)
- Pipeline note: the roadmap is now a **baked seed** (`roadmapSeedData.js` via `scripts/build-roadmap-seed.mjs`, Codex) — content changes need bundle regen + seed regen + `CURRICULUM_VERSION` bump (30→31 here).
- Follow-ups parked in `docs/curr/goal-shaped-path-design.md`: in-lesson `getNextNode` still goal-blind; scenes could inherit topics.
- Pages: [curriculum-paths](topics/tech/curriculum-paths.md), [adaptive-sequencer](topics/tech/adaptive-sequencer.md).

## [2026-06-11] ingest | TTS bucket migration completed to Cloudflare R2
attributed_to: [niko, codex]   belongs_to: [bucket-storage, tts-pipeline]
- Supabase `tts-cache` → Cloudflare R2 migration completed for all `42,071` objects.
- First full pass copied `16,491` missing objects, skipped `25,560`, and left 20 transient fetch failures. Retry pass copied 2 remaining objects, skipped `42,069`, and ended with `failed=0`.
- Verified production `/api/tts` redirects to `https://tts.tecxmate.com/...` with `x-tts-cache-provider: r2`; following the redirect returns `HTTP 200 audio/wav`.
- Pages: [bucket-storage](topics/tech/bucket-storage.md), [tts-pipeline](topics/tech/tts-pipeline.md).

## [2026-06-11] ingest | Supabase storage quota unlock for R2 migration
attributed_to: [niko, codex]   belongs_to: [bucket-storage]
- Supabase Storage reads were restricted after the `tts-cache` bucket exceeded the free storage quota by roughly 25%; the R2 migration script failed at object listing with HTTP 402.
- Niko paid for one Supabase Pro month ($25) to unlock the project and allow the Supabase → Cloudflare R2 migration to complete.
- Lesson: migrate future storage workloads before crossing free-tier quota. Once Supabase restricts a project, the read/list calls required for migration can be blocked too.
- Pages: [bucket-storage](topics/tech/bucket-storage.md).

## [2026-06-11] decision | Staged Supabase retirement plan via Neon, Auth.js, and R2
attributed_to: [niko, codex]   belongs_to: [backend-vendor-migration, backend-ops-store, bucket-storage]
- Migration branch `infra/migrate-to-neon-r2` is a scaffold/warm-up path, not an immediate cutover; Supabase stays primary until Neon data, R2 storage, and Auth.js auth are all verified.
- Planned sequence: run Neon schema, backfill Supabase tables, dual-write progress, move ops/progress reads to Neon, migrate TTS via the existing script, flip R2 uploads, then complete Auth.js cutover and user-ID linking.
- Supabase can be retired only after runtime code no longer depends on `supabase.auth`, Supabase bearer validation, Supabase Storage URLs, or Supabase env vars.
- Pages: [backend-vendor-migration](topics/tech/backend-vendor-migration.md), [backend-ops-store](topics/tech/backend-ops-store.md), [bucket-storage](topics/tech/bucket-storage.md).

## [2026-06-11] ingest | Supabase Pro month turned into migration tooling
attributed_to: [niko, codex]   belongs_to: [backend-vendor-migration, backups-recovery]
- Added portable Supabase → Neon export and parity-check scripts: `scripts/export-supabase-neon-sql.mjs`, `scripts/check-neon-parity.mjs`, and shared table map `scripts/backend-migration-tables.mjs`.
- Added npm commands: `db:apply:neon`, `db:export:supabase`, and `db:check:neon-parity`.
- Updated the backend migration wiki to treat Supabase Pro as a one-month safety net and experiment lab, while avoiding new Supabase lock-in.
- Pages: [backend-vendor-migration](topics/tech/backend-vendor-migration.md), [backups-recovery](topics/tech/backups-recovery.md).

## [2026-06-11] decision | Portable pgvector experiments for Vietnamy learning UX
attributed_to: [niko, codex]   belongs_to: [backend-vendor-migration, grammar-system, curriculum-paths]
- Supabase pgvector can be used during the paid month as a temporary experiment lab, but embeddings stay rebuildable derived data and must remain portable to Neon Postgres/pgvector.
- Prioritized app uses: semantic search, "Ask Vietnamy Tutor" RAG over app-owned content, mistake explanations, "more examples like this", and internal content QA.
- Guardrail: no broad open-ended chatbot or direct frontend Supabase vector calls until retrieval quality, source references, and the Neon exit path are proven.
- Pages: [backend-vendor-migration](topics/tech/backend-vendor-migration.md).

## [2026-06-12] decision | Chinese pronunciation localization shipped (Bopomofo/Pinyin)
attributed_to: [niko]   belongs_to: [curriculum-paths]
- Implemented decision 2026-06-11-chinese-pronunciation-curriculum (status proposed → active).
- Per-language sound explanations across alphabet/vowels/tones via `pickLocalized` + sibling fields; admin edit spots in Alphabet/Vowels/Tone editors.
- Coverage: 29 letters, 11 vowels, 26 diphthong/triphthong/centering, 6 tones — zh-t 注音 + zh-s 拼音. Single vowels + tones owner-validated; diphthongs/consonants first-pass.
- Commits: 559e316, 19ed265. Pages: [decision](decisions/2026-06-11-chinese-pronunciation-curriculum.md).

## [2026-06-13] decision | Canonical curriculum admin editing
attributed_to: [niko, codex]   belongs_to: [curriculum-paths]
- Lesson Builder moved from editing derived mock DB rows to editing a local canonical curriculum draft shaped like `content/curriculum.json`.
- Admin import/export now defaults to canonical curriculum JSON; legacy `vnme_curriculum_edits` backups remain importable.
- Saves validate the canonical draft and regenerate the current study runtime tables (`items`, `translations`, `lesson_blueprints`, `lessons`, lesson/test roadmap nodes).
- Remaining boundary: grammar, pronunciation drills, scenes, and articles still use specialized editors/data contracts.
- Pages: [decision](decisions/2026-06-13-canonical-curriculum-admin.md), [curriculum-paths](topics/tech/curriculum-paths.md).

## [2026-06-13] topic | Production readiness and Flutter handoff
attributed_to: [niko, codex]   belongs_to: [vietnamy-app, mobile-strategy]
- Documented that the biggest remaining production blockers are backend-owned user/progress state, admin publish workflow, module contract unification, end-to-end QA, observability, privacy/security workflows, and Flutter handoff fixtures.
- Decision direction: avoid building Supabase-only admin/user infrastructure unless it sits behind backend-neutral contracts; the proprietary Zeabur backend should become the long-term source of truth for web and Flutter.
- Recommended next chunk: backend-neutral user/progress/SRS/saved-words API and schema handoff.
- Pages: [production-readiness-flutter-handoff](topics/tech/production-readiness-flutter-handoff.md).

## [2026-06-13] architecture | Backend-neutral learner state handoff
attributed_to: [niko, codex]   belongs_to: [production-readiness-flutter-handoff, mobile-strategy]
- Added `docs/architecture/USER_STATE_API.md` for profile, progress, hearts/streak, SRS, word grades, saved words/decks, notification preferences, conflict handling, offline/idempotent writes, and migration from current web localStorage keys.
- Added `docs/schemas/user-state.schema.json` as the machine-readable `vnme_user_state` envelope and `docs/fixtures/user-state-sample.json` as the first shared learner fixture.
- Direction: Flutter should consume typed API fields, not React localStorage key names; the Zeabur backend can store JSON first and normalize later without changing clients.
- Pages: [production-readiness-flutter-handoff](topics/tech/production-readiness-flutter-handoff.md).

## [2026-06-14] implementation | Feedback-to-agent bug pipeline
attributed_to: [niko, codex]   belongs_to: [adaptive-software-automation, backend-ops-store]
- In-app bug reports continue to save in `feedback_reports` through local SQLite, Supabase, or Neon depending on `OPS_STORE_PROVIDER`.
- Added lifecycle states and admin APIs so agents can list, claim, triage, and mark reports `fixed_pending_approval`.
- Added `scripts/feedback-agent-pipeline.mjs` plus npm commands for local/cloud queue export and agent handoff.
- Guardrail: agents may prepare fixes, branches, commits, and PRs, but closing/merge/deploy requires Niko approval.
- Pages: [feedback-agent-pipeline](topics/tech/feedback-agent-pipeline.md), [adaptive-software-automation](topics/tech/adaptive-software-automation.md), [backend-ops-store](topics/tech/backend-ops-store.md).

## [2026-06-17] decision | Narrated Reader + Azure-free word timing
attributed_to: [niko]   belongs_to: [narrated-reader, tts-pipeline]
- Built the Narrated Reader: slide deck synced to narration, word-by-word karaoke, tap-to-meaning; new `explainer` content type (airport topic). Reuses TappableVietnamese/WordPopup/segment/SRS.
- Promoted to its own bottom-nav **Reader tab, replacing Watch** (WatchTab now orphaned).
- Phase 4 word timing: prototyped Azure Speech SDK `WordBoundary`, then **dropped Azure** per Niko → VieNeu-TTS (open) + CTC forced alignment, generated offline (`scripts/generate_explainer_audio.py`) and served from a pre-baked cache by `/api/tts-timed`. Runs on M1 Pro (GGUF) / Ryzen CPU; no CUDA.
- Client `karaokeTiming.js`: exact marks when present (Exact badge), syllable estimate fallback. Verified end-to-end with a dummy cache entry.
- Pages: [narrated-reader](topics/tech/narrated-reader.md), [decision](decisions/2026-06-17-narrated-reader-azure-free-timing.md), [tts-pipeline](topics/tech/tts-pipeline.md).
