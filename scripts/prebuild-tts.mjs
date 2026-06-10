#!/usr/bin/env node
// Walks curriculum + content data files, collects unique Vietnamese strings,
// then warms the TTS bucket by hitting /api/tts for each (text, voice).
// The server uploads to Supabase Storage on first miss; subsequent hits are
// 302 redirects to the CDN.
//
// Usage:
//   node scripts/prebuild-tts.mjs                          # azure-north (the reading voice)
//   node scripts/prebuild-tts.mjs --voices=azure-north,google
//   node scripts/prebuild-tts.mjs --server=https://...     # remote server
//   node scripts/prebuild-tts.mjs --concurrency=3
//   node scripts/prebuild-tts.mjs --dry-run                # print counts only
//   node scripts/prebuild-tts.mjs --ck=custom-version      # override cache version
//
// IMPORTANT: the warm request must carry the SAME `ck` (cache version) the app
// sends, or the derived WAV lands under a different cache path than the client
// looks up — warming the wrong slot. The app uses `tts-v10-voice-preview-<voice>`
// (see buildTtsUrl in src/utils/speak.js); keep CK_TEMPLATE in sync with it.
//
// Requires the server running with the TTS cache configured (R2/Supabase). Note:
// a full CDN cache-hit only pays off if the bucket's PUBLIC url works — if
// R2_PUBLIC_BASE_URL points at the private S3 endpoint, hits 302 to a 400.

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, dirname, extname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { execFileSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DATA_DIR = join(ROOT, 'src', 'data');

const VI_KEY_PATTERN = /^(vi|vi_text|vietnamese|target_vi|answer_vi|source_text_vi|template_vi|audio_text|vi_north|vi_south|title_vi|word)$/;

// --- CLI args ---------------------------------------------------------------
const args = Object.fromEntries(
    process.argv.slice(2).map(a => {
        const m = a.match(/^--([^=]+)(?:=(.*))?$/);
        return m ? [m[1], m[2] ?? 'true'] : [a, 'true'];
    })
);
const SERVER = (args.server || process.env.TTS_SERVER_URL || 'http://localhost:3001').replace(/\/+$/, '');
const VOICES = (args.voices || 'azure-north').split(',').map(s => s.trim()).filter(Boolean);
// Cache version sent as `ck` — must match the app's buildTtsUrl. `{voice}` is
// substituted per voice. Override with --ck for a one-off version.
const CK_TEMPLATE = args.ck || 'tts-v10-voice-preview-{voice}';
const CONCURRENCY = Math.max(1, parseInt(args.concurrency, 10) || 5);
const DRY_RUN = args['dry-run'] === 'true';
const DICT_TOP = parseInt(args.dict, 10) || 0;
const DICT_DB = args['dict-db'] || join(ROOT, 'server', 'databases', 'vn_en_dictionary_high.db');

// --- Collect Vietnamese strings ---------------------------------------------
function walk(node, out) {
    if (node == null) return;
    if (typeof node !== 'object') return;
    if (Array.isArray(node)) { for (const n of node) walk(n, out); return; }
    for (const [k, v] of Object.entries(node)) {
        if (typeof v === 'string') {
            if (VI_KEY_PATTERN.test(k)) {
                const s = v.trim();
                if (s && s.length > 0 && s.length <= 200) out.add(s);
            }
        } else {
            walk(v, out);
        }
    }
}

function listFiles(dir) {
    const out = [];
    for (const name of readdirSync(dir)) {
        const full = join(dir, name);
        const st = statSync(full);
        if (st.isDirectory()) out.push(...listFiles(full));
        else out.push(full);
    }
    return out;
}

async function loadFile(path) {
    const ext = extname(path);
    if (ext === '.json') {
        try { return JSON.parse(readFileSync(path, 'utf8')); }
        catch (err) { console.warn(`skip ${path}: ${err.message}`); return null; }
    }
    if (ext === '.js' || ext === '.mjs') {
        try {
            const mod = await import(pathToFileURL(path).href);
            return mod;
        } catch (err) { console.warn(`skip ${path}: ${err.message}`); return null; }
    }
    return null;
}

const strings = new Set();
const files = listFiles(DATA_DIR);
for (const file of files) {
    const data = await loadFile(file);
    if (data) walk(data, strings);
}

console.log(`Collected ${strings.size} unique Vietnamese strings from ${files.length} data files.`);

// --- Optional: include top-N dictionary words ---------------------------------
if (DICT_TOP > 0) {
    try {
        const sql = `SELECT w.word FROM words w JOIN word_metrics wm ON w.id = wm.word_id WHERE wm.subt_freq > 0 ORDER BY wm.subt_freq DESC LIMIT ${DICT_TOP};`;
        const raw = execFileSync('sqlite3', [DICT_DB, sql], { encoding: 'utf8' });
        let added = 0;
        for (const line of raw.split('\n')) {
            const w = line.trim();
            if (!w || w.length > 200) continue;
            // Skip technical/junk entries (must contain Vietnamese-ish characters or be short content words)
            if (/[-_]/.test(w) || /^[0-9]/.test(w)) continue;
            if (!strings.has(w)) { strings.add(w); added++; }
        }
        console.log(`+ ${added} new strings from top ${DICT_TOP} dictionary words`);
    } catch (err) {
        console.warn(`Could not read dict (${DICT_DB}): ${err.message}`);
    }
}

console.log(`Voices: ${VOICES.join(', ')}`);
console.log(`Total TTS requests: ${strings.size * VOICES.length}`);
console.log(`Target server: ${SERVER}`);

if (DRY_RUN) {
    console.log('--dry-run set, exiting.');
    process.exit(0);
}

// --- Warm the cache ---------------------------------------------------------
const tasks = [];
for (const voice of VOICES) {
    for (const text of strings) {
        tasks.push({ voice, text });
    }
}

let done = 0;
let hits = 0;
let misses = 0;
let failed = 0;
const startedAt = Date.now();

async function run(task) {
    const ck = CK_TEMPLATE.replace('{voice}', task.voice);
    const url = `${SERVER}/api/tts?text=${encodeURIComponent(task.text)}&lang=vi&voice=${encodeURIComponent(task.voice)}&ck=${encodeURIComponent(ck)}`;
    try {
        const r = await fetch(url, { redirect: 'manual' });
        if (r.status === 302) hits++;
        else if (r.ok) misses++;
        else failed++;
    } catch {
        failed++;
    }
    done++;
    if (done % 25 === 0 || done === tasks.length) {
        const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
        const rate = (done / Math.max(1, parseFloat(elapsed))).toFixed(1);
        process.stdout.write(`\r${done}/${tasks.length}  hit=${hits} miss=${misses} fail=${failed}  ${rate}/s  ${elapsed}s `);
    }
}

async function pool(items, n, worker) {
    const queue = items.slice();
    const workers = Array.from({ length: n }, async () => {
        while (queue.length) {
            const item = queue.shift();
            if (!item) return;
            await worker(item);
        }
    });
    await Promise.all(workers);
}

await pool(tasks, CONCURRENCY, run);

console.log('\nDone.');
console.log(`  hits  (already cached): ${hits}`);
console.log(`  misses (generated)   : ${misses}`);
console.log(`  failures             : ${failed}`);
