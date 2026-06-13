# Backend-Neutral Curriculum Draft API

This contract is for the proprietary backend that will serve both the web admin
and the Flutter app. It intentionally does not depend on Supabase tables, RLS,
or client SDK behavior.

The web implementation keeps local draft storage today, but all import/export
and future API sync payloads use the same envelope.

## Goals

- Keep `content/curriculum.json` as the canonical data shape.
- Let any backend store drafts in Postgres, SQLite, object storage, or another
  internal model without changing the web or Flutter clients.
- Keep admin cloud work portable while the Flutter backend is being built on
  Zeabur.
- Avoid direct client coupling to Supabase-specific auth, tables, or row shapes.

## Canonical Draft Envelope

```jsonc
{
  "kind": "vnme_canonical_curriculum_draft",
  "apiVersion": 1,
  "draftId": "default",
  "state": "draft",
  "schemaVersion": "1.0.0",
  "revision": "42",
  "baseRevision": "41",
  "updatedAt": "2026-06-13T12:00:00.000Z",
  "author": {
    "id": "user_123",
    "name": "Niko",
    "email": "niko@example.com"
  },
  "counts": {
    "units": 39,
    "lessons": 140,
    "words": 1001,
    "sentences": 479,
    "conversations": 132,
    "grammarTags": 139
  },
  "curriculum": {
    "meta": {},
    "units": [],
    "lessons": [],
    "words": [],
    "sentences": [],
    "conversations": [],
    "grammarTags": []
  }
}
```

`curriculum` is the same normalized camelCase contract as
`content/curriculum.json`. Runtime tables such as `items`, `translations`,
`lesson_blueprints`, or roadmap nodes are derived client/server artifacts and
should not be edited as source data.

## Endpoints

All endpoints are examples under `/api`. A hosted backend can expose the same
paths on another domain and the web app can point to it with
`VITE_CURRICULUM_API_BASE_URL`.

### `GET /api/admin/curriculum-draft`

Returns the current editable draft envelope.

Response:

```json
{
  "kind": "vnme_canonical_curriculum_draft",
  "apiVersion": 1,
  "draftId": "default",
  "state": "draft",
  "revision": "42",
  "baseRevision": "41",
  "updatedAt": "2026-06-13T12:00:00.000Z",
  "author": null,
  "counts": {},
  "curriculum": {}
}
```

### `PUT /api/admin/curriculum-draft`

Validates and stores a draft. The backend should reject invalid curriculum
references and stale revisions.

Request body: canonical draft envelope.

Recommended responses:

- `200` with the saved envelope and next `revision`.
- `400` for schema/validation errors.
- `409` when `baseRevision` is stale.
- `401`/`403` for unauthorized admin writes.

### `POST /api/admin/curriculum-publish`

Validates a draft and promotes it to the current published curriculum.

Request body: canonical draft envelope, usually with `state: "published"`.

Recommended response:

```json
{
  "ok": true,
  "publishedRevision": "43",
  "publishedAt": "2026-06-13T12:05:00.000Z",
  "curriculumUrl": "/api/curriculum/current"
}
```

### `GET /api/curriculum/current`

Returns the published curriculum for learners. This may return either the full
draft envelope with `state: "published"` or just the raw canonical curriculum.
Clients must accept both.

## Client Integration

The web app has a backend-neutral adapter in:

- `src/lib/content/curriculumDraftContract.js`
- `src/lib/content/curriculumDraftApi.js`

The adapter uses:

- `VITE_CURRICULUM_API_BASE_URL` for a remote backend origin.
- `VITE_CURRICULUM_API_PREFIX` to replace `/api` if needed.
- `VITE_CURRICULUM_API_ENABLED=true` to allow same-origin draft API calls.

The adapter accepts a generic bearer token. It does not import Supabase and does
not assume how the proprietary backend authenticates admins.

## Migration Guidance

- Keep local import/export active until the proprietary backend is ready.
- Store the canonical envelope as JSON initially if that is fastest.
- Add normalized backend tables only where they help admin queries or publishing
  workflows.
- Keep `revision`/`baseRevision` even if the first backend uses simple integer
  revisions. That gives the web and Flutter clients a stable conflict model.
- Do not expose Supabase table names or Auth-specific IDs in this API contract.
