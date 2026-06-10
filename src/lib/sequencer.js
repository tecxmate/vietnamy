// Adaptive curriculum sequencer — Layers 3-4 (purpose + performance selection).
//
// PURE engine. Consumed via src/lib/recommendations.js (which derives learnerState
// from live progress/SRS/mastery and applies admin weight overrides) by the Study
// tab's "Recommended for you" row, the roadmap's Recommended badges, and the
// Continue button (for lesson nodes, when no topic filter is active). It reads the
// generated `adaptive` block on each lesson (Layers 1-2) + a learnerState and
// returns a ranked, prerequisite-satisfied "what's next" with an explainable score.
//
// Design (see docs/ADAPTIVE_CURRICULUM_SEQUENCER.md §6):
//   - candidate set = pool lessons not yet done whose grammar prerequisites are met
//   - score = purpose-fit + difficulty-fit + variety + review (SRS-due) +
//     remediation (weak items), all item-based where it matters
//   - spine discipline = the shared on-ramp stays ordered and comes before the pool,
//     so the path keeps a visible structure (not a slot machine)
//   - deterministic + explainable; weights tunable (admin: /admin/adaptive)

/** Tunable scoring weights. review/remediation are item-based (Layer 4): SRS-due
 *  and weak items matched against each lesson's wordIds ∪ adaptive.usesVocab. */
export const SEQUENCER_WEIGHTS = {
    purpose: 1.0,
    difficulty: 0.6,
    variety: 0.4,
    review: 0.3,
    remediation: 0.4,
};

/** Union of grammar tags introduced by the lessons already completed. */
export function introducedGrammarFrom(completedLessons) {
    const set = new Set();
    for (const l of completedLessons) for (const g of l.adaptive?.introducesGrammar || []) set.add(g);
    return set;
}

/** A lesson is a valid candidate only if every grammar prerequisite is already introduced. */
export function prereqsSatisfied(lesson, introducedGrammar) {
    return (lesson.adaptive?.requiresGrammar || []).every((g) => introducedGrammar.has(g));
}

/** How strongly this lesson serves the learner's purpose (0-1). */
export function purposeMatch(lesson, purposeId) {
    const p = (lesson.adaptive?.purposes || []).find((x) => x.id === purposeId);
    return p ? p.weight : 0;
}

/** Closeness of lesson difficulty to the learner's estimated level. Both on the
 *  curriculum's 1-10 difficulty scale; `spread` is the tolerance band. */
export function difficultyFit(difficulty, estimatedLevel, spread = 3) {
    if (difficulty == null || estimatedLevel == null) return 0.5;
    return Math.max(0, 1 - Math.abs(difficulty - estimatedLevel) / spread);
}

/** Reward topics that differ from what the learner just did (avoid 4 café lessons in a row). */
export function varietyBonus(topic, recentTopics = []) {
    return recentTopics.includes(topic) ? 0 : 1;
}

/** All vocab a lesson exercises: its own words + vocab its sentences reuse. */
function lessonVocab(lesson) {
    return [...(lesson.wordIds || []), ...(lesson.adaptive?.usesVocab || [])];
}

/** Reward a lesson that re-surfaces vocab currently due for SRS review (0-1). */
export function reviewValue(lesson, dueItemIds) {
    if (!dueItemIds || !dueItemIds.size) return 0;
    let hits = 0;
    for (const w of lessonVocab(lesson)) if (dueItemIds.has(w)) hits++;
    return hits ? Math.min(1, hits / 3) : 0;
}

/** Reward a lesson that re-exercises the learner's weak items (0-1, item-based —
 *  skills are near-uniform across this curriculum so items are the real signal). */
export function remediationValue(lesson, weakItemIds) {
    if (!weakItemIds || !weakItemIds.size) return 0;
    let hits = 0;
    for (const w of lessonVocab(lesson)) if (weakItemIds.has(w)) hits++;
    return hits ? Math.min(1, hits / 3) : 0;
}

/** Transparent, explainable per-lesson score. */
export function scoreLesson(lesson, state, weights = SEQUENCER_WEIGHTS) {
    const breakdown = {
        purpose: weights.purpose * purposeMatch(lesson, state.purpose),
        difficulty: weights.difficulty * difficultyFit(lesson.difficulty, state.estimatedLevel),
        variety: weights.variety * varietyBonus(lesson.topic, state.recentTopics),
        review: weights.review * reviewValue(lesson, state.dueItemIds),
        remediation: weights.remediation * remediationValue(lesson, state.weakItemIds),
    };
    const total = Object.values(breakdown).reduce((a, b) => a + b, 0);
    return { total, breakdown };
}

/**
 * Rank what to do next.
 * @param {object} state - { completedLessonIds[], purpose, estimatedLevel, recentTopics[] }
 * @param {Array}  lessons - curriculum lessons (each with an `adaptive` block)
 * @param {object} opts - { weights, limit }
 * @returns ranked candidates: [{ lesson, total, breakdown, spine }]
 *
 * Spine discipline: remaining prerequisite-satisfied spine lessons (the shared on-ramp)
 * are kept in their authored order and returned before pool lessons — the dynamic
 * selection happens within the pool, under a stable visible path.
 */
export function getNextBestLessons(state, lessons, opts = {}) {
    const { weights = SEQUENCER_WEIGHTS, limit = 5 } = opts;
    const done = new Set(state.completedLessonIds || []);
    const introduced = introducedGrammarFrom(lessons.filter((l) => done.has(l.id)));

    const candidates = lessons
        .filter((l) => !done.has(l.id) && prereqsSatisfied(l, introduced))
        .map((l) => ({ lesson: l, spine: !!l.adaptive?.spine, ...scoreLesson(l, state, weights) }));

    const spine = candidates
        .filter((c) => c.spine)
        .sort((a, b) => (a.lesson.orderIndex ?? 0) - (b.lesson.orderIndex ?? 0));
    const pool = candidates
        .filter((c) => !c.spine)
        .sort((a, b) => b.total - a.total);

    return [...spine, ...pool].slice(0, limit);
}

/** Convenience: the single next lesson (or null if none are eligible). */
export function getNextBestNode(state, lessons, opts = {}) {
    return getNextBestLessons(state, lessons, { ...opts, limit: 1 })[0]?.lesson || null;
}
