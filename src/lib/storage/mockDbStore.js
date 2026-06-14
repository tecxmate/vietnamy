import { buildRuntimeFromCanonical, getInitialData, hydrateInitialData } from '../content/initialData';

const DB_KEY = 'vnme_mock_db_v24'; // v24: unified_db.json as primary source
const CURRICULUM_VERSION = 33; // v33: A1 lessons split into per-skill nodes

let dbCache = null;
let dbIsFull = false;

const safeSetLocalStorage = (key, value) => {
    try {
        localStorage.setItem(key, value);
    } catch {
        // Some browsers deny localStorage in private/blocked-storage contexts.
    }
};

const persistLightSeed = (lightSeed) => {
    safeSetLocalStorage(DB_KEY, JSON.stringify(lightSeed));
    safeSetLocalStorage(DB_KEY + '_cv', String(CURRICULUM_VERSION));
    dbIsFull = false;
    return lightSeed;
};

const parseStoredDB = (raw) => {
    try {
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === 'object' ? parsed : null;
    } catch {
        return null;
    }
};

const hasFullContent = (db) => (
    (db.items || []).length > 0 &&
    (db.translations || []).length > 0 &&
    (db.lesson_blueprints || []).length > 0
);

const initDB = () => {
    const raw = localStorage.getItem(DB_KEY);
    const lightSeed = getInitialData({ full: false });

    if (!raw) {
        return persistLightSeed(lightSeed);
    }

    const parsed = parseStoredDB(raw);
    if (!parsed) return persistLightSeed(lightSeed);

    const storedVersion = parseInt(localStorage.getItem(DB_KEY + '_cv') || '1', 10);
    if (storedVersion < CURRICULUM_VERSION) {
        // Overwrite curriculum-derived collections, keep user-edited exercises.
        // v30 intentionally stores a slim roadmap seed; full exercise/content
        // collections are hydrated only when a route actually needs them.
        const existing = parsed;
        existing.units = lightSeed.units;
        existing.path_nodes = lightSeed.path_nodes;
        existing.lessons = lightSeed.lessons;
        existing.items = [];
        existing.translations = [];
        existing.lesson_blueprints = [];
        existing.scenes = [];
        existing.scene_locations = [];
        safeSetLocalStorage(DB_KEY, JSON.stringify(existing));
        safeSetLocalStorage(DB_KEY + '_cv', String(CURRICULUM_VERSION));
        dbIsFull = false;
        return existing;
    }

    dbIsFull = hasFullContent(parsed);
    return parsed;
};

export const getDB = () => {
    if (!dbCache) {
        dbCache = initDB();
    }
    return dbCache;
};

export const getFullDB = () => {
    const db = getDB();
    if (!dbIsFull || !hasFullContent(db)) {
        dbCache = hydrateInitialData(db);
        dbIsFull = true;
    }
    return dbCache;
};

export const saveDB = (data) => {
    dbCache = data;
    dbIsFull = hasFullContent(data);
    safeSetLocalStorage(DB_KEY, JSON.stringify(data));
};

export const applyCanonicalCurriculumToDB = (curriculum) => {
    const runtime = buildRuntimeFromCanonical(curriculum, { includeContent: true });
    const db = getFullDB();
    const canonicalNodeIds = new Set(runtime.pathNodes.map(node => node.id));
    const canonicalSourceNodeIds = new Set(runtime.pathNodes.map(node => node.source_node_id).filter(Boolean));

    db.lessons = runtime.lessons;
    db.items = runtime.items;
    db.translations = runtime.translations;
    db.lesson_blueprints = runtime.blueprints;
    db.path_nodes = [
        ...runtime.pathNodes,
        ...(db.path_nodes || []).filter(node => {
            if (canonicalNodeIds.has(node.id)) return false;
            if (node.node_type === 'lesson' || node.type === 'lesson') return false;
            if (node.test_scope === 'module' && canonicalSourceNodeIds.has(node.source_node_id)) return false;
            return true;
        }),
    ];

    saveDB(db);
    return db;
};

const EXPORT_KIND = 'vnme_curriculum_edits';
const EXPORT_VERSION = 1;

// Serialize the entire mock DB (curriculum + edits + exercises) to a JSON
// payload that can be re-imported on another browser/machine. Progress keys
// (vietnamy_progress / vnme_hearts / vnme_streak / legacy vietnamy_dong)
// are intentionally excluded — this is a curriculum backup, not a save game.
export const exportDB = () => ({
    kind: EXPORT_KIND,
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    curriculumVersion: CURRICULUM_VERSION,
    db: getFullDB(),
});

// Replace the current mock DB with an imported payload. Throws on malformed
// input. The caller is responsible for any UI feedback (and for reloading
// the page so React contexts re-read the new DB).
export const importDB = (payload) => {
    if (!payload || payload.kind !== EXPORT_KIND) {
        throw new Error('Not a Vietnamy curriculum-edits file.');
    }
    if (!payload.db || typeof payload.db !== 'object') {
        throw new Error('Import payload is missing the `db` object.');
    }
    safeSetLocalStorage(DB_KEY, JSON.stringify(payload.db));
    // Pin the version to what was exported so the version-gate logic in
    // initDB doesn't immediately overwrite the imported curriculum on next load.
    const cv = Number.isFinite(payload.curriculumVersion) ? payload.curriculumVersion : CURRICULUM_VERSION;
    safeSetLocalStorage(DB_KEY + '_cv', String(cv));
    dbCache = payload.db;
    dbIsFull = hasFullContent(payload.db);
};
