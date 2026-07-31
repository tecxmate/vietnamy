// LEARN modules — the "teach before practice" phase of a lesson. A fixed,
// Duolingo-lean 2-screen template that plays before the MCQ practice, all under
// one progress bar in LessonGame:
//   1) THE IDEA  — the goal + (optional) color-coded pattern + one-line note
//   2) NEW WORDS — the words, tap-to-hear
// Canonical content lives in content/learn_modules.json; admin edits save to
// localStorage and override the bundle at runtime (vnme_cms_* CMS pattern).

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
 * Build the fixed 2-screen LEARN sequence for LessonGame.
 * Returns render-ready step objects: { type, data }.
 *   - 'idea'  → goal + optional pattern + note (+ module header for context)
 *   - 'vocab' → the new words
 */
export function buildLearnSteps(module) {
    if (!module) return [];
    const steps = [];
    if (module.idea) {
        steps.push({
            type: 'idea',
            data: {
                goal: module.idea.goal,
                note: module.idea.note || null,
                pattern: module.idea.pattern || null,
                title_vi: module.title_vi,
                title_en: module.title_en,
                cefr: module.cefr,
                difficulty: module.difficulty,
            },
        });
    }
    // One flashcard step per word (each is its own progress-bar step).
    const words = module.words || [];
    words.forEach((word, i) => {
        steps.push({ type: 'flashcard', data: { word, index: i, total: words.length } });
    });
    return steps;
}
