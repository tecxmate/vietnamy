#!/usr/bin/env node
// Bulk-renames a TTS_CACHE_VERSION folder in Supabase Storage. Uses the
// Storage move API so files are renamed in place — no re-upload, no Azure
// calls, no re-derive cost. Run once when you want to rename a version
// label without disturbing the cache contents.
//
// Usage:
//   SUPABASE_SERVICE_ROLE_KEY=<key> node scripts/rename-tts-version.mjs \
//       --from=v9-nam-minh-lower --to=v9-processed
//   ... --dry-run                # list only
//   ... --voices=azure-north     # one voice only

const SUPABASE_URL = (process.env.SUPABASE_URL || 'https://kqtxsevnwmfafugxgfxu.supabase.co').replace(/\/+$/, '');
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = process.env.TTS_BUCKET || 'tts-cache';

const args = Object.fromEntries(
    process.argv.slice(2).map(a => {
        const m = a.match(/^--([^=]+)(?:=(.*))?$/);
        return m ? [m[1], m[2] ?? 'true'] : [a, 'true'];
    })
);
const FROM = args.from;
const TO = args.to;
const VOICES = (args.voices || 'azure-north,azure-south').split(',').map(s => s.trim()).filter(Boolean);
const DRY_RUN = args['dry-run'] === 'true';
const CONCURRENCY = Math.max(1, parseInt(args.concurrency, 10) || 8);

if (!KEY) {
    console.error('Set SUPABASE_SERVICE_ROLE_KEY in env.');
    process.exit(1);
}
if (!FROM || !TO) {
    console.error('Usage: --from=<old-version> --to=<new-version>');
    process.exit(1);
}

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

async function moveOne(sourceKey, destKey) {
    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/move`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bucketId: BUCKET, sourceKey, destinationKey: destKey }),
    });
    if (!res.ok) {
        const detail = await res.text().catch(() => '');
        throw new Error(`move ${sourceKey} → ${destKey}: ${res.status} ${detail.slice(0, 200)}`);
    }
}

async function pool(items, n, worker) {
    const queue = items.slice();
    let done = 0;
    const total = items.length;
    const startedAt = Date.now();
    const workers = Array.from({ length: n }, async () => {
        while (queue.length) {
            const item = queue.shift();
            if (!item) return;
            await worker(item);
            done++;
            if (done % 50 === 0 || done === total) {
                const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
                process.stdout.write(`\r  moved ${done}/${total}  ${elapsed}s `);
            }
        }
    });
    await Promise.all(workers);
}

let totalMoved = 0;
let totalFailed = 0;

for (const voice of VOICES) {
    const prefix = `${FROM}/${voice}`;
    process.stdout.write(`Listing ${prefix}/ ... `);
    const files = await listAll(prefix);
    console.log(`${files.length} files`);
    if (files.length === 0) continue;
    if (DRY_RUN) {
        console.log(`  (dry-run) would move into ${TO}/${voice}/`);
        console.log(`  e.g. ${files[0]} → ${files[0].replace(FROM, TO)}`);
        continue;
    }
    const tasks = files.map(src => ({ src, dst: src.replace(`${FROM}/`, `${TO}/`) }));
    await pool(tasks, CONCURRENCY, async ({ src, dst }) => {
        try {
            await moveOne(src, dst);
            totalMoved++;
        } catch (err) {
            totalFailed++;
            if (totalFailed <= 5) console.log(`\n  ${err.message}`);
        }
    });
    console.log('');
}

if (!DRY_RUN) {
    console.log(`\nDone. moved=${totalMoved} failed=${totalFailed}`);
}
