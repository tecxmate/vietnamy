---
title: Production Readiness and Flutter Handoff
type: topic
slug: production-readiness-flutter-handoff
status: active
owner: niko
related: [vietnamy-app, backend-vendor-migration, backend-ops-store, curriculum-paths, mobile-strategy]
updated: 2026-06-13
---

# Production Readiness and Flutter Handoff

Vietnamy web is now strong on content structure and canonical curriculum
authoring, but it is not yet production-ready at Duolingo-web quality. The main
remaining work is the production backbone: backend-owned user state, admin
publish workflow, cross-platform API contracts, observability, QA, and Flutter
handoff assets.

## Current decision

Do not spend more time building Supabase-only admin/user infrastructure unless it
is hidden behind backend-neutral interfaces. The proprietary backend hosted on
Zeabur should become the long-term source of truth for web and Flutter. Supabase
can remain a temporary web runtime dependency, but new work should prefer
portable API contracts.

## Ship blockers

1. **Backend ownership decision**
   - The proprietary Zeabur backend should own production APIs for auth, profile,
     progress, SRS, saved words, notifications, curriculum publish, and admin
     roles.
   - Avoid new direct web-client dependencies on Supabase tables, RLS policies,
     or Supabase-specific auth behavior.
   - Where Supabase remains temporarily useful, put it behind adapters that can
     be replaced by proprietary backend endpoints.

2. **Unified user and progress model**
   - The current web app still syncs much user state as localStorage-compatible
     blobs.
   - Production needs backend-owned schemas/contracts for:
     - profile
     - lesson progress
     - hearts and streak
     - SRS/review state
     - saved words and decks
     - notification preferences
     - engagement/adaptive message preferences

3. **Admin publish flow**
   - Current curriculum admin is canonical and portable, but still local-first
     with import/export.
   - Production flow should support:
     - save draft
     - validate draft
     - publish
     - rollback
     - version history
     - preview as learner
     - role-gated admin access
   - Use `docs/architecture/CURRICULUM_DRAFT_API.md` as the backend-neutral
     starting contract, not a Supabase-specific table design.

4. **Full module unification**
   - Lesson/vocabulary content is canonical-first.
   - Grammar units, pronunciation drills, scenes, articles, mascot scripts, and
     tone data still have specialized editors/data contracts.
   - Flutter handoff needs either one shared base module contract or clearly
     documented separate contracts for each module type.

5. **End-to-end QA**
   - Build/content validation is necessary but insufficient.
   - Add reproducible flows for:
     - onboarding
     - first lesson
     - lesson completion
     - roadmap unlock
     - SRS review
     - saved words/decks
     - notification click/adaptation
     - admin import/export/publish

## Duolingo-level production gaps

- Performance: code splitting and bundle-size cleanup; current builds still
  produce large chunk warnings.
- Observability: Sentry or equivalent error tracking, structured backend logs,
  product events, funnel metrics, notification click metrics.
- Notification controls: user consent, reminder preferences, unsubscribe/opt-out
  semantics, and clear privacy boundaries for adaptive messaging.
- Security: admin authorization, rate limiting, audit logs, backend validation,
  and abuse protection.
- Privacy/account lifecycle: account deletion, data export, retention policy,
  and production privacy workflow.
- Reliability: curriculum/user-progress backup and restore plan, published
  content rollback, and disaster recovery runbook.
- Product polish: consistent empty, loading, offline, retry, and error states
  across all learning/admin surfaces.

## Flutter handoff package

The Flutter team should receive these artifacts before implementing parity:

- OpenAPI spec for proprietary backend endpoints.
- JSON schemas for curriculum, profile, progress, SRS, saved words/decks,
  notifications, and admin draft/publish payloads. The user-state schema now
  lives at `docs/schemas/user-state.schema.json`.
- `docs/architecture/CURRICULUM_DRAFT_API.md` plus example draft/publish payloads.
- `docs/architecture/USER_STATE_API.md` plus `docs/fixtures/user-state-sample.json`
  for profile/progress/SRS/saved-word handoff.
- Sample learner fixtures covering a new user, mid-course user, due-review user,
  saved-word/deck user, and notification-preference variants.
- Content bundle exports: curriculum, drills, grammar, scenes, articles, tone
  data, and mascot scripts.
- Roadmap unlock/progress state-machine documentation.
- TTS/audio contract including cache URL format, voice identifiers, fallback
  behavior, and pronunciation-assessment payloads.
- Design tokens, icon/assets list, and screen-state checklist.
- Cross-platform QA checklist that web and Flutter can run against the same
  fixtures.

## Handoff status

The backend-neutral **user/progress/SRS/saved-words API and schema handoff** was
created on 2026-06-13. It gives the Zeabur backend and Flutter team a typed
envelope, endpoints, conflict semantics, migration map from current web
localStorage keys, and a sample learner fixture. The next practical step is to
turn `docs/architecture/USER_STATE_API.md` into an OpenAPI document once the
backend framework/router conventions are known.
