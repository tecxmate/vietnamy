#!/usr/bin/env node
/**
 * tutor-metrics.mjs — print what the AI tutor is actually doing.
 *
 * The tutor had no analytics at all, so "does anyone use this, and is it worth
 * keeping" could not be answered. /api/tutor now leaves one row per request and
 * /api/tutor/stats aggregates them; this prints that as a page you can read.
 *
 *   npm run tutor:metrics                      # last 30 days, localhost:3001
 *   npm run tutor:metrics -- --days 7
 *   npm run tutor:metrics -- --url https://vietnamy.tecxmate.com --days 90
 *   npm run tutor:metrics -- --json            # raw, for piping into jq
 *
 * Auth is MAIL_ADMIN_TOKEN — the operator credential this server already uses
 * for /api/push/stats. Export it, or pass --token. Never paste it into a
 * committed file.
 *
 * It talks to the running server rather than opening the SQLite file directly,
 * because in production that file lives on the server's volume and not on the
 * machine you are typing on.
 *
 * WHICH SERVER: the Express one in this repo (server/server.js, the Docker
 * deploy). NestJS has its own tutor that the app does not call; its numbers, if
 * it had any, would be about nothing. See docs/ROLE-OF-THIS-REPO.md.
 */

const args = process.argv.slice(2);
const flag = (name, fallback) => {
    const i = args.indexOf(`--${name}`);
    return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const has = (name) => args.includes(`--${name}`);

const baseUrl = (flag('url', process.env.TUTOR_METRICS_URL || 'http://localhost:3001')).replace(/\/$/, '');
const days = Number(flag('days', '30')) || 30;
const token = flag('token', process.env.MAIL_ADMIN_TOKEN || '');

const pad = (v, n) => String(v).padEnd(n);
const num = (v, n = 8) => String(v ?? 0).padStart(n);
const pct = (v) => `${Math.round((v || 0) * 100)}%`;
const rule = (label = '') => console.log(`\n\x1b[1m${label}\x1b[0m\n${'─'.repeat(64)}`);

const res = await fetch(`${baseUrl}/api/tutor/stats?days=${days}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
}).catch((err) => {
    console.error(`\n✗ could not reach ${baseUrl} — ${err.message}\n`);
    console.error('  Is the server running? For production pass --url or set TUTOR_METRICS_URL.\n');
    process.exit(1);
});

if (res.status === 401) {
    console.error('\n✗ 401 — set MAIL_ADMIN_TOKEN (the same value the server has) or pass --token.\n');
    process.exit(1);
}
if (!res.ok) {
    console.error(`\n✗ ${res.status} from ${baseUrl}/api/tutor/stats\n${(await res.text()).slice(0, 400)}\n`);
    process.exit(1);
}

const s = await res.json();

if (has('json')) {
    console.log(JSON.stringify(s, null, 2));
    process.exit(0);
}

if (!s.available) {
    console.error(`\n✗ ${s.reason}\n\n  The tutor store did not open. Check TUTOR_USAGE_DB_PATH and the\n  "Tutor guardrails:" line in the server's boot log.\n`);
    process.exit(1);
}

const { reach, engagement, retention, conversion, cost, reliability } = s;

console.log(`\n\x1b[1mAI tutor — ${s.window.days} days, ${s.window.since} to ${s.window.until}\x1b[0m`);
console.log(`\x1b[2m${s.window.dayOffsetNote}\x1b[0m`);

rule('DOES ANYONE USE IT');
console.log(`  ${pad('learners who sent a message', 34)}${num(reach.identifiedUsers)}`);
console.log(`  ${pad('  of those, first time here', 34)}${num(reach.newUsers)}`);
console.log(`  ${pad('messages delivered', 34)}${num(engagement.messages)}`);
console.log(`  ${pad('conversations started', 34)}${num(engagement.conversations)}`);
console.log(`  ${pad('requests (incl. failures)', 34)}${num(reach.requests)}`);
if (reach.anonymousRequests) {
    console.log(`\n  \x1b[2m${reach.anonymousRequests} request(s), ${pct(reach.anonymousShare)}, carried no verifiable token —`);
    console.log('  app builds that predate the member JWT. They are counted but not');
    console.log('  attributed to a person, so the learner count above is a floor.');
    console.log('  This share falling to ~0 is the signal to flip TUTOR_REQUIRE_AUTH.\x1b[0m');
}
console.log('\n  \x1b[2mHow many OPEN the tutor without typing is not visible here — that');
console.log('  makes no request. Firebase Analytics has it: tutor_open vs');
console.log('  tutor_message_sent.\x1b[0m');

rule('DO THEY ACTUALLY TALK');
console.log(`  ${pad('messages per conversation', 34)}${num(engagement.messagesPerConversation)}`);
console.log(`  ${pad('conversations per learner', 34)}${num(engagement.conversationsPerUser)}`);
console.log(`  ${pad('messages per learner', 34)}${num(engagement.messagesPerUser)}`);
if (engagement.depth.length) {
    console.log('\n  how deep a conversation gets (messages sent at each turn)');
    const total = engagement.depth.reduce((a, d) => a + d.n, 0) || 1;
    for (const d of engagement.depth) {
        const bar = '█'.repeat(Math.max(1, Math.round((d.n / total) * 30)));
        console.log(`    turn ${pad(d.turns, 6)}${num(d.n, 7)}  ${bar}`);
    }
    console.log('  \x1b[2mmostly turn 1 means people say hello and leave.\x1b[0m');
}
if (engagement.scenarios.length) {
    console.log('\n  scenarios');
    for (const sc of engagement.scenarios) {
        console.log(`    ${pad(sc.scenario, 26)}${num(sc.messages, 7)} msgs  ${num(sc.users, 4)} learners`);
    }
}

rule('DO THEY COME BACK');
console.log(`  ${pad('learners active in window', 34)}${num(retention.activeUsers)}`);
console.log(`  ${pad('came back on a later day', 34)}${num(retention.returningUsers)}   ${pct(retention.returnRate)}`);
if (retention.activeDaysHistogram.length) {
    console.log('\n  days used');
    for (const r of retention.activeDaysHistogram) {
        console.log(`    ${pad(`${r.days} day${r.days > 1 ? 's' : ''}`, 26)}${num(r.users, 7)} learners`);
    }
}

rule('WILL THEY PAY');
console.log(`  ${pad('free-cap refusals', 34)}${num(conversion.freeLimitHits)}`);
console.log(`  ${pad('learners who hit the cap', 34)}${num(conversion.usersHittingLimit)}   ${pct(conversion.shareOfUsersHittingLimit)} of learners`);
console.log('\n  \x1b[2mWhether hitting the cap turns into a purchase is a Firebase funnel:');
console.log('  tutor_free_limit_reached → subscription_purchase.\x1b[0m');

rule('WHAT IT COSTS');
console.log(`  ${pad('paid completions', 34)}${num(cost.calls)}`);
console.log(`  ${pad('prompt tokens', 34)}${num(cost.tokensIn)}`);
console.log(`  ${pad('completion tokens', 34)}${num(cost.tokensOut)}`);
if (cost.pricingConfigured) {
    console.log(`  ${pad('estimated', 34)}${num(`$${cost.estimatedUsd}`)}`);
} else {
    console.log('\n  \x1b[2mNo dollar figure: set TUTOR_COST_USD_PER_MTOK_IN and _OUT to your');
    console.log('  current OpenAI prices. A price baked into this repo would go stale');
    console.log('  and quietly report the wrong number forever.\x1b[0m');
}

rule('WHERE IT FAILS');
const outcomeHelp = {
    ok: 'replied',
    moderated: 'deflected by the moderation pass',
    free_limit: 'daily free allowance spent',
    rate_limited: 'per-IP hourly limiter (once per IP per window)',
    global_quota: 'global daily cost ceiling',
    auth_required: 'TUTOR_REQUIRE_AUTH is on and no valid token',
    bad_request: 'no messages in the body',
    no_key: 'OPENAI_API_KEY missing (once per day)',
    upstream_quota: 'OpenAI out of quota / rate limited — check billing',
    upstream_auth: 'OpenAI rejected the key — check OPENAI_API_KEY',
    upstream_error: 'OpenAI returned an error',
    timeout: 'the call to OpenAI ran out of clock',
    failed: 'the call to OpenAI threw',
};
for (const o of reliability.outcomes) {
    console.log(`  ${pad(o.outcome, 18)}${num(o.n, 7)}  \x1b[2m${outcomeHelp[o.outcome] || ''}\x1b[0m`);
}
console.log(`\n  ${pad('reply latency p50', 34)}${num(`${reliability.latency.p50Ms ?? '-'}ms`)}`);
console.log(`  ${pad('reply latency p95', 34)}${num(`${reliability.latency.p95Ms ?? '-'}ms`)}`);

if (s.daily.length) {
    rule('BY DAY');
    console.log(`  ${pad('day', 12)}${num('reqs', 7)}${num('msgs', 7)}${num('users', 7)}${num('tokens', 10)}`);
    for (const d of s.daily) {
        console.log(`  ${pad(d.day, 12)}${num(d.requests, 7)}${num(d.messages, 7)}${num(d.users, 7)}${num(d.tokens, 10)}`);
    }
}

console.log('');
