/**
 * Study-import curriculum overrides — per mode, persisted in localStorage.
 *
 * Canonical JSON (committed to the repo) is never mutated. Teachers' edits
 * live in a single key, `vnme_study_import_overrides`, scoped by mode:
 *
 *   {
 *     version: 2,
 *     updatedAt: "...",
 *     byMode: {
 *       explore_vietnam: {
 *         unitOrder:   ["a1_core:1","a1_core:3", ...],
 *         lessonOrder: { "a1_core:1": ["L001","L003","L002"] },
 *         lessonPatches: {
 *           "L_d100db69f6": {
 *             "lesson_title":      "The Six Tones (revised)",
 *             "xp_reward":         12,
 *             "words[2].vi":       "má",
 *             "sentences[0].translation": "..."
 *           }
 *         }
 *       }
 *     }
 *   }
 *
 * IDs:
 *   - unit `_uid`     = `${track}:${withinTrackIndex}`  (assigned at compose time)
 *   - lesson `id`     = stable canonical id
 *
 * Patches:
 *   - Sparse: only modified fields are stored, by dotted/indexed path
 *     (e.g. `lesson_title`, `words[3].vi`, `unlock_rule.type`).
 *   - Stale paths (field removed in canonical) are silently ignored on apply.
 *
 * Stale ids (renamed/removed in canonical) are silently dropped on apply, so a
 * canonical update never breaks the override layer.
 *
 * Migration: v1 (no lessonPatches) loads as v2 with `lessonPatches: {}`.
 */

const STORAGE_KEY = 'vnme_study_import_overrides';
const VERSION = 2;

function readAll() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return { version: VERSION, updatedAt: null, byMode: {} };
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object') return { version: VERSION, updatedAt: null, byMode: {} };
        return { version: VERSION, updatedAt: parsed.updatedAt || null, byMode: parsed.byMode || {} };
    } catch {
        return { version: VERSION, updatedAt: null, byMode: {} };
    }
}

function writeAll(all) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...all, version: VERSION, updatedAt: new Date().toISOString() }));
    } catch {
        /* quota / disabled — silently ignore */
    }
}

function emptyMode() {
    return { unitOrder: [], lessonOrder: {}, lessonPatches: {} };
}

function isEmptyMode(o) {
    if (!o) return true;
    return (
        (!o.unitOrder || o.unitOrder.length === 0) &&
        (!o.lessonOrder || Object.keys(o.lessonOrder).length === 0) &&
        (!o.lessonPatches || Object.keys(o.lessonPatches).length === 0)
    );
}

function normalizeMode(o) {
    return {
        unitOrder: Array.isArray(o?.unitOrder) ? o.unitOrder : [],
        lessonOrder: o?.lessonOrder && typeof o.lessonOrder === 'object' ? o.lessonOrder : {},
        lessonPatches: o?.lessonPatches && typeof o.lessonPatches === 'object' ? o.lessonPatches : {},
    };
}

export function getOverrides(modeId) {
    const o = readAll().byMode[modeId];
    return o ? normalizeMode(o) : null;
}

export function hasOverrides(modeId) {
    const o = getOverrides(modeId);
    return !isEmptyMode(o);
}

export function setOverrides(modeId, next) {
    const all = readAll();
    const norm = normalizeMode(next);
    if (isEmptyMode(norm)) {
        delete all.byMode[modeId];
    } else {
        all.byMode[modeId] = norm;
    }
    writeAll(all);
}

export function resetMode(modeId) {
    const all = readAll();
    delete all.byMode[modeId];
    writeAll(all);
}

export function exportMode(modeId) {
    return {
        kind: 'vnme_study_import_overrides',
        version: VERSION,
        mode: modeId,
        exportedAt: new Date().toISOString(),
        overrides: getOverrides(modeId) || emptyMode(),
    };
}

export function importMode(modeId, payload) {
    if (!payload || payload.kind !== 'vnme_study_import_overrides') {
        throw new Error('Not a Vietnamy curriculum override file.');
    }
    if (payload.mode && payload.mode !== modeId) {
        throw new Error(`File is for mode "${payload.mode}", but the editor is in "${modeId}".`);
    }
    setOverrides(modeId, normalizeMode(payload.overrides));
}

/**
 * Move a unit up or down by one position. Returns the new unitOrder.
 *
 * `currentOrder` is the array of unit `_uid`s in their currently-displayed order
 * (pass `units.map(u => u._uid)` from the composed curriculum so canonical units
 * not yet in the override list are included).
 */
export function moveUnit(modeId, currentOrder, uid, direction) {
    const order = [...currentOrder];
    const i = order.indexOf(uid);
    if (i < 0) return order;
    const j = direction === 'up' ? i - 1 : i + 1;
    if (j < 0 || j >= order.length) return order;
    [order[i], order[j]] = [order[j], order[i]];
    const ov = getOverrides(modeId) || emptyMode();
    setOverrides(modeId, { ...ov, unitOrder: order });
    return order;
}

/** Move a lesson up/down within its unit. `currentLessonIds` is in display order. */
export function moveLesson(modeId, unitUid, currentLessonIds, lessonId, direction) {
    const order = [...currentLessonIds];
    const i = order.indexOf(lessonId);
    if (i < 0) return order;
    const j = direction === 'up' ? i - 1 : i + 1;
    if (j < 0 || j >= order.length) return order;
    [order[i], order[j]] = [order[j], order[i]];
    const ov = getOverrides(modeId) || emptyMode();
    setOverrides(modeId, { ...ov, lessonOrder: { ...(ov.lessonOrder || {}), [unitUid]: order } });
    return order;
}

// ─── Lesson field patches ──────────────────────────────────────────────────
//
// Path syntax: dot-separated names with bracketed numeric indices.
//   "lesson_title"
//   "xp_reward"
//   "words[2].vi"
//   "sentences[0].translation"
//   "unlock_rule.type"
//
// Tokens are either string keys or numeric array indices.

export function parsePath(path) {
    if (typeof path !== 'string' || !path) return null;
    const tokens = [];
    const re = /([^.[\]]+)|\[(\d+)\]/g;
    let m;
    while ((m = re.exec(path)) !== null) {
        if (m[2] !== undefined) tokens.push(Number(m[2]));
        else tokens.push(m[1]);
    }
    return tokens.length ? tokens : null;
}

function applyPathToObject(root, tokens, value) {
    // Returns a new root with `value` set at `tokens`. If any segment along the
    // path is missing or has the wrong shape, returns root unchanged.
    if (!tokens || tokens.length === 0) return root;
    const [head, ...rest] = tokens;
    if (typeof head === 'number') {
        if (!Array.isArray(root) || head < 0 || head >= root.length) return root;
        const next = rest.length === 0 ? value : applyPathToObject(root[head], rest, value);
        if (next === root[head]) return root;
        const copy = root.slice();
        copy[head] = next;
        return copy;
    }
    if (!root || typeof root !== 'object' || Array.isArray(root)) return root;
    if (!(head in root)) return root;
    const next = rest.length === 0 ? value : applyPathToObject(root[head], rest, value);
    if (next === root[head]) return root;
    return { ...root, [head]: next };
}

// Array operation key prefix. Patch entries like `_ops:words`, `_ops:sentences`,
// `_ops:matches` carry per-item edits/additions/removals keyed by stable item id,
// not by index — so the patch survives canonical reordering or insertion.
//
// Shape:
//   { edits: { [itemId]: { [field]: value } }, added: [item, ...], removed: [itemId, ...] }
//
// Apply order: keep canonical items in order (skipping removed, applying edits),
// then append added items at the end.
const ARRAY_OP_PREFIX = '_ops:';

export function applyArrayOp(canonicalArr, op) {
    if (!Array.isArray(canonicalArr)) return canonicalArr;
    if (!op || typeof op !== 'object') return canonicalArr;
    const removed = new Set(Array.isArray(op.removed) ? op.removed : []);
    const edits = (op.edits && typeof op.edits === 'object') ? op.edits : {};
    const added = Array.isArray(op.added) ? op.added : [];
    const out = [];
    for (const item of canonicalArr) {
        if (item && removed.has(item.id)) continue;
        if (item && edits[item.id]) out.push({ ...item, ...edits[item.id] });
        else out.push(item);
    }
    for (const a of added) out.push(a);
    return out;
}

/** Apply a patch object `{ "path": value, ... }` to a lesson. Sparse, missing-path-safe.
 *  Recognizes `_ops:<arrayName>` keys for structured array operations. */
export function applyLessonPatch(lesson, patch) {
    if (!patch) return lesson;
    let out = lesson;
    for (const [path, value] of Object.entries(patch)) {
        if (path.startsWith(ARRAY_OP_PREFIX)) {
            const name = path.slice(ARRAY_OP_PREFIX.length);
            if (Array.isArray(out[name])) {
                out = { ...out, [name]: applyArrayOp(out[name], value) };
            }
            continue;
        }
        const tokens = parsePath(path);
        if (!tokens) continue;
        out = applyPathToObject(out, tokens, value);
    }
    return out;
}

export function getLessonPatch(modeId, lessonId) {
    const ov = getOverrides(modeId);
    return ov?.lessonPatches?.[lessonId] || null;
}

export function hasLessonPatch(modeId, lessonId) {
    const p = getLessonPatch(modeId, lessonId);
    return !!(p && Object.keys(p).length);
}

export function setLessonField(modeId, lessonId, path, value) {
    if (!parsePath(path)) return;
    const ov = getOverrides(modeId) || emptyMode();
    const patches = { ...(ov.lessonPatches || {}) };
    const lp = { ...(patches[lessonId] || {}), [path]: value };
    patches[lessonId] = lp;
    setOverrides(modeId, { ...ov, lessonPatches: patches });
}

export function revertLessonField(modeId, lessonId, path) {
    const ov = getOverrides(modeId);
    if (!ov?.lessonPatches?.[lessonId]) return;
    const lp = { ...ov.lessonPatches[lessonId] };
    delete lp[path];
    const patches = { ...ov.lessonPatches };
    if (Object.keys(lp).length === 0) delete patches[lessonId];
    else patches[lessonId] = lp;
    setOverrides(modeId, { ...ov, lessonPatches: patches });
}

// ─── Array-op helpers (words / sentences / matches) ────────────────────────

function opKey(arrayName) { return `${ARRAY_OP_PREFIX}${arrayName}`; }

function emptyOp() { return { edits: {}, added: [], removed: [] }; }

function isOpEmpty(op) {
    return !op || (
        Object.keys(op.edits || {}).length === 0 &&
        (op.added || []).length === 0 &&
        (op.removed || []).length === 0
    );
}

export function getArrayOp(modeId, lessonId, arrayName) {
    const lp = getLessonPatch(modeId, lessonId);
    return lp?.[opKey(arrayName)] || null;
}

function writeArrayOp(modeId, lessonId, arrayName, nextOp) {
    const ov = getOverrides(modeId) || emptyMode();
    const patches = { ...(ov.lessonPatches || {}) };
    const lp = { ...(patches[lessonId] || {}) };
    const k = opKey(arrayName);
    if (isOpEmpty(nextOp)) delete lp[k];
    else lp[k] = nextOp;
    if (Object.keys(lp).length === 0) delete patches[lessonId];
    else patches[lessonId] = lp;
    setOverrides(modeId, { ...ov, lessonPatches: patches });
}

/** Generate a unique id for a newly-added item. Visibly distinct from canonical ids. */
export function newItemId(prefix = 'x') {
    const rand = Math.random().toString(16).slice(2, 10);
    return `_new_${prefix}_${rand}`;
}

/**
 * Edit a field on an item. If the item is in `added`, edit it in place.
 * Otherwise, store the edit in `edits[itemId]`.
 */
export function editArrayItem(modeId, lessonId, arrayName, itemId, fields) {
    const op = getArrayOp(modeId, lessonId, arrayName) || emptyOp();
    const next = { edits: { ...(op.edits || {}) }, added: [...(op.added || [])], removed: [...(op.removed || [])] };
    const addedIdx = next.added.findIndex(a => a.id === itemId);
    if (addedIdx >= 0) {
        next.added[addedIdx] = { ...next.added[addedIdx], ...fields };
    } else {
        next.edits[itemId] = { ...(next.edits[itemId] || {}), ...fields };
    }
    writeArrayOp(modeId, lessonId, arrayName, next);
}

/** Append a new item. */
export function addArrayItem(modeId, lessonId, arrayName, item) {
    const op = getArrayOp(modeId, lessonId, arrayName) || emptyOp();
    const next = { edits: { ...(op.edits || {}) }, added: [...(op.added || []), item], removed: [...(op.removed || [])] };
    writeArrayOp(modeId, lessonId, arrayName, next);
}

/**
 * Remove an item.
 *   - If the item was in `added`, remove it from `added`.
 *   - Otherwise mark its canonical id in `removed` and clear any edits on it.
 */
export function removeArrayItem(modeId, lessonId, arrayName, itemId) {
    const op = getArrayOp(modeId, lessonId, arrayName) || emptyOp();
    const next = { edits: { ...(op.edits || {}) }, added: [...(op.added || [])], removed: [...(op.removed || [])] };
    const addedIdx = next.added.findIndex(a => a.id === itemId);
    if (addedIdx >= 0) {
        next.added.splice(addedIdx, 1);
    } else {
        delete next.edits[itemId];
        if (!next.removed.includes(itemId)) next.removed.push(itemId);
    }
    writeArrayOp(modeId, lessonId, arrayName, next);
}

/** Revert all changes to a single canonical item (clears its edits + un-removes it). */
export function revertArrayItem(modeId, lessonId, arrayName, itemId) {
    const op = getArrayOp(modeId, lessonId, arrayName);
    if (!op) return;
    const next = { edits: { ...(op.edits || {}) }, added: [...(op.added || [])], removed: (op.removed || []).filter(id => id !== itemId) };
    delete next.edits[itemId];
    writeArrayOp(modeId, lessonId, arrayName, next);
}

export function revertLesson(modeId, lessonId) {
    const ov = getOverrides(modeId);
    if (!ov?.lessonPatches?.[lessonId]) return;
    const patches = { ...ov.lessonPatches };
    delete patches[lessonId];
    setOverrides(modeId, { ...ov, lessonPatches: patches });
}

// ─── Composition ───────────────────────────────────────────────────────────

/**
 * Apply persisted overrides to a composed curriculum. Returns a new
 * `{ units, lessons }` with reassigned `index` / `unit_index` / `order_index`
 * matching the displayed order, and lesson field patches applied.
 *
 * Stale ids and stale field paths are dropped silently.
 */
export function applyOverrides(curriculum, modeId) {
    const ov = getOverrides(modeId);
    if (isEmptyMode(ov)) return curriculum;

    let units = curriculum.units;
    let lessons = curriculum.lessons;

    // 1. Reorder units. Units mentioned in unitOrder come first in that order,
    //    unmentioned units keep their canonical relative order at the end.
    if (ov.unitOrder?.length) {
        const byUid = new Map(units.map(u => [u._uid, u]));
        const seen = new Set();
        const ordered = [];
        for (const uid of ov.unitOrder) {
            if (byUid.has(uid) && !seen.has(uid)) {
                ordered.push(byUid.get(uid));
                seen.add(uid);
            }
        }
        const rest = units.filter(u => !seen.has(u._uid));
        units = [...ordered, ...rest];
    }

    // 2. Reassign unit.index to display order.
    units = units.map((u, i) => ({ ...u, index: i }));

    // 3. Group lessons by their original _unit_uid, then reorder per override,
    //    apply field patches, and flatten with reassigned unit_index / order_index.
    const lessonsByUid = new Map();
    for (const l of lessons) {
        const arr = lessonsByUid.get(l._unit_uid) || [];
        arr.push(l);
        lessonsByUid.set(l._unit_uid, arr);
    }

    const patches = ov.lessonPatches || {};
    const newLessons = [];
    for (const u of units) {
        const inUnit = lessonsByUid.get(u._uid) || [];
        const order = ov.lessonOrder?.[u._uid];
        let display;
        if (order?.length) {
            const byId = new Map(inUnit.map(l => [l.id, l]));
            const seen = new Set();
            const ordered = [];
            for (const id of order) {
                if (byId.has(id) && !seen.has(id)) {
                    ordered.push(byId.get(id));
                    seen.add(id);
                }
            }
            const rest = inUnit.filter(l => !seen.has(l.id));
            display = [...ordered, ...rest];
        } else {
            display = inUnit;
        }
        display.forEach((l, j) => {
            const patched = patches[l.id] ? applyLessonPatch(l, patches[l.id]) : l;
            newLessons.push({ ...patched, unit_index: u.index, order_index: j, _patched: !!patches[l.id] });
        });
    }

    return { ...curriculum, units, lessons: newLessons };
}
