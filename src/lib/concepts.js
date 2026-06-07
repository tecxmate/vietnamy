// Concept blocks — short teaching screens (Duolingo-style "tips") shown in a
// lesson's intro phase. Canonical content lives in content/concepts.json
// (authoritative, hand-maintained, like tones.json); this module is a thin
// adapter over it. A concept declares its lesson via lessonId, so attaching a
// concept never touches the generated curriculum bundle.
//
// Admin edits (Concept Editor) are saved to localStorage and override the baked
// bundle at runtime — same CMS pattern as the other editors (vnme_cms_*).

import conceptsData from '../../content/concepts.json';

export const CONCEPTS_STORAGE_KEY = 'vnme_cms_concepts';

/**
 * All concepts. Admin localStorage edits override the baked bundle when present.
 * @returns {Array<{ id, lessonId, title, body, examples? }>}
 */
export function getAllConcepts() {
    try {
        const raw = localStorage.getItem(CONCEPTS_STORAGE_KEY);
        if (raw) return JSON.parse(raw);
    } catch { /* localStorage unavailable / bad JSON — fall back to bundle */ }
    return conceptsData.concepts || [];
}

/** Persist the full concept list (used by the Concept Editor). */
export function saveAllConcepts(concepts) {
    localStorage.setItem(CONCEPTS_STORAGE_KEY, JSON.stringify(concepts));
}

/**
 * Concepts attached to a lesson, in list order.
 * @param {string} lessonId
 */
export function getConceptsForLesson(lessonId) {
    return getAllConcepts().filter((c) => c.lessonId === lessonId);
}
