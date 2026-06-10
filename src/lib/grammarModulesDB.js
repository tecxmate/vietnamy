/**
 * grammarModulesDB.js — Data layer for the grammar modules curriculum.
 *
 * Thin adapter over the canonical content/grammar.json bundle (generated from
 * src/data/grammar_modules.json via `npm run content:build`). Same nested
 * Level → Module → Unit structure; exposes helpers for the Grammar Guide / unit lessons
 * component and GrammarUnitLesson page.
 *
 * Progress is tracked via ProgressContext's completedNodes set — each grammar
 * unit ID (e.g. "A1_M01_U01") is treated as a completable node ID.
 */
// Lazy-load content/grammar.json — keeps it out of the main bundle.
// Data loads on first access and is cached. The import starts eagerly so it's
// typically ready before any grammar UI renders.
let _data = null;
let _loadPromise = null;

function _ensureLoaded() {
    if (_data) return Promise.resolve(_data);
    if (!_loadPromise) {
        _loadPromise = import('../../content/grammar.json').then(mod => {
            _data = mod.default;
            return _data;
        });
    }
    return _loadPromise;
}

// Start loading immediately (non-blocking) so data is ready by the time user navigates
_ensureLoaded();

/** Async accessor — call from useEffect/event handlers */
export async function loadGrammarModules() {
    return _ensureLoaded();
}

/** Sync accessor — returns null if not yet loaded (use loadGrammarModules first) */
export function getGrammarModulesSync() {
    return _data;
}

/** Get all levels (A1, A2, B1) */
export function getLevels() {
    return _data?.levels || [];
}

/** Get a single level by ID */
export function getLevel(levelId) {
    return (_data?.levels || []).find(l => l.id === levelId) || null;
}

/** Get all modules for a level */
export function getModules(levelId) {
    const level = getLevel(levelId);
    return level ? level.modules : [];
}

/** Get a single module by ID (e.g. "A1_M01") */
export function getModule(moduleId) {
    for (const level of (_data?.levels || [])) {
        const mod = level.modules.find(m => m.id === moduleId);
        if (mod) return mod;
    }
    return null;
}

// ─── Admin content overrides (edited grammar units) ──────────────────
// A unit's editable content (title/pattern/explanation/note/examples) can be
// overridden by the admin Grammar Unit editor; stored per-unit in localStorage.
const UNIT_OVERRIDE_PREFIX = 'vnme_cms_grammar_unit_';

export function getGrammarUnitOverride(unitId) {
    try {
        const raw = localStorage.getItem(UNIT_OVERRIDE_PREFIX + unitId);
        return raw ? JSON.parse(raw) : null;
    } catch { return null; }
}

export function saveGrammarUnitOverride(unitId, patch) {
    localStorage.setItem(UNIT_OVERRIDE_PREFIX + unitId, JSON.stringify(patch));
}

export function resetGrammarUnitOverride(unitId) {
    localStorage.removeItem(UNIT_OVERRIDE_PREFIX + unitId);
}

/** Get a single unit by ID (e.g. "A1_M01_U01"), with any admin edit merged in. */
export function getUnit(unitId) {
    for (const level of (_data?.levels || [])) {
        for (const mod of level.modules) {
            const unit = mod.units.find(u => u.id === unitId);
            if (unit) {
                const override = getGrammarUnitOverride(unitId);
                return { unit: override ? { ...unit, ...override } : unit, module: mod, level };
            }
        }
    }
    return null;
}

/** Get all units for a module */
export function getUnitsForModule(moduleId) {
    const mod = getModule(moduleId);
    return mod ? mod.units : [];
}

// ─── Progress helpers ───────────────────────────────────────────

/**
 * Calculate unit status given a set of completed node IDs.
 * Returns 'completed' | 'active' | 'locked'
 */
export function getUnitStatus(unit, completedNodeIds) {
    if (completedNodeIds.has(unit.id)) return 'completed';

    // Check prerequisites — all must be completed
    const prereqs = unit.prerequisites || [];
    if (prereqs.length === 0) return 'active'; // First unit, no prereqs
    const allPrereqsMet = prereqs.every(pid => completedNodeIds.has(pid));
    return allPrereqsMet ? 'active' : 'locked';
}

/**
 * Calculate module progress: { completed, total, percent, status }
 */
export function getModuleProgress(moduleId, completedNodeIds) {
    const mod = getModule(moduleId);
    if (!mod) return { completed: 0, total: 0, percent: 0, status: 'locked' };

    const total = mod.units.length;
    const completed = mod.units.filter(u => completedNodeIds.has(u.id)).length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

    let status = 'locked';
    if (completed === total && total > 0) status = 'completed';
    else if (mod.units.some(u => getUnitStatus(u, completedNodeIds) === 'active')) status = 'active';

    return { completed, total, percent, status };
}

/**
 * Calculate level progress: { completed, total, percent }
 */
export function getLevelProgress(levelId, completedNodeIds) {
    const modules = getModules(levelId);
    let completed = 0;
    let total = 0;
    for (const mod of modules) {
        total += mod.units.length;
        completed += mod.units.filter(u => completedNodeIds.has(u.id)).length;
    }
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completed, total, percent };
}

/**
 * Get the next active (unlocked) unit across the entire curriculum.
 * Useful for a "Continue Grammar" button.
 */
export function getNextActiveUnit(completedNodeIds) {
    for (const level of (_data?.levels || [])) {
        for (const mod of level.modules) {
            for (const unit of mod.units) {
                if (getUnitStatus(unit, completedNodeIds) === 'active') {
                    return { unit, module: mod, level };
                }
            }
        }
    }
    return null;
}

// ─── Exercise generation from unit examples ─────────────────────

// Session profiles for grammar: session 0 = recognition, session 1 = production
const GRAMMAR_SESSION_PROFILES = [
    // Session 0 (Learn): recognition-heavy
    { types: ['mcq_translate_to_en', 'mcq_translate_to_vi', 'listen_choose', 'match_pairs'], count: 6 },
    // Session 1 (Practice): production-heavy
    { types: ['fill_blank', 'reorder_words', 'mcq_translate_to_vi', 'listen_choose', 'mcq_translate_to_en'], count: 8 },
];

/**
 * Generate exercises for a grammar unit from its examples + exercise_types.
 * Session parameter controls exercise type profile (0 = recognition, 1 = production).
 */
export function generateExercisesForUnit(unitId, _count = 6, session = 0) {
    const result = getUnit(unitId);
    if (!result) return [];

    const { unit } = result;
    const examples = unit.examples || [];
    if (examples.length === 0) return [];

    const profile = GRAMMAR_SESSION_PROFILES[Math.min(session, GRAMMAR_SESSION_PROFILES.length - 1)];
    const exerciseTypes = profile.types;
    const effectiveCount = profile.count;

    const exercises = [];
    const maxExercises = Math.min(effectiveCount, examples.length * exerciseTypes.length);

    // Cycle through examples and exercise types
    for (let i = 0; i < maxExercises; i++) {
        const ex = examples[i % examples.length];
        const exType = exerciseTypes[i % exerciseTypes.length];

        const exercise = buildExercise(ex, exType, examples, unit);
        if (exercise) exercises.push(exercise);
    }

    // Shuffle
    for (let i = exercises.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [exercises[i], exercises[j]] = [exercises[j], exercises[i]];
    }

    return exercises.slice(0, effectiveCount);
}

function buildExercise(example, type, allExamples, unit) {
    const { vi, en } = example;
    if (!vi || !en) return null;

    switch (type) {
        case 'mcq_translate_to_en': {
            // Show Vietnamese, pick correct English
            const distractors = allExamples
                .filter(e => e.en && e.en !== en)
                .map(e => e.en)
                .sort(() => Math.random() - 0.5)
                .slice(0, 3);
            // Pad with generic distractors if not enough
            while (distractors.length < 3) {
                distractors.push(`Not: ${en.split(' ').reverse().join(' ')}`);
            }
            const options = [en, ...distractors].sort(() => Math.random() - 0.5);
            return {
                exercise_type: 'mcq_translate_to_en',
                prompt: { sentence_vi: vi, answer_en: en, options_en: options },
            };
        }

        case 'mcq_translate_to_vi': {
            const distractors = allExamples
                .filter(e => e.vi && e.vi !== vi)
                .map(e => e.vi)
                .sort(() => Math.random() - 0.5)
                .slice(0, 3);
            while (distractors.length < 3) {
                distractors.push(`Không phải: ${vi.split(' ').slice(0, 3).join(' ')}...`);
            }
            const options = [vi, ...distractors].sort(() => Math.random() - 0.5);
            return {
                exercise_type: 'mcq_translate_to_vi',
                prompt: { sentence_en: en, answer_vi: vi, options_vi: options },
            };
        }

        case 'fill_blank': {
            // Remove a key word from Vietnamese sentence and ask user to fill it
            const words = vi.split(/\s+/);
            if (words.length < 3) return buildExercise(example, 'mcq_translate_to_en', allExamples, unit);
            // Pick a word to blank out (prefer content words, not first/last)
            const blankIdx = Math.min(words.length - 2, Math.max(1, Math.floor(Math.random() * (words.length - 1))));
            const answer = words[blankIdx];
            const blanked = [...words];
            blanked[blankIdx] = '______';
            return {
                exercise_type: 'fill_blank',
                prompt: {
                    sentence_with_blank: blanked.join(' '),
                    answer_vi: answer,
                    accepted_answers_vi: [answer, answer.toLowerCase()],
                    hint_en: en,
                },
            };
        }

        case 'listen_choose': {
            // Play Vietnamese audio, pick the correct translation
            const distractors = allExamples
                .filter(e => e.en && e.en !== en)
                .map(e => e.en)
                .sort(() => Math.random() - 0.5)
                .slice(0, 3);
            while (distractors.length < 3) {
                distractors.push(`Not: ${en.split(' ').reverse().join(' ')}`);
            }
            const options = [en, ...distractors].sort(() => Math.random() - 0.5);
            return {
                exercise_type: 'listen_choose',
                prompt: { audio_vi: vi, answer_en: en, options_en: options },
            };
        }

        case 'reorder_words': {
            const words = vi.split(/\s+/);
            if (words.length < 3) return buildExercise(example, 'mcq_translate_to_vi', allExamples, unit);
            const shuffled = [...words].sort(() => Math.random() - 0.5);
            // Make sure shuffled is different from original
            if (shuffled.join(' ') === vi) shuffled.reverse();
            return {
                exercise_type: 'reorder_words',
                prompt: {
                    words_shuffled: shuffled,
                    answer_vi: vi,
                    hint_en: en,
                },
            };
        }

        case 'match_pairs': {
            // Build pairs from available examples
            const pairs = allExamples
                .filter(e => e.vi && e.en)
                .slice(0, 4)
                .map(e => ({ vi: e.vi, en: e.en }));
            return {
                exercise_type: 'match_pairs',
                prompt: { pairs },
            };
        }

        default:
            return buildExercise(example, 'mcq_translate_to_en', allExamples, unit);
    }
}
