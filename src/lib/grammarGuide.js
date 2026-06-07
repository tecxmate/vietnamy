// Grammar guide — derives "what grammar does this unit teach" from the grammar
// tags already carried by the unit's sentences, so the roadmap can surface a
// Duolingo-style guidebook. No separate authoring needed: a sentence's
// grammarTagIds resolve to canonical grammar tags (id, name, category,
// description) in content/curriculum.json.
//
// Coverage tracks tagging: only sentences that carry grammarTagIds contribute,
// so units with untagged sentences return an empty list (the roadmap hides the
// button in that case).

import curriculum from '../../content/curriculum.json';

const TAGS = new Map((curriculum.grammarTags || []).map((t) => [t.id, t]));
const SENTENCES = new Map((curriculum.sentences || []).map((s) => [s.id, s]));

/**
 * Distinct grammar points taught across all lessons in a unit, in tag order.
 * @param {string} unitId
 * @returns {Array<{ id, name, category, description }>}
 */
export function getGrammarForUnit(unitId) {
    const tagIds = new Set();
    for (const lesson of curriculum.lessons || []) {
        if (lesson.unitId !== unitId) continue;
        for (const sid of lesson.sentenceIds || []) {
            const sentence = SENTENCES.get(sid);
            (sentence?.grammarTagIds || []).forEach((id) => tagIds.add(id));
        }
    }
    return [...tagIds].map((id) => TAGS.get(id)).filter(Boolean);
}
