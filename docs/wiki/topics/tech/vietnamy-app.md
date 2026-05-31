---
title: Vietnamy — Project Overview
type: topic
slug: vietnamy-app
date: 2026-05-23
updated: 2026-05-24
belongs_to: [niko]
source: synthesis
status: active
tags: [overview, architecture]
related: [tts-pipeline, pronunciation-assessment, curriculum-paths, skill-tree, bucket-storage, mobile-strategy, payment-strategy]
---

## Summary
Vietnamy is a mobile-first Vietnamese language-learning PWA built primarily for English and Chinese speakers, with a Heritage path targeting Vietnamese-diaspora learners reconnecting with the language. Tonal-language pronunciation is the moat — most competitors use text-match grading that can't detect tone errors; Vietnamy uses Azure Pronunciation Assessment for phoneme-level scoring.

## Stack at a glance

| Layer | Technology | Hosted on |
| --- | --- | --- |
| Frontend | React 19 + Vite 7 (PWA) | Vercel (`vietnamy.tecxmate.com`) |
| Backend API | Express + better-sqlite3 (ESM) | Zeabur (`/api/*`) |
| Auth | Supabase Auth (Google OAuth) | Supabase |
| Audio cache | Supabase Storage `tts-cache` bucket | Supabase + Cloudflare |
| TTS / STT / Pronunciation | Azure Speech (S0 tier) | Azure (`VNME-Asia` resource) |
| Dictionary | SQLite databases in `server/databases/` | Zeabur disk |
| Client state | React Context + localStorage | Browser |
| Cloud sync | Supabase Postgres (`user_progress` table) | Supabase |

## Core surfaces
- **Home** — daily streak, dictionary search, partner referrals.
- **Roadmap / Study** — Duolingo-style skill tree of lesson nodes per learner path (see [skill-tree]).
- **Practice (Grammar)** — drill modules including the [tone-trainer], numbers, kinship, telex, teen-code.
- **Dictionary** — Vietnamese ↔ EN/ZH (and 7 others locally). Server reads SQLite on-demand.
- **Reading Library** — bilingual sentence-aligned articles. Each article has Vietnamese sentences voiced by both Nam Minh (north) and Hoài Mỹ (south).
- **Lesson engine** — `src/components/LessonGame.jsx` runs MCQ / listen-tap / speaking / reorder exercises with SRS-backed grading.
- **Pronunciation grading** — for `speak_sentence` exercises and the Tone Trainer (see [pronunciation-assessment]).

## Learner paths
Three modes defined in `src/data/learnerModes.js`. Curricula in `src/data/curricula/`:
- **Explore Vietnam** — travelers and tourists. Full A1 → C2 (~150 lessons).
- **Professional** — business Vietnamese. 30 lessons across A1, A2/B1, B2/C1.
- **Heritage** — diaspora reconnection. 30 lessons across A1, A2/B1, B2/C1.

See [curriculum-paths] for the full breakdown.

## Cross-cutting infrastructure
- [tts-pipeline] — two-tier audio cache (source PCM + processed WAV), Azure free tier strategy, post-processing.
- [bucket-storage] — Supabase Storage layout, sizes, the upcoming Cloudflare R2 migration ([issue #17](https://github.com/tecxmate/vietnamy/issues/17)).
- [backups-recovery] — local backup script, the home-PC daily mirror plan.
- [pronunciation-assessment] — Azure Pronunciation Assessment for tonal scoring.

## Deeper reference docs
- `docs/tts-cache.md` — exhaustive TTS architecture, operations, failure modes.
- `docs/prd/PRD.md` — product requirements.
- `docs/prd/PROJECT_HANDOFF.md` — original architecture handoff doc.
- `docs/curr/CANONICAL_CURRICULUM_SCHEMA.md` — curriculum JSON schema.
- `CLAUDE.md` — agent operating instructions for this repo.

## Open questions
- Mobile distribution timing (see [mobile-strategy]).
- Monetization launch (see [payment-strategy]).
- Cloudflare R2 migration timing (within ~1 month per issue #17).
