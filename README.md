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
  context/          # React Context (UserContext, DongContext, LanguageContext)
  components/
    Tabs/           # Main tab views (Home, Roadmap, Practice, Dictionary, Community)
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
docs/               # Project documentation (PRD, handoff guide, user flows)
```

## Core Features

- **Lesson Engine** — Interactive exercises (multiple choice, listen & tap, reorder words, speaking) with a 5-heart system
- **Roadmap** — Duolingo-style skill tree with unlock prerequisites
- **Dictionary** — Multi-source fuzzy search with diacritics handling, IPA, examples, and compound word decomposition
- **Spaced Repetition** — SM-2 inspired flashcard system (1/3/7/14/30 day intervals)
- **Gamification** — Virtual currency, daily streaks, stage unlocking
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

See `docs/PROJECT_HANDOFF.md` for detailed architecture, data structures, and instructions on adapting this app for other language pairs.

## Credits

Developed by [TECXMATE.COM](https://tecxmate.com)
