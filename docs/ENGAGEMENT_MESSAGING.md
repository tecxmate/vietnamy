# Engagement Messaging System

Vietnamy now has one message catalog for email, push, and in-app notifications. The intent is to avoid three separate copy systems drifting apart.

## Reference Pattern

Tecxwork uses a useful PWA pattern: a durable in-app notification row is created first, then web push fans out to the user device subscriptions. Email is kept for account/security, reliable reach, and high-value reminders. Vietnamy should follow the same split:

- In-app: durable product state and user history.
- Push: timely habit nudges and short confirmations.
- Email: account/security, weekly digests, research campaigns, prototype/demo invitations, billing, and fallback when push is unavailable.

Duolingo-style notification optimization should be treated as an inspiration, not as a copy target. The core idea is to test message variants, learn which variant gets opens/clicks, and keep some exploration so the system does not get stuck on stale copy.

## Current Backend Files

- `server/engagementMessages.js` contains the canonical scenario catalog and renderers.
- `server/engagementOptimizer.js` records message events and selects variants with a lightweight explore/exploit strategy.
- `server/server.js` exposes admin render/send/stats endpoints.
- Runtime message events are stored in `server/databases/message_events.json` and ignored by git.
- Push subscriptions/events are stored in `server/databases/push_notifications.json` and ignored by git.
- Prototype feedback reports are stored in `server/databases/feedback_reports.json` and ignored by git.

## Scenario Groups

The catalog currently covers:

- Account: welcome, verification, password reset, security login.
- Learning: first lesson, daily review, streak save, streak milestone, weekly progress, lesson complete, unit unlock, pronunciation, tone trainer, grammar review.
- Lifecycle: 2-day inactivity, 7-day pause/reminder check, 30-day winback.
- Research and campaigns: feedback form invite, prototype update plan, demo invite.
- Product: product update, maintenance notice.
- Billing/SaaS: trial started, trial ending, payment failed, receipt.
- Support/community: support received, community invite.

## Admin Endpoints

All admin endpoints require `Authorization: Bearer <MAIL_ADMIN_TOKEN>`.

- `GET /api/messages/scenarios` lists scenario metadata and variant counts.
- `GET /api/messages/stats` returns selected/sent/opened/clicked/dismissed stats by variant.
- `POST /api/messages/render` renders one scenario/channel without sending.
- `POST /api/messages/send-email` renders, tracks, and sends one scenario email.
- `POST /api/push/send` sends a push notification. It still accepts legacy `templateId` values, but also accepts `scenarioId`, `variantId`, `context`, and `userId`. When `scenarioId` is present, the push body is rendered from the shared catalog and tracked in the engagement optimizer.
- `GET /api/push/stats` returns push send/click/open stats by template/scenario.
- `POST /api/feedback` stores structured beta feedback with page, viewport, app version, optional screenshot URL, and compact client logs.
- `GET /api/admin/feedback` lists feedback reports and summary counts.

Public tracking endpoints:

- `GET /api/messages/open` records a best-effort email open pixel.
- `GET /api/messages/click` records a click and redirects to the target URL.
- `POST /api/messages/events` records frontend events such as push clicked, in-app dismissed, or notification opened.
- `POST /api/push/events` records push clicks/app-opens and forwards matching scenario events to the same optimizer.

## Unlimited Email Quota Test Window

This month is a good time to test higher-volume research and product-update messages, while keeping the system disciplined for later quota limits. Best campaigns to run now:

1. `demo_invite` to waitlist users and early leads.
2. `prototype_update_plan` with product plan details and demo links.
3. `feedback_form_invite` with forms asking learners what they want next.
4. `weekly_progress` for active users to test digest value.
5. `winback_30d` for inactive users with a concrete new-feature reason.

Avoid using unlimited quota as a reason to ignore fatigue. Keep cooldowns and track clicks/dismissals now so the system learns before quotas matter again.

## Example Send

```bash
curl -X POST https://vietnamy.tecxmate.com/api/messages/send-email \
  -H "Authorization: Bearer $MAIL_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "scenarioId": "prototype_update_plan",
    "to": "learner@example.com",
    "context": {
      "name": "Learner",
      "updateTitle": "New Vietnamy demo",
      "summary": "We improved onboarding, pronunciation practice, and review flow.",
      "demoUrl": "https://vietnamy.tecxmate.com",
      "formUrl": "https://forms.example.com/vietnamy-feedback"
    }
  }'
```

## Example Push Send

```bash
curl -X POST https://vietnamy.tecxmate.com/api/push/send \
  -H "Content-Type: application/json" \
  -d '{
    "scenarioId": "daily_review_due",
    "userId": "learner@example.com",
    "context": {
      "name": "Learner",
      "reviewCount": "12"
    }
  }'
```

Legacy callers can still send:

```bash
curl -X POST https://vietnamy.tecxmate.com/api/push/send \
  -H "Content-Type: application/json" \
  -d '{ "templateId": "daily_review" }'
```

## Example Feedback Report

```bash
curl -X POST https://vietnamy.tecxmate.com/api/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "kind": "bug",
    "severity": "high",
    "subject": "Bottom button is cut off",
    "body": "The Continue button is clipped in installed PWA mode.",
    "pathname": "/practice/alphabet",
    "viewport": "393x852",
    "screenshotUrl": "https://example.com/screenshot.png"
  }'
```

## Optimization Notes

The current optimizer is intentionally simple:

- Every selected/rendered/sent/opened/clicked event is logged.
- Variant score favors clicks, then opens, and penalizes dismissals/failures.
- `MESSAGE_EXPLORATION_RATE` defaults to `0.2`, so 20% of selections explore other variants.

Next production step: move `message_events.json`, `push_notifications.json`, `feedback_reports.json`, and `email_logs.json` into Supabase/Postgres or another durable store before sending campaigns at scale across multiple server instances.
