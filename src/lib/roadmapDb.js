import { ROADMAP_SEED } from './content/roadmapSeedData';
import { expandLessonsIntoSkills } from './content/skillSplit.js';

const DB_KEY = 'vnme_mock_db_v24';
const CURRICULUM_VERSION = 31; // v31: A1 lessons split into per-skill nodes

let dbCache = null;

const cloneSeed = () => structuredClone(ROADMAP_SEED);

// Apply the per-skill lesson split to a db's path_nodes. Idempotent, so it's
// safe whether the db came from our own seed or one written by mockDbStore.
const withSkills = (db) => {
    if (db && Array.isArray(db.path_nodes)) {
        db.path_nodes = expandLessonsIntoSkills(db.path_nodes);
    }
    return db;
};

const persist = (db) => {
    try {
        localStorage.setItem(DB_KEY, JSON.stringify(db));
        localStorage.setItem(DB_KEY + '_cv', String(CURRICULUM_VERSION));
    } catch { /* localStorage may be unavailable in private contexts */ }
};

const getRoadmapDB = () => {
    if (dbCache) return dbCache;

    try {
        const raw = localStorage.getItem(DB_KEY);
        const storedVersion = parseInt(localStorage.getItem(DB_KEY + '_cv') || '1', 10);
        if (!raw || storedVersion < CURRICULUM_VERSION) {
            dbCache = withSkills(cloneSeed());
            persist(dbCache);
            return dbCache;
        }
        dbCache = withSkills(JSON.parse(raw));
    } catch {
        dbCache = withSkills(cloneSeed());
    }

    return dbCache;
};

export const getUnits = () => {
    const db = getRoadmapDB();
    return db.units.map((u, index) => ({
        id: u.id,
        order_index: u.unit_index || (index + 1),
        title: u.title,
        subtitle: '',
        themeColor: '#10B981',
        unlockCondition: 'free',
    })).sort((a, b) => a.order_index - b.order_index);
};

const getPreviousUnitTestId = (unitId) => {
    const db = getRoadmapDB();
    const units = [...(db.units || [])].sort((a, b) => (a.unit_index || 0) - (b.unit_index || 0));
    const idx = units.findIndex(u => u.id === unitId);
    if (idx <= 0) return null;
    const prevUnitId = units[idx - 1].id;
    const prevTest = (db.path_nodes || []).find(n => n.unit_id === prevUnitId && n.test_scope === 'unit');
    return prevTest?.id || null;
};

export const getNodesForUnitWithProgress = (unitId, completedNodeIds) => {
    const db = getRoadmapDB();
    const nodes = db.path_nodes || [];
    const unitNodes = nodes.filter(n => n.unit_id === unitId);
    const lessonsById = new Map((db.lessons || []).map(lesson => [lesson.id, lesson]));
    const nodesById = new Map(nodes.map(node => [node.id, node]));
    const sorted = [...unitNodes].sort((a, b) => (a.node_index || 0) - (b.node_index || 0));

    return sorted.map((n, i) => {
        let status;
        if (completedNodeIds.has(n.id)) {
            status = 'completed';
        } else if (i === 0) {
            const prevTestId = getPreviousUnitTestId(unitId);
            status = (!prevTestId || completedNodeIds.has(prevTestId)) ? 'active' : 'locked';
        } else {
            status = completedNodeIds.has(sorted[i - 1].id) ? 'active' : 'locked';
        }

        const lesson = n.lesson_id ? lessonsById.get(n.lesson_id) : null;
        const sourceNode = n.source_node_id ? nodesById.get(n.source_node_id) : null;
        const sourceLesson = sourceNode?.lesson_id ? lessonsById.get(sourceNode.lesson_id) : null;
        let label = n.label || '';
        if (n.node_type === 'lesson' && n.lesson_id && lesson && !n.skill) label = lesson.title;

        return {
            id: n.id,
            unit_id: n.unit_id,
            order_index: n.node_index || n.order_index || 0,
            type: n.node_type || n.type,
            label,
            content_ref_id: n.lesson_id || n.content_ref_id,
            practice_route: n.practice_route || null,
            skill_content: n.skill_content || null,
            module_type: n.module_type || null,
            skill: n.skill || null,
            test_scope: n.test_scope || null,
            source_node_id: n.source_node_id || null,
            scene_id: n.scene_id || null,
            difficulty: n.difficulty || null,
            cefr_level: n.cefr_level || null,
            topic: n.topic || lesson?.topic || sourceNode?.topic || sourceLesson?.topic || null,
            vocab_introduces: n.vocab_introduces || null,
            vocab_requires: n.vocab_requires || null,
            sessions_required: n.sessions_required || null,
            status,
        };
    });
};
