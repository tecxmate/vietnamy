// Ingest a corpus into the Supabase pgvector store.
//   node scripts/ingest-semantic.mjs curriculum
//   node scripts/ingest-semantic.mjs repo
//   node scripts/ingest-semantic.mjs dictionary   (HEAVY — see cost note below)
//
// Requires SUPABASE_URL + SUPABASE_SERVICE_KEY + GEMINI_API_KEY in .env, and the
// schema applied (db/sql/semantic_search.sql). See docs/SEMANTIC_SEARCH.md.

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, dirname, relative } from 'path';
import { fileURLToPath } from 'url';
import { embedBatch, insertDocs, clearCorpus, isSemanticEnabled, closeDb } from '../server/semantic.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// Standalone script → load .env ourselves (doesn't go through server.js).
function loadEnv(file) {
    try {
        for (const line of readFileSync(file, 'utf8').split('\n')) {
            const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/);
            if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
        }
    } catch { /* no file */ }
}
loadEnv(join(ROOT, '.env.local'));
loadEnv(join(ROOT, '.env'));

const readJSON = (p) => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));
const BATCH = 96; // under Gemini's batchEmbedContents cap

// ── Corpus chunk builders → [{ source, content, metadata }] ──────────────────
function curriculumDocs() {
    const docs = [];
    // Tones
    try {
        for (const t of readJSON('content/tones.json').tones || []) {
            docs.push({ source: `tones.json#${t.id}`, metadata: { type: 'tone', id: t.id },
                content: `Vietnamese tone ${t.name} (mark "${t.mark}", ${t.label}): ${t.description}` });
        }
    } catch (e) { console.warn('tones:', e.message); }
    // Concepts (the richest grounding — title + body explanations)
    try {
        for (const c of readJSON('content/concepts.json').concepts || []) {
            const ex = (c.examples || []).map(x => (typeof x === 'string' ? x : x.vi || x.text || '')).filter(Boolean).join('; ');
            docs.push({ source: `concepts.json#${c.id}`, metadata: { type: 'concept', id: c.id, lessonId: c.lessonId },
                content: `${c.title}: ${c.body}${ex ? ` Examples: ${ex}` : ''}` });
        }
    } catch (e) { console.warn('concepts:', e.message); }
    // Grammar (levels + their modules, best-effort text extraction)
    try {
        for (const lvl of readJSON('content/grammar.json').levels || []) {
            docs.push({ source: `grammar.json#${lvl.id}`, metadata: { type: 'grammarLevel', id: lvl.id },
                content: `Grammar level ${lvl.label}: ${lvl.description || ''}` });
            for (const mod of lvl.modules || []) {
                const text = Object.values(mod).filter(v => typeof v === 'string').join(' — ');
                if (text.trim()) docs.push({ source: `grammar.json#${lvl.id}/${mod.id || ''}`, metadata: { type: 'grammarModule', level: lvl.id }, content: text });
            }
        }
    } catch (e) { console.warn('grammar:', e.message); }
    // Kinship terms
    try {
        for (const k of readJSON('content/kinship.json')) {
            docs.push({ source: `kinship.json#${k.id}`, metadata: { type: 'kinship', id: k.id },
                content: `Kinship term ${k.label}: ${k.relationType}, ${k.gender || ''}, generation ${k.generation}` });
        }
    } catch (e) { console.warn('kinship:', e.message); }
    return docs;
}

// docs/*.md + the lesson/teacher source, chunked by paragraph blocks.
function repoDocs() {
    const docs = [];
    const walk = (dir) => readdirSync(dir).flatMap(name => {
        const full = join(dir, name);
        if (statSync(full).isDirectory()) return name === 'node_modules' ? [] : walk(full);
        return /\.(md|mdx)$/.test(name) ? [full] : [];
    });
    for (const file of walk(join(ROOT, 'docs'))) {
        const rel = relative(ROOT, file);
        const blocks = readFileSync(file, 'utf8').split(/\n#{1,3}\s/).map(s => s.trim()).filter(b => b.length > 60);
        blocks.forEach((b, i) => docs.push({ source: `${rel}#${i}`, metadata: { type: 'doc', file: rel }, content: b.slice(0, 2000) }));
    }
    return docs;
}

// Dictionary from the bundled content/dictionary.json. The FULL ~300k-entry
// dictionary lives in the SQLite DBs (not in git) — wire that source here when
// you're ready to pay for the embeddings (see the cost note in the spec).
function dictionaryDocs() {
    const data = readJSON('content/dictionary.json');
    const entries = Array.isArray(data) ? data : (data.entries || data.words || Object.values(data));
    return entries.filter(Boolean).map((e, i) => {
        const vi = e.vi || e.word || e.headword || '';
        const en = e.en || e.meaning || e.definition || (Array.isArray(e.meanings) ? e.meanings.join('; ') : '');
        return { source: `dictionary#${e.id || vi || i}`, metadata: { type: 'dictionary', vi }, content: `${vi} — ${en}` };
    }).filter(d => d.content.length > 3);
}

const BUILDERS = { curriculum: curriculumDocs, repo: repoDocs, dictionary: dictionaryDocs };

async function main() {
    const corpus = process.argv[2];
    if (!BUILDERS[corpus]) {
        console.error('Usage: node scripts/ingest-semantic.mjs <curriculum|repo|dictionary>');
        process.exit(1);
    }
    if (!isSemanticEnabled()) {
        console.error('Not configured. Set SUPABASE_URL, SUPABASE_SERVICE_KEY and GEMINI_API_KEY in .env.');
        process.exit(1);
    }

    const docs = BUILDERS[corpus]();
    console.log(`[${corpus}] built ${docs.length} chunks. Embedding in batches of ${BATCH}…`);
    if (corpus === 'dictionary' && docs.length > 5000) {
        console.log(`  NOTE: ${docs.length} embeddings — this costs real quota/money. Ctrl-C to abort.`);
    }

    console.log(`[${corpus}] clearing existing rows…`);
    await clearCorpus(corpus);

    // Retry on 429 (free-tier rate limit) with backoff.
    const embedWithRetry = async (texts, tries = 6) => {
        for (let attempt = 0; ; attempt++) {
            try { return await embedBatch(texts, 'RETRIEVAL_DOCUMENT'); }
            catch (e) {
                if (/\b429\b/.test(e.message) && attempt < tries - 1) {
                    const wait = 35000 * (attempt + 1);
                    console.log(`  rate limited — waiting ${wait / 1000}s…`);
                    await new Promise(r => setTimeout(r, wait));
                } else throw e;
            }
        }
    };

    let done = 0;
    for (let i = 0; i < docs.length; i += BATCH) {
        const slice = docs.slice(i, i + BATCH);
        const vectors = await embedWithRetry(slice.map(d => d.content));
        const rows = slice.map((d, j) => ({ corpus, source: d.source, content: d.content, metadata: d.metadata || {}, embedding: vectors[j] }))
            .filter(r => Array.isArray(r.embedding));
        if (rows.length) await insertDocs(rows);
        done += rows.length;
        console.log(`  ${done}/${docs.length}`);
        await new Promise(r => setTimeout(r, 40000)); // stay under per-minute embedding quota
    }
    console.log(`[${corpus}] done — ${done} chunks embedded and stored.`);
}

main()
    .then(() => closeDb())
    .catch(async (err) => { console.error(err); await closeDb().catch(() => {}); process.exit(1); });
