#!/usr/bin/env node
// One-shot backfill: walks every Vietnamese string the app uses, checks
// whether the unversioned source PCM exists in Supabase, and forces an
// Azure regeneration for any that don't. After this runs, every cached
// string has a source PCM — future TTS_CACHE_VERSION bumps re-derive
// locally with zero Azure cost.
//
// Implementation: forces an Azure call by passing ck=migrate-source as the
// cache version, which the server reads via req.query.ck. That bypasses the
// derived hit and falls through to the source check (miss → Azure → save
// both tiers). The unversioned source/<voice>/<sha1>.pcm is what we care
// about; the migrate-source/ derived folder it also creates can be deleted
// from Supabase Storage afterwards.
//
// Usage:
//   node scripts/backfill-tts-source.mjs --server=https://vietnamy.tecxmate.com
//   node scripts/backfill-tts-source.mjs --dry-run             # count only
//   node scripts/backfill-tts-source.mjs --voices=azure-south  # one voice
//   node scripts/backfill-tts-source.mjs --concurrency=3
//
// Cost: ~$3 on S0 for the full ~17K strings (one Azure call each), only
// for strings that don't already have a source PCM.

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, dirname, extname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { execFileSync } from 'child_process';
import crypto from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DATA_DIR = join(ROOT, 'src', 'data');

const VI_KEY_PATTERN = /^(vi|vi_text|vietnamese|target_vi|answer_vi|source_text_vi|template_vi|audio_text|vi_north|vi_south|title_vi|word)$/;

const args = Object.fromEntries(
    process.argv.slice(2).map(a => {
        const m = a.match(/^--([^=]+)(?:=(.*))?$/);
        return m ? [m[1], m[2] ?? 'true'] : [a, 'true'];
    })
);
const SERVER = (args.server || 'https://vietnamy.tecxmate.com').replace(/\/+$/, '');
const BUCKET_URL = (args['bucket-url'] || 'https://kqtxsevnwmfafugxgfxu.supabase.co/storage/v1/object/public/tts-cache').replace(/\/+$/, '');
const VOICES = (args.voices || 'azure-north,azure-south').split(',').map(s => s.trim()).filter(Boolean);
const CONCURRENCY = Math.max(1, parseInt(args.concurrency, 10) || 4);
const DICT_TOP = parseInt(args.dict, 10) || 3000;
const DICT_DB = args['dict-db'] || join(ROOT, 'server', 'databases', 'vn_en_dictionary_high.db');
const DRY_RUN = args['dry-run'] === 'true';
const MIGRATE_VERSION = args['migrate-version'] || 'migrate-source';

// --- String collection (mirrors prebuild-tts.mjs) -----------------------------
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
        catch { return null; }
    }
    if (ext === '.js' || ext === '.mjs') {
        try { return await import(pathToFileURL(path).href); }
        catch { return null; }
    }
    return null;
}

const strings = new Set();
for (const file of listFiles(DATA_DIR)) {
    const data = await loadFile(file);
    if (data) walk(data, strings);
}

if (DICT_TOP > 0) {
    try {
        const sql = `SELECT w.word FROM words w JOIN word_metrics wm ON w.id = wm.word_id WHERE wm.subt_freq > 0 ORDER BY wm.subt_freq DESC LIMIT ${DICT_TOP};`;
        const raw = execFileSync('sqlite3', [DICT_DB, sql], { encoding: 'utf8' });
        for (const line of raw.split('\n')) {
            const w = line.trim();
            if (!w || w.length > 200) continue;
            if (/[-_]/.test(w) || /^[0-9]/.test(w)) continue;
            strings.add(w);
        }
    } catch (err) {
        console.warn(`Could not read dict: ${err.message}`);
    }
}

console.log(`Collected ${strings.size} unique strings.`);
console.log(`Voices: ${VOICES.join(', ')}`);
console.log(`Server: ${SERVER}`);
console.log(`Bucket: ${BUCKET_URL}`);
console.log(`Migrate version tag: ${MIGRATE_VERSION}`);

// --- Plan: which strings need backfill ---------------------------------------
function sourceKey(voice, text) {
    const hash = crypto.createHash('sha1').update(`${voice}|vi|${text}`).digest('hex');
    return `source/${voice}/${hash}.pcm`;
}

const tasks = [];
for (const voice of VOICES) {
    for (const text of strings) {
        tasks.push({ voice, text });
    }
}

console.log(`Total source-PCM keys to check: ${tasks.length}`);

if (DRY_RUN) {
    console.log('--dry-run set, exiting.');
    process.exit(0);
}

// --- Check each source key; if missing, force Azure regen via the API --------
let checked = 0;
let alreadyHave = 0;
let backfilled = 0;
let failed = 0;
const startedAt = Date.now();

async function processTask(task) {
    checked++;
    try {
        const head = await fetch(`${BUCKET_URL}/${sourceKey(task.voice, task.text)}`, { method: 'HEAD' });
        if (head.ok) {
            alreadyHave++;
            return;
        }
    } catch {
        // fall through to regen
    }
    try {
        const url = `${SERVER}/api/tts?text=${encodeURIComponent(task.text)}&lang=vi&voice=${encodeURIComponent(task.voice)}&ck=${encodeURIComponent(MIGRATE_VERSION)}`;
        const r = await fetch(url, { redirect: 'manual' });
        if (r.ok || r.status === 302) {
            backfilled++;
        } else {
            failed++;
        }
    } catch {
        failed++;
    }

    if (checked % 25 === 0 || checked === tasks.length) {
        const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
        const rate = (checked / Math.max(1, parseFloat(elapsed))).toFixed(1);
        process.stdout.write(`\r${checked}/${tasks.length}  have=${alreadyHave} new=${backfilled} fail=${failed}  ${rate}/s  ${elapsed}s `);
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

await pool(tasks, CONCURRENCY, processTask);

console.log('\n\nDone.');
console.log(`  already had source: ${alreadyHave}`);
console.log(`  backfilled:         ${backfilled}`);
console.log(`  failures:           ${failed}`);
console.log('');
console.log('Cleanup: the backfill created a temporary derived folder you can');
console.log(`delete in the Supabase Dashboard:`);
console.log(`  Storage → tts-cache → ${MIGRATE_VERSION}/  → Delete`);
console.log('');
console.log('From now on, bumping TTS_CACHE_VERSION re-derives every cached string');
console.log('locally with no Azure calls.');
