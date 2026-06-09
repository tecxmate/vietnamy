# Backend Scaling Plan

Vietnamy should scale as a Postgres-backed app with heavy objects kept out of the database.

## Target Split

- Cloudflare R2: TTS audio, generated media, screenshots, uploads, backups of object assets.
- Supabase Postgres: accounts, learner profiles, SRS/progress, operational logs, notifications, feedback, campaign/message analytics, billing state.
- Express server: service-role API layer, TTS generation/cache routing, admin actions, message sending, push fan-out.
- Future analytics warehouse: only if raw interaction volume grows beyond what Postgres retention/rollups should handle.

## Current Bridge

`server/opsStore.js` writes operational data to `server/databases/app_ops.db` so the app has a coherent durable store before the full Supabase cutover.

The matching Supabase schema is:

`supabase/migrations/202606100001_app_ops.sql`

Export current local ops data to Postgres insert SQL:

```bash
npm run ops:export:postgres -- --out /tmp/vietnamy-app-ops-export.sql
```

Apply in Supabase:

1. Open Supabase Dashboard.
2. Select the Vietnamy project.
3. Go to SQL Editor.
4. Run `supabase/migrations/202606100001_app_ops.sql`.
5. Run the generated `/tmp/vietnamy-app-ops-export.sql` if you want to preserve local ops test/prototype data.

## Retention Policy

Keep forever:

- user profile
- SRS card state
- lesson/node completion
- billing state
- notification preferences
- aggregate campaign stats

Keep raw for 30-90 days:

- message_events
- push_events
- email_logs
- client error logs
- fine-grained exercise attempts

Roll up daily:

- active learners
- lessons completed
- words reviewed
- streak outcomes
- TTS request/cache-hit counts
- message sent/open/click/dismiss counts
- feedback counts by kind/severity/status

## Why Supabase First

Supabase is a good fit because Vietnamy needs more than a database:

- Auth and password reset
- Row Level Security
- dashboard inspection
- service role operations from Express
- Realtime later for notifications/admin views
- ordinary Postgres portability if Neon becomes preferable later

Neon remains a viable future option because the schema is normal Postgres. Avoid Supabase-only features in the core data model unless they remove meaningful work.

## Next Implementation Steps

1. Add Supabase service-role connection to the Express server behind `OPS_STORE_PROVIDER=supabase`.
2. Keep SQLite fallback for local dev and emergency rollback.
3. Move auth/account creation to Supabase Auth.
4. Replace anonymous `userId` strings with Supabase `auth.users.id`.
5. Add RLS policies for direct client reads where appropriate, starting with notifications and profile/progress.
6. Add daily rollup jobs for analytics tables.
7. Add backup script for Supabase Postgres plus R2 object inventory.
