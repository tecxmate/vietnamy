// Shared learner-state derivation + sequencer invocation (Layer 3/4).
// Used by the Study tab's "Recommended for you" row AND the Continue button
// (sequencer-primary). Pure aside from reading the live SRS/mastery signals.
import curriculum from '../../content/curriculum.json';
import { getNextBestLessons } from './sequencer';
import { getDueItemIds } from './srs';
import { getWeakItems, isItemMastered } from './wordGrades';

const REAL_PURPOSES = ['explore_vietnam', 'professional', 'heritage'];
export const PURPOSE_IDS = REAL_PURPOSES;

// Admin-tunable per-lesson purpose weights (vnme_cms_purpose_weights), id-keyed
// like the other CMS overrides. Overlays the generated adaptive.purposes.
const PURPOSE_OVERRIDES_KEY = 'vnme_cms_purpose_weights';

export function getPurposeOverrides() {
    try {
        const raw = localStorage.getItem(PURPOSE_OVERRIDES_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
}

export function savePurposeOverrides(overrides) {
    try {
        localStorage.setItem(PURPOSE_OVERRIDES_KEY, JSON.stringify(overrides));
    } catch { /* ignore */ }
}

/** Overlay admin weight overrides onto a lesson's generated purposes. */
function withPurposeOverrides(lessons) {
    const overrides = getPurposeOverrides();
    if (!Object.keys(overrides).length) return lessons;
    return lessons.map((l) => {
        const o = overrides[l.id];
        if (!o) return l;
        const merged = new Map((l.adaptive?.purposes || []).map(p => [p.id, p.weight]));
        for (const [pid, w] of Object.entries(o)) merged.set(pid, w);
        return { ...l, adaptive: { ...l.adaptive, purposes: [...merged].map(([id, weight]) => ({ id, weight })) } };
    });
}

/**
 * Sequencer recommendations for the learner's current progress + purpose.
 * @param {Set|Array} completedNodeIds - completed roadmap node ids (current mode)
 * @param {string} purpose - learner mode id
 * @returns {{ recs: Array, dueCount: number }}
 */
export function getRecommendations(completedNodeIds, purpose, { limit = 3 } = {}) {
    const lessons = withPurposeOverrides(curriculum.lessons || []);
    const nodeToLesson = new Map(lessons.filter(l => l.nodeId).map(l => [l.nodeId, l]));
    const completed = [...(completedNodeIds || [])].map(id => nodeToLesson.get(id)).filter(Boolean);
    const seenItemIds = completed.flatMap(l => l.wordIds || []);

    // Base target difficulty from completed lessons, nudged ±1 by live mastery
    // (Layer 4 performance-adaptivity): strong → harder, struggling → easier.
    const baseLevel = completed.length
        ? Math.min(10, Math.max(1, Math.round(completed.reduce((s, l) => s + (l.difficulty || 3), 0) / completed.length) + 1))
        : 2;
    let estimatedLevel = baseLevel;
    if (seenItemIds.length >= 8) {
        const masteredRatio = seenItemIds.filter(isItemMastered).length / seenItemIds.length;
        if (masteredRatio >= 0.7) estimatedLevel = Math.min(10, baseLevel + 1);
        else if (masteredRatio < 0.3) estimatedLevel = Math.max(1, baseLevel - 1);
    }
    const recentTopics = [...completed]
        .sort((a, b) => (b.orderIndex ?? 0) - (a.orderIndex ?? 0))
        .slice(0, 3).map(l => l.topic);
    const realPurpose = REAL_PURPOSES.includes(purpose) ? purpose : 'explore_vietnam';

    // Item-based Layer 4 signals: SRS due + weakest third of seen vocab.
    const dueItemIds = new Set(getDueItemIds());
    const weakItemIds = new Set(getWeakItems(seenItemIds).slice(0, Math.ceil(seenItemIds.length / 3)));

    return {
        recs: getNextBestLessons(
            { completedLessonIds: completed.map(l => l.id), purpose: realPurpose, estimatedLevel, recentTopics, dueItemIds, weakItemIds },
            lessons, { limit },
        ),
        dueCount: dueItemIds.size,
    };
}
