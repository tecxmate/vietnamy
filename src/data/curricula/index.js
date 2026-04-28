/**
 * Curriculum Loader — study_import schema
 *
 * Composes lessons for a given (mode, base) on demand:
 *   canonical (Vietnamese + structure, EN-derived) + translations[base] = displayable curriculum.
 *
 * Mode → tracks:
 *   explore_vietnam → [a1_core, a2_core, b1_tourist]
 *   professional    → [a1_core, a2_core, b1_manager]
 *   heritage        → [a1_core, a2_core, b1_heritage]
 *   placement       → [placement]
 *
 * Translation fallback: if a lesson has no translation in the requested base
 * (because that base's xlsx is partial or has edited vi text that didn't match
 * the canonical fingerprint), fall back to EN. The UI gets vi + best-available translation.
 *
 * Legacy API (`getCurriculum`, `getLessonsForMode`, etc.) is preserved.
 */

// Canonical content (Vietnamese + structure). One file per (level, track).
import a1Core from './study_import/canonical/a1_core.json';
import a2Core from './study_import/canonical/a2_core.json';
import b1Manager from './study_import/canonical/b1_manager.json';
import b1Tourist from './study_import/canonical/b1_tourist.json';
import b1Heritage from './study_import/canonical/b1_heritage.json';
import placement from './study_import/canonical/placement.json';
import manifest from './study_import/manifest.json';

// Translations per base × track. Glob import so adding a new base just means
// dropping files into translations/<base>/ and rebuilding.
const trModules = import.meta.glob('./study_import/translations/*/*.json', { eager: true });
const TRANSLATIONS = {}; // { base: { ltKey: { lesson_id: { item_id: text } } } }
for (const [path, mod] of Object.entries(trModules)) {
    const m = path.match(/translations\/([^/]+)\/([^/]+)\.json$/);
    if (!m) continue;
    const [, base, ltKey] = m;
    (TRANSLATIONS[base] = TRANSLATIONS[base] || {})[ltKey] = mod.default ?? mod;
}

const CANONICAL_BY_LT = {
    a1_core: a1Core,
    a2_core: a2Core,
    b1_manager: b1Manager,
    b1_tourist: b1Tourist,
    b1_heritage: b1Heritage,
    placement,
};

const MODE_TRACKS = {
    explore_vietnam: ['a1_core', 'a2_core', 'b1_tourist'],
    professional:    ['a1_core', 'a2_core', 'b1_manager'],
    heritage:        ['a1_core', 'a2_core', 'b1_heritage'],
    placement:       ['placement'],
};

const BASE_FROM_UI_LANG = {
    en: 'en',
    cn: 'zh',     // legacy UI language code "cn" → traditional Chinese base
    'zh-CN': 'zh_cn',
    ja: 'ja',
    ko: 'ko',
};

const DEFAULT_BASE = 'en';
const DEFAULT_MODE = 'explore_vietnam';

function resolveBase(uiLang) {
    return BASE_FROM_UI_LANG[uiLang] || uiLang || DEFAULT_BASE;
}

function lookupTr(lessonId, itemId, ltKey, base) {
    const a = TRANSLATIONS[base]?.[ltKey]?.translations?.[lessonId]?.[itemId];
    if (a) return a;
    if (base === DEFAULT_BASE) return null;
    return TRANSLATIONS[DEFAULT_BASE]?.[ltKey]?.translations?.[lessonId]?.[itemId] || null;
}

/**
 * Compose a single track's lessons with translations baked in for the requested base.
 * Returns lessons in canonical order with `words[i].translation`, `sentences[i].translation`,
 * `matches[i].target` filled.
 */
function composeTrack(ltKey, base) {
    const canonical = CANONICAL_BY_LT[ltKey];
    if (!canonical) return null;
    const lessons = canonical.lessons.map(l => ({
        ...l,
        ltKey,
        words: l.words.map(w => ({ ...w, translation: lookupTr(l.id, w.id, ltKey, base) })),
        sentences: l.sentences.map(s => ({ ...s, translation: lookupTr(l.id, s.id, ltKey, base) })),
        matches: l.matches.map(m => ({ ...m, target: lookupTr(l.id, m.id, ltKey, base) })),
    }));
    return { meta: canonical.meta, units: canonical.units, lessons };
}

/**
 * Get the full composed curriculum for a (mode, base/uiLang).
 * Concatenates all track lessons and merges units (each track contributes its own unit list,
 * prefixed by track for disambiguation).
 */
export function getCurriculum(modeId = DEFAULT_MODE, uiLang = 'en') {
    const tracks = MODE_TRACKS[modeId] || MODE_TRACKS[DEFAULT_MODE];
    const base = resolveBase(uiLang);
    const composed = tracks.map(lt => composeTrack(lt, base)).filter(Boolean);

    const allLessons = [];
    const allUnits = [];
    let unitOffset = 0;
    for (const track of composed) {
        for (const u of track.units) {
            allUnits.push({ ...u, index: u.index + unitOffset, track: track.meta.track });
        }
        for (const l of track.lessons) {
            allLessons.push({ ...l, unit_index: l.unit_index + unitOffset });
        }
        unitOffset += track.units.length;
    }

    return {
        meta: {
            mode: modeId,
            base,
            generated: manifest.generated,
            tracks,
            stats: {
                units: allUnits.length,
                lessons: allLessons.length,
                words: allLessons.reduce((s, l) => s + l.words.length, 0),
                sentences: allLessons.reduce((s, l) => s + l.sentences.length, 0),
                matches: allLessons.reduce((s, l) => s + l.matches.length, 0),
            },
        },
        units: allUnits,
        lessons: allLessons,
    };
}

export function getLessonsForMode(modeId, uiLang = 'en', unitFilter = null) {
    const c = getCurriculum(modeId, uiLang);
    return unitFilter ? c.lessons.filter(l => l.unit_index === unitFilter) : c.lessons;
}

export function getUnitsForMode(modeId, uiLang = 'en') {
    return getCurriculum(modeId, uiLang).units;
}

export function getLessonById(modeId, lessonId, uiLang = 'en') {
    return getCurriculum(modeId, uiLang).lessons.find(l => l.id === lessonId) || null;
}

/** Coverage stats from manifest — useful for telling the UI which language pairs are complete. */
export function getCoverage() {
    return manifest.coverage || null;
}

/** Available bases (UI language codes that have any translations). */
export function getAvailableBases() {
    return Object.keys(manifest.bases);
}

/**
 * Convert a study_import lesson into the LESSON_DEFS shape used by the existing
 * exercise generator (db.js → buildFromDefs). Words/sentences flattened, with
 * en/translation aliases.
 */
export function toLessonDef(lesson) {
    return {
        id: lesson.id,
        nodeId: lesson.node_id,
        quizId: lesson.quiz_id,
        unit: `unit_${lesson.unit_index}`,
        title: lesson.lesson_title,
        type: lesson.lesson_type,
        unlockRule: lesson.unlock_rule,
        xp: lesson.xp_reward,
        contentTypes: lesson.content_types,
        grammarTags: lesson.grammar_tags,
        words: lesson.words.map(w => ({
            id: w.id,
            vi: w.vi,
            en: w.translation || '',
            ipa: w.ipa,
            category: w.category,
        })),
        sentences: lesson.sentences.map(s => ({
            id: s.id,
            vi: s.vi,
            en: s.translation || '',
        })),
        matches: lesson.matches.map(m => ({
            id: m.id,
            text: m.text,
            target: m.target || '',
        })),
    };
}

export function getAllLessonDefs(modeId, uiLang = 'en') {
    return getLessonsForMode(modeId, uiLang).map(toLessonDef);
}

export function getCurriculumStats(modeId, uiLang = 'en') {
    return getCurriculum(modeId, uiLang).meta.stats;
}

export default {
    getCurriculum,
    getLessonsForMode,
    getUnitsForMode,
    getLessonById,
    getCoverage,
    getAvailableBases,
    toLessonDef,
    getAllLessonDefs,
    getCurriculumStats,
};
