// Layer 5 — engagement instrumentation (CAPTURE ONLY, by design).
//
// Logs lightweight engagement events (response time, results, quits, completions)
// to localStorage so we can later learn what they correlate with. Per the adaptive
// design (docs/ADAPTIVE_CURRICULUM_SEQUENCER.md §8): instrument now, act later —
// nothing reads this to drive sequencing yet.

const KEY = 'vnme_engagement';
const MAX_EVENTS = 1000; // ring buffer — oldest dropped first

function load() {
    try {
        const raw = localStorage.getItem(KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

/**
 * Append an engagement event. Never throws; never blocks UX.
 * Event kinds used today:
 *  - { kind: 'exercise', lessonId, exerciseType, correct, responseMs }
 *  - { kind: 'lesson_quit', lessonId, atIndex, total, elapsedMs }
 *  - { kind: 'lesson_complete', lessonId, total, elapsedMs }
 */
export function logEngagement(event) {
    try {
        const events = load();
        events.push({ t: Date.now(), ...event });
        if (events.length > MAX_EVENTS) events.splice(0, events.length - MAX_EVENTS);
        localStorage.setItem(KEY, JSON.stringify(events));
    } catch {
        /* analytics must never break the app */
    }
}

/** Read all captured events (for future analysis/export). */
export function getEngagementEvents() {
    return load();
}
