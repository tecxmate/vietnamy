-- Semantic search schema for Supabase (pgvector). Run once in the Supabase SQL
-- editor. Embeddings are 768-dim (Gemini text-embedding-004). See
-- docs/SEMANTIC_SEARCH.md.

create extension if not exists vector;

create table if not exists semantic_docs (
    id          bigserial primary key,
    corpus      text not null,            -- 'curriculum' | 'dictionary' | 'repo'
    source      text,                     -- e.g. 'tones.json#huyen', 'docs/ARCHITECTURE.md#L40'
    content     text not null,            -- the chunk that was embedded
    metadata    jsonb not null default '{}',
    embedding   vector(768),
    created_at  timestamptz not null default now()
);

-- Cosine-distance ANN index. HNSW is a good default for read-heavy search.
create index if not exists semantic_docs_embedding_idx
    on semantic_docs using hnsw (embedding vector_cosine_ops);
create index if not exists semantic_docs_corpus_idx on semantic_docs (corpus);

-- Top-k matcher used by the app (server/semantic.js calls this via RPC).
create or replace function match_semantic_docs(
    query_embedding vector(768),
    match_count int default 5,
    filter_corpus text default null
)
returns table (
    id bigint,
    corpus text,
    source text,
    content text,
    metadata jsonb,
    similarity float
)
language sql stable
as $$
    select d.id, d.corpus, d.source, d.content, d.metadata,
           1 - (d.embedding <=> query_embedding) as similarity
    from semantic_docs d
    where filter_corpus is null or d.corpus = filter_corpus
    order by d.embedding <=> query_embedding
    limit match_count;
$$;
