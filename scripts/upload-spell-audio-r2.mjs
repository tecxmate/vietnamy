#!/usr/bin/env node
// Upload pre-rendered Spelling Playground clips to Cloudflare R2 and update the
// client manifest with exactly the assets that exist locally.
//
// Usage:
//   set -a; source .env.local; set +a
//   node scripts/upload-spell-audio-r2.mjs --accent=north --in=./spell_audio_out
//   node scripts/upload-spell-audio-r2.mjs --dry-run
//
// Env:
//   R2_ENDPOINT or R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY
//   R2_PUBLIC_BASE_URL must point at the public bucket/custom domain for playback.

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { putR2Object, r2PublicUrl } from '../server/r2Storage.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const GEN_LIST = join(ROOT, 'content', 'spell_gen_list.json');
const MANIFEST = join(ROOT, 'content', 'spell_audio_manifest.json');

const args = Object.fromEntries(
    process.argv.slice(2).map((a) => {
        const m = a.match(/^--([^=]+)(?:=(.*))?$/);
        return m ? [m[1], m[2] ?? 'true'] : [a, 'true'];
    })
);

const accent = args.accent || 'north';
const inputDir = args.in || join(ROOT, 'spell_audio_out');
const ext = (args.ext || 'mp3').replace(/^\./, '');
const bucket = args.bucket || process.env.R2_SPELL_BUCKET || process.env.R2_BUCKET || process.env.TTS_BUCKET || 'tts-cache';
const prefix = (args.prefix || `spell/${accent}`).replace(/^\/+|\/+$/g, '');
const concurrency = Math.max(1, parseInt(args.concurrency, 10) || 8);
const dryRun = args['dry-run'] === 'true';
const writeManifest = args.manifest !== 'false';

const contentType = ext === 'mp3' ? 'audio/mpeg' : ext === 'wav' ? 'audio/wav' : 'application/octet-stream';
const gen = JSON.parse(readFileSync(GEN_LIST, 'utf8'));
const localAssets = [];

for (const item of gen.items || []) {
    const path = join(inputDir, `${item.slug}.${ext}`);
    if (existsSync(path)) localAssets.push({ ...item, path });
}

console.log(`generation list: ${(gen.items || []).length} items`);
console.log(`local assets:    ${localAssets.length} .${ext} files in ${inputDir}`);
console.log(`target:          r2://${bucket}/${prefix}/`);

if (localAssets.length === 0) {
    console.error('No local assets found. Generate clips on the M5 first or pass --in=/path/to/output.');
    process.exit(1);
}

if (dryRun) {
    console.log('--dry-run set, not uploading or writing manifest.');
    process.exit(0);
}

let done = 0;
let failed = 0;
const startedAt = Date.now();

async function uploadOne(item) {
    try {
        const body = readFileSync(item.path);
        await putR2Object({
            bucket,
            key: `${prefix}/${item.slug}.${ext}`,
            body,
            contentType,
        });
    } catch (err) {
        failed++;
        if (failed <= 10) console.warn(`failed ${item.slug}: ${err.message}`);
    }
    done++;
    if (done % 100 === 0 || done === localAssets.length) {
        const elapsed = ((Date.now() - startedAt) / 1000).toFixed(0);
        console.log(`${done}/${localAssets.length} uploaded, failed=${failed}, elapsed=${elapsed}s`);
    }
}

async function pool(items, n, worker) {
    const queue = items.slice();
    await Promise.all(Array.from({ length: n }, async () => {
        while (queue.length) {
            const item = queue.shift();
            if (item) await worker(item);
        }
    }));
}

await pool(localAssets, concurrency, uploadOne);

if (failed > 0) {
    console.error(`Upload finished with ${failed} failures. Manifest was not changed.`);
    process.exit(1);
}

if (writeManifest) {
    const previous = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, 'utf8')) : {};
    const accentBaseUrls = { ...(previous.accentBaseUrls || {}) };
    const publicPrefix = r2PublicUrl(prefix);
    if (!publicPrefix) {
        console.warn('R2_PUBLIC_BASE_URL is not set; manifest will not include an R2 base URL.');
    } else {
        accentBaseUrls[accent] = publicPrefix;
    }
    const accents = Array.from(new Set([...(previous.accents || []), accent])).sort();
    const manifest = {
        note: 'Pre-generated audio assets for the Spelling Playground. Keys listed here are played from accentBaseUrls[accent] when present, otherwise from /audio/spell/<accent>/. Missing keys fall back to /api/tts.',
        ext,
        accents,
        accentBaseUrls,
        assets: localAssets.map((item) => item.slug).sort(),
    };
    writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);
    console.log(`wrote ${MANIFEST}`);
}
