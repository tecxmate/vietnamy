#!/usr/bin/env node
// Walks curriculum + content data files, collects unique Vietnamese strings,
// then warms the TTS bucket by hitting /api/tts for each (text, voice).
// The server uploads to Supabase Storage on first miss; subsequent hits are
// 302 redirects to the CDN.
//
// Usage:
//   node scripts/prebuild-tts.mjs                          # north + south
//   node scripts/prebuild-tts.mjs --voices=azure-north     # one voice
//   node scripts/prebuild-tts.mjs --server=https://...     # remote server
//   node scripts/prebuild-tts.mjs --concurrency=3
//   node scripts/prebuild-tts.mjs --dry-run                # print counts only
//
// Requires the server to be running with SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, dirname, extname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DATA_DIR = join(ROOT, 'src', 'data');

const VI_KEY_PATTERN = /^(vi|vi_text|vietnamese|target_vi|answer_vi|source_text_vi|template_vi|audio_text|vi_north|vi_south)$/;

// --- CLI args ---------------------------------------------------------------
const args = Object.fromEntries(
    process.argv.slice(2).map(a => {
        const m = a.match(/^--([^=]+)(?:=(.*))?$/);
        return m ? [m[1], m[2] ?? 'true'] : [a, 'true'];
    })
);
const SERVER = (args.server || process.env.TTS_SERVER_URL || 'http://localhost:3001').replace(/\/+$/, '');
const VOICES = (args.voices || 'azure-north,azure-south').split(',').map(s => s.trim()).filter(Boolean);
const CONCURRENCY = Math.max(1, parseInt(args.concurrency, 10) || 5);
const DRY_RUN = args['dry-run'] === 'true';

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
    const url = `${SERVER}/api/tts?text=${encodeURIComponent(task.text)}&lang=vi&voice=${encodeURIComponent(task.voice)}`;
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
