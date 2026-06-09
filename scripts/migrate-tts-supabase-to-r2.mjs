#!/usr/bin/env node
// Copies the full Supabase Storage TTS bucket to Cloudflare R2, preserving keys.
//
// Usage:
//   node scripts/migrate-tts-supabase-to-r2.mjs --dry-run
//   node scripts/migrate-tts-supabase-to-r2.mjs --concurrency=8
//   node scripts/migrate-tts-supabase-to-r2.mjs --prefix=v9-processed/azure-north
//   node scripts/migrate-tts-supabase-to-r2.mjs --limit=20
//
// Required env:
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
//   TTS_BUCKET
//   R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY

import crypto from 'crypto';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');

function loadEnvFile(path) {
    if (!existsSync(path)) return;
    for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
        if (!match) continue;
        const [, key, rawValue] = match;
        if (process.env[key] !== undefined) continue;
        process.env[key] = rawValue.replace(/^['"]|['"]$/g, '');
    }
}

loadEnvFile(join(ROOT, '.env.local'));
loadEnvFile(join(ROOT, '.env'));

const args = Object.fromEntries(
    process.argv.slice(2).map(arg => {
        const match = arg.match(/^--([^=]+)(?:=(.*))?$/);
        return match ? [match[1], match[2] ?? 'true'] : [arg, 'true'];
    })
);

const SUPABASE_URL = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').replace(/\/+$/, '');
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const TTS_BUCKET = process.env.TTS_BUCKET || 'tts-cache';
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || '';
const R2_ENDPOINT = (process.env.R2_ENDPOINT || (R2_ACCOUNT_ID ? `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com` : '')).replace(/\/+$/, '');
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || '';
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || '';
const CONCURRENCY = Math.max(1, Number.parseInt(args.concurrency, 10) || 6);
const PREFIX = args.prefix && args.prefix !== 'true' ? args.prefix.replace(/^\/+|\/+$/g, '') : '';
const DRY_RUN = args['dry-run'] === 'true';
const FORCE = args.force === 'true';
const LIMIT = args.limit ? Math.max(0, Number.parseInt(args.limit, 10) || 0) : 0;

function requireEnv(name, value) {
    if (!value) {
        console.error(`Missing ${name}. Fill it in .env or export it before running.`);
        process.exit(1);
    }
}

requireEnv('SUPABASE_URL', SUPABASE_URL);
requireEnv('SUPABASE_SERVICE_ROLE_KEY', SUPABASE_SERVICE_ROLE_KEY);
requireEnv('R2_ENDPOINT', R2_ENDPOINT);
requireEnv('R2_ACCESS_KEY_ID', R2_ACCESS_KEY_ID);
requireEnv('R2_SECRET_ACCESS_KEY', R2_SECRET_ACCESS_KEY);

const startedAt = Date.now();
const log = (...items) => console.log(`[${new Date().toISOString()}]`, ...items);

function encodeObjectKey(key) {
    return key.split('/').map(part => encodeURIComponent(part)).join('/');
}

function hmacSha256(key, value, encoding) {
    return crypto.createHmac('sha256', key).update(value).digest(encoding);
}

function sha256(value) {
    return crypto.createHash('sha256').update(value || '').digest('hex');
}

function r2SignedHeaders(method, url, headers = {}, body = null) {
    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateStamp = amzDate.slice(0, 8);
    const payloadHash = sha256(body);
    const allHeaders = {
        ...headers,
        host: url.host,
        'x-amz-content-sha256': payloadHash,
        'x-amz-date': amzDate,
    };
    const canonicalHeaderEntries = Object.entries(allHeaders)
        .map(([key, value]) => [key.toLowerCase(), String(value).trim().replace(/\s+/g, ' ')])
        .sort(([a], [b]) => a.localeCompare(b));
    const canonicalHeaders = canonicalHeaderEntries.map(([key, value]) => `${key}:${value}\n`).join('');
    const signedHeaders = canonicalHeaderEntries.map(([key]) => key).join(';');
    const canonicalRequest = [
        method,
        url.pathname,
        '',
        canonicalHeaders,
        signedHeaders,
        payloadHash,
    ].join('\n');
    const credentialScope = `${dateStamp}/auto/s3/aws4_request`;
    const stringToSign = [
        'AWS4-HMAC-SHA256',
        amzDate,
        credentialScope,
        sha256(canonicalRequest),
    ].join('\n');
    const dateKey = hmacSha256(`AWS4${R2_SECRET_ACCESS_KEY}`, dateStamp);
    const regionKey = hmacSha256(dateKey, 'auto');
    const serviceKey = hmacSha256(regionKey, 's3');
    const signingKey = hmacSha256(serviceKey, 'aws4_request');
    const signature = hmacSha256(signingKey, stringToSign, 'hex');
    return {
        ...headers,
        'x-amz-content-sha256': payloadHash,
        'x-amz-date': amzDate,
        Authorization: `AWS4-HMAC-SHA256 Credential=${R2_ACCESS_KEY_ID}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
    };
}

async function r2FetchObject(key, { method = 'GET', headers = {}, body = null } = {}) {
    const url = new URL(`${R2_ENDPOINT}/${TTS_BUCKET}/${encodeObjectKey(key)}`);
    return fetch(url, {
        method,
        headers: r2SignedHeaders(method, url, headers, body),
        body,
    });
}

async function listSupabaseOne(prefix) {
    const out = { files: [], folders: [] };
    let offset = 0;
    const limit = 1000;
    while (true) {
        const res = await fetch(`${SUPABASE_URL}/storage/v1/object/list/${TTS_BUCKET}`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prefix, limit, offset, sortBy: { column: 'name', order: 'asc' } }),
        });
        if (!res.ok) {
            const detail = await res.text().catch(() => '');
            throw new Error(`Supabase list ${prefix || '<root>'}: ${res.status} ${detail.slice(0, 200)}`);
        }
        const page = await res.json();
        if (!Array.isArray(page) || page.length === 0) break;
        for (const item of page) {
            const path = prefix ? `${prefix}/${item.name}` : item.name;
            if (item.id === null) out.folders.push(path);
            else out.files.push({ path, size: item.metadata?.size ?? null, mimeType: item.metadata?.mimetype || null });
        }
        if (page.length < limit) break;
        offset += page.length;
    }
    return out;
}

async function walkSupabase(prefix = '') {
    const files = [];
    const stack = [prefix];
    while (stack.length) {
        const current = stack.pop();
        const result = await listSupabaseOne(current);
        files.push(...result.files);
        stack.push(...result.folders);
    }
    return files;
}

function contentTypeForPath(path) {
    if (path.endsWith('.mp3')) return 'audio/mpeg';
    if (path.endsWith('.wav')) return 'audio/wav';
    if (path.endsWith('.pcm')) return 'application/octet-stream';
    return 'application/octet-stream';
}

async function r2HasObject(path) {
    if (FORCE) return false;
    const res = await r2FetchObject(path, { method: 'HEAD' });
    if (res.ok) return true;
    if (res.status === 404) return false;
    const detail = await res.text().catch(() => '');
    throw new Error(`R2 HEAD ${path}: ${res.status} ${detail.slice(0, 160)}`);
}

async function copyOne(file) {
    const path = file.path;
    if (await r2HasObject(path)) return { status: 'skipped', bytes: 0 };
    if (DRY_RUN) return { status: 'planned', bytes: file.size || 0 };

    const sourceUrl = `${SUPABASE_URL}/storage/v1/object/public/${TTS_BUCKET}/${path}`;
    const source = await fetch(sourceUrl);
    if (!source.ok) throw new Error(`Supabase GET ${path}: ${source.status}`);
    const buffer = Buffer.from(await source.arrayBuffer());
    const put = await r2FetchObject(path, {
        method: 'PUT',
        headers: {
            'Content-Type': file.mimeType || contentTypeForPath(path),
            'Cache-Control': 'public, max-age=31536000, immutable',
        },
        body: buffer,
    });
    if (!put.ok) {
        const detail = await put.text().catch(() => '');
        throw new Error(`R2 PUT ${path}: ${put.status} ${detail.slice(0, 160)}`);
    }
    return { status: 'copied', bytes: buffer.length };
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

log(`Listing Supabase ${TTS_BUCKET}/${PREFIX || ''}...`);
let files = await walkSupabase(PREFIX);
if (LIMIT) files = files.slice(0, LIMIT);
log(`Found ${files.length} objects. R2 endpoint: ${R2_ENDPOINT}`);
if (DRY_RUN) log('Dry run: no objects will be uploaded.');

let copied = 0;
let skipped = 0;
let planned = 0;
let failed = 0;
let bytes = 0;
let completed = 0;

await pool(files, CONCURRENCY, async file => {
    try {
        const result = await copyOne(file);
        if (result.status === 'copied') copied++;
        if (result.status === 'skipped') skipped++;
        if (result.status === 'planned') planned++;
        bytes += result.bytes || 0;
    } catch (err) {
        failed++;
        if (failed <= 10) log(`Failed ${file.path}: ${err.message}`);
    } finally {
        completed++;
        if (completed % 100 === 0 || completed === files.length) {
            const mb = (bytes / 1024 / 1024).toFixed(1);
            const elapsed = ((Date.now() - startedAt) / 1000).toFixed(0);
            log(`${completed}/${files.length} copied=${copied} skipped=${skipped} planned=${planned} failed=${failed} bytes=${mb}MB elapsed=${elapsed}s`);
        }
    }
});

const totalMb = (bytes / 1024 / 1024).toFixed(1);
log('Done.');
log(`  copied:  ${copied}`);
log(`  skipped: ${skipped}`);
log(`  planned: ${planned}`);
log(`  failed:  ${failed}`);
log(`  bytes:   ${totalMb} MB`);
if (failed > 0) process.exitCode = 1;
