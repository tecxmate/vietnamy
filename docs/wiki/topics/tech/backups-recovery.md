---
title: Backups & Disaster Recovery
type: topic
slug: backups-recovery
date: 2026-05-24
updated: 2026-05-24
belongs_to: [niko]
source: synthesis
status: active
tags: [backup, disaster-recovery, cron]
related: [bucket-storage, tts-pipeline]
---

## Summary
Two layers of off-cloud durability for the TTS audio cache, plus the curriculum content living in Git. Both audio backup paths are scripted; one runs by request and the other is intended to run as a nightly cron on a home PC.

## Layer 1 — Curriculum-referenced backup (`scripts/backup-tts.mjs`)
Walks `src/data/` for known Vietnamese keys, computes SHA-1 keys, and downloads each file from the public Supabase bucket URL. Output: a local folder (default `tts-backup/`, gitignored) preserving the bucket's directory structure plus a `manifest.json` recording the text → file mapping.

**When to use:** when Niko wants a snapshot of audio for content the app actually references, on his laptop, no cron needed.

**Limitations:** misses files in the bucket that aren't referenced by current `src/data/` content (orphans, future-version derived files, etc.).

## Layer 2 — Full bucket mirror (`scripts/mirror-bucket.mjs`)
Recursively walks the entire `tts-cache` bucket via the Supabase Storage list API, downloads every object to a local folder, skips files already present with matching size. Idempotent — designed to run as a daily cron on a dedicated home PC for cloud-independent disaster recovery.

**Setup on a home server:**

```bash
mkdir -p ~/vietnamy-mirror && cd ~/vietnamy-mirror
curl -O https://raw.githubusercontent.com/tecxmate/vietnamy/main/scripts/mirror-bucket.mjs
echo "SUPABASE_SERVICE_ROLE_KEY=<paste-from-zeabur>" > .env
chmod 600 .env
mkdir -p /mnt/backups/tts
```

**Test manually:**
```bash
set -a && . ./.env && set +a
node mirror-bucket.mjs --out=/mnt/backups/tts --dry-run
node mirror-bucket.mjs --out=/mnt/backups/tts --concurrency=8
```

**Cron line (3 AM nightly):**
```cron
0 3 * * * cd /home/USER/vietnamy-mirror && set -a && . ./.env && set +a && /usr/bin/env node mirror-bucket.mjs --out=/mnt/backups/tts >> sync.log 2>&1
```

First full pull: ~1.4 GB, 5–10 minutes. Nightly deltas: typically under 30 seconds. Pass `--prune` if the mirror should exactly reflect the cloud (deletes local copies of files removed from cloud).

## Layer 3 — Git
Everything outside the audio bucket lives in the GitHub repo (`tecxmate/vietnamy`). Includes:
- All curriculum JSON (`src/data/curricula/*.json`).
- Tone Trainer data (`src/data/toneTrainerData.js`).
- Article data (`src/data/articleData.js`).
- Server code, scripts, wiki, docs.
- The SQLite dictionaries (`server/databases/*.db`) — **NOT** in git; they're 100 MB+ and Niko keeps a local copy.

## What's NOT backed up (yet)
- **User progress** in Supabase Postgres `user_progress` table. Supabase has its own daily snapshots; for stronger guarantees, a `pg_dump` cron should be added.
- **The `server/databases/` SQLite files**. They're not in git and not in any backup pipeline. If Niko's local copy is lost, the production version on Zeabur is the only remaining source — which is itself ephemeral if the Zeabur disk isn't persistent.

## Open questions
- Add Postgres backup for user progress? Free Supabase tier has limited backup retention; Pro tier has point-in-time recovery.
- Should the dictionary SQLite files have a tracked backup path? Likely a one-time upload to the home mirror covers it.
