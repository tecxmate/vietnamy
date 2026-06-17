// Simple Spaced Repetition System using localStorage
// Intervals in days: 1 → 3 → 7 → 14 → 30

const SRS_KEY = 'vnme_srs';
const INTERVALS = [1, 3, 7, 14, 30];

function loadSRS() {
    try {
        const raw = localStorage.getItem(SRS_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
}

function saveSRS(data) {
    localStorage.setItem(SRS_KEY, JSON.stringify(data));
}

function todayISO() {
    return new Date().toISOString().slice(0, 10);
}

/**
 * Add items from a completed lesson to the SRS queue.
 * Reads the lesson blueprint from the mock DB to find introduced items.
 */
export async function addItemsFromLesson(lessonId) {
    try {
        const { getFullDB } = await import('./storage/mockDbStore');
        const db = getFullDB();
        const itemIds = Array.isArray(lessonId)
            ? lessonId
            : (db.lesson_blueprints || []).find(bp => bp.lesson_id === lessonId)?.introduced_items;
        if (!itemIds?.length) return;

        const srs = loadSRS();
        const today = todayISO();

        itemIds.forEach(itemId => {
            if (srs[itemId]) return; // Already in SRS, don't reset

            const item = (db.items || []).find(i => i.id === itemId);
            const translation = (db.translations || []).find(t => t.item_id === itemId && t.lang === 'en');
            if (!item || !translation) return;

            srs[itemId] = {
                itemId,
                vietnamese: item.vi_text,
                english: translation.text,
                intervalIndex: 0,      // Index into INTERVALS array
                nextReview: today,     // Due immediately for first review
                lastReview: null,
                correctCount: 0,
                wrongCount: 0,
            };
        });

        saveSRS(srs);
    } catch {
        // SRS is a retention layer; never let it interrupt lesson completion.
    }
}

/**
 * Get all items that are due for review (nextReview <= today).
 */
export function getDueItems() {
    const srs = loadSRS();
    const today = todayISO();

    return Object.values(srs).filter(card => card.nextReview <= today);
}

/**
 * Get item IDs that are due for review.
 */
export function getDueItemIds() {
    return getDueItems().map(card => card.itemId);
}

/**
 * Get total number of items in SRS.
 */
export function getTotalItems() {
    return Object.keys(loadSRS()).length;
}

/**
 * Record a review result for an item.
 * correct: true → advance interval. false → reset to day 1.
 */
export function recordReview(itemId, correct) {
    const srs = loadSRS();
    const card = srs[itemId];
    if (!card) return;

    const today = todayISO();
    card.lastReview = today;

    if (correct) {
        card.correctCount++;
        card.intervalIndex = Math.min(card.intervalIndex + 1, INTERVALS.length - 1);
    } else {
        card.wrongCount++;
        card.intervalIndex = 0;
    }

    const daysUntilNext = INTERVALS[card.intervalIndex];
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + daysUntilNext);
    card.nextReview = nextDate.toISOString().slice(0, 10);

    srs[itemId] = card;
    saveSRS(srs);
}
