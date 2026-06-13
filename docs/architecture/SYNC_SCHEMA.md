# Account & Sync Contract

The contract the **mobile team** builds against so the Learn app, the Dictionary
app, and the web app all share one account and one synced state. It is the
account-layer companion to `docs/CONTENT_SCHEMA.md` (which covers *content*).

The reference implementation lives in `src/lib/syncProgress.js`,
`src/lib/supabase.js`, and `src/context/AuthContext.jsx`. This document is the
stable contract; the web code is one consumer of it.

---

## 1. Identity (auth)

- **Provider:** Supabase Auth, Google OAuth (`supabase.auth.signInWithOAuth({ provider: 'google' })`).
- **Client config:** `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` env vars. If absent, the web app falls back to a local-dev mock user (`{ id: 'local-dev' }`) and never syncs. Mobile apps should require real config.
- **The account key is `auth.user.id`**. In Supabase this is a UUID; in the Neon/API mirror it is stored as text so the same value can survive the backend migration.
- All three apps (web Learn, web Dictionary, mobile Learn, mobile Dictionary) authenticate as the **same Supabase user** → they read and write the same row.

---

## 2. Storage table

The current sync model has a typed profile row, a raw progress blob, and a
normalized saved-word index:

```
table: profiles
  id                    text/uuid primary key   -- = auth.user.id
  email                 text
  full_name             text
  avatar_url            text
  ui_language           text
  dialect               text
  onboarding_completed  boolean
  updated_at            timestamptz

table: user_progress
  user_id     text/uuid primary key      -- = auth.user.id
  data        jsonb                      -- the synced localStorage blob (see §3)
  updated_at  timestamptz

table: saved_words
  user_id     text/uuid                  -- = auth.user.id
  word_id     text
  source      text                       -- lesson | dictionary
  metadata    jsonb
  updated_at  timestamptz
  primary key (user_id, word_id, source)
```

- **Row Level Security (required):** a user may only read/write their own row —
  `using (user_id = auth.uid())` for user-owned tables.
- **`data` shape:** a flat object whose keys are the namespaced keys in §3 and
  whose values are **strings** — each value is the already-JSON-stringified
  localStorage payload. A consumer must `JSON.parse` each value to use it.
- **Profile shape:** `profiles` intentionally stores only the identity/display
  subset. The full learning profile (`goal`, `level`, `dailyMins`,
  `learnerMode`, dictionary language preferences, etc.) lives in the synced
  `vnme_user_profile` blob.
- **Saved-word shape:** `saved_words` is the normalized cross-device index of
  saved word IDs. Deck membership still lives in `vnme_custom_decks` and
  `vnme_dict_decks` inside the blob.

```jsonc
// user_progress.data
{
  "vnme_user_profile": "{\"name\":\"An\",\"nativeLang\":\"en\",\"level\":\"A1\"}",
  "vnme_srs":          "{\"it_w_0001\":{\"interval\":3,\"ease\":2.5,...}}",
  "vietnamy_progress": "{\"completedNodes\":{\"explore_vietnam\":[\"p1_L001\"]},...}",
  "vnme_hearts":       "5",
  "vnme_streak":       "{\"count\":7,\"lastActiveDate\":\"2026-06-13\",...}",
  "vnme_dict_saved_words": "[\"w_0001\",\"w_0002\"]"
  // ... every present key from §3
}
```

---

## 3. Synced keys

Each key is an independent slice of state. **Owner** indicates which experience
primarily writes it; **shared** keys are written by both.

| Key | Owner | Value (parsed) | Purpose |
|---|---|---|---|
| `vnme_user_profile` | shared | object | Name, age, level, dialect, goal, nativeLang, dictMode, learnerMode |
| `vnme_app_language` | shared | string | UI language: `en` \| `zh-s` \| `zh-t` |
| `vnme_settings` | shared | object | Audio/TTS voice, testMode, showCefrTags, etc. |
| `vnme_onboarding_completed` | shared | `"true"` | Onboarding done flag |
| `vnme_srs` | shared | object | SM-2 spaced-repetition schedule, keyed by item id |
| `vnme_saved_words` | Learn | array of ids | Saved vocabulary from lessons/study |
| `vnme_custom_decks` | Learn | array | User-built lesson vocabulary decks |
| `vietnamy_progress` | **Learn** | object | Completed roadmap nodes and per-node session counts |
| `vnme_hearts` | **Learn** | number string | Current heart count |
| `vnme_streak` | **Learn** | object | Daily streak count, best streak, last active date, consumed moments |
| `vnme_word_grades` | **Learn** | object | Per-word mastery across exercise dimensions |
| `vnme_tutorial_completed` | **Learn** | `"true"` | In-app tutorial done flag |
| `vnme_dict_saved_words` | **Dictionary** | array of ids | Words saved from the dictionary |
| `vnme_dict_decks` | **Dictionary** | array | Dictionary flashcard decks |
| `vietnamy_dong` | legacy Learn | object | Old combined progress/coins/hearts/streak payload. Keep readable for migration; new clients should not write it. |

**Legacy alias:** on restore, if `vnme_app_language` is absent but the old
`vietnamy_language` is present, the latter is mapped onto the former. New
clients should only write `vnme_app_language`.

**Not part of account sync:** admin content drafts (`vnme_canonical_curriculum_v1`,
`vnme_mock_db_v24`, and `vnme_cms_*` overrides), local UI placement/preferences
such as feedback button position, dictionary search history, notification panel
history, and push device IDs. Admin content currently moves through import/export
or the repository content bundle, not through `user_progress`.

The exact internal shape of each value is owned by its module
(`srs.js`, `wordGrades.js`, `vocabLibrary.js`, `dictSavedWords.js`,
`ProgressContext.jsx`, `UserContext.jsx`); treat those as the source of truth
for sub-structure. The **contract** is the key set, ownership, and the table.

---

## 4. Sync semantics (today)

- **On sign-in (`SIGNED_IN`):** the client calls `loadProgressFromCloud(userId)`
  — reads the row and writes each known key back into local storage. If the user
  had no local onboarding yet, the app reloads so it renders from the restored
  state; if it already had local progress, it instead pushes local up
  (`saveProgressToCloud`).
- **On change:** writes are **debounced ~2s** (`debouncedSaveProgress`) and
  upsert the **entire `data` blob**. Saved-word IDs are also mirrored into the
  normalized `saved_words` table.
- **Conflict resolution:** whole-blob **last-write-wins**. There is no per-key
  merge — the most recent `upsert` replaces the full `data` object, and a load
  overwrites local keys with cloud values.

### ⚠️ The concurrency caveat for two apps

Because a write replaces the **whole blob**, two clients editing different slices
**can clobber each other** (Dictionary app saves a word while Learn app, holding
a stale blob, writes back its gamification → the saved word is lost).

For two independently-running apps, the mobile team should do one of:
1. **Read-merge-write:** before writing, re-read the row and merge your changed
   keys into the latest `data` (cheap, works with today's table). *Recommended
   near-term.*
2. **Per-key / per-namespace rows:** evolve the table to
   `(user_id, key, value, updated_at)` so writes are scoped and never clobber
   sibling keys. *Recommended if both apps are frequently active at once.*

This caveat is the one real thing to design around — flagged so it isn't
discovered in production.

---

## 5. Guidance per app

- **Both apps** authenticate as the same Supabase user and share: profile,
  language, settings, onboarding, and **SRS**.
- **Saved words** are shared at the normalized `saved_words` layer, but each
  app owns its own local list key: Learn writes `vnme_saved_words`, Dictionary
  writes `vnme_dict_saved_words`. Decks are app-specific until a future deck
  schema is introduced.
- **Learn app** owns progress (`vietnamy_progress`), hearts (`vnme_hearts`),
  streak (`vnme_streak`), grades (`vnme_word_grades`), and tutorial flag.
- **Dictionary app** owns `vnme_dict_saved_words` / `vnme_dict_decks`.
- Each app should **only write the keys it owns + the shared keys it changes**,
  using read-merge-write (§4) so it never drops another app's keys.
