---
title: Backend Ops Store and Identity Migration
type: topic
slug: backend-ops-store
date: 2026-06-10
updated: 2026-06-10
belongs_to: [niko]
source: synthesis
status: active
tags: [backend, supabase, vercel, auth, notifications, email, analytics]
related: [vietnamy-app, bucket-storage, 2026-06-10-supabase-ops-store-vercel-api]
---

## Summary
Vietnamy now uses Supabase Postgres as the production operations store while keeping local SQLite as the development fallback. Heavy objects belong in Cloudflare R2, not Supabase. The next backend milestone is identity: move from anonymous/string `userId` values to Supabase Auth user IDs, then add RLS and sync user progress into Postgres.

## Current State

### Storage split
- Heavy audio/media objects: Cloudflare R2 path.
- Small relational app data: Supabase Postgres.
- Local/dev fallback: `server/databases/app_ops.db` through `better-sqlite3`.

### Supabase tables
The migration `supabase/migrations/202606100001_app_ops.sql` creates:
- `email_logs`
- `message_events`
- `push_subscriptions`
- `push_events`
- `feedback_reports`
- `notifications`

RLS is enabled on all six tables. Direct client policies are intentionally not opened yet; the server uses the Supabase service-role key.

### Runtime code
- `server/opsStore.js` chooses storage with `OPS_STORE_PROVIDER`.
- `OPS_STORE_PROVIDER=sqlite` uses local SQLite.
- `OPS_STORE_PROVIDER=supabase` uses Supabase via `SUPABASE_URL`/`VITE_SUPABASE_URL` plus `SUPABASE_SERVICE_ROLE_KEY`.
- `server/mail.js`, `server/engagementOptimizer.js`, and the API routes are async because Supabase writes/reads are remote.
- `scripts/export-app-ops-postgres.mjs` exports local SQLite ops data as Postgres insert SQL when preservation is needed.

### Production hosting
Production API ops routes are on Vercel, not the full dictionary Express process:
- `api/[...path].js` implements the lightweight ops/email/notification/message API.
- `api/ops.js` rewrites nested `/api/*` requests back to their original path.
- `vercel.json` preserves `api/mascot-upload` and rewrites nested ops routes to `api/ops`.

Important lesson: importing `server/server.js` into a Vercel function bundled `server/databases/*` and produced a ~519 MB function. The lightweight API bundle is ~1.7 MB and deploys successfully.

### Production env vars
Vercel Production must have non-empty values for:
- `OPS_STORE_PROVIDER=supabase`
- `VITE_SUPABASE_URL`
- `SUPABASE_URL` (set to the real Supabase project URL, not the placeholder)
- `SUPABASE_SERVICE_ROLE_KEY`
- `VITE_SUPABASE_ANON_KEY`
- `RESEND_API_KEY`
- `EMAIL_FROM`
- `SUPPORT_EMAIL`
- `PUBLIC_BASE_URL`
- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT`
- `AZURE_SPEECH_KEY`
- `AZURE_SPEECH_REGION`

Do not expose `SUPABASE_SERVICE_ROLE_KEY` to client code. Keep it in server/deployment env only.

### Verified Production Smoke
On 2026-06-10, after redeploying `https://vnme-web.vercel.app`:
- `GET /api/mail/config` returned enabled mail config:
  - from: `Vietnamy <noreply@tecxmate.com>`
  - support: `official@tecxmate.com`
- `GET /api/notifications?userId=<smoke-id>` returned `{ notifications: [], unreadCount: 0 }`.
- `POST /api/feedback` returned 200.
- The new feedback row was verified in Supabase `feedback_reports`.

## Open Questions
- Should smoke feedback rows be hard-deleted or marked with a test status/metadata?
- Which user table should become canonical: direct `auth.users` references only, or an app-owned `profiles` table with one row per `auth.users.id`?
- Should notification reads be served directly from Supabase with client RLS after auth, or continue through the server API?
- Which progress state should migrate first: saved words, SRS review records, lesson completion, or streaks?
- Where should daily analytics rollups run: Vercel cron, Supabase scheduled jobs, or GitHub Actions?

## Next Implementation Sequence
1. Clean up smoke feedback rows.
2. Add Supabase Auth UI and session provider.
3. Add `profiles` table and profile creation on signup/login.
4. Replace anonymous/string IDs with `auth.users.id`.
5. Create progress tables for saved words, lesson completion, SRS reviews, streaks, and notification preferences.
6. Add RLS policies for user-owned rows.
7. Migrate local progress to Supabase on first login.
8. Add admin-only rollups for message engagement, push stats, feedback stats, and email stats.
9. Add Supabase Postgres backup/export and R2 inventory backup.

## History
- 2026-06-10 — Supabase ops store and Vercel API cutover ([decision](../../decisions/2026-06-10-supabase-ops-store-vercel-api.md)).
