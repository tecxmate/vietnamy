#!/usr/bin/env node
/**
 * validate-upload-auth.mjs — the two file-upload routes must not be open.
 *
 * `/api/mascot-upload` writes caller-supplied bytes to a PUBLIC bucket under a
 * caller-chosen content type. It shipped with no auth at all, in both the
 * Express server (server/server.js) and the Vercel function (api/mascot-upload.js),
 * and its type table included image/svg+xml — i.e. anyone on the internet could
 * park a script on the asset origin. This locks both halves of that shut:
 *
 *   1. no admin token          → 401
 *   2. wrong admin token       → 401
 *   3. right token, type=svg   → 415  (svg is gone from the table)
 *   4. right token, type=lottie→ past the gate (a legitimate admin still works)
 *
 * `/api/feedback-screenshot` stays open on purpose — learners attach
 * screenshots to in-app bug reports and hold no token — so what is asserted
 * there is that it is rate limited per IP.
 *
 *   node scripts/validate-upload-auth.mjs
 */
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const TOKEN = 'test-admin-token-do-not-use-in-production';
const PORT = Number(process.env.UPLOAD_AUTH_TEST_PORT || 3987);
const BASE = `http://127.0.0.1:${PORT}`;

let passed = 0;
const failures = [];

async function check(name, fn) {
    try {
        await fn();
        passed++;
        console.log(`  ✓ ${name}`);
    } catch (err) {
        failures.push(`${name}: ${err.message}`);
        console.log(`  ✗ ${name}\n      ${err.message}`);
    }
}

// ── 1. the shared guard itself ──────────────────────────────────────────────
// Imported lazily so the module reads process.env at call time, which is the
// whole point of the lazy reads in adminAuth.js.
const { constantTimeEqual, hasValidAdminToken, requireAdminToken } = await import(
    join(ROOT, 'server/adminAuth.js')
);

const fakeRes = () => {
    const res = { statusCode: null, body: null };
    res.status = (code) => { res.statusCode = code; return res; };
    res.json = (body) => { res.body = body; return res; };
    return res;
};

console.log('server/adminAuth.js');

await check('constantTimeEqual matches equal strings and rejects unequal ones', () => {
    assert.equal(constantTimeEqual('abc', 'abc'), true);
    assert.equal(constantTimeEqual('abc', 'abd'), false);
    // Different lengths must not throw — timingSafeEqual on raw buffers would.
    assert.equal(constantTimeEqual('abc', 'abcdefghijklmnop'), false);
    assert.equal(constantTimeEqual('', ''), true);
});

await check('an unset MAIL_ADMIN_TOKEN denies everyone', () => {
    delete process.env.MAIL_ADMIN_TOKEN;
    assert.equal(hasValidAdminToken({ headers: {}, query: {} }), false);
    // Including a caller who presents an empty token, which must not match ''.
    assert.equal(hasValidAdminToken({ headers: { authorization: 'Bearer ' }, query: {} }), false);
    const res = fakeRes();
    assert.equal(requireAdminToken({ headers: {}, query: {} }, res), false);
    assert.equal(res.statusCode, 401);
});

await check('all three credential shapes are accepted', () => {
    process.env.MAIL_ADMIN_TOKEN = TOKEN;
    assert.equal(hasValidAdminToken({ headers: { authorization: `Bearer ${TOKEN}` }, query: {} }), true);
    assert.equal(hasValidAdminToken({ headers: { 'x-mail-admin-token': TOKEN }, query: {} }), true);
    assert.equal(hasValidAdminToken({ headers: {}, query: { token: TOKEN } }), true);
    assert.equal(hasValidAdminToken({ headers: { authorization: `Bearer ${TOKEN}x` }, query: {} }), false);
});

await check('the localhost escape hatch only applies while no token is set', () => {
    process.env.MAIL_ADMIN_TOKEN = TOKEN;
    const res = fakeRes();
    assert.equal(requireAdminToken({ headers: {}, query: {} }, res, { allowLocalWhenUnconfigured: true }), false);
    assert.equal(res.statusCode, 401);

    delete process.env.MAIL_ADMIN_TOKEN;
    assert.equal(requireAdminToken({ headers: {}, query: {} }, fakeRes(), { allowLocalWhenUnconfigured: true }), true);
});

// ── 2. the Vercel function ──────────────────────────────────────────────────
console.log('api/mascot-upload.js (serverless handler)');

const { default: mascotHandler } = await import(join(ROOT, 'api/mascot-upload.js'));

async function callMascotHandler({ token, type }) {
    const res = fakeRes();
    await mascotHandler({
        method: 'POST',
        headers: token ? { authorization: `Bearer ${token}` } : {},
        query: { type, filename: 'probe.bin' },
        body: Buffer.from('probe'),
    }, res);
    return res;
}

await check('an anonymous upload is rejected', async () => {
    process.env.MAIL_ADMIN_TOKEN = TOKEN;
    const res = await callMascotHandler({ token: '', type: 'lottie' });
    assert.equal(res.statusCode, 401);
});

await check('a wrong token is rejected', async () => {
    process.env.MAIL_ADMIN_TOKEN = TOKEN;
    const res = await callMascotHandler({ token: 'nope', type: 'lottie' });
    assert.equal(res.statusCode, 401);
});

await check('svg is no longer an accepted type', async () => {
    process.env.MAIL_ADMIN_TOKEN = TOKEN;
    const res = await callMascotHandler({ token: TOKEN, type: 'svg' });
    assert.equal(res.statusCode, 415);
});

await check('a real admin upload still gets through the gate', async () => {
    process.env.MAIL_ADMIN_TOKEN = TOKEN;
    const res = await callMascotHandler({ token: TOKEN, type: 'lottie' });
    // Storage is not configured in a test environment, so the handler gets as
    // far as the storage call and reports that. Anything but 401/415 proves the
    // guard let a legitimate admin past.
    assert.notEqual(res.statusCode, 401);
    assert.notEqual(res.statusCode, 415);
});

// ── 3. the live Express server ──────────────────────────────────────────────
// This is the load-bearing one: server/server.js is what the mobile app talks
// to. Booting it needs node_modules and server/databases/*.db; when they are
// missing the HTTP leg is skipped loudly rather than reported as a pass.
console.log('server/server.js (live HTTP)');

const child = spawn(process.execPath, [join(ROOT, 'server/server.js')], {
    cwd: ROOT,
    env: {
        ...process.env,
        PORT: String(PORT),
        MAIL_ADMIN_TOKEN: TOKEN,
        MAIL_ADMIN_ALLOW_LOCAL: 'false',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
});
let bootLog = '';
child.stdout.on('data', (b) => { bootLog += b; });
child.stderr.on('data', (b) => { bootLog += b; });
process.on('exit', () => { try { child.kill('SIGTERM'); } catch { /* already gone */ } });

async function waitForServer(deadlineMs = 45000) {
    const until = Date.now() + deadlineMs;
    while (Date.now() < until) {
        if (child.exitCode !== null) return false;
        try {
            await fetch(`${BASE}/api/mascot-upload`, { method: 'POST', body: 'ping' });
            return true;
        } catch {
            await new Promise(r => setTimeout(r, 300));
        }
    }
    return false;
}

const booted = await waitForServer();

if (!booted) {
    console.log('  ⚠ SKIPPED — server/server.js did not start (dependencies or dictionary .db files missing).');
    console.log(bootLog.split('\n').slice(-6).map(l => `      ${l}`).join('\n'));
} else {
    const upload = (query, headers = {}) => fetch(`${BASE}/api/mascot-upload?${query}`, {
        method: 'POST',
        headers: { 'content-type': 'application/octet-stream', ...headers },
        body: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'),
    });

    await check('POST /api/mascot-upload without a token → 401', async () => {
        const res = await upload('type=svg&filename=x.svg');
        assert.equal(res.status, 401);
    });

    await check('POST /api/mascot-upload with a wrong token → 401', async () => {
        const res = await upload('type=lottie&filename=x.json', { authorization: 'Bearer wrong' });
        assert.equal(res.status, 401);
    });

    await check('POST /api/mascot-upload?type=svg with a good token → 415', async () => {
        const res = await upload('type=svg&filename=x.svg', { authorization: `Bearer ${TOKEN}` });
        assert.equal(res.status, 415);
    });

    // The route used to default to `type=svg`, so an upload with no type at all
    // was stored as image/svg+xml. It now defaults to lottie — which, together
    // with svg being 415 above, is what proves the default changed.
    await check('an upload with no explicit type is not treated as svg', async () => {
        const res = await upload('filename=x', { authorization: `Bearer ${TOKEN}` });
        assert.notEqual(res.status, 401);
        assert.notEqual(res.status, 415);
    });

    await check('an authenticated lottie upload reaches storage', async () => {
        const res = await upload('type=lottie&filename=x.json', { authorization: `Bearer ${TOKEN}` });
        assert.notEqual(res.status, 401);
        assert.notEqual(res.status, 415);
    });

    await check('POST /api/feedback-screenshot stays open but is rate limited', async () => {
        const shot = () => fetch(`${BASE}/api/feedback-screenshot`, {
            method: 'POST',
            headers: { 'content-type': 'image/png' },
            body: Buffer.from('not-really-a-png'),
        });
        const first = await shot();
        assert.notEqual(first.status, 401, 'feedback screenshots must not require a token');

        let last = first.status;
        for (let i = 0; i < 40 && last !== 429; i++) last = (await shot()).status;
        assert.equal(last, 429, `expected a 429 within 41 requests, last status was ${last}`);
    });
}

child.kill('SIGTERM');

console.log(`\n${passed} passed, ${failures.length} failed`);
if (failures.length) {
    for (const f of failures) console.error(`  FAIL ${f}`);
    process.exit(1);
}
process.exit(0);
