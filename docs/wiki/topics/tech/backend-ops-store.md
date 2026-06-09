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
Vietnamy now uses Supabase Postgres as the production operations store while keeping local SQLite as the development fallback. Heavy objects belong in Cloudflare R2, not Supabase. Identity now uses Supabase Auth user IDs for owned progress/profile records, with RLS policies guarding authenticated client access.

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

The migration `supabase/migrations/202606100002_identity_progress.sql` adds:
- `profiles` — one row per `auth.users.id`.
- `user_progress` — JSON local-cache snapshot keyed by `auth.users.id`.
- `saved_words` — normalized saved lesson/dictionary word IDs keyed by `auth.users.id`.

RLS policies allow authenticated users to select/update only their own profile, progress, saved words, and notification rows. The public notification API also verifies the caller's Supabase JWT and derives `recipientId` from that token instead of trusting a query/body `userId`.

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
- Should notification reads eventually move from the server API to direct Supabase client reads now that RLS exists?
- Which progress state should get first-class relational tables next: SRS review records, lesson completion, streaks, or decks?
- Where should daily analytics rollups run: Vercel cron, Supabase scheduled jobs, or GitHub Actions?

## Next Implementation Sequence
1. Apply `supabase/migrations/202606100002_identity_progress.sql` in Supabase before deploying the auth-sync client.
2. Test Google login on production and verify a `profiles` row, `user_progress` row, and `saved_words` rows are created under the same `auth.users.id`.
3. Add authenticated client helpers for notification list/read actions.
4. Decide whether SRS, lesson completion, streaks, and decks remain in `user_progress.data` for MVP or get separate tables before launch.
5. Add admin-only rollups for message engagement, push stats, feedback stats, and email stats.
6. Add Supabase Postgres backup/export and R2 inventory backup.

## History
- 2026-06-10 — Supabase ops store and Vercel API cutover ([decision](../../decisions/2026-06-10-supabase-ops-store-vercel-api.md)).
- 2026-06-10 — Added Supabase Auth profile/progress/saved-word migration and client sync path.
