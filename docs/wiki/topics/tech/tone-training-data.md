---
title: Tone Training Data
type: topic
slug: tone-training-data
date: 2026-05-30
updated: 2026-05-30
belongs_to: [niko]
source: synthesis
status: active
tags: [tones, pronunciation, data, ml, backend]
related: [tone-trainer, pronunciation-assessment, adaptive-software-automation]
---

## Summary
The Speak step's F0-template scoring is unreliable (see [Tone Trainer](tone-trainer.md) → Known limitation). The agreed fix is a small **learned** tone-scoring model, which needs labeled data. So every Speak attempt can be **self-labeled** by the learner ("Did you actually say it right?") and the resulting sample — the pitch-contour feature plus its ground-truth label — is stored locally and **pooled to a backend endpoint** for later training. No raw audio is stored, only the derived contour.

## Collection flow
After a Speak result, the lesson shows **"Help train the tone model — did you actually say it right?"** with **Yes, correct** / **No, wrong**. Tapping either saves one sample.

A sample:
```json
{ "tone": "nga", "word": "mã",
  "contour": [ …~24 normalized semitone values… ],  // the feature
  "dialect": "south",                                // from the user profile
  "label": "correct",                                // ground truth
  "recognized": "Mã.", "predicted": "sac", "matchScore": 5,
  "clientId": "<anon uuid>", "ts": 1717000000000 }
```
`dialect` is captured because it is a key confound (Northern templates vs Southern Ngã/Hỏi merge); `predicted`/`matchScore` record what the heuristic guessed, so disagreements with the human label become the most valuable training signal.

## Storage
- **Local** — `localStorage['vnme_tone_samples']` (capped 3000, schema-versioned). Per-device backup the learner can export as JSON from the lesson's Done screen ("Export N training samples"). Anonymous device id in `localStorage['vnme_client_id']`.
- **Pooled (backend)** — best-effort `fetch` POST on each save (`keepalive`, never blocks UI). Backed by a writable SQLite DB.

## Backend API
Added in `server/server.js`, table `tone_samples` at `TONE_DB_PATH`.
- `POST /api/tone-samples` — body is one sample or `{ samples: [...] }` (max 100). Validates tone ∈ the 6 ids and label ∈ {correct,wrong}; invalid rows are skipped. Returns `{ ok, stored, total }`.
- `GET /api/tone-samples/stats` — public aggregate counts only (`{ total, byTone: [{tone,label,n}] }`), no PII.
- `GET /api/tone-samples?token=…&limit=…&offset=…` — owner export; requires `TONE_EXPORT_TOKEN` to be set and matched, else `403`. Returns rows with `contour` parsed back to numbers.

## Deployment (Zeabur) — required env
1. **`TONE_EXPORT_TOKEN`** — set to a secret string. Without it the export endpoint is write-only (`403`). Download data via `https://vietnamy.zeabur.app/api/tone-samples?token=<secret>`. Public sanity check: `…/api/tone-samples/stats`.
2. **`TONE_DB_PATH` → a mounted persistent volume** (e.g. `/data/tone_samples.db`). Default is `server/databases/tone_samples.db`, but Zeabur's container filesystem is **ephemeral** — without a volume, pooled samples are wiped on every redeploy. Ingestion and on-device testing still work; cross-deploy accumulation needs the volume.

The runtime DB files (`server/databases/tone_samples.db`, `push_notifications.json`) are gitignored so user data never enters the repo.

## Files
- `src/utils/toneData.js` — local store, anonymous client id, JSON export, background pooling POST.
- `src/components/Sounds/ToneLesson.jsx` — self-label UI and Done-screen export link.
- `server/server.js` — DB setup + `/api/tone-samples` endpoints.

## Open questions
- Model: a tiny in-browser classifier (logistic regression or 1-D CNN on the 24-point contour, a few KB of weights) once a few hundred labeled samples per tone/dialect exist.
- Should pooled samples carry an opt-in/consent note in the UI? Currently silent (contour-only, anonymous).
- Cross-device dedup / quality filtering before training.

## History
- 2026-05-30 — Built self-label collection (local + JSON export), then pooled it to a new SQLite-backed `/api/tone-samples` endpoint; documented Zeabur env requirements (`TONE_EXPORT_TOKEN`, `TONE_DB_PATH` volume).
