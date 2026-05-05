/**
 * Study-import curriculum overrides — per mode, persisted in localStorage.
 *
 * Canonical JSON (committed to the repo) is never mutated. Teachers' reordering
 * lives in a single key, `vnme_study_import_overrides`, scoped by mode:
 *
 *   {
 *     version: 1,
 *     updatedAt: "...",
 *     byMode: {
 *       explore_vietnam: {
 *         unitOrder: ["a1_core:1","a1_core:3","a1_core:2", ...],
 *         lessonOrder: { "a1_core:1": ["L001","L003","L002"] }
 *       },
 *       ...
 *     }
 *   }
 *
 * IDs:
 *   - unit `_uid`     = `${track}:${withinTrackIndex}`  (assigned at compose time)
 *   - lesson `id`     = stable canonical id
 *
 * Stale ids (renamed/removed in canonical) are silently dropped on apply, so a
 * canonical update never breaks the override layer.
 */

const STORAGE_KEY = 'vnme_study_import_overrides';
const VERSION = 1;

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

export function getOverrides(modeId) {
    return readAll().byMode[modeId] || null;
}

export function hasOverrides(modeId) {
    const o = getOverrides(modeId);
    return !!(o && ((o.unitOrder?.length) || Object.keys(o.lessonOrder || {}).length));
}

export function setOverrides(modeId, next) {
    const all = readAll();
    if (!next || (!next.unitOrder?.length && !Object.keys(next.lessonOrder || {}).length)) {
        delete all.byMode[modeId];
    } else {
        all.byMode[modeId] = {
            unitOrder: next.unitOrder || [],
            lessonOrder: next.lessonOrder || {},
        };
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
        overrides: getOverrides(modeId) || { unitOrder: [], lessonOrder: {} },
    };
}

export function importMode(modeId, payload) {
    if (!payload || payload.kind !== 'vnme_study_import_overrides') {
        throw new Error('Not a Vietnamy curriculum override file.');
    }
    if (payload.mode && payload.mode !== modeId) {
        throw new Error(`File is for mode "${payload.mode}", but the editor is in "${modeId}".`);
    }
    const ov = payload.overrides || {};
    setOverrides(modeId, {
        unitOrder: Array.isArray(ov.unitOrder) ? ov.unitOrder : [],
        lessonOrder: ov.lessonOrder && typeof ov.lessonOrder === 'object' ? ov.lessonOrder : {},
    });
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
    const ov = getOverrides(modeId) || { unitOrder: [], lessonOrder: {} };
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
    const ov = getOverrides(modeId) || { unitOrder: [], lessonOrder: {} };
    setOverrides(modeId, { ...ov, lessonOrder: { ...(ov.lessonOrder || {}), [unitUid]: order } });
    return order;
}

/**
 * Apply persisted overrides to a composed curriculum (in place: returns a new
 * `{ units, lessons }` with reassigned `index` / `unit_index` / `order_index`
 * matching the displayed order).
 *
 * Stale ids are dropped silently. Any unit / lesson the override doesn't mention
 * keeps its canonical position relative to the rest.
 */
export function applyOverrides(curriculum, modeId) {
    const ov = getOverrides(modeId);
    if (!ov || ((!ov.unitOrder || ov.unitOrder.length === 0) && (!ov.lessonOrder || Object.keys(ov.lessonOrder).length === 0))) {
        return curriculum;
    }

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

    // 2. Reassign unit.index to display order. Build uid → new index map.
    const uidToIndex = new Map();
    units = units.map((u, i) => {
        const next = { ...u, index: i };
        uidToIndex.set(u._uid, i);
        return next;
    });

    // 3. Group lessons by their original _unit_uid, then reorder per override,
    //    then flatten back with reassigned unit_index / order_index.
    const lessonsByUid = new Map();
    for (const l of lessons) {
        const arr = lessonsByUid.get(l._unit_uid) || [];
        arr.push(l);
        lessonsByUid.set(l._unit_uid, arr);
    }

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
            newLessons.push({ ...l, unit_index: u.index, order_index: j });
        });
    }

    return { ...curriculum, units, lessons: newLessons };
}
