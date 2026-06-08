import { INIT_DATA } from '../content/initialData';

const DB_KEY = 'vnme_mock_db_v24'; // v24: unified_db.json as primary source
const CURRICULUM_VERSION = 28; // v28: revive 4-module units (pron+grammar) for Units 1-3

let dbCache = null;

const initDB = () => {
    const raw = localStorage.getItem(DB_KEY);
    if (!raw) {
        localStorage.setItem(DB_KEY, JSON.stringify(INIT_DATA));
        localStorage.setItem(DB_KEY + '_cv', String(CURRICULUM_VERSION));
        return JSON.parse(localStorage.getItem(DB_KEY));
    }

    const storedVersion = parseInt(localStorage.getItem(DB_KEY + '_cv') || '1', 10);
    if (storedVersion < CURRICULUM_VERSION) {
        // Overwrite curriculum-derived collections, keep user-edited exercises.
        const existing = JSON.parse(raw);
        existing.units = INIT_DATA.units;
        existing.path_nodes = INIT_DATA.path_nodes;
        existing.lessons = INIT_DATA.lessons;
        existing.items = INIT_DATA.items;
        existing.translations = INIT_DATA.translations;
        existing.lesson_blueprints = INIT_DATA.lesson_blueprints;
        existing.scenes = INIT_DATA.scenes;
        existing.scene_locations = INIT_DATA.scene_locations;
        localStorage.setItem(DB_KEY, JSON.stringify(existing));
        localStorage.setItem(DB_KEY + '_cv', String(CURRICULUM_VERSION));
        return existing;
    }

    return JSON.parse(raw);
};

export const getDB = () => {
    if (!dbCache) {
        dbCache = initDB();
    }
    return dbCache;
};

export const saveDB = (data) => {
    dbCache = data;
    localStorage.setItem(DB_KEY, JSON.stringify(data));
};

const EXPORT_KIND = 'vnme_curriculum_edits';
const EXPORT_VERSION = 1;

// Serialize the entire mock DB (curriculum + edits + exercises) to a JSON
// payload that can be re-imported on another browser/machine. Progress keys
// (vietnamy_progress / vietnamy_dong) are intentionally excluded — this is
// a curriculum backup, not a save game.
export const exportDB = () => ({
    kind: EXPORT_KIND,
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    curriculumVersion: CURRICULUM_VERSION,
    db: getDB(),
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
    localStorage.setItem(DB_KEY, JSON.stringify(payload.db));
    // Pin the version to what was exported so the version-gate logic in
    // initDB doesn't immediately overwrite the imported curriculum on next load.
    const cv = Number.isFinite(payload.curriculumVersion) ? payload.curriculumVersion : CURRICULUM_VERSION;
    localStorage.setItem(DB_KEY + '_cv', String(cv));
    dbCache = payload.db;
};
