# Semantic search (Supabase + pgvector)

A vector store so AI agents can semantically search reference material — the AI
tutor (RAG grounding), meaning-based dictionary lookup, and a repo docs/code
knowledge base. Embeddings via **Gemini `text-embedding-004` (768-dim)**, stored
in **Supabase Postgres + `pgvector`**.

**Status:** foundation built and wired. It is a **graceful no-op until creds are
present**, so there's zero regression. To activate: add creds, run the schema,
run ingestion.

---

## Architecture

```
content/*.json ─┐
docs/*.md ──────┤  ingest-semantic.mjs  → Gemini embed (batch) → semantic_docs (pgvector)
dictionary ─────┘

/api/tutor      ─ embed question → match_semantic_docs(corpus='curriculum') → inject as facts
/api/semantic-search?q=&corpus= ─ generic top-k retrieval
```

- **`server/semantic.js`** — `embedText` / `embedBatch` (Gemini), `semanticSearch`
  (never throws → `[]`), `insertDocs` / `clearCorpus`. Config is read lazily; if
  `SUPABASE_URL` + a service key + `GEMINI_API_KEY` aren't all set, everything is
  a safe no-op.
- **`db/sql/semantic_search.sql`** — `semantic_docs` table + HNSW cosine index +
  `match_semantic_docs(query_embedding, match_count, filter_corpus)` RPC.
- **`scripts/ingest-semantic.mjs`** — `curriculum | repo | dictionary` corpora.
- **Endpoints** — `GET /api/semantic-search?q=&corpus=&k=`; the tutor enriches
  its grounding `facts` with `corpus='curriculum'` hits when enabled.

## Schema (one table, three corpora)

`semantic_docs(id, corpus, source, content, metadata jsonb, embedding vector(768))`.
`corpus ∈ {curriculum, dictionary, repo}`. Retrieval filters by corpus, so one
table + one index serves all three.

## The three corpora

| Corpus | Source | ~Chunks | Use |
|---|---|---|---|
| **curriculum** | `content/tones,concepts,grammar,kinship.json` | ~170 | **Tutor RAG** — replaces hand-authored `facts`; the tutor retrieves the right grounding for any question. Small, cheap, highest value. |
| **repo** | `docs/**/*.md` (paragraph blocks) | ~hundreds | Knowledge base for dev/AI agents working in the repo. |
| **dictionary** | `content/dictionary.json` now; the full ~300k-entry SQLite later | 300k | Meaning-based lookup ("word for being polite" → dạ/vâng). **The expensive one.** |

## Setup (you provide creds)

1. Add DB creds to `.env` (not committed). Either:
   - **Generic Postgres (recommended, portable):** `DATABASE_URL=postgres://…`
   - **or Supabase REST:** `SUPABASE_URL=…` (or `VITE_SUPABASE_URL`) + a
     service-role key (`SUPABASE_SERVICE_KEY` / `SUPABASE_SERVICE_ROLE_KEY`).
   `GEMINI_API_KEY` is already set (used for embeddings).
2. In the Supabase SQL editor, run **`db/sql/semantic_search.sql`** (enables
   `vector`, creates the table/index + the match RPC).
3. Ingest, cheapest first:
   ```
   node scripts/ingest-semantic.mjs curriculum   # ~170 chunks, seconds
   node scripts/ingest-semantic.mjs repo         # docs/*.md
   node scripts/ingest-semantic.mjs dictionary   # see cost note before running
   ```
4. Restart the server. `GET /api/semantic-search?q=falling%20tone&corpus=curriculum`
   should return hits; the tutor automatically starts using curriculum retrieval.

## Backend portability (no lock-in)

This is **plain Postgres + pgvector** — Supabase is just one way to host it.
`server/semantic.js` auto-selects a driver:

| Driver | When | Used for |
|---|---|---|
| **`pg`** (generic Postgres) | `DATABASE_URL` is set | Your own backend, Neon, RDS, local Postgres, or Supabase's direct connection string |
| **`supabase`** (REST SDK) | only `SUPABASE_URL` + service key set | Current hosted setup |

The schema (`db/sql/semantic_search.sql`), the `match_semantic_docs` function,
the embeddings (Gemini), and every endpoint are **identical** across drivers.

**Migrating off Supabase to your own Postgres:**
1. Stand up Postgres with the `vector` extension (`create extension vector;`).
2. Run `db/sql/semantic_search.sql` there (unchanged).
3. Set `DATABASE_URL=postgres://user:pass@host:5432/db` in `.env` (the driver
   switches to `pg` automatically; the Supabase SDK is no longer used).
4. Re-run `node scripts/ingest-semantic.mjs curriculum` (and friends) against the
   new DB. Nothing else changes — the tutor RAG, the search endpoint, all the
   same. (SSL is on by default except for `localhost`.)

That's the whole migration: a connection string + a schema run. No app code edits.

## Cost / feasibility

- `text-embedding-004` has a generous free tier; curriculum (~170) and repo are
  effectively free.
- **Dictionary is the real cost.** ~300k entries = ~300k embeddings. At paid
  rates that's on the order of single-digit dollars one-time, but it will blow
  past free-tier daily limits — run it in batches across days, or enable billing.
  Embeddings are one-time per content version (re-run only when content changes).
- Query-time cost is one embedding per search (tiny). pgvector HNSW search is
  sub-millisecond at this scale.

## How the tutor uses it (RAG)

When semantic search is enabled, `/api/tutor` embeds the student's message,
retrieves the top-4 `curriculum` chunks, and appends them to the grounding
`facts` (which the system prompt marks "use ONLY these"). This scales the
anti-hallucination grounding from per-lesson hand-authored facts to the whole
curriculum — without changing the tutor's behaviour when it's off.

## Future

- Wire the **full 300k dictionary** from the SQLite DBs (not just the bundled
  JSON) once the embedding budget is approved.
- Add a **client dictionary search** UI hitting `/api/semantic-search?corpus=dictionary`.
- Re-embed on content-version bumps (hook into the curriculum version).
- Consider per-corpus `match_count` and a similarity floor to drop weak hits.
