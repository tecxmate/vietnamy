// ---------------------------------------------------------------------------
// Tutor usage telemetry.
//
// The question this exists to answer is not "is the tutor healthy" — the logs
// already say that. It is "does this feature earn its place", and nothing in
// the product could answer it: the study surface has no analytics at all, and
// the tutor's only durable state was the per-user allowance from the metering
// change. So every /api/tutor request now leaves one row here, and
// summariseTutorUsage() turns those rows into the six numbers the decision
// actually needs (see scripts/tutor-metrics.mjs, which prints them).
//
// ── What is recorded, and what is deliberately not ────────────────────────
// RECORDED: who (the NestJS user id, already stored next door for metering),
// when, which turn of the conversation, which scenario from the app's fixed
// catalogue, the learner's level band, how it ended, how long it took, and how
// many tokens it cost.
//
// NOT RECORDED, and this is a hard line: no message text — not the learner's,
// not the tutor's reply, not the correction. No IP address. No email, even
// though the access token carries one. No scenario free-text: `setting`,
// `npc.personality` and `goal.vi` are client-supplied strings that go into the
// prompt, and they stay there; only the catalogue id is kept, which is a
// bounded enum from the app's own scenario list.
//
// The consequence to be honest about: an anonymous caller is counted but not
// identified. No IP hash, no device fingerprint, no attempt to stitch them
// into a person. That undercounts distinct learners while old app builds are
// still out there — and the size of `anonymous.requests` in the summary is
// itself the number to watch, because it is what says whether those builds
// have aged out enough to flip TUTOR_REQUIRE_AUTH.
//
// ── Bounded by construction ───────────────────────────────────────────────
// One row per request, and requests are already capped by
// TUTOR_GLOBAL_DAILY_MAX (5000/day by default), so the table cannot exceed
// retention x that ceiling — roughly 450k rows at the 90-day default, tens of
// megabytes at the absolute worst case and far less in practice. Pruning runs
// at most once per metering day. This is a log to read, not a warehouse.
//
// It shares the SQLite file the allowance meter opened (TUTOR_USAGE_DB_PATH),
// so there is one path to point at a persistent volume and one file to back
// up. Same caveat as the meter: left at the default it lands in the container
// and a redeploy wipes it.
// ---------------------------------------------------------------------------
import { meteringDay } from './tutorUsage.js';

/**
 * How many days of events to keep. Longer than the allowance counters' 14 days
 * on purpose: "do people come back on a later day" is unanswerable in a window
 * shorter than the return interval you are trying to measure, and a month is
 * the shortest window that shows one.
 */
const RETAIN_DAYS = Number(process.env.TUTOR_METRICS_RETAIN_DAYS) || 90;

/** Outcomes where the learner actually received a reply. */
const DELIVERED = ['ok', 'moderated'];

let db = null;
let stmtInsert = null;
let stmtPrune = null;
let lastPrunedDay = '';

/**
 * Attach to the tutor store's database handle.
 *
 * Takes the handle rather than a path so there is exactly one connection and
 * one configured location. A null handle (the meter failed to open) disables
 * telemetry silently — the tutor must not go down because a counter cannot be
 * written.
 */
export function initTutorMetrics(handle) {
    if (!handle) {
        console.warn('Tutor metrics disabled: no usage store.');
        return false;
    }
    try {
        db = handle;
        db.exec(`CREATE TABLE IF NOT EXISTS tutor_event (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            at          TEXT    NOT NULL,
            day         TEXT    NOT NULL,
            user_id     TEXT,
            turn        INTEGER NOT NULL DEFAULT 0,
            scenario_id TEXT    NOT NULL DEFAULT '',
            level       TEXT    NOT NULL DEFAULT '',
            outcome     TEXT    NOT NULL,
            status      INTEGER NOT NULL DEFAULT 0,
            latency_ms  INTEGER NOT NULL DEFAULT 0,
            tokens_in   INTEGER NOT NULL DEFAULT 0,
            tokens_out  INTEGER NOT NULL DEFAULT 0,
            model       TEXT    NOT NULL DEFAULT ''
        )`);
        db.exec('CREATE INDEX IF NOT EXISTS tutor_event_day ON tutor_event(day)');
        db.exec('CREATE INDEX IF NOT EXISTS tutor_event_user_day ON tutor_event(user_id, day)');

        stmtInsert = db.prepare(`
            INSERT INTO tutor_event
                (at, day, user_id, turn, scenario_id, level, outcome, status,
                 latency_ms, tokens_in, tokens_out, model)
            VALUES
                (@at, @day, @user_id, @turn, @scenario_id, @level, @outcome, @status,
                 @latency_ms, @tokens_in, @tokens_out, @model)
        `);
        stmtPrune = db.prepare('DELETE FROM tutor_event WHERE day < ?');
        return true;
    } catch (err) {
        console.warn('Tutor metrics unavailable:', err.message);
        db = null;
        return false;
    }
}

export function tutorMetricsReady() {
    return Boolean(db);
}

/**
 * Record one finished tutor request.
 *
 * Never throws: a telemetry failure must not turn into a failed reply. The
 * write is a single synchronous INSERT into a WAL database, so it costs well
 * under a millisecond and does not need to be deferred.
 *
 * `turn` is the learner's turn number within the conversation, counted from
 * the history the client sends. Turn 1 is therefore a conversation start, and
 * that is where "how many conversations" comes from — no conversation id had
 * to be invented, and it works for app builds that predate all of this.
 */
export function recordTutorEvent({
    userId = null,
    turn = 0,
    scenarioId = '',
    level = '',
    outcome,
    status = 0,
    latencyMs = 0,
    tokensIn = 0,
    tokensOut = 0,
    model = '',
    now = Date.now(),
} = {}) {
    if (!db || !outcome) return;
    try {
        const day = meteringDay(now);
        maybePrune(day);
        stmtInsert.run({
            at: new Date(now).toISOString(),
            day,
            user_id: userId || null,
            turn: Number.isFinite(turn) ? Math.max(0, Math.trunc(turn)) : 0,
            scenario_id: String(scenarioId || '').slice(0, 60),
            level: String(level || '').slice(0, 20),
            outcome: String(outcome).slice(0, 30),
            status: Number.isFinite(status) ? status : 0,
            latency_ms: Number.isFinite(latencyMs) ? Math.max(0, Math.trunc(latencyMs)) : 0,
            tokens_in: Number.isFinite(tokensIn) ? Math.max(0, Math.trunc(tokensIn)) : 0,
            tokens_out: Number.isFinite(tokensOut) ? Math.max(0, Math.trunc(tokensOut)) : 0,
            model: String(model || '').slice(0, 60),
        });
    } catch (err) {
        console.warn('Tutor metrics write failed:', err.message);
    }
}

/**
 * Erase everything this server holds about one learner — telemetry rows AND
 * allowance counters.
 *
 * Both tables are keyed by the NestJS user id, and neither had a way to honour
 * a deletion request. Adding the events table without adding this would have
 * turned a gap into a bigger one, so it covers both. Returns the row counts
 * removed, so a deletion can be evidenced.
 *
 * Note what erasure costs, honestly: the learner's daily allowance resets,
 * because the counter that said how much they had spent is gone. That is the
 * right trade — the alternative is keeping a record of someone who asked to be
 * forgotten so we can keep charging them against it.
 */
export function forgetTutorUser(userId) {
    if (!db || !userId) return { events: 0, usage: 0 };
    try {
        const events = db.prepare('DELETE FROM tutor_event WHERE user_id = ?').run(userId);
        const usage = db.prepare('DELETE FROM tutor_usage WHERE user_id = ?').run(userId);
        return { events: events.changes, usage: usage.changes };
    } catch (err) {
        console.warn('Tutor erasure failed:', err.message);
        return { events: 0, usage: 0, error: err.message };
    }
}

/** Drop events older than RETAIN_DAYS. Runs at most once per metering day. */
function maybePrune(day) {
    if (day === lastPrunedDay) return;
    lastPrunedDay = day;
    try {
        const cutoff = new Date(Date.parse(`${day}T00:00:00Z`) - RETAIN_DAYS * 86400000)
            .toISOString()
            .slice(0, 10);
        stmtPrune.run(cutoff);
    } catch (err) {
        console.warn('Tutor metrics prune failed:', err.message);
    }
}

/** The metering day `days` days before the one `now` falls in. */
function windowStart(days, now) {
    return meteringDay(now - Math.max(0, days - 1) * 86400000);
}

/**
 * Percentile of a column, without window functions: count, then jump to the
 * row at the right offset. Two indexed reads instead of pulling every latency
 * into memory.
 */
function percentile(where, params, p) {
    const n = db.prepare(`SELECT COUNT(*) AS n FROM tutor_event WHERE ${where}`).get(...params).n;
    if (!n) return null;
    const offset = Math.min(n - 1, Math.floor(n * p));
    const row = db
        .prepare(`SELECT latency_ms FROM tutor_event WHERE ${where} ORDER BY latency_ms LIMIT 1 OFFSET ?`)
        .get(...params, offset);
    return row?.latency_ms ?? null;
}

/**
 * The whole report, in one pass of small aggregate queries.
 *
 * Shaped around the six questions someone deciding this feature's fate has to
 * answer, and nothing else:
 *
 *   reach       — how many learners send messages, how many are new
 *   engagement  — conversations, messages per conversation, how deep they go
 *   retention   — how many come back on a later day
 *   conversion  — how many hit the free cap
 *   cost        — calls and tokens (and dollars, if prices are configured)
 *   failures    — where it breaks, and how slow it is when it works
 *
 * The one question it CANNOT answer is how many people open the tutor and
 * never type: that leaves no request. It is measured in the app instead
 * (`tutor_open` vs `tutor_message_sent` in Firebase Analytics).
 */
export function summariseTutorUsage({ days = 30, now = Date.now() } = {}) {
    if (!db) return { available: false, reason: 'tutor metrics store unavailable' };

    const windowDays = Math.min(Math.max(Math.trunc(days) || 30, 1), RETAIN_DAYS);
    const since = windowStart(windowDays, now);
    const delivered = `outcome IN (${DELIVERED.map(() => '?').join(',')})`;
    const one = (sql, ...params) => db.prepare(sql).get(...params);
    const all = (sql, ...params) => db.prepare(sql).all(...params);

    const totals = one(
        `SELECT COUNT(*)                                   AS requests,
                COUNT(DISTINCT user_id)                    AS identified_users,
                SUM(user_id IS NULL)                       AS anonymous_requests,
                SUM(${delivered})                          AS messages,
                SUM(tokens_in)                             AS tokens_in,
                SUM(tokens_out)                            AS tokens_out
           FROM tutor_event WHERE day >= ?`,
        ...DELIVERED,
        since,
    );

    const conversations = one(
        `SELECT COUNT(*) AS n FROM tutor_event WHERE day >= ? AND turn = 1 AND ${delivered}`,
        since,
        ...DELIVERED,
    ).n;

    const newUsers = one(
        `SELECT COUNT(*) AS n FROM (
             SELECT user_id, MIN(day) AS first_day
               FROM tutor_event WHERE user_id IS NOT NULL GROUP BY user_id
         ) WHERE first_day >= ?`,
        since,
    ).n;

    // Distinct active days per learner. Two or more means they came back.
    const activeDays = all(
        `SELECT days, COUNT(*) AS users FROM (
             SELECT user_id, COUNT(DISTINCT day) AS days
               FROM tutor_event
              WHERE day >= ? AND user_id IS NOT NULL AND ${delivered}
              GROUP BY user_id
         ) GROUP BY days ORDER BY days`,
        since,
        ...DELIVERED,
    );
    const activeUsers = activeDays.reduce((sum, r) => sum + r.users, 0);
    const returning = activeDays.filter(r => r.days >= 2).reduce((sum, r) => sum + r.users, 0);

    const outcomes = all(
        `SELECT outcome, COUNT(*) AS n, COUNT(DISTINCT user_id) AS users
           FROM tutor_event WHERE day >= ? GROUP BY outcome ORDER BY n DESC`,
        since,
    );

    const depth = all(
        `SELECT CASE WHEN turn <= 1 THEN '1'
                     WHEN turn <= 3 THEN '2-3'
                     WHEN turn <= 9 THEN '4-9'
                     ELSE '10+' END AS turns,
                COUNT(*) AS n
           FROM tutor_event WHERE day >= ? AND ${delivered}
          GROUP BY turns ORDER BY MIN(turn)`,
        since,
        ...DELIVERED,
    );

    const scenarios = all(
        `SELECT CASE WHEN scenario_id = '' THEN '(not reported)' ELSE scenario_id END AS scenario,
                COUNT(*) AS messages, COUNT(DISTINCT user_id) AS users
           FROM tutor_event WHERE day >= ? AND ${delivered}
          GROUP BY scenario ORDER BY messages DESC LIMIT 12`,
        since,
        ...DELIVERED,
    );

    const daily = all(
        `SELECT day,
                COUNT(*)                       AS requests,
                COUNT(DISTINCT user_id)        AS users,
                SUM(${delivered})              AS messages,
                SUM(tokens_in + tokens_out)    AS tokens
           FROM tutor_event WHERE day >= ? GROUP BY day ORDER BY day`,
        ...DELIVERED,
        since,
    );

    const capHits = one(
        `SELECT COUNT(*) AS hits, COUNT(DISTINCT user_id) AS users
           FROM tutor_event WHERE day >= ? AND outcome = 'free_limit'`,
        since,
    );

    const okWhere = "day >= ? AND outcome = 'ok'";
    const latency = {
        p50Ms: percentile(okWhere, [since], 0.5),
        p95Ms: percentile(okWhere, [since], 0.95),
    };

    const tokensIn = totals.tokens_in || 0;
    const tokensOut = totals.tokens_out || 0;
    const priceIn = Number(process.env.TUTOR_COST_USD_PER_MTOK_IN);
    const priceOut = Number(process.env.TUTOR_COST_USD_PER_MTOK_OUT);
    // No hardcoded price list. Model pricing changes and a stale constant in
    // here would quietly report the wrong dollar figure forever; tokens are
    // the fact, dollars are a conversion the operator opts into.
    const estimatedUsd = Number.isFinite(priceIn) && Number.isFinite(priceOut)
        ? Number(((tokensIn / 1e6) * priceIn + (tokensOut / 1e6) * priceOut).toFixed(4))
        : null;

    const messages = totals.messages || 0;
    const ratio = (a, b) => (b ? Number((a / b).toFixed(2)) : 0);

    return {
        available: true,
        window: { days: windowDays, since, until: meteringDay(now), dayOffsetNote: 'days roll over at midnight UTC+7, matching the free allowance' },
        reach: {
            requests: totals.requests || 0,
            identifiedUsers: totals.identified_users || 0,
            newUsers,
            anonymousRequests: totals.anonymous_requests || 0,
            anonymousShare: ratio(totals.anonymous_requests || 0, totals.requests || 0),
        },
        engagement: {
            messages,
            conversations,
            messagesPerConversation: ratio(messages, conversations),
            conversationsPerUser: ratio(conversations, totals.identified_users || 0),
            messagesPerUser: ratio(messages, totals.identified_users || 0),
            depth,
            scenarios,
        },
        retention: {
            activeUsers,
            returningUsers: returning,
            returnRate: ratio(returning, activeUsers),
            activeDaysHistogram: activeDays,
        },
        conversion: {
            freeLimitHits: capHits.hits || 0,
            usersHittingLimit: capHits.users || 0,
            shareOfUsersHittingLimit: ratio(capHits.users || 0, totals.identified_users || 0),
        },
        cost: {
            calls: outcomes.find(o => o.outcome === 'ok')?.n || 0,
            tokensIn,
            tokensOut,
            estimatedUsd,
            pricingConfigured: estimatedUsd !== null,
        },
        reliability: { outcomes, latency },
        daily,
    };
}
