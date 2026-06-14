// Semantic search over Supabase + pgvector, embeddings via Gemini.
// Powers three corpora: 'curriculum' (tutor grounding), 'dictionary' (meaning
// lookup), 'repo' (docs/code knowledge base). See docs/SEMANTIC_SEARCH.md.
//
// Config is read LAZILY (not at import time) because server.js loads the .env
// file after its imports run — reading process.env at module top would see
// nothing. Until SUPABASE_URL + a service key + a Gemini key are all set, every
// function is a safe no-op, so the app has zero regression.

import { createClient } from '@supabase/supabase-js';
import pg from 'pg';

const EMBED_DIM = 768; // gemini-embedding-001 truncated to 768 via outputDimensionality

// Backend-agnostic: prefer a generic Postgres connection (DATABASE_URL) so this
// runs on ANY Postgres (your own backend, Neon, RDS, local…); fall back to the
// Supabase REST SDK. Either way the schema + queries are identical pgvector.
export function semanticConfig() {
    const databaseUrl = process.env.DATABASE_URL || '';
    const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
    const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    const gemini = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
    const model = process.env.EMBED_MODEL || 'gemini-embedding-001';
    const driver = databaseUrl ? 'pg' : (url && key ? 'supabase' : 'none');
    return { databaseUrl, url, key, gemini, model, driver, enabled: driver !== 'none' && Boolean(gemini) };
}

export function isSemanticEnabled() {
    return semanticConfig().enabled;
}

// pgvector literal for a JS number array, e.g. [0.1, 0.2] -> '[0.1,0.2]'.
const toVector = (vec) => `[${vec.join(',')}]`;

let _supabase = null;
function supabaseClient() {
    const { url, key } = semanticConfig();
    if (!_supabase) _supabase = createClient(url, key, { auth: { persistSession: false } });
    return _supabase;
}

let _pool = null;
function pgPool() {
    const { databaseUrl } = semanticConfig();
    if (!_pool) {
        const ssl = /localhost|127\.0\.0\.1/.test(databaseUrl) ? false : { rejectUnauthorized: false };
        _pool = new pg.Pool({ connectionString: databaseUrl, ssl, max: 4 });
    }
    return _pool;
}

// Release the pg pool (so standalone scripts can exit). No-op on Supabase.
export async function closeDb() {
    if (_pool) { await _pool.end(); _pool = null; }
}

// Embed a single string. taskType is 'RETRIEVAL_QUERY' for searches,
// 'RETRIEVAL_DOCUMENT' for stored chunks (improves retrieval quality).
export async function embedText(text, taskType = 'RETRIEVAL_QUERY') {
    const { gemini, model } = semanticConfig();
    if (!gemini) return null;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:embedContent?key=${encodeURIComponent(gemini)}`;
    const r = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ content: { parts: [{ text: String(text).slice(0, 8000) }] }, taskType, outputDimensionality: EMBED_DIM }),
    });
    if (!r.ok) throw new Error(`embed ${r.status}: ${(await r.text()).slice(0, 150)}`);
    const data = await r.json();
    const values = data.embedding?.values || null;
    if (values && values.length !== EMBED_DIM) {
        throw new Error(`embedding dim ${values.length} != ${EMBED_DIM} (model ${model})`);
    }
    return values;
}

// Embed many texts in one call (Gemini batchEmbedContents, cap ~100/call). Used
// by ingestion. Returns an array of vectors aligned to `texts`.
export async function embedBatch(texts, taskType = 'RETRIEVAL_DOCUMENT') {
    const { gemini, model } = semanticConfig();
    if (!gemini) return texts.map(() => null);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:batchEmbedContents?key=${encodeURIComponent(gemini)}`;
    const requests = texts.map(t => ({ model: `models/${model}`, content: { parts: [{ text: String(t).slice(0, 8000) }] }, taskType, outputDimensionality: EMBED_DIM }));
    const r = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ requests }),
    });
    if (!r.ok) throw new Error(`batchEmbed ${r.status}: ${(await r.text()).slice(0, 150)}`);
    const data = await r.json();
    return (data.embeddings || []).map(e => e.values || null);
}

// Top-k semantic matches. Never throws — returns [] on any failure so callers
// (e.g. the tutor) degrade gracefully.
export async function semanticSearch(query, { corpus = null, k = 5 } = {}) {
    const { enabled, driver } = semanticConfig();
    if (!enabled || !query) return [];
    try {
        const embedding = await embedText(query, 'RETRIEVAL_QUERY');
        if (!embedding) return [];
        if (driver === 'pg') {
            const { rows } = await pgPool().query(
                'SELECT id, corpus, source, content, metadata, similarity FROM match_semantic_docs($1::vector, $2, $3)',
                [toVector(embedding), k, corpus],
            );
            return rows;
        }
        const { data, error } = await supabaseClient().rpc('match_semantic_docs', {
            query_embedding: embedding,
            match_count: k,
            filter_corpus: corpus,
        });
        if (error) { console.warn('semantic search error:', error.message); return []; }
        return data || [];
    } catch (err) {
        console.warn('semantic search failed:', err.message);
        return [];
    }
}

// Bulk insert rows: [{ corpus, source, content, metadata, embedding }]. Used by
// the ingest script — throws so ingestion surfaces real errors.
export async function insertDocs(rows) {
    const { enabled, driver } = semanticConfig();
    if (!enabled) throw new Error('semantic search not configured (need DATABASE_URL or Supabase creds + GEMINI_API_KEY)');
    if (driver === 'pg') {
        const placeholders = [];
        const params = [];
        rows.forEach((r, i) => {
            const b = i * 5;
            placeholders.push(`($${b + 1},$${b + 2},$${b + 3},$${b + 4}::jsonb,$${b + 5}::vector)`);
            params.push(r.corpus, r.source, r.content, JSON.stringify(r.metadata || {}), toVector(r.embedding));
        });
        await pgPool().query(
            `INSERT INTO semantic_docs (corpus, source, content, metadata, embedding) VALUES ${placeholders.join(',')}`,
            params,
        );
        return;
    }
    const { error } = await supabaseClient().from('semantic_docs').insert(rows);
    if (error) throw new Error(error.message);
}

// Remove a corpus before re-ingesting it.
export async function clearCorpus(corpus) {
    const { enabled, driver } = semanticConfig();
    if (!enabled) throw new Error('semantic search not configured');
    if (driver === 'pg') {
        await pgPool().query('DELETE FROM semantic_docs WHERE corpus = $1', [corpus]);
        return;
    }
    const { error } = await supabaseClient().from('semantic_docs').delete().eq('corpus', corpus);
    if (error) throw new Error(error.message);
}
