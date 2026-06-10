// Adaptive curriculum sequencer — Layer 3 (purpose-weighted selection).
//
// PURE + NOT WIRED IN YET. Nothing calls this in the running app; navigation still
// uses the linear getNextNode. This is the reviewable engine: it reads the generated
// `adaptive` block on each lesson (Layers 1-2) + a learnerState and returns a ranked,
// prerequisite-satisfied "what's next" list with an explainable score breakdown.
//
// Design (see docs/ADAPTIVE_CURRICULUM_SEQUENCER.md §6):
//   - candidate set = pool lessons not yet done whose grammar prerequisites are met
//   - score = weighted sum of purpose-fit + difficulty-fit + variety (+ review/
//     remediation once skills/SRS data is wired)
//   - spine discipline = the shared on-ramp stays ordered and comes before the pool,
//     so the path keeps a visible structure (not a slot machine)
//   - deterministic + explainable; weights are tunable (future: admin config)

/** Tunable scoring weights. review/remediation stay 0 until requires_vocab + skills
 *  + SRS state are wired (Layer 4). Keep this admin-editable later. */
export const SEQUENCER_WEIGHTS = {
    purpose: 1.0,
    difficulty: 0.6,
    variety: 0.4,
    review: 0.0,
    remediation: 0.0,
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

/** Transparent, explainable per-lesson score. */
export function scoreLesson(lesson, state, weights = SEQUENCER_WEIGHTS) {
    const breakdown = {
        purpose: weights.purpose * purposeMatch(lesson, state.purpose),
        difficulty: weights.difficulty * difficultyFit(lesson.difficulty, state.estimatedLevel),
        variety: weights.variety * varietyBonus(lesson.topic, state.recentTopics),
        review: 0,       // Layer 4: reviewValue(lesson.introducesVocab, dueSrsItems)
        remediation: 0,  // Layer 4: remediationValue(lesson.skills, state.weakSkills)
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
