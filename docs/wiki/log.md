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
