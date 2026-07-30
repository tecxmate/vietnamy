// LEARN modules — the "teach before practice" phase of a lesson: an ordered set
// of typed teaching steps (objective / pattern / insight / vocab) that play
// before the practice exercises, all under one progress bar in LessonGame.
//
// Canonical content lives in content/learn_modules.json. Admin edits (Lesson
// Modules editor) save to localStorage and override the bundle at runtime —
// same CMS pattern as concepts/vocab (vnme_cms_*).

import learnData from '../../content/learn_modules.json';
import { loadSettings } from './settings';

export const LEARN_MODULES_STORAGE_KEY = 'vnme_cms_learn_modules';

export const LEARN_DEPTHS = ['light', 'standard', 'deep'];
export const DEFAULT_LEARN_DEPTH = 'standard';

/** All modules. Admin localStorage edits override the baked bundle when present. */
export function getAllLearnModules() {
    try {
        const raw = localStorage.getItem(LEARN_MODULES_STORAGE_KEY);
        if (raw) return JSON.parse(raw);
    } catch { /* bad JSON / no storage — fall back to bundle */ }
    return learnData.modules || [];
}

/** Persist the full module list (used by the Lesson Modules editor). */
export function saveAllLearnModules(modules) {
    localStorage.setItem(LEARN_MODULES_STORAGE_KEY, JSON.stringify(modules));
}

/** The LEARN module attached to a lesson, or null. */
export function getLearnModule(lessonId) {
    return getAllLearnModules().find((m) => m.lesson_id === lessonId) || null;
}

/** The learner's explanation-depth preference. */
export function getLearnDepth() {
    const depth = loadSettings()?.learnDepth;
    return LEARN_DEPTHS.includes(depth) ? depth : DEFAULT_LEARN_DEPTH;
}

// Depth policy — the adjustable "intensity" dial. It only compresses the
// explanatory layer (insight cards + extra pattern examples); it never changes
// which words or pattern are taught.
function keepStepAtDepth(step, depth) {
    if (step.type !== 'insight') return true;      // objective / pattern / vocab always show
    if (depth === 'light') return false;           // light: skip the linguistic notes
    if (depth === 'standard') return step.depth !== 'deep'; // standard: core notes only
    return true;                                   // deep: everything
}

/**
 * Build the ordered LEARN intro steps for LessonGame, filtered by depth.
 * Returns render-ready step objects: { type, data }.
 */
export function buildLearnSteps(module, depth = DEFAULT_LEARN_DEPTH) {
    if (!module?.learn) return [];
    const meta = {
        title_vi: module.title_vi,
        title_en: module.title_en,
        est_minutes: module.est_minutes,
        cefr: module.cefr,
        difficulty: module.difficulty,
    };
    return module.learn
        .filter((step) => keepStepAtDepth(step, depth))
        .map((step) => {
            if (step.type === 'objective') return { type: 'objective', data: { ...step, meta } };
            if (step.type === 'pattern') {
                // Light view shows just the headline example, no extra examples.
                const examples = depth === 'light' ? [] : (step.examples || []);
                return { type: 'pattern', data: { ...step, examples } };
            }
            if (step.type === 'vocab') return { type: 'learn_vocab', data: step };
            return { type: step.type, data: step };
        });
}
