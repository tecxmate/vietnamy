// Concept blocks — short teaching screens (Duolingo-style "tips") shown in a
// lesson's intro phase. Canonical content lives in content/concepts.json
// (authoritative, hand-maintained, like tones.json); this module is a thin
// adapter over it. A concept declares its lesson via lessonId, so attaching a
// concept never touches the generated curriculum bundle.

import conceptsData from '../../content/concepts.json';

/**
 * Concepts attached to a lesson, in file order.
 * @param {string} lessonId
 * @returns {Array<{ id, lessonId, title, body, examples? }>}
 */
export function getConceptsForLesson(lessonId) {
    return (conceptsData.concepts || []).filter((c) => c.lessonId === lessonId);
}
