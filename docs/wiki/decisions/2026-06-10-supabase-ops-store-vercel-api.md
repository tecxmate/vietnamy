---
title: Supabase Ops Store and Vercel API Cutover
type: decision
slug: 2026-06-10-supabase-ops-store-vercel-api
date: 2026-06-10
attributed_to: [niko, codex]
belongs_to: [backend-ops-store]
source: chat
status: active
tags: [backend, supabase, vercel, operations, email, notifications]
related: [backend-ops-store, bucket-storage, vietnamy-app]
---

## Context
Supabase free-tier storage was being consumed by heavy objects, so audio/media moved toward Cloudflare R2. Supabase remains suitable for relational user data, operational events, notifications, feedback, and analytics because those rows are small and queryable. Niko completed the Supabase SQL migration for the operations tables in the SQL Editor on 2026-06-10.

## Decision
Vietnamy will keep heavy objects on Cloudflare R2 and use Supabase Postgres as the production operations store for email logs, message events, feedback reports, push events, push subscriptions, and notifications. Vercel Production now hosts the lightweight `/api/*` operations routes needed by the PWA, backed by `OPS_STORE_PROVIDER=supabase`.

## Rationale
Supabase Postgres is enough for the current scale because the storage-heavy audio objects are no longer the database's responsibility. Keeping operational rows in Supabase gives a direct path to Supabase Auth, user profiles, RLS policies, admin views, and analytics rollups without introducing Neon yet. Neon remains a future option because the schema is normal Postgres, but switching databases before identity is implemented would add migration work without solving the immediate product gap.

## Consequences
- Production Supabase migration `supabase/migrations/202606100001_app_ops.sql` has been run successfully.
- `server/opsStore.js` supports both local SQLite and production Supabase via `OPS_STORE_PROVIDER`.
- Vercel Production env now includes Supabase, Resend, public base URL, VAPID, and Azure Speech variables.
- A lightweight Vercel API surface in `api/[...path].js` handles ops/email/notification/message routes without bundling the large dictionary SQLite databases.
- `api/ops.js` plus `vercel.json` rewrites nested `/api/*` paths so routes like `/api/mail/config` and `/api/notifications` work on Vercel.
- Full dictionary/SQLite server code is not bundled into the Vercel function because it creates a ~500 MB output; Vercel ops functions are ~1.7 MB.
- Production smoke test passed after redeploy:
  - `GET /api/mail/config` returns enabled mail config for `Vietnamy <noreply@tecxmate.com>` and `official@tecxmate.com`.
  - `GET /api/notifications?userId=<id>` returns from Supabase.
  - `POST /api/feedback` returns 200 and the row is verified in Supabase `feedback_reports`.
- Smoke feedback rows created during testing should be closed, tagged, or deleted from admin workflows so test data does not pollute real feedback.

## Next Steps
1. Clean up or mark the production smoke feedback rows.
2. Add Supabase Auth to the app.
3. Create/link a profile row on signup/login.
4. Replace anonymous/string `userId` values with `auth.users.id`.
5. Add RLS policies for user-readable tables, starting with notifications, progress, saved words, and review stats.
6. Move local progress/saved-word state into Supabase tables.
7. Add analytics rollups so admin stats do not scan large event tables forever.
8. Add backup/export scripts for Supabase Postgres plus R2 object inventory.

## Provenance
- Discussed on 2026-06-10 between [niko] (owner) and [codex] (agent).
- Implementing commits: `2f186b7`, `fad5d0c`, `9413664`, `b150d7a`, `47a7da9`, `a2eb480`, `c327f5c`.
