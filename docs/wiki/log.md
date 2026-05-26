# Wiki Log

Append-only. Newest entries at the bottom. Standard prefix: `## [YYYY-MM-DD] <kind> | <subject>`.

`<kind>` ∈ `ingest | decision | chat | lint | external`.

Quick recent log: `grep "^## \[" docs/wiki/log.md | tail -10`.

<!-- Agent: append entries. The first entry should be the bootstrap ingest after BOOTSTRAP.md is followed. -->

## [2026-05-13] decision | Root drive folder for media sync
attributed_to: [tecxmate]   belongs_to: [drive-media-sync]
- Added a root `drive/` placeholder for project-specific Google Drive media synchronization.
- Documented that `drive/` is ignored media/reference storage, not source code.
- Pages: [decision](decisions/2026-05-13-root-drive-folder.md), [topic](topics/drive-media-sync.md), [stakeholder](stakeholders/tecxmate.md).

## [2026-05-13] decision | Publish template repository
attributed_to: [tecxmate]   belongs_to: [repository-publishing]
- Tecxmate requested that this template folder become a Git repository, be committed, and be pushed to GitHub.
- Pages: [decision](decisions/2026-05-13-publish-template-repo.md), [topic](topics/repository-publishing.md).

## [2026-05-13] ingest | GitHub repository published
attributed_to: [codex]   belongs_to: [repository-publishing]
- Created and pushed the GitHub repository at `https://github.com/nikolasdoan/tecx`.
- `main` now tracks `origin/main`.

## [2026-05-13] decision | Adaptive software automation vision
attributed_to: [tecxmate]   belongs_to: [adaptive-software-automation]
- Tecxmate described the long-term goal of using in-app feedback, Google Forms, GA4, GitHub Actions, cron jobs, and AI agents to generate fix PRs for human review.
- Documented feasibility as assisted repair with human merge/deploy review, not unsupervised production changes.
- Pages: [decision](decisions/2026-05-13-adaptive-software-automation-vision.md), [topic](topics/adaptive-software-automation.md).

## [2026-05-13] decision | Lowercase drive folder name
attributed_to: [tecxmate]   belongs_to: [drive-media-sync]
- Tecxmate clarified that the synced media folder should be named `drive/` with a lowercase `d`.
- Renamed the tracked placeholder folder and updated template documentation to match.

## [2026-05-13] decision | drive symlink shortcut
attributed_to: [tecxmate]   belongs_to: [drive-media-sync]
- Tecxmate asked for a shortcut from the template `drive/` folder to a separately synchronized Google Drive location.
- Added `scripts/link-drive.sh` to create ignored symlinks such as `drive/sync`.
- Pages: [decision](decisions/2026-05-13-drive-symlink-shortcut.md), [topic](topics/drive-media-sync.md).

## [2026-05-23] decision | Two-tier TTS cache (source + derived)
attributed_to: [claude-opus, niko]   belongs_to: [tts-pipeline]
- Split `tts-cache` bucket into `source/<voice>/<sha1>.pcm` (raw Azure PCM, unversioned) and `<TTS_CACHE_VERSION>/<voice>/<sha1>.wav` (post-processed, served).
- Bumping the version env var now re-derives WAVs from source locally — zero Azure calls.
- Shipped in commit `91608cf`. One-time source backfill ran the same day (~$3 on Azure S0).
- Pages: [decision](decisions/2026-05-23-two-tier-tts-cache.md), [topic](topics/tts-pipeline.md).

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
- Pages: [decision](decisions/2026-05-23-pronunciation-assessment-for-grading.md), [topic](topics/pronunciation-assessment.md), [topic](topics/tone-trainer.md).

## [2026-05-23] decision | Three learner paths (Professional + Heritage)
attributed_to: [niko]   belongs_to: [curriculum-paths]
- Authored 60 new lessons across Professional and Heritage paths (A1 / A2/B1 / B2/C1).
- 30 lessons per path; 240 words, 120 sentences, 30 conversations each.
- Flipped `enabled: false` → `true` in `src/data/learnerModes.js`.
- Shipped in commits `38a7b94` (A1), `60d60ce` (A2/B1), `84bf3c3` (B2/C1).
- Pages: [decision](decisions/2026-05-23-three-learner-paths.md), [topic](topics/curriculum-paths.md).

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
- Pages: [decision](decisions/2026-05-24-capacitor-mobile-path.md), [topic](topics/mobile-strategy.md).

## [2026-05-24] chat | Payment strategy — IAP via RevenueCat
attributed_to: [niko]   belongs_to: [payment-strategy]
- Native subscriptions will use IAP via RevenueCat SDK (Apple/Google 15–30% + RevenueCat 1% over $2.5K MRR).
- Web subscriptions via Stripe (2.9% + 30¢).
- Long-term hybrid: higher in-app sticker price + lower web price (Tinder/Audible pattern).
- No code today; decision recorded for monetization launch.
- Pages: [decision](decisions/2026-05-24-iap-via-revenuecat.md), [topic](topics/payment-strategy.md).

## [2026-05-24] decision | Migrate TTS bucket to Cloudflare R2 within 1 month
attributed_to: [niko]   belongs_to: [bucket-storage]
- Bucket at ~1.4 GB; over Supabase free tier (1 GB storage, 5 GB egress/month).
- Target: R2 migration by 2026-06-24. Tracked as GitHub issue #17.
- New scripts during cleanup-prep: `scripts/cleanup-legacy-tts.mjs`, `scripts/mirror-bucket.mjs` (full-bucket mirror for home-PC cron).
- Deleted ~21K orphaned files from old voice iterations (`v3-trim/`, `v4-trim-loudness/`) and the `migrate-source/` throwaway.
- Pages: [decision](decisions/2026-05-24-cloudflare-r2-migration-pending.md), [topic](topics/bucket-storage.md), [topic](topics/backups-recovery.md).

## [2026-05-24] ingest | Wiki bootstrap for Vietnamy project
attributed_to: [claude-opus]   belongs_to: [vietnamy-app]
- Populated the wiki with Vietnamy-specific stakeholders ([niko], [claude-opus]) and a baseline topic graph: [vietnamy-app], [tts-pipeline], [pronunciation-assessment], [curriculum-paths], [skill-tree], [tone-trainer], [bucket-storage], [backups-recovery], [mobile-strategy], [payment-strategy].
- Migrated content from `docs/tts-cache.md` and the in-conversation context. The deep TTS doc stays canonical; topic pages summarize and link to it.
- Recorded 8 decisions covering all major architectural choices made in the 2026-05-23/24 working session.

## [2026-05-26] external | Capacitor Android bootstrap verified
attributed_to: [codex, niko]   belongs_to: [mobile-strategy]
- Started Capacitor bootstrap on branch `mobile/capacitor-bootstrap`.
- Added Capacitor 8, generated `ios/` and `android/`, and added `VITE_API_BASE_URL` support through `src/utils/apiUrl.js`.
- Android debug build passes with `cd android && ./gradlew assembleDebug`; APK is `android/app/build/outputs/apk/debug/app-debug.apk` (`7.0M`).
- Local Android tooling installed: Temurin JDK 21 (`336M`), Android SDK packages (`546M`), Gradle cache (`1.0G`).
- iOS project exists, but native build is blocked until full Xcode is installed and selected.
- Pages: [decision](decisions/2026-05-24-capacitor-mobile-path.md), [topic](topics/mobile-strategy.md).
