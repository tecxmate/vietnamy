// LEARN modules — the "teach before practice" phase of a lesson: a short,
// fixed set of typed teaching steps (objective / pattern / insight / vocab)
// that play before the practice exercises, all under one progress bar in
// LessonGame.
//
// Kept deliberately lean: one clean on-ramp per module, no per-learner depth
// dial. Canonical content lives in content/learn_modules.json; admin edits save
// to localStorage and override the bundle at runtime (vnme_cms_* CMS pattern).

import learnData from '../../content/learn_modules.json';

export const LEARN_MODULES_STORAGE_KEY = 'vnme_cms_learn_modules';

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

/**
 * Build the ordered LEARN intro steps for LessonGame.
 * Returns render-ready step objects: { type, data }. The objective step is
 * enriched with the module header (title / minutes / CEFR / difficulty).
 */
export function buildLearnSteps(module) {
    if (!module?.learn) return [];
    const meta = {
        title_vi: module.title_vi,
        title_en: module.title_en,
        est_minutes: module.est_minutes,
        cefr: module.cefr,
        difficulty: module.difficulty,
    };
    return module.learn.map((step) => {
        if (step.type === 'objective') return { type: 'objective', data: { ...step, meta } };
        if (step.type === 'vocab') return { type: 'learn_vocab', data: step };
        return { type: step.type, data: step };
    });
}
