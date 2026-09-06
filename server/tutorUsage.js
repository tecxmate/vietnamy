// ---------------------------------------------------------------------------
// Per-user daily tutor metering.
//
// Why SQLite and not a Map: the existing global tutor cap lives in a module
// variable, so it resets to zero on every deploy and is counted per process —
// two instances mean two full caps. That is tolerable for a blunt cost ceiling
// but useless for a per-user allowance, where "you have used 30 of 30" has to
// survive a restart or the paywall is one deploy away from being free. This
// file is on disk and it is transactional.
//
// TUTOR_USAGE_DB_PATH points it at a persistent volume in production. Left at
// the default it lands next to the dictionary databases, which on the Docker
// image is container-local — so a redeploy wipes today's counters. Same caveat
// as tone_samples.db; see ownerOpsSteps in the handoff.
//
// ── The day boundary ──────────────────────────────────────────────────────
// Rollover is midnight in Asia/Ho_Chi_Minh, not UTC.
//
// The learners are studying Vietnamese and a large share of them are in
// Vietnam. A UTC day rolls over at 07:00 local, so a UTC-based allowance would
// hand someone a fresh 30 messages in the middle of their morning and then cut
// them off mid-evening. Midnight local is the boundary a person actually feels.
//
// Vietnam has observed no daylight saving since 1975 and sits at a flat UTC+7,
// so a fixed offset is exact all year — no tz database, no Intl, no ambiguity.
// TUTOR_DAY_UTC_OFFSET_HOURS exists so a future market can move it without a
// code change. (The pre-existing global cap still rolls over at UTC midnight;
// this does not change that, and the two boundaries are allowed to differ —
// one is a cost ceiling, the other is a user-facing allowance.)
// ---------------------------------------------------------------------------
import Database from 'better-sqlite3';
import { mkdirSync } from 'fs';
import { dirname, join } from 'path';

// Resolved on first use rather than at import time: server.js calls
// loadEnvFile() in its own body, which ESM runs only after every imported
// module has already been evaluated.
let dayOffsetHours = null;

function offsetHours() {
    if (dayOffsetHours === null) {
        const raw = Number(process.env.TUTOR_DAY_UTC_OFFSET_HOURS);
        dayOffsetHours = Number.isFinite(raw) ? raw : 7;
    }
    return dayOffsetHours;
}

function offsetMs() {
    return offsetHours() * 60 * 60 * 1000;
}

/** How many past days of counters to keep. Purely for file hygiene. */
const RETAIN_DAYS = 14;

let db = null;
let stmtTryConsume = null;
let stmtRead = null;
let stmtRefund = null;
let stmtPrune = null;
let lastPrunedDay = '';

/**
 * The metering day a given instant falls in, as 'YYYY-MM-DD' in the metering
 * timezone. Shifting the instant and then reading the UTC calendar date is the
 * whole trick — no local-time API is involved, so the answer does not depend on
 * the server's own TZ setting.
 */
export function meteringDay(now = Date.now()) {
    return new Date(now + offsetMs()).toISOString().slice(0, 10);
}

/** The instant the current metering day ends, as an ISO string (UTC). */
export function meteringDayResetAt(now = Date.now()) {
    const shifted = now + offsetMs();
    const startOfShiftedDay = Math.floor(shifted / 86400000) * 86400000;
    return new Date(startOfShiftedDay + 86400000 - offsetMs()).toISOString();
}

export function initTutorUsage(defaultDir) {
    const path = process.env.TUTOR_USAGE_DB_PATH || join(defaultDir, 'tutor_usage.db');
    try {
        mkdirSync(dirname(path), { recursive: true });
        db = new Database(path);
        db.pragma('journal_mode = WAL');
        db.exec(`CREATE TABLE IF NOT EXISTS tutor_usage (
            user_id    TEXT    NOT NULL,
            day        TEXT    NOT NULL,
            count      INTEGER NOT NULL DEFAULT 0,
            updated_at TEXT    NOT NULL,
            PRIMARY KEY (user_id, day)
        )`);

        // One atomic admission test. The WHERE on DO UPDATE is what makes this
        // exact under concurrency: when the row is already at the limit no
        // update happens, RETURNING yields no row, and .get() comes back
        // undefined — which is the "denied" answer. No read-then-write race.
        stmtTryConsume = db.prepare(`
            INSERT INTO tutor_usage (user_id, day, count, updated_at)
            VALUES (@user_id, @day, 1, @now)
            ON CONFLICT(user_id, day) DO UPDATE
                SET count = count + 1, updated_at = excluded.updated_at
                WHERE tutor_usage.count < @limit
            RETURNING count
        `);
        stmtRead = db.prepare(
            'SELECT count FROM tutor_usage WHERE user_id = ? AND day = ?',
        );
        // Give a message back when the paid call never happened. Clamped at 0
        // so a double refund can never mint quota.
        stmtRefund = db.prepare(`
            UPDATE tutor_usage SET count = MAX(count - 1, 0), updated_at = @now
            WHERE user_id = @user_id AND day = @day
        `);
        stmtPrune = db.prepare('DELETE FROM tutor_usage WHERE day < ?');

        console.log('Tutor usage DB ready at', path, `(day rollover UTC+${offsetHours()})`);
    } catch (err) {
        // Fail OPEN, matching how the moderation pass already behaves: a broken
        // meter must not take the tutor down with it. Learners keep talking,
        // and the IP limiter plus the global daily cap still bound the spend.
        console.warn('Tutor usage DB unavailable, per-user metering disabled:', err.message);
        db = null;
    }
    return Boolean(db);
}

export function tutorUsageReady() {
    return Boolean(db);
}

/**
 * The open handle, for other tutor-side state that belongs in the same file.
 *
 * Telemetry (tutorMetrics.js) lives in this database rather than its own, so
 * there is one TUTOR_USAGE_DB_PATH to point at a persistent volume, one file
 * to back up, and one connection. Null when the store failed to open.
 */
export function tutorStoreDb() {
    return db;
}

/**
 * Try to spend one message from `userId`'s allowance for today.
 *
 * Returns { ok, used, limit, resetAt }. `ok:false` means the allowance is spent.
 * When the store is unavailable it returns ok:true with used:0 — see the
 * fail-open note above.
 */
export function consumeTutorMessage(userId, limit, now = Date.now()) {
    const day = meteringDay(now);
    const resetAt = meteringDayResetAt(now);

    if (!db || !userId) return { ok: true, used: 0, limit, resetAt, metered: false };

    // A limit of 0 means no free messages at all. The upsert's WHERE clause
    // only guards the conflict branch, so a first insert would otherwise slip
    // one through.
    if (!Number.isFinite(limit) || limit <= 0) {
        return { ok: false, used: 0, limit: 0, resetAt, metered: true };
    }

    try {
        maybePrune(day);
        const row = stmtTryConsume.get({
            user_id: userId,
            day,
            limit,
            now: new Date(now).toISOString(),
        });
        if (row) return { ok: true, used: row.count, limit, resetAt, metered: true };
        const current = stmtRead.get(userId, day);
        return { ok: false, used: current?.count ?? limit, limit, resetAt, metered: true };
    } catch (err) {
        console.warn('Tutor usage accounting failed (allowing through):', err.message);
        return { ok: true, used: 0, limit, resetAt, metered: false };
    }
}

/**
 * Hand a message back after the upstream call failed, so an outage on our side
 * does not eat a learner's daily allowance.
 */
export function refundTutorMessage(userId, now = Date.now()) {
    if (!db || !userId) return;
    try {
        stmtRefund.run({
            user_id: userId,
            day: meteringDay(now),
            now: new Date(now).toISOString(),
        });
    } catch (err) {
        console.warn('Tutor usage refund failed:', err.message);
    }
}

/** Drop counters older than RETAIN_DAYS. Runs at most once per metering day. */
function maybePrune(day) {
    if (day === lastPrunedDay) return;
    lastPrunedDay = day;
    try {
        const cutoff = new Date(Date.parse(`${day}T00:00:00Z`) - RETAIN_DAYS * 86400000)
            .toISOString()
            .slice(0, 10);
        stmtPrune.run(cutoff);
    } catch (err) {
        console.warn('Tutor usage prune failed:', err.message);
    }
}
