// Per-word, per-exercise-type grading system
// Tracks how well the user knows each word across different skill dimensions
// Used by SRS to determine which words need more practice and in which modality

const GRADES_KEY = 'vnme_word_grades';

// Skill dimensions that map to exercise types
export const DIMENSIONS = {
    meaning_recognition: 'meaning_recognition',  // mcq_to_en, match_pairs, picture_choice
    meaning_production: 'meaning_production',     // mcq_to_vi, translation_word_bank
    listening: 'listening',                       // listen_choose, listen_type
    spelling: 'spelling',                         // listen_type (typing accuracy)
    speaking: 'speaking',                         // speak_sentence
    context: 'context',                           // fill_blank, reorder_words
};

// Map exercise types → which dimensions they test
const EXERCISE_DIMENSION_MAP = {
    match_pairs: [DIMENSIONS.meaning_recognition],
    picture_choice: [DIMENSIONS.meaning_recognition],
    mcq_translate_to_en: [DIMENSIONS.meaning_recognition],
    mcq_translate_to_vi: [DIMENSIONS.meaning_production],
    listen_choose: [DIMENSIONS.listening],
    listen_type: [DIMENSIONS.listening, DIMENSIONS.spelling],
    fill_blank: [DIMENSIONS.context],
    translation_word_bank: [DIMENSIONS.meaning_production, DIMENSIONS.context],
    reorder_words: [DIMENSIONS.context],
    speak_sentence: [DIMENSIONS.speaking],
};

function loadGrades() {
    try {
        const raw = localStorage.getItem(GRADES_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
}

function saveGrades(data) {
    localStorage.setItem(GRADES_KEY, JSON.stringify(data));
}

function todayISO() {
    return new Date().toISOString().slice(0, 10);
}

/**
 * Record a grading result for one or more items after an exercise.
 *
 * @param {string} exerciseType - e.g. 'mcq_translate_to_en'
 * @param {string[]} itemIds - item IDs tested in this exercise
 * @param {boolean} correct - whether the user got it right
 */
export function recordExerciseResult(exerciseType, itemIds, correct) {
    if (!itemIds || itemIds.length === 0) return;

    const dimensions = EXERCISE_DIMENSION_MAP[exerciseType];
    if (!dimensions) return;

    const grades = loadGrades();
    const today = todayISO();

    for (const itemId of itemIds) {
        if (!grades[itemId]) {
            grades[itemId] = {};
        }

        for (const dim of dimensions) {
            if (!grades[itemId][dim]) {
                grades[itemId][dim] = { correct: 0, wrong: 0, last: null };
            }

            if (correct) {
                grades[itemId][dim].correct++;
            } else {
                grades[itemId][dim].wrong++;
            }
            grades[itemId][dim].last = today;
        }
    }

    saveGrades(grades);
}

/**
 * Get the grade data for a specific item.
 * Returns null if no data exists.
 *
 * @param {string} itemId
 * @returns {Object|null} e.g. { meaning_recognition: { correct: 5, wrong: 1, last: "2026-03-16" }, ... }
 */
export function getItemGrades(itemId) {
    const grades = loadGrades();
    return grades[itemId] || null;
}

/**
 * Get the weakest dimension for an item.
 * Returns the dimension name with the worst correct/wrong ratio,
 * or null if no grades exist.
 *
 * @param {string} itemId
 * @returns {string|null}
 */
export function getWeakestDimension(itemId) {
    const itemGrades = getItemGrades(itemId);
    if (!itemGrades) return null;

    let weakest = null;
    let worstRatio = Infinity;

    for (const [dim, data] of Object.entries(itemGrades)) {
        const total = data.correct + data.wrong;
        if (total === 0) continue;
        const ratio = data.correct / total;
        if (ratio < worstRatio) {
            worstRatio = ratio;
            weakest = dim;
        }
    }

    return weakest;
}

/**
 * Check if an item is "mastered" across all tested dimensions.
 * Mastery = correct > wrong in every dimension that has been tested.
 *
 * @param {string} itemId
 * @returns {boolean}
 */
export function isItemMastered(itemId) {
    const itemGrades = getItemGrades(itemId);
    if (!itemGrades) return false;

    const dims = Object.values(itemGrades);
    if (dims.length === 0) return false;

    return dims.every(d => d.correct > d.wrong);
}

/**
 * Get items that are weak (not mastered) from a list of item IDs.
 * Sorted by weakness (worst ratio first).
 *
 * @param {string[]} itemIds
 * @returns {string[]} sorted item IDs, weakest first
 */
export function getWeakItems(itemIds) {
    const grades = loadGrades();

    return itemIds
        .map(id => {
            const g = grades[id];
            if (!g) return { id, ratio: 0 }; // never tested = weakest
            const dims = Object.values(g);
            if (dims.length === 0) return { id, ratio: 0 };
            const totalCorrect = dims.reduce((s, d) => s + d.correct, 0);
            const totalWrong = dims.reduce((s, d) => s + d.wrong, 0);
            const total = totalCorrect + totalWrong;
            return { id, ratio: total > 0 ? totalCorrect / total : 0 };
        })
        .sort((a, b) => a.ratio - b.ratio)
        .map(x => x.id);
}

/**
 * Extract item IDs that an exercise tests, based on exercise type and prompt data.
 * This is needed because different exercise types store item references differently.
 *
 * @param {Object} exercise - the exercise object with exercise_type and prompt
 * @param {Object} db - the database object (to resolve vi_text → item ID lookups)
 * @returns {string[]} array of item IDs involved in this exercise
 */
export function extractItemIds(exercise, db) {
    if (!exercise || !exercise.prompt) return [];

    const items = db?.items || [];
    const findByVi = (viText) => {
        if (!viText) return null;
        const item = items.find(i => i.vi_text === viText);
        return item ? item.id : null;
    };

    const type = exercise.exercise_type;
    const prompt = exercise.prompt;
    const ids = [];

    switch (type) {
        case 'match_pairs':
            // Match pairs test all items in the batch
            if (prompt.pairs) {
                for (const pair of prompt.pairs) {
                    const id = findByVi(pair.vi_text);
                    if (id) ids.push(id);
                }
            }
            break;

        case 'picture_choice':
        case 'listen_choose':
            // These test the target item (the correct answer)
            {
                const id = findByVi(prompt.answer_vi);
                if (id) ids.push(id);
            }
            break;

        case 'mcq_translate_to_en':
            // Source is Vietnamese, answer is the item being tested
            {
                const id = findByVi(prompt.source_text_vi);
                if (id) ids.push(id);
            }
            break;

        case 'mcq_translate_to_vi':
            // Answer is Vietnamese
            {
                const id = findByVi(prompt.answer_vi);
                if (id) ids.push(id);
            }
            break;

        case 'listen_type':
            {
                const id = findByVi(prompt.answer_vi);
                if (id) ids.push(id);
            }
            break;

        case 'speak_sentence':
            {
                const id = findByVi(prompt.target_vi);
                if (id) ids.push(id);
            }
            break;

        case 'translation_word_bank':
        case 'reorder_words':
            // These test the full sentence
            {
                const id = findByVi(prompt.answer_vi || prompt.target_vi);
                if (id) ids.push(id);
            }
            break;

        case 'fill_blank':
            // The word being blanked is the tested item
            {
                const id = findByVi(prompt.answer_vi);
                if (id) ids.push(id);
            }
            break;

        case 'dialogue_complete':
            // The missing turn is the tested item. Dialogue lines are authored
            // separately from the sentence bank, so this only resolves when the
            // line also exists as an item — no match simply means no SRS credit,
            // which is the same behaviour as any unrecognised text.
            {
                const id = findByVi(prompt.answer_vi);
                if (id) ids.push(id);
            }
            break;
    }

    return ids;
}
