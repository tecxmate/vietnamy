// Post-build smoke test: boot the built app and confirm every key route
// actually renders — no page errors, no empty screens, no route stuck on the
// lazy-loading fallback.
//
//   npx vite build && node scripts/smoke-routes.mjs
//
// This is the safety net the repo's Playwright specs don't provide (those are
// recording helpers, not assertions). It serves `dist/` itself, so CI needs no
// separate server step. Chromium comes from Playwright's usual resolution; set
// CHROMIUM_PATH to point at a preinstalled binary instead.

import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const PORT = 4321;
const BASE = `http://localhost:${PORT}`;

// One representative route per engine/surface. Booting a wrapper exercises its
// engine, data imports, and route wiring — siblings share all three.
const ROUTES = [
    '/',                             // tab shell (Study/Dictionary/Library)
    '/spell',                        // spelling playground
    '/grammar',                      // grammar level index
    '/practice/alphabet',
    '/practice/vowels-single-1',     // VowelsPractice engine
    '/practice/consonants',          // DrillPractice engine
    '/practice/tones/level1',        // ToneLesson engine
    '/practice/tones/speak',         // ToneLesson speak step
    '/practice/tonemarks-basic',     // ToneMarks engine
    '/practice/numbers-1',           // NumbersPractice engine
    '/practice/telex-1',             // TelexTyping engine
    '/practice/teencode-1',          // TeenCode engine
    '/practice/pronouns-1',          // PronounsPractice engine
    '/practice/kinship-foundation',
    '/practice/kinship-calculator',
    '/practice/kinship-engine',
    '/practice/classifiers-1',       // one grammar drill wrapper
];

// Failures the app throws in any environment without backend/audio — not what
// this smoke test is judging.
const IGNORED_CONSOLE = [/\/api\//, /net::ERR/, /Failed to load resource/, /manifest/i, /service.?worker/i];

const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], {
    stdio: 'ignore',
    detached: false,
});
const stopServer = () => { try { server.kill('SIGTERM'); } catch { /* already gone */ } };
process.on('exit', stopServer);

// Wait for the server to accept connections.
const deadline = Date.now() + 30_000;
for (;;) {
    try {
        const res = await fetch(BASE, { method: 'HEAD' });
        if (res.ok || res.status === 404) break;
    } catch { /* not up yet */ }
    if (Date.now() > deadline) {
        console.error('✗ preview server did not start within 30s (is dist/ built?)');
        process.exit(1);
    }
    await new Promise((r) => setTimeout(r, 250));
}

const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || undefined,
});
const context = await browser.newContext({ viewport: { width: 390, height: 800 } });

let failures = 0;
for (const route of ROUTES) {
    const page = await context.newPage();
    const problems = [];
    page.on('pageerror', (err) => problems.push(`pageerror: ${err.message.split('\n')[0].slice(0, 140)}`));
    page.on('console', (msg) => {
        if (msg.type() !== 'error') return;
        const text = msg.text();
        if (IGNORED_CONSOLE.some((re) => re.test(text))) return;
        problems.push(`console: ${text.slice(0, 140)}`);
    });

    try {
        await page.goto(BASE + route, { waitUntil: 'domcontentloaded', timeout: 15_000 });
        // Rendered = real text beyond the Suspense "Loading..." fallback.
        await page.waitForFunction(
            () => {
                const text = document.body.innerText.trim();
                return text.length > 30 && text !== 'Loading...';
            },
            { timeout: 15_000 },
        );
    } catch (err) {
        problems.push(`load: ${err.message.split('\n')[0].slice(0, 140)}`);
    }

    if (problems.length) {
        failures++;
        console.error(`✗ ${route}`);
        for (const p of problems.slice(0, 3)) console.error(`    ${p}`);
    } else {
        console.log(`✓ ${route}`);
    }
    await page.close();
}

await browser.close();
stopServer();

if (failures) {
    console.error(`\n✗ smoke test failed — ${failures}/${ROUTES.length} routes broken`);
    process.exit(1);
}
console.log(`\n✓ smoke test passed — all ${ROUTES.length} routes render`);
