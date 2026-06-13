# Backend-Neutral User State API

This is the production handoff contract for learner-owned data shared by the web
app, Flutter app, and proprietary backend. It is intentionally independent of
Supabase table names, RLS policies, or localStorage keys.

Current web implementation detail: `src/lib/syncProgress.js` still syncs a
localStorage-compatible blob through Supabase/Neon paths. Treat that as a
temporary compatibility layer. New backend and Flutter work should target this
typed API contract.

## Goals

- Give web and Flutter one account-owned learner state model.
- Move profile, progress, SRS, saved words, and notification preferences behind
  proprietary backend endpoints.
- Preserve enough revision metadata for safe multi-device sync.
- Keep old web localStorage keys mappable during migration.
- Avoid backend decisions that force Flutter to mimic React implementation
  details.

## Schema

Machine-readable schema:

- `docs/schemas/user-state.schema.json`

Sample payload:

- `docs/fixtures/user-state-sample.json`

Top-level envelope:

```jsonc
{
  "kind": "vnme_user_state",
  "apiVersion": 1,
  "userId": "user_demo_001",
  "revision": "12",
  "baseRevision": "11",
  "updatedAt": "2026-06-13T12:00:00.000Z",
  "deviceId": "web_demo_device",
  "profile": {},
  "progress": {},
  "srs": {},
  "wordGrades": {},
  "savedWords": {},
  "notificationPreferences": {},
  "clientState": {}
}
```

`revision` is backend-assigned. Clients send `baseRevision` when writing. The
backend returns `409 Conflict` if the client writes over a newer revision without
first merging.

## Resource Model

The backend may store this in normalized tables, JSON columns, object storage, or
any internal layout. The API boundary should expose these resource groups:

| Resource | Purpose |
|---|---|
| `profile` | Display identity plus learning preferences. |
| `progress` | Completed roadmap nodes, session counts, hearts, streak, last activity. |
| `srs` | Review queue and interval state. |
| `wordGrades` | Per-word skill-dimension counters. |
| `savedWords` | Saved lesson/dictionary words and decks. |
| `notificationPreferences` | Push/reminder/adaptive-message preferences. |

`clientState` is a temporary compatibility bag for fields that are not yet worth
promoting into typed backend resources. It should shrink over time.

## Endpoints

All endpoints are written under `/api`. A Zeabur backend can expose the same
paths on another origin; clients should configure the origin, not change the
payload contract.

### `GET /api/me/state`

Returns the complete `vnme_user_state` envelope. This is the recommended app
bootstrap endpoint for web and Flutter.

Response:

```json
{
  "kind": "vnme_user_state",
  "apiVersion": 1,
  "userId": "user_demo_001",
  "revision": "12",
  "updatedAt": "2026-06-13T12:00:00.000Z",
  "profile": {},
  "progress": {},
  "srs": {},
  "wordGrades": {},
  "savedWords": {},
  "notificationPreferences": {}
}
```

### `PUT /api/me/state`

Replaces the full user state after validation. Use sparingly, usually for first
migration from web localStorage or for restore/import.

Request body: full `vnme_user_state` envelope.

Recommended responses:

- `200` with saved envelope and next `revision`.
- `400` for schema validation errors.
- `409` if `baseRevision` is stale.
- `401`/`403` for auth/admin failures.

### `PATCH /api/me/profile`

Partial update for profile/preferences.

```json
{
  "baseRevision": "12",
  "profile": {
    "name": "An",
    "nativeLang": "en",
    "dialect": "south",
    "learnerMode": "explore_vietnam",
    "dailyMins": 10
  }
}
```

### `PATCH /api/me/progress`

Partial update for roadmap progress, hearts, streak, and last activity.

```json
{
  "baseRevision": "12",
  "progress": {
    "completedNodes": {
      "explore_vietnam": ["p1_L001", "p1_L002"]
    },
    "nodeSessionCounts": {
      "explore_vietnam": {
        "p1_L001": 4,
        "p1_L002": 2
      }
    },
    "hearts": 5,
    "streak": {
      "count": 7,
      "best": 12,
      "lastActiveDate": "2026-06-13",
      "moments": {}
    }
  }
}
```

### `POST /api/me/lesson-completions`

Idempotent event endpoint for completing a lesson/session. Prefer this for
normal learning flow because the backend can update progress, SRS, grades,
streak, rewards, and analytics atomically.

```json
{
  "idempotencyKey": "web_demo_device:lesson_002:2026-06-13T11:58:00.000Z",
  "baseRevision": "12",
  "lessonId": "lesson_002",
  "nodeId": "p1_L002",
  "learnerMode": "explore_vietnam",
  "sessionsCompleted": 1,
  "sessionsRequired": 4,
  "score": {
    "correct": 8,
    "total": 10,
    "accuracy": 0.8
  },
  "introducedItemIds": ["w_xin_chao"],
  "testedItemIds": ["w_xin_chao"],
  "completedAt": "2026-06-13T11:58:00.000Z"
}
```

Recommended response:

```json
{
  "ok": true,
  "revision": "13",
  "statePatch": {
    "progress": {},
    "srs": {},
    "wordGrades": {}
  }
}
```

### `GET /api/me/srs`

Returns the SRS state only.

### `POST /api/me/srs/reviews`

Records one or more review results. The backend should apply the
`vnme-fixed-interval-v1` algorithm unless a future API version changes it.

```json
{
  "baseRevision": "13",
  "reviews": [
    {
      "itemId": "w_xin_chao",
      "correct": true,
      "reviewedAt": "2026-06-13T12:01:00.000Z"
    }
  ]
}
```

### `GET /api/me/saved-words`

Returns `savedWords`.

### `PUT /api/me/saved-words`

Replaces saved words and decks as one resource.

```json
{
  "baseRevision": "13",
  "savedWords": {
    "lessonWordIds": ["w_xin_chao"],
    "dictionaryWordIds": ["pho"],
    "lessonDecks": [],
    "dictionaryDecks": []
  }
}
```

### `PATCH /api/me/notification-preferences`

Partial update for push/reminder/adaptive-message preferences.

```json
{
  "baseRevision": "13",
  "notificationPreferences": {
    "pushEnabled": true,
    "dailyReminderEnabled": true,
    "dailyReminderTimeLocal": "19:30",
    "adaptiveMessagesEnabled": true
  }
}
```

## Conflict and Offline Semantics

- Every write should include `baseRevision` when the client has one.
- Backend returns the next `revision` after every accepted write.
- Use `409 Conflict` when `baseRevision` is stale and the backend cannot safely
  merge.
- Use `idempotencyKey` for event endpoints such as lesson completion and SRS
  review submissions.
- Clients may queue events offline, then replay them in original order.
- For direct resource replacement endpoints, prefer read-merge-write after a
  `409`.

## Migration From Current Web Keys

| Current web key | Production field |
|---|---|
| `vnme_user_profile` | `profile` |
| `vnme_app_language` | `profile.uiLanguage` |
| `vnme_onboarding_completed` | `profile.onboardingCompleted` |
| `vnme_tutorial_completed` | `profile.tutorialCompleted` |
| `vietnamy_progress` | `progress.completedNodes`, `progress.nodeSessionCounts` |
| `vnme_hearts` | `progress.hearts` |
| `vnme_streak` | `progress.streak` |
| `vnme_srs` | `srs.cards` |
| `vnme_word_grades` | `wordGrades` |
| `vnme_saved_words` | `savedWords.lessonWordIds` |
| `vnme_custom_decks` | `savedWords.lessonDecks` |
| `vnme_dict_saved_words` | `savedWords.dictionaryWordIds` |
| `vnme_dict_decks` | `savedWords.dictionaryDecks` |
| `vnme_settings` | `clientState.vnme_settings` until promoted |
| `vietnamy_dong` | legacy read-only migration source only |

The Flutter app should not implement localStorage key names. It should consume
the typed fields above.

## Backend Validation Rules

- `userId` must come from the authenticated session, not the request body, unless
  an admin service endpoint is explicitly being used.
- Validate node IDs, lesson IDs, and item IDs against the published curriculum
  version.
- Reject impossible counts such as negative session counts, hearts over max, or
  SRS interval indexes outside the algorithm range.
- Keep `updatedAt` server-owned for accepted writes.
- Store enough audit metadata to debug multi-device conflicts: previous revision,
  device ID, user agent/app version, and idempotency key where available.

## First Implementation Recommendation

For the Zeabur backend, the fastest portable implementation is:

1. Store the complete `vnme_user_state` envelope as JSON per user.
2. Add indexes/tables only for data that needs queryability: user profile,
   notifications, SRS due count, and saved words.
3. Implement `GET /api/me/state`, `PUT /api/me/state`,
   `POST /api/me/lesson-completions`, and `POST /api/me/srs/reviews` first.
4. Keep per-resource `PATCH` endpoints as thin read-merge-write helpers.
5. Once Flutter and web both pass the same fixture tests, optimize storage
   internals without changing this API.
