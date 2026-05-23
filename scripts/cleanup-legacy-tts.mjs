#!/usr/bin/env node
// Deletes legacy TTS audio folders from Supabase Storage.
//
// Before the two-tier cache split, all derived WAVs lived at
// tts-cache/<voice>/<sha1>.wav with no version prefix. The introduction of
// TTS_CACHE_VERSION moved active files to <version>/<voice>/<sha1>.wav, but
// the old unversioned files were never deleted — they orphan in the bucket.
//
// This script lists everything directly under tts-cache/azure-north/ and
// tts-cache/azure-south/ (no version prefix) and bulk-deletes them. Other
// folders (the current TTS_CACHE_VERSION, source/, migrate-source/) are
// untouched.
//
// Also supports cleaning up the migrate-source/ throwaway folder that
// scripts/backfill-tts-source.mjs leaves behind.
//
// Usage:
//   SUPABASE_SERVICE_ROLE_KEY=<key> node scripts/cleanup-legacy-tts.mjs
//   SUPABASE_SERVICE_ROLE_KEY=<key> node scripts/cleanup-legacy-tts.mjs --dry-run
//   SUPABASE_SERVICE_ROLE_KEY=<key> node scripts/cleanup-legacy-tts.mjs --prefix=migrate-source/azure-north
//
// Pull the service-role key from Zeabur env vars before running.

const SUPABASE_URL = (process.env.SUPABASE_URL || 'https://kqtxsevnwmfafugxgfxu.supabase.co').replace(/\/+$/, '');
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = process.env.TTS_BUCKET || 'tts-cache';

const args = Object.fromEntries(
    process.argv.slice(2).map(a => {
        const m = a.match(/^--([^=]+)(?:=(.*))?$/);
        return m ? [m[1], m[2] ?? 'true'] : [a, 'true'];
    })
);
const DRY_RUN = args['dry-run'] === 'true';

if (!KEY) {
    console.error('Set SUPABASE_SERVICE_ROLE_KEY in env (read from Zeabur dashboard).');
    process.exit(1);
}

// Folders to clean. The legacy unversioned voice folders + the throwaway
// derived produced by the migration backfill.
const PREFIXES = args.prefix
    ? [args.prefix]
    : [
        'azure-north',
        'azure-south',
        'migrate-source/azure-north',
        'migrate-source/azure-south',
    ];

async function listAll(prefix) {
    const out = [];
    let offset = 0;
    const limit = 1000;
    while (true) {
        const res = await fetch(`${SUPABASE_URL}/storage/v1/object/list/${BUCKET}`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prefix, limit, offset, sortBy: { column: 'name', order: 'asc' } }),
        });
        if (!res.ok) {
            const detail = await res.text().catch(() => '');
            throw new Error(`list ${prefix}: ${res.status} ${detail.slice(0, 200)}`);
        }
        const page = await res.json();
        if (!Array.isArray(page) || page.length === 0) break;
        for (const item of page) {
            if (item.name && item.id !== null) {
                out.push(`${prefix}/${item.name}`);
            }
        }
        if (page.length < limit) break;
        offset += page.length;
    }
    return out;
}

async function deleteChunk(paths) {
    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}`, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prefixes: paths }),
    });
    if (!res.ok) {
        const detail = await res.text().catch(() => '');
        throw new Error(`delete chunk: ${res.status} ${detail.slice(0, 200)}`);
    }
    return res.json();
}

for (const prefix of PREFIXES) {
    process.stdout.write(`Listing ${prefix}/ ... `);
    let paths;
    try {
        paths = await listAll(prefix);
    } catch (err) {
        console.log(`error: ${err.message}`);
        continue;
    }
    console.log(`${paths.length} files`);
    if (paths.length === 0) continue;
    if (DRY_RUN) {
        console.log(`  (dry-run) would delete ${paths.length} files`);
        console.log(`  e.g. ${paths.slice(0, 3).join(', ')}${paths.length > 3 ? ' …' : ''}`);
        continue;
    }
    const CHUNK = 200;
    let deleted = 0;
    for (let i = 0; i < paths.length; i += CHUNK) {
        const chunk = paths.slice(i, i + CHUNK);
        try {
            await deleteChunk(chunk);
            deleted += chunk.length;
            process.stdout.write(`\r  deleted ${deleted}/${paths.length}`);
        } catch (err) {
            console.log(`\n  chunk error: ${err.message}`);
        }
    }
    console.log('');
}

console.log('Done.');
