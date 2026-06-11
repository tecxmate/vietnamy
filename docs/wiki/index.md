# Wiki Index

Catalog of every page in `docs/wiki/`. One line per page. Update on every create/rename.

## Schema
- [LLM Wiki — Master Plan](llm-wiki-guide.md) — schema, conventions, agent workflow, portable pattern

## Stakeholders
*Things that can make decisions: people, teams, organizations, regulators, agents, automations.*

<!-- Agent: append `- [Name](stakeholders/slug.md) — one-line role` for each new stakeholder. -->
- [Niko (Nikolas Doan)](stakeholders/niko.md) — solo founder and owner of Vietnamy; makes all product/infra/budget decisions
- [Claude (Anthropic)](stakeholders/claude-opus.md) — AI coding agent (Opus 4.7) working on Vietnamy under `CLAUDE.md`
- [Tecxmate](stakeholders/tecxmate.md) — template owner for future Tecxmate web projects
- [Codex](stakeholders/codex.md) — AI coding agent operating under `AGENTS.md`

## Decisions
<!-- Agent: append `- [YYYY-MM-DD — Title](decisions/YYYY-MM-DD-slug.md) — one-line summary` for each decision. -->
- [2026-05-13 — Root drive/ Folder for Google Drive Media Sync](decisions/2026-05-13-root-drive-folder.md) — reserves root `drive/` for ignored Google Drive media sync
- [2026-05-13 — Publish Template as GitHub Repository](decisions/2026-05-13-publish-template-repo.md) — initializes and publishes the template as a GitHub repo
- [2026-05-13 — Adaptive Software Automation Vision](decisions/2026-05-13-adaptive-software-automation-vision.md) — documents the feedback-to-PR automation goal
- [2026-05-13 — drive/ Symlink Shortcut for Central Google Drive Sync](decisions/2026-05-13-drive-symlink-shortcut.md) — adds a script to link `drive/sync` to a central synced folder
- [2026-05-23 — Two-Tier TTS Cache (source + derived)](decisions/2026-05-23-two-tier-tts-cache.md) — split bucket into raw-PCM source + post-processed WAV derived so voice-quality iteration is free
- [2026-05-23 — Azure Speech F0 → S0 Pricing Tier](decisions/2026-05-23-azure-s0-pricing-tier.md) — upgraded after F0 quota was exhausted mid-warmup; $200 credit covers years of organic usage
- [2026-05-23 — Pronunciation Assessment as Primary Grading Signal](decisions/2026-05-23-pronunciation-assessment-for-grading.md) — replaced browser STT with Azure phoneme-level scoring for tonal accuracy
- [2026-05-23 — Three Learner Paths (Explore Vietnam, Professional, Heritage)](decisions/2026-05-23-three-learner-paths.md) — authored 60 new lessons across two new paths, enabled in the chooser
- [2026-05-24 — Rename TTS Cache Version v9-nam-minh-lower → v9-processed](decisions/2026-05-24-v9-processed-rename.md) — folder name now describes processing state, not voice identity
- [2026-05-24 — Capacitor as the Mobile Distribution Path](decisions/2026-05-24-capacitor-mobile-path.md) — defer mobile, wrap PWA via Capacitor when web is feature-complete
- [2026-05-24 — IAP via RevenueCat for In-App Subscriptions](decisions/2026-05-24-iap-via-revenuecat.md) — proposed: native subs via RevenueCat, web subs via Stripe
- [2026-05-24 — Migrate TTS Bucket to Cloudflare R2 Within One Month](decisions/2026-05-24-cloudflare-r2-migration-pending.md) — proposed: tracked as GitHub issue #17, deadline 2026-06-24
- [2026-06-10 — Supabase Ops Store and Vercel API Cutover](decisions/2026-06-10-supabase-ops-store-vercel-api.md) — use Supabase Postgres for ops data, keep heavy objects in R2, expose lightweight Vercel API routes
- [2026-06-11 — Chinese Pronunciation Explanations are Curriculum (Bopomofo / Pinyin)](decisions/2026-06-11-chinese-pronunciation-curriculum.md) — re-author VN sound explanations against Bopomofo (zh-t) / Pinyin (zh-s), not literal translation; some sounds have no Mandarin equivalent
- [2026-06-11 — R2 Public URL via tts.tecxmate.com Custom Domain](decisions/2026-06-11-r2-public-url-custom-domain.md) — R2_PUBLIC_BASE_URL pointed at the private S3 endpoint (cache-hits 302→400); bind tts.tecxmate.com custom domain + CORS to fix

## Topics
*Areas, products, events, and synthesised concepts. Topics don't make decisions; stakeholders do.*

Topics are split into `topics/tech/` (engineering, infra, app, content systems) and `topics/business/` (market, customers, money, positioning).

### Tech
<!-- Agent: append `- [Title](topics/tech/slug.md) — one-line summary` for each tech topic. -->
- [Vietnamy — Project Overview](topics/tech/vietnamy-app.md) — stack, surfaces, learner paths, links to deeper topics
- [TTS Pipeline (Two-Tier Cache)](topics/tech/tts-pipeline.md) — source + derived bucket layout, request flow, post-processing
- [Pronunciation Assessment](topics/tech/pronunciation-assessment.md) — Azure phoneme-level scoring for `speak_sentence` and Tone Trainer
- [Curriculum & Learner Paths](topics/tech/curriculum-paths.md) — Explore Vietnam / Professional / Heritage curricula
- [Adaptive Curriculum Sequencer](topics/tech/adaptive-sequencer.md) — purpose/performance-driven lesson sequencing; Layers 1–4 built (additive)
- [Grammar System (single-source)](topics/tech/grammar-system.md) — A1–C2 via grammarModulesDB; Grammar Guide at /grammar; legacy bank retired
- [Skill Tree (Roadmap)](topics/tech/skill-tree.md) — Duolingo-style node tree, unlock_rules, why it exists
- [Tone Trainer](topics/tech/tone-trainer.md) — Sounds-tab Learn→Identify→Speak lesson with client-side pitch overlay + shape-classification verdict
- [Tone Training Data](topics/tech/tone-training-data.md) — self-labeled pitch-contour samples pooled to `/api/tone-samples` toward a learned tone-scoring model
- [Bucket Storage (Supabase → R2)](topics/tech/bucket-storage.md) — current state, sizes, R2 migration plan
- [Backend Vendor Migration (Supabase → Neon + R2)](topics/tech/backend-vendor-migration.md) — staged plan to migrate data/storage/auth and retire Supabase safely
- [Backups & Disaster Recovery](topics/tech/backups-recovery.md) — local backup, full bucket mirror, cron setup
- [Mobile Strategy](topics/tech/mobile-strategy.md) — Capacitor path, what ports, what to avoid
- [Drive Media Sync](topics/tech/drive-media-sync.md) — root `drive/` convention and symlink helper for heavy Google Drive media files
- [Repository Publishing](topics/tech/repository-publishing.md) — Git/GitHub publishing status for the reusable template
- [Adaptive Software Automation](topics/tech/adaptive-software-automation.md) — long-term feedback, telemetry, AI repair, and PR review loop
- [Backend Ops Store and Identity Migration](topics/tech/backend-ops-store.md) — Supabase ops tables, Vercel API routing, production env, and next auth/RLS plan

### Business
<!-- Agent: append `- [Title](topics/business/slug.md) — one-line summary` for each business topic. -->
- [Payment & Monetization Strategy](topics/business/payment-strategy.md) — IAP via RevenueCat + web Stripe
- [Taiwan—Vietnam Business Corridor](topics/business/tw-vn-business-corridor.md) — TW FDI market backdrop and B2B target rationale ($42B, 3,457 companies)
- [Hán-Việt as a Competitive Moat](topics/business/han-viet-moat.md) — 60% Sino-Vietnamese vocab as Mandarin-speaker differentiator
- [Pricing & Unit Economics](topics/business/pricing-and-unit-economics.md) — proposed B2B seat plans + B2C subscription with LTV/CAC math
- [Competitive Landscape](topics/business/competitive-landscape.md) — Duolingo, Ling, Pimsleur, Babbel, Rosetta, italki — and where we win
- [Customer Pipeline](topics/business/customer-pipeline.md) — landed (CTBC + 5 NTU classes) + outbound target list

## Log
- [log.md](log.md) — append-only chronological record
