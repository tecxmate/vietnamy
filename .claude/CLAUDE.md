# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Vietnamy is a mobile-first Vietnamese language learning app (React + Vite frontend, Express + SQLite backend). It teaches Vietnamese to English/Chinese speakers through interactive lessons, spaced repetition, dictionary, grammar drills, and gamification. The architecture is designed to be cloned and adapted for other language pairs.

## Commands

```bash
# Install dependencies (root + server)
npm install && cd server && npm install && cd ..

# Development (frontend + backend concurrently)
npm run dev:all

# Frontend only (localhost:5173)
npm run dev

# Backend only (localhost:3001)
npm run dev:server

# Production build
npm run build

# Production start
npm start

# Lint
npm run lint

# E2E tests (requires dev server running)
npx playwright test test_*.spec.js
```

## Architecture

### Two-Process Setup
- **Frontend**: React 19 + Vite 7 dev server on port 5173. Vite proxies `/api` requests to the backend.
- **Backend**: Express.js on port 3001 (dev) / 8080 (Docker). Serves dictionary API + TTS/translation proxy. In production, also serves the built frontend from `/dist`.

### State Management
All app state uses React Context + localStorage (no backend auth, no user accounts):
- **UserContext** — profile (name, age, level, dialect, goal)
- **DongContext** — gamification (coins, hearts, streaks, completed nodes, unlocked stages)
- **LanguageContext** — UI language toggle (en/cn)

localStorage keys are prefixed `vnme_*` or `vietnamy_*`. The "mock database" in `db.js` IS the production data store — it seeds localStorage on first load.

### Routing (React Router v6)
- `/` — Main app with 5 tab layout (Home, Roadmap, Practice, Dictionary, Community)
- `/lesson/:lessonId` — Interactive lesson engine
- `/grammar-lesson/:nodeId`, `/test/:nodeId` — Grammar lessons and unit tests
- `/practice/*` — Full-screen practice modules (tones, pronouns, numbers, vowels, pitch, telex, teencode)
- `/grammar/:level/:index` — Grammar list/detail
- `/admin/*` — Content management (mapper, lesson builder, grammar/article/vocab/tone/kinship editors)

### Core Systems
- **Lesson Engine** (`LessonGame.jsx`) — Exercises with 5-heart system, streak tracking, SRS integration. Types: multiple_choice, listen_tap, speaking_repeat, reorder_words.
- **Roadmap** (`RoadmapTab.jsx`) — Duolingo-style skill tree. Nodes have `unlock_rule` prerequisites. 4 sessions = 1 completion.
- **Gamification** (`DongContext.jsx`) — Virtual currency "₫", daily streaks, stage unlocking. Hearts regenerate 1 per 30 min.
- **SRS** (`srs.js`) — SM-2 inspired spaced repetition. Intervals: 1→3→7→14→30 days.
- **Dictionary** — Server indexes SQLite databases on startup. Fuzzy suggest + full search with diacritics handling, compound word decomposition, IPA, examples. Supports EN/ZH + 6 more language pairs.
- **Admin CMS** (`/admin/*`) — Writes content edits to localStorage.

### Data Layer
- **Client**: Static content in `src/data/` (lessons, vocab, grammar, articles, tones, kinship). All baked into the bundle.
- **Server**: SQLite databases in `server/databases/` for dictionary (100MB+, not in git). Schema: `words`, `meanings`, `sources`, `examples`, `word_metrics`, `pronunciations`.

## Conventions

- **Pure JavaScript/JSX** — no TypeScript
- **ESM modules** (`"type": "module"` in both package.json files)
- **CSS**: Global CSS with component-scoped class names (no CSS modules). CSS variables for theming in `index.css`. Mobile-first (max-width: 480px), dark/light mode via `prefers-color-scheme`.
- **ESLint**: `no-unused-vars` ignores uppercase names (constants/components). React hooks and refresh plugins enabled.
- **Components**: One per file, PascalCase filenames. Tabs in `src/components/Tabs/`, practice modules in `src/pages/Practice/`, admin editors in `src/pages/Admin/`.
- **Icons**: lucide-react exclusively
- **TTS**: Google Translate proxy via `/api/tts` endpoint; browser `speechSynthesis` as fallback

## Adding Common Things

**New lesson**: Add exercises to `db.js` → `exercises`, lesson blueprint to `lesson_blueprints`, path node to `path_nodes` with `unlock_rule`.

**New practice module**: Create component in `src/pages/Practice/`, add route in `App.jsx`, add to grid in `PracticeTab.jsx`.

**New tab**: Create in `src/components/Tabs/`, add to `renderTab()` in `App.jsx`, add to `BottomNav.jsx`, add to `TAB_META` in `TopBar.jsx`.
