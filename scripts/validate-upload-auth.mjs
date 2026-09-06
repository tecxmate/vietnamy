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
 *   1. no token                     → 401
 *   2. wrong token                  → 401
 *   3. the MASTER admin token       → 401  (the upload credential is separate)
 *   4. upload token == admin token  → 500  (refuses to run misconfigured)
 *   5. right token, type=svg        → 415  (svg is gone from the table)
 *   6. right token, type=lottie     → past the gate (a legitimate upload works)
 *
 * It also asserts the two structural properties that are easy to regress:
 *
 *   - the "is this request local" test used for the MAIL_ADMIN_ALLOW_LOCAL
 *     escape hatch reads the TCP peer address, never X-Forwarded-For, in both
 *     server/server.js and api/[...path].js; and no upload route consults it;
 *   - api/[...path].js imports the shared gate instead of keeping a third copy.
 *
 * `/api/feedback-screenshot` stays open on purpose — learners attach
 * screenshots to in-app bug reports and hold no token — so what is asserted
 * there is that it is rate limited per IP.
 *
 *   node scripts/validate-upload-auth.mjs
 */
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { networkInterfaces } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const ADMIN_TOKEN = 'test-admin-token-do-not-use-in-production';
const UPLOAD_TOKEN = 'test-upload-token-do-not-use-in-production';
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
const { constantTimeEqual, hasValidAdminToken, requireAdminToken, requireUploadToken } = await import(
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

await check('every credential shape either entry point ever accepted still works', () => {
    process.env.MAIL_ADMIN_TOKEN = ADMIN_TOKEN;
    assert.equal(hasValidAdminToken({ headers: { authorization: `Bearer ${ADMIN_TOKEN}` }, query: {} }), true);
    assert.equal(hasValidAdminToken({ headers: { 'x-mail-admin-token': ADMIN_TOKEN }, query: {} }), true);
    // api/[...path].js used this name before it was consolidated onto the
    // shared gate; dropping it would have broken existing Vercel clients.
    assert.equal(hasValidAdminToken({ headers: { 'x-admin-token': ADMIN_TOKEN }, query: {} }), true);
    assert.equal(hasValidAdminToken({ headers: {}, query: { token: ADMIN_TOKEN } }), true);
    assert.equal(hasValidAdminToken({ headers: { authorization: `Bearer ${ADMIN_TOKEN}x` }, query: {} }), false);
});

await check('the localhost escape hatch only applies while no token is set', () => {
    process.env.MAIL_ADMIN_TOKEN = ADMIN_TOKEN;
    const res = fakeRes();
    assert.equal(requireAdminToken({ headers: {}, query: {} }, res, { allowLocalWhenUnconfigured: true }), false);
    assert.equal(res.statusCode, 401);

    delete process.env.MAIL_ADMIN_TOKEN;
    assert.equal(requireAdminToken({ headers: {}, query: {} }, fakeRes(), { allowLocalWhenUnconfigured: true }), true);
});

await check('the upload credential is separate from the master admin token', () => {
    process.env.MAIL_ADMIN_TOKEN = ADMIN_TOKEN;
    process.env.MASCOT_UPLOAD_TOKEN = UPLOAD_TOKEN;

    // The master token must NOT open the upload route. This is the property
    // that keeps a leaked upload credential from becoming send-email-to-everyone.
    const withAdmin = fakeRes();
    assert.equal(requireUploadToken({ headers: { authorization: `Bearer ${ADMIN_TOKEN}` }, query: {} }, withAdmin), false);
    assert.equal(withAdmin.statusCode, 401);

    assert.equal(requireUploadToken({ headers: { authorization: `Bearer ${UPLOAD_TOKEN}` }, query: {} }, fakeRes()), true);

    // And there is no escape hatch to ask for: unset means deny, full stop.
    delete process.env.MASCOT_UPLOAD_TOKEN;
    const unset = fakeRes();
    assert.equal(requireUploadToken({ headers: { authorization: `Bearer ${UPLOAD_TOKEN}` }, query: {} }, unset), false);
    assert.equal(unset.statusCode, 401);
});

await check('setting the upload token to the admin token is refused, not tolerated', () => {
    process.env.MAIL_ADMIN_TOKEN = ADMIN_TOKEN;
    process.env.MASCOT_UPLOAD_TOKEN = ADMIN_TOKEN;
    const res = fakeRes();
    assert.equal(requireUploadToken({ headers: { authorization: `Bearer ${ADMIN_TOKEN}` }, query: {} }, res), false);
    assert.equal(res.statusCode, 500);
    process.env.MASCOT_UPLOAD_TOKEN = UPLOAD_TOKEN;
});

// ── 2. structural properties of the two entry points ────────────────────────
console.log('source-level guards');

const serverSrc = readFileSync(join(ROOT, 'server/server.js'), 'utf8');
const apiSrc = readFileSync(join(ROOT, 'api/[...path].js'), 'utf8');

const isLocalBody = (src, label) => {
    const match = src.match(/function isLocalRequest\(req\) \{([\s\S]*?)\n\}/);
    assert.ok(match, `${label}: could not find isLocalRequest`);
    return match[1];
};

await check('isLocalRequest decides from the socket, not from a request header', () => {
    for (const [label, src] of [['server/server.js', serverSrc], ['api/[...path].js', apiSrc]]) {
        const body = isLocalBody(src, label);
        assert.ok(
            /remoteAddress/.test(body),
            `${label}: isLocalRequest must read socket.remoteAddress`,
        );
        assert.ok(
            !/x-forwarded-for/i.test(body) && !/requestIp\(/.test(body),
            `${label}: isLocalRequest must not consult X-Forwarded-For — it is caller-supplied`,
        );
    }
});

await check('no upload route is behind the localhost escape hatch', () => {
    const mascotRoute = serverSrc.slice(serverSrc.indexOf("app.post('/api/mascot-upload'"));
    const routeBody = mascotRoute.slice(0, mascotRoute.indexOf("app.post('/api/feedback-screenshot'"));
    assert.ok(/requireUploadToken\(req, res\)/.test(routeBody), 'mascot route must use requireUploadToken');
    assert.ok(
        !/allowLocalWhenUnconfigured/.test(routeBody),
        'the mascot route must not accept a localhost escape hatch',
    );
    const vercelSrc = readFileSync(join(ROOT, 'api/mascot-upload.js'), 'utf8');
    assert.ok(/requireUploadToken\(req, res\)/.test(vercelSrc), 'api/mascot-upload.js must use requireUploadToken');
});

await check('api/[...path].js uses the shared gate rather than a third copy', () => {
    assert.ok(
        /from '\.\.\/server\/adminAuth\.js'/.test(apiSrc),
        'api/[...path].js must import the shared gate',
    );
    assert.ok(
        !/const MAIL_ADMIN_TOKEN\s*=/.test(apiSrc),
        'api/[...path].js must not re-read MAIL_ADMIN_TOKEN at module scope',
    );
    assert.ok(
        !/===\s*MAIL_ADMIN_TOKEN/.test(apiSrc),
        'api/[...path].js must not compare the token with ===',
    );
});

// ── 3. the Vercel function ──────────────────────────────────────────────────
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
    process.env.MASCOT_UPLOAD_TOKEN = UPLOAD_TOKEN;
    const res = await callMascotHandler({ token: '', type: 'lottie' });
    assert.equal(res.statusCode, 401);
});

await check('a wrong token is rejected', async () => {
    process.env.MASCOT_UPLOAD_TOKEN = UPLOAD_TOKEN;
    const res = await callMascotHandler({ token: 'nope', type: 'lottie' });
    assert.equal(res.statusCode, 401);
});

await check('the master admin token does not open the upload route', async () => {
    process.env.MAIL_ADMIN_TOKEN = ADMIN_TOKEN;
    process.env.MASCOT_UPLOAD_TOKEN = UPLOAD_TOKEN;
    const res = await callMascotHandler({ token: ADMIN_TOKEN, type: 'lottie' });
    assert.equal(res.statusCode, 401);
});

await check('svg is no longer an accepted type', async () => {
    process.env.MASCOT_UPLOAD_TOKEN = UPLOAD_TOKEN;
    const res = await callMascotHandler({ token: UPLOAD_TOKEN, type: 'svg' });
    assert.equal(res.statusCode, 415);
});

await check('a real upload still gets through the gate', async () => {
    process.env.MASCOT_UPLOAD_TOKEN = UPLOAD_TOKEN;
    const res = await callMascotHandler({ token: UPLOAD_TOKEN, type: 'lottie' });
    // Storage is not configured in a test environment, so the handler gets as
    // far as the storage call and reports that. Anything but 401/415 proves the
    // guard let a legitimate caller past.
    assert.notEqual(res.statusCode, 401);
    assert.notEqual(res.statusCode, 415);
});

// ── 4. the live Express server ──────────────────────────────────────────────
// This is the load-bearing one: server/server.js is what the mobile app talks
// to. Booting it needs node_modules and server/databases/*.db; when they are
// missing the HTTP leg is skipped loudly rather than reported as a pass.
//
// MAIL_ADMIN_ALLOW_LOCAL is deliberately 'true' here, with MAIL_ADMIN_TOKEN
// unset, and the requests below come from 127.0.0.1 — i.e. the most permissive
// configuration this server has. The mascot route must still deny.
console.log('server/server.js (live HTTP)');

const childEnv = { ...process.env, PORT: String(PORT), MASCOT_UPLOAD_TOKEN: UPLOAD_TOKEN, MAIL_ADMIN_ALLOW_LOCAL: 'true' };
delete childEnv.MAIL_ADMIN_TOKEN;

const child = spawn(process.execPath, [join(ROOT, 'server/server.js')], {
    cwd: ROOT,
    env: childEnv,
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

    // The server is running with MAIL_ADMIN_TOKEN unset and
    // MAIL_ADMIN_ALLOW_LOCAL=true, and this request really does come from
    // 127.0.0.1 — so the mail routes' escape hatch is open right now. The
    // upload route must not share it.
    await check('the localhost escape hatch does not reach the upload route', async () => {
        const res = await upload('type=lottie&filename=x.json');
        assert.equal(res.status, 401);
    });

    // And the header form of the claim must not work either. This is the
    // defect in its original shape: the escape hatch IS open for a genuine
    // loopback peer in this configuration, so the request is made over a
    // non-loopback interface while asserting `X-Forwarded-For: 127.0.0.1`.
    // Before the fix that request was admitted; now the socket decides.
    const externalAddress = Object.values(networkInterfaces())
        .flat()
        .find((a) => a && a.family === 'IPv4' && !a.internal)?.address;

    if (!externalAddress) {
        console.log('  ⚠ SKIPPED — no non-loopback IPv4 interface to spoof from.');
    } else {
        await check('X-Forwarded-For: 127.0.0.1 from a remote peer is not local', async () => {
            const res = await fetch(`http://${externalAddress}:${PORT}/api/admin/feedback`, {
                headers: { 'x-forwarded-for': '127.0.0.1' },
            });
            assert.equal(res.status, 401, 'a spoofed X-Forwarded-For must not open the escape hatch');
        });

        await check('a remote peer cannot spoof its way into the upload route either', async () => {
            const res = await fetch(`http://${externalAddress}:${PORT}/api/mascot-upload?type=lottie&filename=x.json`, {
                method: 'POST',
                headers: { 'content-type': 'application/octet-stream', 'x-forwarded-for': '127.0.0.1' },
                body: Buffer.from('{}'),
            });
            assert.equal(res.status, 401);
        });
    }

    await check('POST /api/mascot-upload?type=svg with a good token → 415', async () => {
        const res = await upload('type=svg&filename=x.svg', { authorization: `Bearer ${UPLOAD_TOKEN}` });
        assert.equal(res.status, 415);
    });

    // The route used to default to `type=svg`, so an upload with no type at all
    // was stored as image/svg+xml. It now defaults to lottie — which, together
    // with svg being 415 above, is what proves the default changed.
    await check('an upload with no explicit type is not treated as svg', async () => {
        const res = await upload('filename=x', { authorization: `Bearer ${UPLOAD_TOKEN}` });
        assert.notEqual(res.status, 401);
        assert.notEqual(res.status, 415);
    });

    await check('an authenticated lottie upload reaches storage', async () => {
        const res = await upload('type=lottie&filename=x.json', { authorization: `Bearer ${UPLOAD_TOKEN}` });
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
