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
| `npm run cap:sync` | Build web assets and sync them into iOS/Android |
| `npm run cap:open:ios` | Open the iOS Capacitor project in Xcode |
| `npm run cap:open:android` | Open the Android Capacitor project in Android Studio |
| `npm run cap:run:ios` | Build and run the iOS app through Capacitor |
| `npm run cap:run:android` | Build and run the Android app through Capacitor |

## Mobile Apps

Vietnamy uses Capacitor for native iOS and Android distribution. The shared React/Vite app remains in `src/`; native platform code lives in `ios/` and `android/`.

For web and local Vite development, API calls stay relative (`/api/...`) and Vite proxies them to `localhost:3001`. For packaged iOS/Android builds, set `VITE_API_BASE_URL` to the deployed backend origin before building, for example:

```bash
VITE_API_BASE_URL=https://your-api-host.example npm run cap:sync
```

Do not include `/api` in `VITE_API_BASE_URL`; the frontend appends the API path.

For the current Vietnamy backend, use:

```bash
npm run cap:android:debug
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

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

The `/api/tts` endpoint caches generated audio in a public Supabase Storage bucket so most requests are served as 302 redirects from the CDN instead of regenerating from Azure / Google.

### One-time setup

1. In the Supabase Dashboard → **Storage**, create a bucket named `tts-cache` and mark it **Public**.
2. Add these env vars on the server (Zeabur, local `.env`, etc.):
   ```
   SUPABASE_URL=https://<project-ref>.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
   ```
   (Optional: `TTS_BUCKET=tts-cache` to override the default bucket name.)
3. Redeploy the server. On a cache miss it now uploads to the bucket; on a hit it 302-redirects.

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
