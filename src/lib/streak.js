// Daily-streak logic — pure, no React, so it's trivially testable. A "streak" is
// the number of consecutive calendar days (local time) on which the learner did
// any study activity. The reducer is idempotent within a day and resets after a
// gap. State shape: { count, lastActiveDate: 'YYYY-MM-DD'|null, best }.

export const STREAK_MILESTONES = [1, 3, 7, 30, 100];

/** Local YYYY-MM-DD for a Date (defaults to now). */
export function todayStr(now = new Date()) {
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

/** Whole-day difference a→b (b - a) for 'YYYY-MM-DD' strings; null if either missing. */
export function daysBetween(a, b) {
    if (!a || !b) return null;
    const da = Date.parse(`${a}T00:00:00`);
    const db = Date.parse(`${b}T00:00:00`);
    if (Number.isNaN(da) || Number.isNaN(db)) return null;
    return Math.round((db - da) / 86400000);
}

/**
 * Apply a study activity on `today`.
 * @returns { count, lastActiveDate, best, milestone, brokenFrom }
 *   milestone — the streak value if it just hit 1/3/7/30/100, else null.
 *   brokenFrom — the previous run length if a run >0 was broken before this restart, else 0.
 */
export function advanceStreak(state = {}, today = todayStr()) {
    const prevCount = state.count || 0;
    const best = state.best || 0;
    const gap = daysBetween(state.lastActiveDate, today);

    let count;
    let brokenFrom = 0;
    if (gap === 0) {
        // Already counted today — idempotent.
        return { count: prevCount, lastActiveDate: today, best, milestone: null, brokenFrom: 0 };
    } else if (gap === 1) {
        count = prevCount + 1;           // consecutive day
    } else {
        // First ever, a multi-day gap, or a backwards clock → fresh streak.
        if (prevCount > 0 && (gap == null || gap > 1)) brokenFrom = prevCount;
        count = 1;
    }

    return {
        count,
        lastActiveDate: today,
        best: Math.max(best, count),
        milestone: STREAK_MILESTONES.includes(count) ? count : null,
        brokenFrom,
    };
}

/**
 * Read-only view for UI / on-open decisions (no mutation).
 * @returns { count, isActiveToday, atRisk, brokenFrom, awayDays }
 *   atRisk — has a live run but hasn't studied today (one more day keeps it).
 *   brokenFrom — a run that has already lapsed (>1 day since last active).
 *   awayDays — days since last activity (0 if today, null if never).
 */
export function streakStatus(state = {}, today = todayStr()) {
    const count = state.count || 0;
    const gap = daysBetween(state.lastActiveDate, today);
    const isActiveToday = gap === 0;
    const lapsed = count > 0 && gap != null && gap > 1;
    return {
        count: lapsed ? 0 : count,
        isActiveToday,
        atRisk: count > 0 && gap === 1,
        brokenFrom: lapsed ? count : 0,
        awayDays: gap,
    };
}
