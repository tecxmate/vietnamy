# Vietnamy

A mobile-first Vietnamese language learning web app built with React + Vite. Teaches Vietnamese to English and Chinese speakers through interactive lessons, spaced repetition, a multi-source dictionary, grammar drills, and gamification.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, React Router 6, Vite 7 |
| Backend | Express.js, SQLite (better-sqlite3) |
| Styling | CSS variables, mobile-first, dark/light mode |
| Icons | Lucide React |
| Chinese support | OpenCC-JS (simplified/traditional conversion) |

## Getting Started

```bash
# Install dependencies
npm install
cd server && npm install && cd ..

# Run frontend + backend concurrently
npm run dev:all

# Or run separately:
npm run dev          # Frontend — localhost:5173
npm run dev:server   # Backend  — localhost:3001
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server (port 5173) |
| `npm run dev:server` | Start Express API server (port 3001) |
| `npm run dev:all` | Run both concurrently |
| `npm run build` | Production build (Vite + server deps) |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview production build locally |

## Project Structure

```
src/
  context/          # React Context (UserContext, ProgressContext, LanguageContext, AuthContext, NotificationContext)
  components/
    Tabs/           # Main tab views (Study, Dictionary, Library)
    Onboarding/     # First-launch setup wizard
  pages/
    Practice/       # Practice modules (tones, pronouns, numbers, flashcards, etc.)
    Admin/          # Content management editors
    Grammar/        # Grammar list and detail views
  lib/              # Business logic (db, SRS, vocab library, grammar, i18n)
  data/             # Static content (lessons, vocab, grammar, articles, tones)
  utils/            # Utilities (TTS, pitch detection, fuzzy matching, pronoun logic)
  hooks/            # Custom React hooks
server/
  server.js         # Express API (dictionary search, suggest, TTS proxy)
  databases/        # SQLite dictionary databases (not in git)
  scripts/          # Data import and generation pipelines
docs/               # Project documentation (wiki, PRD, curriculum source, content schema)
```

## Core Features

- **Lesson Engine** — Interactive exercises (multiple choice, listen & tap, reorder words, speaking)
- **Roadmap** — Duolingo-style skill tree with unlock prerequisites
- **Dictionary** — Multi-source fuzzy search with diacritics handling, IPA, examples, and compound word decomposition
- **Spaced Repetition** — SM-2 inspired flashcard system (1/3/7/14/30 day intervals)
- **Gamification** — Daily streaks, progress tracking, and roadmap unlock prerequisites
- **Practice Modules** — Tones, pitch training, pronouns, numbers, vowels, TELEX typing, teen code
- **Admin CMS** — Visual editors for lessons, roadmap, grammar, articles, vocabulary
- **Bilingual UI** — English and Chinese interface toggle

## Deployment

The app includes a Dockerfile for containerized deployment:

```bash
docker build -t vietnamy .
docker run -p 8080:8080 vietnamy
```

In production, Express serves both the API and the built frontend from `/dist`.

## Mail System

The Express server can send transactional email through Resend without a separate worker. It keeps a local runtime log at `server/databases/email_logs.json` for smoke checks and lightweight usage stats.

### Setup

1. Create a Resend API key.
2. Add these env vars on the server:
   ```
   RESEND_API_KEY=<resend-api-key>
   EMAIL_FROM="Vietnamy <hello@your-domain.com>"
   SUPPORT_EMAIL=ceo@tecxmate.com
   PUBLIC_BASE_URL=https://vietnamy.app
   MAIL_ADMIN_TOKEN=<random-admin-token>
   ```
3. In production, verify the sender domain in Resend before changing `EMAIL_FROM` away from Resend's test sender.

### Endpoints

- `GET /api/mail/config` — public provider status, no secrets.
- `POST /api/mail/support` — public support/feedback email to `SUPPORT_EMAIL`.
- `POST /api/mail/waitlist` — public waitlist notification to `SUPPORT_EMAIL`, with optional confirmation email to the learner.
- `GET /api/mail/stats` — requires `Authorization: Bearer <MAIL_ADMIN_TOKEN>`.
- `POST /api/mail/reminder` — requires `MAIL_ADMIN_TOKEN`; sends one lesson reminder.
- `POST /api/mail/test` — requires `MAIL_ADMIN_TOKEN`; sends a smoke-test email.

Public send endpoints are rate-limited in memory by email/IP. If `RESEND_API_KEY` is missing, send endpoints return `503` and log the skipped attempt locally.

See `docs/ENGAGEMENT_MESSAGING.md` for the standardized email, push, in-app message catalog and optimization workflow.

## Feedback Reports

`POST /api/feedback` stores structured prototype feedback, including page, viewport, app version, optional screenshot URL, and compact client logs. `GET /api/admin/feedback` requires `MAIL_ADMIN_TOKEN` and returns recent reports plus summary counts.

## App Operations Store

Runtime product operations live in `server/databases/app_ops.db`, a local SQLite store ignored by git. It currently holds email logs, message optimization events, push subscriptions/events, durable in-app notifications, and feedback reports. This mirrors Tecxwork's coherent operational data model while keeping Vietnamy's current Express/Vite architecture.

Important endpoints:

- `GET /api/mail/stats` — email usage and failures.
- `GET /api/messages/stats` — message variant selection/open/click stats.
- `GET /api/push/stats` — push subscriptions and engagement.
- `GET /api/admin/feedback` — recent feedback and summary counts.
- `GET /api/notifications?userId=...` — durable in-app notification history.

See `docs/BACKEND_SCALING_PLAN.md` for the Supabase/R2 scaling split and `supabase/migrations/202606100001_app_ops.sql` for the Postgres schema. Export local ops data with:

```bash
npm run ops:export:postgres -- --out /tmp/vietnamy-app-ops-export.sql
```

## TTS Bucket Cache

The `/api/tts` endpoint caches generated audio in object storage so most requests are served as 302 redirects from the CDN instead of regenerating from Azure / Google.

### One-time setup

Cloudflare R2 is the preferred storage backend:

1. In Cloudflare R2, create a bucket named `tts-cache`.
2. Create an R2 S3 API token with Object Read & Write access to that bucket.
3. Add these env vars on the server (Zeabur, local `.env`, etc.):
   ```
   TTS_STORAGE_PROVIDER=r2
   TTS_BUCKET=tts-cache
   R2_ACCOUNT_ID=<cloudflare-account-id>
   R2_ENDPOINT=https://<cloudflare-account-id>.r2.cloudflarestorage.com
   R2_ACCESS_KEY_ID=<r2-access-key-id>
   R2_SECRET_ACCESS_KEY=<r2-secret-access-key>
   R2_PUBLIC_BASE_URL=<public-r2-dev-url-or-custom-domain>
   ```
4. Keep these Supabase env vars during migration so R2 can fall back to the old bucket:
   ```
   SUPABASE_URL=https://<project-ref>.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
   ```
5. Redeploy the server. On a cache miss it now uploads to R2; on an R2 miss it can still read from Supabase while you migrate.

To copy the existing Supabase bucket to R2:

```bash
node scripts/migrate-tts-supabase-to-r2.mjs --dry-run
node scripts/migrate-tts-supabase-to-r2.mjs --concurrency=8
```

### Warm the cache for baked-in curriculum

Run this once after setup so users never wait on a cold cache for built-in content:

```bash
# Local server
node scripts/prebuild-tts.mjs

# Or against the deployed server
node scripts/prebuild-tts.mjs --server=https://your-server.zeabur.app

# Limit voices / parallelism
node scripts/prebuild-tts.mjs --voices=azure-north --concurrency=3

# Just count strings without hitting the API
node scripts/prebuild-tts.mjs --dry-run
```

The script collects every Vietnamese string under known keys (`vi`, `vi_text`, `target_vi`, etc.) across `src/data/`, dedupes, and walks them through `/api/tts` for each voice. Cache hits are skipped (302 from the server).

## Documentation

See `docs/wiki/` (start at `docs/wiki/index.md`) for architecture, decisions, and topic deep-dives; `docs/prd/PRD.md` for product requirements; and `docs/CONTENT_SCHEMA.md` for the canonical content contract.

## Credits

Developed by [TECXMATE.COM](https://tecxmate.com)
