#!/usr/bin/env node
/**
 * validate-api-routes.mjs — every /api path the client calls must have a route
 * in the target that actually serves production.
 *
 * This bug class has shipped twice. `/api/tts` was dead on every Vercel deploy
 * until #43; the audit that followed (issue #49) found six more. The cause is
 * structural, not careless: `server/server.js` is the Docker/`npm start` server
 * and registers everything, while Vercel serves `api/[...path].js` — so a route
 * added to server.js works locally, passes review, and 404s in production.
 *
 * Nothing compared the two. This does.
 *
 * It is a ratchet, not a gate on the existing debt: the endpoints already known
 * to be missing are listed in KNOWN_GAPS with the issue that tracks them, so CI
 * stays green today. It fails when a NEW client call has no serverless route,
 * and it also fails when a KNOWN_GAPS entry starts resolving — that entry has
 * been fixed and must be deleted, or the ratchet silently loosens.
 *
 *   node scripts/validate-api-routes.mjs
 */
import { readFileSync, readdirSync, statSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join, relative } from 'path';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

/**
 * Endpoints the client calls that the serverless app does not serve, with the
 * issue tracking each. Deleting an entry is how a fix gets locked in.
 *
 * The four dictionary routes read the SQLite files in server/databases/
 * (100MB+, not in git), so they can't simply be ported into a function bundle —
 * issue #49 lays out the two architectures. The rest need no dictionary and are
 * portable whenever someone picks them up.
 */
const KNOWN_GAPS = {
    '/api/search': 'issue #49 — needs the dictionary DB (architecture decision)',
    '/api/suggest': 'issue #49 — needs the dictionary DB (architecture decision)',
    '/api/word-popup': 'issue #49 — needs the dictionary DB (architecture decision)',
    '/api/segment': 'issue #49 — needs the dictionary DB (architecture decision)',
    '/api/tutor': 'issue #49 — portable, no dictionary needed',
    // tone-samples writes to a local SQLite file; a serverless function's disk
    // is ephemeral, so porting it as-is would silently discard every sample. It
    // needs a hosted store first — it is NOT portable, contrary to issue #49.
    '/api/tone-samples': 'issue #49 — needs a hosted store, not portable as-is',
};

// ─── What the client calls ─────────────────────────────────────────
// Matches a literal path in a string or template literal: fetch('/api/search'),
// `/api/messages/render`, "/api/tts". A template hole (`/api/${x}`) truncates
// the match at the hole, which is the right behaviour — the static prefix is
// what has to be routed.
const CALL = /['"`](\/api\/[a-zA-Z0-9/_-]*)/g;

function walk(dir, out = []) {
    for (const name of readdirSync(dir)) {
        if (name === 'node_modules' || name.startsWith('.')) continue;
        const p = join(dir, name);
        if (statSync(p).isDirectory()) walk(p, out);
        else if (/\.(js|jsx|mjs)$/.test(p)) out.push(p);
    }
    return out;
}

const callers = new Map(); // path -> Set of files
for (const file of walk(join(ROOT, 'src'))) {
    const src = readFileSync(file, 'utf8');
    for (const m of src.matchAll(CALL)) {
        const path = m[1].replace(/\/$/, '');
        if (path === '/api' || path === '/api/') continue;
        if (!callers.has(path)) callers.set(path, new Set());
        callers.get(path).add(relative(ROOT, file));
    }
}

// ─── What the serverless target serves ─────────────────────────────
// `app.post(\n  '/api/pronunciation',` is real in this codebase, so the path may
// not be on the same line as the method — match across whitespace.
const ROUTE = /app\.(get|post|put|delete|all|use)\s*\(\s*['"`](\/api\/[^'"`]*)/g;

// Routes aren't all declared in api/*.js. The serverless app also does
//   import { mountSyncRoutes } from '../server/syncRoutes.js';
//   mountSyncRoutes(app, …);
// so a scanner that reads only api/*.js reports /api/sync/* as missing when it
// is served. Follow the imports transitively and scan those modules too.
const IMPORT = /from\s+['"](\.[^'"]+)['"]/g;

const served = new Set();
const scanned = new Set();

function scanForRoutes(file) {
    if (scanned.has(file)) return;
    scanned.add(file);
    let src;
    try {
        src = readFileSync(file, 'utf8');
    } catch {
        return; // extensionless or unresolvable import — nothing to scan
    }
    for (const m of src.matchAll(ROUTE)) served.add(m[2].replace(/\/$/, ''));
    for (const m of src.matchAll(IMPORT)) {
        const target = join(dirname(file), m[1]);
        scanForRoutes(/\.(js|mjs)$/.test(target) ? target : `${target}.js`);
    }
}

const apiDir = join(ROOT, 'api');
for (const file of readdirSync(apiDir)) {
    if (/\.(js|mjs)$/.test(file)) scanForRoutes(join(apiDir, file));
}

// A file at api/<name>.js is itself a serverless function at /api/<name> when
// vercel.json rewrites to it directly, rather than through the catch-all.
const vercel = JSON.parse(readFileSync(join(ROOT, 'vercel.json'), 'utf8'));
for (const rw of vercel.rewrites || []) {
    if (typeof rw.source === 'string' && !rw.source.includes('(') && rw.source.startsWith('/api/')) {
        served.add(rw.source.replace(/\/$/, ''));
    }
}

/** Does some registered route serve this path (exactly, or as its prefix)? */
const isServed = (path) => {
    if (served.has(path)) return true;
    // '/api/push' is covered by '/api/push/subscribe' only in the sense that the
    // client's static prefix is a truncated template hole; treat a registered
    // route that extends the called prefix as coverage.
    for (const r of served) if (r.startsWith(path + '/')) return true;
    // Conversely a mounted prefix serves everything beneath it.
    for (const r of served) if (path.startsWith(r + '/')) return true;
    return false;
};

// ─── Compare ───────────────────────────────────────────────────────
const missing = [];
const fixed = [];

for (const [path, files] of [...callers].sort()) {
    if (isServed(path)) {
        if (KNOWN_GAPS[path]) fixed.push(path);
    } else if (!KNOWN_GAPS[path]) {
        missing.push({ path, files: [...files] });
    }
}

let failed = false;

if (missing.length) {
    failed = true;
    console.error('\n✗ client calls an /api path with no serverless route:\n');
    for (const { path, files } of missing) {
        console.error(`  ${path}`);
        console.error(`      called from ${files.slice(0, 3).join(', ')}${files.length > 3 ? ` (+${files.length - 3})` : ''}`);
    }
    console.error('\n  Add the route to api/[...path].js — server/server.js is the Docker');
    console.error('  server and is NOT what Vercel runs. If it genuinely cannot be ported');
    console.error('  yet, add it to KNOWN_GAPS with the issue tracking it.\n');
}

if (fixed.length) {
    failed = true;
    console.error('\n✗ these are listed in KNOWN_GAPS but now have a route:\n');
    for (const p of fixed) console.error(`  ${p}`);
    console.error('\n  Delete them from KNOWN_GAPS so the fix is locked in.\n');
}

if (!failed) {
    const gaps = Object.keys(KNOWN_GAPS).filter(p => callers.has(p));
    console.log(`✓ API route coverage OK — ${callers.size} client-called paths, ` +
        `${served.size} routes registered in the Vercel target`);
    if (gaps.length) {
        console.log(`  ${gaps.length} known gap(s) still unrouted in production, tracked in issue #49:`);
        for (const p of gaps) console.log(`    ${p.padEnd(20)} ${KNOWN_GAPS[p]}`);
    }
}

process.exit(failed ? 1 : 0);
