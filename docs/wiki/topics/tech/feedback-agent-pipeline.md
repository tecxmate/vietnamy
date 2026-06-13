---
title: Feedback Agent Pipeline
type: topic
slug: feedback-agent-pipeline
date: 2026-06-14
updated: 2026-06-14
belongs_to: [niko]
source: implementation
status: active
tags: [feedback, bugs, ai-agents, ops-store, approval]
related: [backend-ops-store, adaptive-software-automation]
---

## Summary
Vietnamy bug reports flow into the existing operations store and can now be picked up by coding agents through an approval-gated lifecycle. Agents may claim, investigate, patch, test, and prepare a PR, but merge/deploy remains a Niko approval step.

## Storage
- Local development: `OPS_STORE_PROVIDER=sqlite` writes to `server/databases/app_ops.db`.
- Cloud operations: `OPS_STORE_PROVIDER=supabase` or `OPS_STORE_PROVIDER=neon` writes to the configured `feedback_reports` table.
- The in-app report modal posts to `POST /api/feedback`.
- Screenshot capture is currently disabled for client performance; reports still include URL/path, viewport, app title, trigger source, button position, active element summary, device metadata, and compact client logs.

## Lifecycle
Feedback rows use the existing `status` field:
- `open` — submitted and waiting.
- `triaged` — reviewed and understood, but not yet assigned.
- `claimed` — a coding agent is investigating.
- `fixed_pending_approval` — fix is prepared and waiting for Niko review.
- `closed` — approved/merged/resolved.
- `not_reproducible` — investigated but not confirmed.
- `wont_fix` — intentionally declined.

Agent notes are appended to `metadata.agentEvents` with actor, note, branch, commit, PR URL, timestamp, and `approvalRequired`.

## Commands
Local queue from the configured ops store:

```bash
npm run feedback:queue
```

Force the local SQLite fallback even when `.env.local` points at Supabase/Neon:

```bash
npm run feedback:queue -- --provider sqlite
```

Export a local markdown handoff:

```bash
npm run feedback:queue -- --status open --out .feedback-agent/queue.md
```

Read from cloud through the admin API:

```bash
npm run feedback:queue -- --api https://vnme-web.vercel.app --token "$MAIL_ADMIN_TOKEN"
```

Claim a report:

```bash
npm run feedback:claim -- --id <feedback-id> --actor codex --branch fix/<short-name>
```

Mark a prepared fix as waiting for approval:

```bash
npm run feedback:pending-approval -- --id <feedback-id> --actor codex --branch <branch> --commit <sha> --prUrl <url> --note "Fix prepared and checks pass."
```

Close only after explicit approval:

```bash
npm run feedback:mark -- --id <feedback-id> --status closed --actor niko --note "Approved and merged."
```

## Admin API
The server and Vercel API both expose:

- `GET /api/admin/feedback?status=open&limit=50`
- `PATCH /api/admin/feedback/:id`

Admin routes require `MAIL_ADMIN_TOKEN` via `Authorization: Bearer <token>`. Local development may allow localhost access when `MAIL_ADMIN_ALLOW_LOCAL=true` and no token is set.

## Approval Rule
Agents must not silently close, merge, or deploy fixes from bug reports. The correct automated stopping point is `fixed_pending_approval` plus a branch/commit/PR reference. Niko approves or rejects the final change.
