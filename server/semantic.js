// Semantic search over Supabase + pgvector, embeddings via Gemini.
// Powers three corpora: 'curriculum' (tutor grounding), 'dictionary' (meaning
// lookup), 'repo' (docs/code knowledge base). See docs/SEMANTIC_SEARCH.md.
//
// Config is read LAZILY (not at import time) because server.js loads the .env
// file after its imports run — reading process.env at module top would see
// nothing. Until SUPABASE_URL + a service key + a Gemini key are all set, every
// function is a safe no-op, so the app has zero regression.

import { createClient } from '@supabase/supabase-js';

const EMBED_DIM = 768; // text-embedding-004

export function semanticConfig() {
    const url = process.env.SUPABASE_URL || '';
    const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    const gemini = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
    const model = process.env.EMBED_MODEL || 'text-embedding-004';
    return { url, key, gemini, model, enabled: Boolean(url && key && gemini) };
}

export function isSemanticEnabled() {
    return semanticConfig().enabled;
}

let _client = null;
function client() {
    const { url, key, enabled } = semanticConfig();
    if (!enabled) return null;
    if (!_client) _client = createClient(url, key, { auth: { persistSession: false } });
    return _client;
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
        body: JSON.stringify({ content: { parts: [{ text: String(text).slice(0, 8000) }] }, taskType }),
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
    const requests = texts.map(t => ({ model: `models/${model}`, content: { parts: [{ text: String(t).slice(0, 8000) }] }, taskType }));
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
    if (!isSemanticEnabled() || !query) return [];
    try {
        const embedding = await embedText(query, 'RETRIEVAL_QUERY');
        if (!embedding) return [];
        const { data, error } = await client().rpc('match_semantic_docs', {
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
    if (!isSemanticEnabled()) throw new Error('semantic search not configured (SUPABASE_URL / service key / GEMINI_API_KEY)');
    const { error } = await client().from('semantic_docs').insert(rows);
    if (error) throw new Error(error.message);
}

// Remove a corpus before re-ingesting it.
export async function clearCorpus(corpus) {
    if (!isSemanticEnabled()) throw new Error('semantic search not configured');
    const { error } = await client().from('semantic_docs').delete().eq('corpus', corpus);
    if (error) throw new Error(error.message);
}
