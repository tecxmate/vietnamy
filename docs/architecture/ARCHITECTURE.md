# Vietnamy — Full Architecture (for Mobile Developers)

> **Audience:** mobile devs porting Vietnamy to native (React Native, Flutter, or Swift/Kotlin).
> **What this is:** the complete architecture, each chart embedded below **and** available as a standalone `.mermaid` file in this folder (so you can open, edit, or export any single diagram).
> Renders in Obsidian (Mermaid core plugin), GitHub, and most Markdown tools.

## Diagram index

| # | Diagram | File |
|---|---------|------|
| 1 | System context | [`01-system-context.mermaid`](01-system-context.mermaid) |
| 2 | Frontend layers | [`02-frontend-layers.mermaid`](02-frontend-layers.mermaid) |
| 3 | State ↔ storage map | [`03-state-storage.mermaid`](03-state-storage.mermaid) |
| 4 | Content pipeline | [`04-content-pipeline.mermaid`](04-content-pipeline.mermaid) |
| 5 | Data model (DB collections) | [`05-data-model.mermaid`](05-data-model.mermaid) |
| 6 | Roadmap node model | [`06-roadmap-model.mermaid`](06-roadmap-model.mermaid) |
| 7 | Lesson flow (sequence) | [`07-lesson-sequence.mermaid`](07-lesson-sequence.mermaid) |
| 8 | SRS state machine | [`08-srs-state.mermaid`](08-srs-state.mermaid) |
| 9 | Backend API surface | [`09-backend-api.mermaid`](09-backend-api.mermaid) |
| 10 | Auth + cloud sync | [`10-auth-sync-sequence.mermaid`](10-auth-sync-sequence.mermaid) |
| 11 | Deployment topology | [`11-deployment.mermaid`](11-deployment.mermaid) |
| 12 | Native port map | [`12-native-port-map.mermaid`](12-native-port-map.mermaid) |

---

## 0. The one thing to understand first

Vietnamy is a **mobile-first React web app** with a **thin Express backend**. There are effectively **no user accounts in the core app logic** — almost all state lives in the browser's `localStorage`, accessed through a "mock database" (`src/lib/db.js` + `storage/mockDbStore.js`) that treats `localStorage` as the production data store. **Supabase is bolted on top only for optional auth + cloud backup** of that local state.

The porting consequence: the learning engines (lessons, SRS, roadmap, dictionary client) are **pure JS and port cleanly**; the Express server is **reused over REST**; the real work is replacing the **browser-dependent layer** (`localStorage`, `react-router`, Web Audio, `speechSynthesis`, OCR, Web Push).

For production handoff, use the backend-neutral contracts instead of copying the
temporary localStorage/Supabase shape: [`USER_STATE_API.md`](USER_STATE_API.md)
for learner state and [`CURRICULUM_DRAFT_API.md`](CURRICULUM_DRAFT_API.md) for
admin curriculum drafts.

---

## 1. System context

The frontend hits the backend only for things the browser can't do well: dictionary search over large SQLite files, TTS audio, pronunciation scoring, translation, and push. Everything else is computed client-side and persisted locally.

```mermaid
flowchart TB
    subgraph Client["📱 Client — React 19 + Vite (mobile-first web)"]
        UI["UI surfaces: Tabs, Lessons, Practice, Dictionary, Admin"]
        CTX["React Context state (5 providers)"]
        ENG["Learning engines (pure JS)"]
        LS[("localStorage<br/>vnme_* / vietnamy_*<br/>= the real DB")]
    end

    subgraph Server["🖥️ Express backend (Node)"]
        API["REST API /api/*"]
        DICT[("SQLite dictionaries<br/>~100MB, not in git")]
    end

    subgraph External["☁️ External services"]
        SB["Supabase<br/>Auth + progress sync + TTS bucket"]
        TTSV["Azure / Google TTS"]
        XLATE["Google Translate"]
        PUSH["Web Push (VAPID)"]
    end

    UI --> CTX --> ENG --> LS
    UI -->|fetch /api| API
    API --> DICT
    API -->|generate audio| TTSV
    API -->|cache + 302 serve| SB
    API -->|translate| XLATE
    API -->|notify| PUSH
    CTX -->|auth + cloud backup| SB
```

---

## 2. Frontend layers

Five Context providers wrap a single `StudentApp` shell (bottom-nav tabs). Feature surfaces call into `lib/` engines, which read/write `localStorage` and fetch `/api/*`. Routing is one `<Routes>` table in `App.jsx`.

```mermaid
flowchart TD
    ROOT["main.jsx → App.jsx<br/>BrowserRouter + Route table"]

    subgraph Providers["Context providers (nesting order)"]
        direction TB
        PA["AuthProvider"] --> PL["LanguageProvider"] --> PP["ProgressProvider"] --> PU["UserProvider"] --> PN["NotificationProvider"]
    end

    ROOT --> Providers
    Providers --> SHELL["StudentApp shell<br/>(bottom-nav tabs)"]

    subgraph Surfaces["Feature surfaces"]
        direction TB
        T["Tabs/: Home, Roadmap, Sounds,<br/>Dictionary, Grammar, ReadingLibrary, Community"]
        LG["LessonGame — exercise engine"]
        SC["SceneEngine — roleplay scenes"]
        PR["Practice/: 45+ drills"]
        GR["Grammar/: guidebook + unit lessons"]
        AD["Admin/: CMS editors"]
    end

    SHELL --> Surfaces

    subgraph Lib["lib/ — engines & data access (framework-agnostic JS)"]
        direction TB
        DB["db.js + storage/mockDbStore.js"]
        SRS["srs.js (SM-2)"]
        EG["exerciseGenerator + practiceQuestionGenerator"]
        MK["moduleKinds.js (roadmap model)"]
        DL["dictionaryLookup.js"]
        SP["syncProgress.js"]
        OV["contentOverrides.js (CMS merges)"]
    end

    Surfaces --> Lib

    subgraph Hooks["hooks/"]
        H["useTTS, useQuizSession,<br/>usePracticeCompletion, useEnterKey"]
    end

    Surfaces --> Hooks

    DB --> STORE[("localStorage")]
    DL -.fetch.-> APIX["Express /api/*"]
    SP -.sync.-> SBX["Supabase"]
```

---

## 3. State ↔ storage map

No Redux. Each Context owns its `localStorage` keys. A subset (`SYNC_KEYS`) is what gets backed up to Supabase. **This map is the porting checklist for the storage layer.**

```mermaid
flowchart LR
    subgraph Contexts["React Context providers"]
        AU["AuthContext"]
        US["UserContext"]
        PG["ProgressContext"]
        LA["LanguageContext"]
        NO["NotificationContext"]
    end

    subgraph Keys["localStorage keys"]
        K1["vnme_user_profile"]
        K2["vietnamy_progress"]
        K3["vnme_hearts / vnme_streak"]
        K4["vnme_srs (review schedule)"]
        K5["vnme_word_grades"]
        K6["vnme_saved_words / vnme_dict_saved_words"]
        K7["vnme_custom_decks / vnme_dict_decks"]
        K8["vnme_app_language / vietnamy_language"]
        K9["vnme_settings"]
        K10["vnme_onboarding_completed / vnme_tutorial_completed"]
        K11["vnme_notifications"]
        K12["vnme_mock_db_v24 (curriculum DB)"]
        K13["vnme_cms_* / vnme_curriculum_edits (CMS overrides)"]
        K14["vietnamy_dong (legacy)"]
    end

    US --> K1
    PG --> K2
    PG --> K3
    US --> K4
    US --> K5
    US --> K6
    US --> K7
    LA --> K8
    US --> K9
    US --> K10
    NO --> K11

    DBJS["db.js / mockDbStore.js"] --> K12
    DBJS --> K13

    AU -->|"debounced upsert (SYNC_KEYS)"| CLOUD[("Supabase<br/>user_progress")]
    K1 -.included in.-> CLOUD
    K2 -.included in.-> CLOUD
    K3 -.included in.-> CLOUD
    K4 -.included in.-> CLOUD
    K14 -.legacy included in.-> CLOUD
```

---

## 4. Content pipeline (build-time)

Curriculum is authored as JSON, validated against JSON Schema, then baked into `INIT_DATA` and seeded into `localStorage` on first load. Not fetched at runtime. **Fully portable** — only the final seeding target changes for native.

```mermaid
flowchart LR
    subgraph Authoring["Authoring (source of truth, in git)"]
        SRC["content/*.json<br/>curriculum, grammar, tones,<br/>kinship, dictionary, concepts,<br/>articles, drills, mascot"]
        SCH["schema/*.json<br/>JSON Schema validators"]
    end

    subgraph Build["Build-time scripts (npm)"]
        V1["validate-content.mjs"]
        V2["validate-curriculum.js"]
        B1["build-unified-db.js"]
        B2["build-canonical.mjs"]
    end

    SEED["src/lib/content/initialData.js<br/>INIT_DATA (baked seed)"]
    DB[("localStorage<br/>vnme_mock_db_v24")]

    SRC -->|validate against| SCH
    SRC --> V1 --> V2 --> B1 --> B2 --> SEED
    SEED -->|first load| DB
    SEED -->|"CURRICULUM_VERSION bump<br/>(reseed curriculum, keep progress)"| DB

    CMS["Admin CMS edits"] -->|override keys| DB
    note["Overrides (vnme_cms_*) merge ON TOP of seed —<br/>seed is never mutated"]
    CMS -.-> note
```

---

## 5. Data model (the mock DB collections)

The `vnme_mock_db_v24` blob holds these collections. Relationships drive the roadmap, lessons, and SRS. Treat this as the schema your native storage must reproduce.

```mermaid
erDiagram
    UNITS ||--o{ PATH_NODES : contains
    PATH_NODES ||--o| LESSONS : "opens (vocab node)"
    LESSONS ||--|| LESSON_BLUEPRINTS : "rendered by"
    LESSON_BLUEPRINTS }o--o{ ITEMS : "introduces vocab"
    ITEMS ||--o{ TRANSLATIONS : "localized by"
    PATH_NODES }o--o{ ITEMS : "vocab_introduces / vocab_requires"
    UNITS ||--o{ SCENES : "has roleplay"
    SCENES ||--o{ SCENE_LOCATIONS : "set in"

    PATH_NODES {
        string id
        int node_index
        string node_type "skill|lesson|test"
        string module_type "blue|orange|purple|test"
        string lesson_id
        json unlock_rule
        array vocab_introduces
        array vocab_requires
    }
    ITEMS {
        string id
        string item_type "word|sentence"
        string vi_text
        string audio_key
        string dialect
        array tags
        string note
    }
```

---

## 6. Roadmap node model

The roadmap is a Duolingo-style skill tree. `moduleKinds.js` is the single source of truth for the four module kinds (shape + colour + which editor opens them). Seed, renderer, and admin all derive from it.

```mermaid
flowchart TB
    subgraph Unit["A roadmap UNIT (default repeating shape)"]
        direction LR
        P["🔵 Pronunciation<br/>node_type: skill<br/>→ practice_route"]:::blue
        V["🟠 Vocabulary<br/>node_type: lesson<br/>→ lesson_id (+ mini-quiz)"]:::orange
        G["🟣 Grammar<br/>node_type: skill<br/>→ grammar_unit_id"]:::purple
        T["🔴 Test<br/>node_type: test<br/>test_scope: unit"]:::red
        P --> V --> G --> T
    end

    MK["moduleKinds.js — MODULE_KINDS"]
    MK --> Unit
    GATE["unlock_rule prerequisites<br/>+ 4 sessions = node complete"]
    Unit --> GATE
    AUX["Auxiliary (not module kinds):<br/>🟢 Scenes, per-lesson mini-quizzes"]
    Unit -.-> AUX

    classDef blue fill:#1CB0F6,color:#fff
    classDef orange fill:#FFB703,color:#000
    classDef purple fill:#A78BFA,color:#fff
    classDef red fill:#EF4444,color:#fff
```

---

## 7. Lesson flow (sequence)

`LessonGame.jsx` generates 10 exercise types from a blueprint, calls the server for audio/scoring, updates gamification, then schedules learned words into SRS and backs up progress.

```mermaid
sequenceDiagram
    participant U as User
    participant RT as RoadmapTab
    participant LG as LessonGame
    participant GEN as exerciseGenerator
    participant API as Express /api
    participant SRS as srs.js
    participant PROG as ProgressContext
    participant SYNC as syncProgress

    U->>RT: tap node
    RT->>RT: check unlock_rule
    RT->>LG: route /lesson/:id
    LG->>GEN: build exercises from blueprint
    GEN-->>LG: 10 types (mcq, listen_choose,<br/>match_pairs, reorder_words,<br/>speak_sentence, fill_blank, …)

    loop each exercise
        U->>LG: answer
        LG->>API: GET /api/tts (audio)
        opt speaking exercise
            LG->>API: POST /api/pronunciation (score)
        end
        LG->>PROG: update hearts / streak
    end

    LG->>SRS: schedule learned words (1→3→7→14→30d)
    LG->>PROG: award XP + coins ₫, mark complete
    PROG->>PROG: unlock next node (localStorage)
    PROG->>SYNC: debounced backup
```

---

## 8. SRS state machine

`srs.js` is SM-2 inspired. Correct recalls promote through five intervals; a lapse resets to day 1. Grades live in `vnme_word_grades`, the schedule in `vnme_srs`.

```mermaid
stateDiagram-v2
    [*] --> New: word introduced in lesson
    New --> I1: added to SRS

    I1: Interval 1 day
    I3: Interval 3 days
    I7: Interval 7 days
    I14: Interval 14 days
    I30: Interval 30 days
    Mature: Review long-term

    I1 --> I3: recalled ✓
    I3 --> I7: recalled ✓
    I7 --> I14: recalled ✓
    I14 --> I30: recalled ✓
    I30 --> Mature: recalled ✓
    Mature --> Mature: recalled ✓

    I3 --> I1: lapse ✗ (reset)
    I7 --> I1: lapse ✗ (reset)
    I14 --> I1: lapse ✗ (reset)
    I30 --> I1: lapse ✗ (reset)
    Mature --> I1: lapse ✗ (reset)
```

---

## 9. Backend API surface

Small and stateless apart from the SQLite dictionaries. A native app calls the **same REST endpoints** — no server changes. In prod the same process also serves the built web app from `/dist` (ignore that for native).

```mermaid
flowchart TB
    CLIENT["📱 Client (dictionaryLookup.js, useTTS, …)"]

    subgraph Express["Express server.js"]
        direction TB
        MW["cors + express.json"]
        subgraph Dict["Dictionary"]
            S1["GET /api/search"]
            S2["GET /api/suggest"]
            S3["GET /api/segment"]
            S4["GET /api/word-popup"]
            S5["GET /api/languages"]
        end
        subgraph Media["Audio / language"]
            M1["GET /api/tts"]
            M2["POST /api/pronunciation"]
            M3["GET /api/translate"]
        end
        subgraph Push["Notifications"]
            P1["GET /api/push/vapid-public-key"]
            P2["POST /api/push/subscribe"]
            P3["POST /api/push/send"]
        end
        STATIC["GET * → serve /dist (prod)"]
    end

    DICTDB[("SQLite dictionaries<br/>better-sqlite3, indexed on startup")]
    BUCKET[("Supabase Storage<br/>tts-cache bucket")]
    AZURE["Azure / Google TTS"]
    GT["Google Translate"]

    CLIENT -->|fetch| MW
    Dict --> DICTDB
    M1 -->|miss → generate| AZURE
    M1 -->|hit → 302| BUCKET
    M3 --> GT
```

| Endpoint | Purpose | Native port impact |
|----------|---------|-------------------|
| `GET /api/search`, `/suggest`, `/segment`, `/word-popup`, `/languages` | Dictionary | Call as-is |
| `GET /api/tts` | TTS audio, 302 to bucket cache | Call as-is; play natively |
| `POST /api/pronunciation` | Scoring (audio upload) | Replace mic capture with native recorder |
| `GET /api/translate` | Translate proxy | Call as-is |
| `POST /api/push/*` | Web Push (VAPID) | **Replace** with FCM/APNs |

---

## 10. Auth + cloud sync

Supabase auth is optional — with no config the app runs offline as `local-dev`. When signed in, `syncProgress.js` hydrates `localStorage` from `user_progress` on boot and debounce-upserts a `SYNC_KEYS` blob on change.

```mermaid
sequenceDiagram
    participant U as User
    participant AC as AuthContext
    participant SB as Supabase Auth
    participant SP as syncProgress.js
    participant TBL as Supabase user_progress
    participant LS as localStorage

    Note over AC: App boot
    AC->>SB: getSession() (5s timeout race)
    alt no Supabase config
        AC->>AC: user = local-dev (offline mode)
    else session exists
        SB-->>AC: user
        AC->>SP: loadProgressFromCloud(userId)
        SP->>TBL: select data
        TBL-->>SP: SYNC_KEYS blob
        SP->>LS: hydrate keys
    end

    Note over U,LS: During use
    U->>LS: progress changes (XP, SRS, streak)
    LS->>SP: debouncedSaveProgress(userId)
    SP->>TBL: upsert { user_id, data, updated_at }
```

---

## 11. Deployment topology

Dev runs Vite + Express separately (Vite proxies `/api`). Prod builds the frontend into `/dist` and Express serves both API and static. Supabase + TTS are managed.

```mermaid
flowchart TB
    subgraph Dev["Development"]
        D1["vite dev :5173 (frontend)"]
        D2["node server.js :3001 (API)"]
        D1 -->|proxy /api| D2
    end

    subgraph Prod["Production (Docker / Zeabur / Vercel)"]
        direction TB
        BUILD["npm run build<br/>vite build → /dist"]
        SRV["Express :8080<br/>serves /api + static /dist"]
        BUILD --> SRV
    end

    subgraph Cloud["Managed services"]
        SBP["Supabase<br/>(Auth, Postgres user_progress,<br/>tts-cache Storage bucket)"]
        TTSP["Azure / Google TTS"]
    end

    SRV --> SBP
    SRV --> TTSP
```

---

## 12. Native port map — the actual work

```mermaid
flowchart LR
    subgraph Portable["✅ Ports cleanly (pure JS / data / backend)"]
        direction TB
        P1["Learning engines:<br/>srs.js, exerciseGenerator, moduleKinds"]
        P2["Curriculum JSON + schema + build scripts"]
        P3["Context state model (5 providers)"]
        P4["Express server — call over REST unchanged"]
        P5["Supabase auth + syncProgress logic"]
        P6["Dictionary client (dictionaryLookup.js)"]
    end

    subgraph Rework["⚠️ Re-implement — browser-specific"]
        direction TB
        R1["localStorage → AsyncStorage / MMKV / SQLite"]
        R2["react-router → native navigation"]
        R3["Web Audio pitch detection → native audio"]
        R4["speechSynthesis fallback → native TTS"]
        R5["tesseract.js OCR → ML Kit / Vision"]
        R6["Web Push (VAPID) → FCM / APNs"]
        R7["TELEX keyboard handling → native input"]
    end

    R1 --- N1["Biggest item:<br/>swap the ONE storage module,<br/>most of the app follows"]:::hot

    classDef hot fill:#EF4444,color:#fff
```

### Suggested porting order

1. Stand up navigation + the tab shell with stub screens.
2. **Replace the storage layer** (`mockDbStore`) with native storage; seed from existing `INIT_DATA`. Unblocks everything stateful.
3. Port the five Context providers (logic reusable; only storage calls change).
4. Wire dictionary + lessons to the existing `/api/*`.
5. Port the engines (`srs`, `exerciseGenerator`, `moduleKinds`) — minimal changes.
6. Re-implement media features last: native audio/TTS, mic pronunciation, OCR, push.

> **Skippable for a v1 native build:** the `/admin/*` CMS (desktop-web content workflow), telex/teencode side-drills, and tone-sample crowd collection. None are on the core learner path.
