#!/usr/bin/env node
// Downloads every TTS audio file referenced by the curriculum from the public
// Supabase Storage bucket into a local folder. Lets you keep a cold archive
// independent of Supabase (commit to a private repo, sync to external drive,
// upload to another cloud, etc.).
//
// The script is deterministic: it computes the same sha1 key the server uses
// (sha1(voice|lang|text)), so no listing/credentials are needed — we just hit
// each known public URL.
//
// Usage:
//   node scripts/backup-tts.mjs                                # default: out=./tts-backup
//   node scripts/backup-tts.mjs --out=/path/to/backup
//   node scripts/backup-tts.mjs --voices=azure-north
//   node scripts/backup-tts.mjs --bucket-url=https://<ref>.supabase.co/storage/v1/object/public/tts-cache
//   node scripts/backup-tts.mjs --concurrency=8

import { readFileSync, readdirSync, statSync, mkdirSync, existsSync, writeFileSync } from 'fs';
import { join, dirname, extname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import crypto from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DATA_DIR = join(ROOT, 'src', 'data');

const VI_KEY_PATTERN = /^(vi|vi_text|vietnamese|target_vi|answer_vi|source_text_vi|template_vi|audio_text|vi_north|vi_south)$/;

const args = Object.fromEntries(
    process.argv.slice(2).map(a => {
        const m = a.match(/^--([^=]+)(?:=(.*))?$/);
        return m ? [m[1], m[2] ?? 'true'] : [a, 'true'];
    })
);
const OUT_DIR = args.out || join(ROOT, 'tts-backup');
const VOICES = (args.voices || 'azure-north,azure-south').split(',').map(s => s.trim()).filter(Boolean);
const BUCKET_URL = (args['bucket-url'] || 'https://kqtxsevnwmfafugxgfxu.supabase.co/storage/v1/object/public/tts-cache').replace(/\/+$/, '');
const CONCURRENCY = Math.max(1, parseInt(args.concurrency, 10) || 8);

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

function cacheKey(voice, lang, text) {
    const hash = crypto.createHash('sha1').update(`${voice}|${lang}|${text}`).digest('hex');
    const ext = voice === 'google' ? 'mp3' : 'wav';
    return `${voice}/${hash}.${ext}`;
}

// --- Collect strings ---
const strings = new Set();
for (const file of listFiles(DATA_DIR)) {
    const data = await loadFile(file);
    if (data) walk(data, strings);
}

console.log(`Collected ${strings.size} unique strings.`);
console.log(`Voices: ${VOICES.join(', ')}`);
console.log(`Bucket: ${BUCKET_URL}`);
console.log(`Output: ${OUT_DIR}`);

if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

const tasks = [];
for (const voice of VOICES) {
    const voiceDir = join(OUT_DIR, voice);
    if (!existsSync(voiceDir)) mkdirSync(voiceDir, { recursive: true });
    for (const text of strings) {
        const key = cacheKey(voice, 'vi', text);
        const localPath = join(OUT_DIR, key);
        tasks.push({ key, localPath, voice, text });
    }
}

let done = 0;
let downloaded = 0;
let cachedLocal = 0;
let missing = 0;
let failed = 0;
const startedAt = Date.now();
const manifest = [];

async function run(task) {
    if (existsSync(task.localPath)) {
        cachedLocal++;
        manifest.push({ key: task.key, voice: task.voice, text: task.text, source: 'local' });
        return;
    }
    try {
        const r = await fetch(`${BUCKET_URL}/${task.key}`);
        if (r.status === 200) {
            const buf = Buffer.from(await r.arrayBuffer());
            writeFileSync(task.localPath, buf);
            downloaded++;
            manifest.push({ key: task.key, voice: task.voice, text: task.text, source: 'downloaded', bytes: buf.length });
        } else if (r.status === 404 || r.status === 400) {
            missing++;
        } else {
            failed++;
        }
    } catch {
        failed++;
    }
    done++;
    if (done % 100 === 0 || done === tasks.length) {
        const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
        process.stdout.write(`\r${done}/${tasks.length}  dl=${downloaded} local=${cachedLocal} miss=${missing} fail=${failed}  ${elapsed}s `);
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

// Write a manifest for reference (text → file mapping).
writeFileSync(join(OUT_DIR, 'manifest.json'), JSON.stringify({
    generated: new Date().toISOString(),
    bucket: BUCKET_URL,
    voices: VOICES,
    stats: { total: tasks.length, downloaded, cachedLocal, missing, failed },
    files: manifest,
}, null, 2));

console.log('\nDone.');
console.log(`  downloaded:        ${downloaded}`);
console.log(`  already on disk:   ${cachedLocal}`);
console.log(`  missing in bucket: ${missing}  (will regenerate on next user request)`);
console.log(`  failures:          ${failed}`);
console.log(`Manifest saved to ${join(OUT_DIR, 'manifest.json')}`);
