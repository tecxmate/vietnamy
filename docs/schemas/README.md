# Backend Handoff Schemas

Machine-readable schemas for backend-neutral API handoff payloads. These are
separate from the content schemas in `/schema` so content drift validation does
not treat user/account fields as curriculum fields.

| File | Validates |
|---|---|
| `user-state.schema.json` | Backend-neutral learner profile/progress/SRS/saved-word envelope |
