---
title: Backend Vendor Migration (Supabase → Neon + R2)
type: topic
slug: backend-vendor-migration
date: 2026-06-11
updated: 2026-06-11
belongs_to: [niko]
source: synthesis
status: active
tags: [backend, supabase, neon, authjs, cloudflare-r2, migration]
related: [backend-ops-store, bucket-storage, tts-pipeline]
---

## Summary
Vietnamy should retire Supabase only after Neon owns relational app data, R2 owns storage, and Auth.js replaces Supabase Auth. The current migration branch `infra/migrate-to-neon-r2` is a scaffold/warm-up path, not a cutover: Supabase remains primary unless explicit env flags switch progress sync, ops storage, or asset uploads.

## Current State
- Supabase remains the production primary for Auth, profile/progress sync, and existing app-owned relational data.
- Neon schema and runtime adapters exist behind flags:
  - `neon/migrations/202606110001_backend_foundation.sql`
  - `DATABASE_URL` / `NEON_DATABASE_URL`
  - `OPS_STORE_PROVIDER=neon`
  - `VITE_CLOUD_SYNC_PROVIDER=api`
  - `VITE_CLOUD_SYNC_DUAL_WRITE=true`
- R2 exists for TTS and can also handle mascot/art uploads:
  - `TTS_STORAGE_PROVIDER=r2`
  - `MASCOT_STORAGE_PROVIDER=r2`
  - `R2_MASCOT_BUCKET=app-assets`
- TTS cache migration is handled by the existing TTS migration script path; do not duplicate that logic in the backend vendor migration.
- Auth.js is scaffolded behind `AUTH_PROVIDER=authjs`, but the client auth flow and API auth verification still need a dedicated implementation pass before Supabase Auth can be retired.

## Test Sequence
1. Switch to the migration branch:
   ```bash
   git switch infra/migrate-to-neon-r2
   npm install
   npm run build
   npm run dev:all
   ```
2. Apply the Neon schema:
   ```bash
   psql "$DATABASE_URL" -f neon/migrations/202606110001_backend_foundation.sql
   ```
   If `psql` is unavailable, paste the SQL into the Neon SQL editor.
3. Baseline safe mode:
   ```env
   AUTH_PROVIDER=supabase
   VITE_CLOUD_SYNC_PROVIDER=supabase
   VITE_CLOUD_SYNC_DUAL_WRITE=false
   OPS_STORE_PROVIDER=sqlite
   MASCOT_STORAGE_PROVIDER=blob
   DATABASE_URL=
   ```
4. Neon warm-up mode:
   ```env
   DATABASE_URL=...
   VITE_CLOUD_SYNC_PROVIDER=supabase
   VITE_CLOUD_SYNC_DUAL_WRITE=true
   ```
   Complete lessons/save words, then verify Neon `profiles`, `user_progress`, and `saved_words`.
5. Neon primary progress sync:
   ```env
   DATABASE_URL=...
   VITE_CLOUD_SYNC_PROVIDER=api
   VITE_CLOUD_SYNC_DUAL_WRITE=false
   ```
   This still authenticates API calls through Supabase bearer tokens during the migration.
6. Neon ops store:
   ```env
   DATABASE_URL=...
   OPS_STORE_PROVIDER=neon
   ```
   Verify feedback, notifications, push events, email logs, and message engagement rows land in Neon.
7. R2 mascot/art uploads:
   ```env
   MASCOT_STORAGE_PROVIDER=r2
   R2_MASCOT_BUCKET=app-assets
   R2_PUBLIC_BASE_URL=https://<public-r2-domain>
   ```

## Retirement Plan
1. Run the Neon foundation schema.
2. Backfill Supabase tables into Neon:
   - `profiles`
   - `user_progress`
   - `saved_words`
   - `email_logs`
   - `message_events`
   - `push_subscriptions`
   - `push_events`
   - `feedback_reports`
   - `notifications`
3. Keep Supabase user UUIDs as Neon text IDs for the first pass. This preserves profile/progress ownership while Supabase Auth is still active.
4. Enable dual-write for progress sync:
   ```env
   VITE_CLOUD_SYNC_PROVIDER=supabase
   VITE_CLOUD_SYNC_DUAL_WRITE=true
   ```
5. Move ops writes to Neon:
   ```env
   OPS_STORE_PROVIDER=neon
   ```
6. Compare Supabase and Neon row counts plus recent-write samples until they match for live traffic.
7. Move progress reads/writes to the API-backed Neon path:
   ```env
   VITE_CLOUD_SYNC_PROVIDER=api
   VITE_CLOUD_SYNC_DUAL_WRITE=false
   ```
8. Complete storage migration:
   - Run the existing TTS cache migration script.
   - Flip `TTS_STORAGE_PROVIDER=r2`.
   - Flip `MASCOT_STORAGE_PROVIDER=r2` when mascot uploads are verified.
9. Implement the Auth.js cutover:
   - Replace `AuthContext.jsx` Supabase login/session calls with Auth.js session endpoints.
   - Change server/API auth verification from Supabase bearer validation to Auth.js session validation.
   - Store Auth.js users/sessions in Neon.
   - Link old Supabase users to Auth.js users by verified email using `supabase_user_migrations`.
10. Re-key user-owned records from Supabase UUID IDs to Auth.js user IDs after account links are established. Use a first-login link path plus a batch job for dormant users.
11. Confirm no runtime Supabase references remain:
    ```bash
    rg "supabase|SUPABASE|VITE_SUPABASE" src server api
    ```
12. Remove Supabase env vars, service-role keys, runtime dependency, and Supabase-specific migrations only after the audit is clean and production has run on Neon/Auth.js/R2 long enough to prove rollback is unnecessary.

## Do Not Retire Supabase Yet
Supabase cannot be retired while any of these are true:
- `AuthContext.jsx` still uses `supabase.auth`.
- API auth still validates Supabase bearer tokens.
- `VITE_CLOUD_SYNC_PROVIDER=supabase` is still production primary.
- Recent writes are not verified in Neon.
- TTS or asset URLs still depend on Supabase Storage.

## Open Questions
- Exact Auth.js adapter/table strategy: use the scaffolded `auth_*` tables directly, add a formal adapter, or adjust table names to the final adapter conventions.
- Whether to re-key progress records immediately on Auth.js first login or keep a durable Supabase-ID alias layer for a longer period.
- How long the dual-write soak period should run before disabling Supabase writes.

## History
- 2026-06-10 — Supabase ops store and identity/progress sync landed as the intermediate backend.
- 2026-06-11 — `infra/migrate-to-neon-r2` added Neon schema/runtime adapters, API sync, R2 mascot upload support, and guarded Auth.js scaffold.
