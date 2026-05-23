#!/usr/bin/env node
// Full Supabase Storage bucket mirror. Recursively walks the entire
// `tts-cache` bucket and downloads every object to a local folder.
// Designed to run as a daily cron on a home PC for disaster-recovery
// snapshots independent of any cloud provider.
//
// Unlike scripts/backup-tts.mjs (which only mirrors files the app
// references via curriculum strings), this script mirrors the bucket
// 1:1 — including any orphaned versions, derived files for strings
// you haven't added to src/data/ yet, etc.
//
// Usage:
//   SUPABASE_SERVICE_ROLE_KEY=<key> node scripts/mirror-bucket.mjs
//   SUPABASE_SERVICE_ROLE_KEY=<key> node scripts/mirror-bucket.mjs --out=/mnt/backups/tts
//   SUPABASE_SERVICE_ROLE_KEY=<key> node scripts/mirror-bucket.mjs --concurrency=8
//   SUPABASE_SERVICE_ROLE_KEY=<key> node scripts/mirror-bucket.mjs --prune    # also delete local files not in cloud
//   SUPABASE_SERVICE_ROLE_KEY=<key> node scripts/mirror-bucket.mjs --dry-run
//
// Cron example (home PC):
//   0 3 * * * cd /home/niko/vietnamy-mirror && \
//     SUPABASE_SERVICE_ROLE_KEY=xxx /usr/bin/node mirror-bucket.mjs \
//     --out=/mnt/backups/tts >> sync.log 2>&1
//
// First run downloads everything (~1.4 GB). Subsequent runs only fetch
// new or changed files — typically minutes.

import { mkdirSync, existsSync, writeFileSync, readdirSync, statSync, rmSync } from 'fs';
import { join, dirname } from 'path';

const SUPABASE_URL = (process.env.SUPABASE_URL || 'https://kqtxsevnwmfafugxgfxu.supabase.co').replace(/\/+$/, '');
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = process.env.TTS_BUCKET || 'tts-cache';

const args = Object.fromEntries(
    process.argv.slice(2).map(a => {
        const m = a.match(/^--([^=]+)(?:=(.*))?$/);
        return m ? [m[1], m[2] ?? 'true'] : [a, 'true'];
    })
);
const OUT_ROOT = args.out || join(process.cwd(), 'tts-mirror');
const CONCURRENCY = Math.max(1, parseInt(args.concurrency, 10) || 8);
const DRY_RUN = args['dry-run'] === 'true';
const PRUNE = args.prune === 'true';

if (!KEY) {
    console.error('Set SUPABASE_SERVICE_ROLE_KEY in env.');
    process.exit(1);
}

const startedAt = Date.now();
const log = (...x) => console.log(`[${new Date().toISOString()}]`, ...x);

// --- Recursive listing -------------------------------------------------------
async function listOne(prefix) {
    const out = { files: [], folders: [] };
    let offset = 0;
    const limit = 1000;
    while (true) {
        const r = await fetch(`${SUPABASE_URL}/storage/v1/object/list/${BUCKET}`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prefix, limit, offset, sortBy: { column: 'name', order: 'asc' } }),
        });
        if (!r.ok) {
            const detail = await r.text().catch(() => '');
            throw new Error(`list ${prefix || '<root>'}: ${r.status} ${detail.slice(0, 200)}`);
        }
        const page = await r.json();
        if (!Array.isArray(page) || page.length === 0) break;
        for (const item of page) {
            const path = prefix ? `${prefix}/${item.name}` : item.name;
            if (item.id === null) {
                out.folders.push(path);
            } else {
                out.files.push({ path, size: item.metadata?.size ?? null });
            }
        }
        if (page.length < limit) break;
        offset += page.length;
    }
    return out;
}

async function walkAll(prefix = '') {
    const all = [];
    const stack = [prefix];
    while (stack.length) {
        const cur = stack.pop();
        const { files, folders } = await listOne(cur);
        for (const f of files) all.push(f);
        for (const d of folders) stack.push(d);
    }
    return all;
}

log(`Walking ${BUCKET}/...`);
const remote = await walkAll('');
log(`Found ${remote.length} files in the bucket.`);

// --- Plan downloads ----------------------------------------------------------
const tasks = [];
let skipped = 0;
for (const file of remote) {
    const local = join(OUT_ROOT, file.path);
    if (existsSync(local)) {
        // If we know the size and it matches, skip. Otherwise size-check.
        const st = statSync(local);
        if (file.size == null || st.size === file.size) {
            skipped++;
            continue;
        }
    }
    tasks.push({ remotePath: file.path, localPath: local });
}

log(`To download: ${tasks.length} new/changed files (${skipped} already up-to-date).`);

if (DRY_RUN) {
    log('--dry-run set, exiting.');
    process.exit(0);
}

// --- Pool download -----------------------------------------------------------
let done = 0;
let failed = 0;
let bytes = 0;

async function downloadOne(task) {
    try {
        const url = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${task.remotePath}`;
        const r = await fetch(url);
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const buf = Buffer.from(await r.arrayBuffer());
        mkdirSync(dirname(task.localPath), { recursive: true });
        writeFileSync(task.localPath, buf);
        bytes += buf.length;
    } catch (err) {
        failed++;
        if (failed <= 5) log(`  failed: ${task.remotePath}: ${err.message}`);
    }
    done++;
    if (done % 100 === 0 || done === tasks.length) {
        const elapsed = ((Date.now() - startedAt) / 1000).toFixed(0);
        const mb = (bytes / 1024 / 1024).toFixed(1);
        log(`  ${done}/${tasks.length}  ${mb} MB  ${elapsed}s`);
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

if (tasks.length > 0) {
    await pool(tasks, CONCURRENCY, downloadOne);
}

// --- Optional prune: remove local files not in cloud --------------------------
let pruned = 0;
if (PRUNE && existsSync(OUT_ROOT)) {
    const remoteSet = new Set(remote.map(f => f.path));
    function walkLocal(dir, relBase = '') {
        for (const name of readdirSync(dir)) {
            const full = join(dir, name);
            const st = statSync(full);
            const rel = relBase ? `${relBase}/${name}` : name;
            if (st.isDirectory()) {
                walkLocal(full, rel);
            } else if (!remoteSet.has(rel)) {
                rmSync(full);
                pruned++;
            }
        }
    }
    walkLocal(OUT_ROOT);
    log(`Pruned ${pruned} local files not present in cloud.`);
}

const totalElapsed = ((Date.now() - startedAt) / 1000).toFixed(0);
const totalMb = (bytes / 1024 / 1024).toFixed(1);
log('Done.');
log(`  total remote files: ${remote.length}`);
log(`  downloaded:         ${done - failed} (${totalMb} MB)`);
log(`  already up-to-date: ${skipped}`);
log(`  failures:           ${failed}`);
if (PRUNE) log(`  pruned locally:     ${pruned}`);
log(`  elapsed:            ${totalElapsed}s`);
