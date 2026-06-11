// A mock database using localStorage to simulate a backend for the 100-levels proposal.

import { createLessonExerciseService } from './content/lessonExerciseService';
import { getDB as getRoadmapDB, getFullDB, saveDB } from './storage/mockDbStore';
import { LEARNER_MODES } from '../data/learnerModes';

export { getFullDB as getDB };

const getDB = getRoadmapDB;

// ── Vocab prerequisite validator ──
// Walks all path_nodes in unit → node_index order and checks that every node's
// vocab_requires items have been covered by preceding nodes' vocab_introduces.
// Returns an array of error objects. Empty array = all good.
export const validateVocabPrerequisites = () => {
    const db = getFullDB();
    const units = [...db.units].sort((a, b) => a.unit_index - b.unit_index);
    const cumulativeVocab = new Set();
    const errors = [];

    for (const unit of units) {
        const unitNodes = db.path_nodes
            .filter(n => n.unit_id === unit.id)
            .sort((a, b) => a.node_index - b.node_index);

        for (const node of unitNodes) {
            // First, add this node's introduced vocab
            (node.vocab_introduces || []).forEach(id => cumulativeVocab.add(id));

            // Then check this node's required vocab
            for (const reqId of (node.vocab_requires || [])) {
                if (!cumulativeVocab.has(reqId)) {
                    const item = db.items.find(i => i.id === reqId);
                    errors.push({
                        node_id: node.id,
                        unit_id: node.unit_id,
                        label: node.label || node.lesson_id || node.id,
                        missing_item: reqId,
                        missing_word: item ? item.vi_text : '(unknown)',
                        message: `Node "${node.label || node.id}" requires "${item ? item.vi_text : reqId}" but it hasn't been introduced yet`
                    });
                }
            }
        }
    }
    return errors;
};

// --- Units API ---
// Maps the new db.units format to what the UI is expecting
export const getUnits = () => {
    const db = getDB();
    return db.units.map((u, index) => ({
        id: u.id,
        order_index: u.unit_index || (index + 1),
        title: u.title,
        subtitle: "", // or mapped if added
        themeColor: "#10B981", // or map if added
        unlockCondition: "free"
    })).sort((a, b) => a.order_index - b.order_index);
};

export const addUnit = (unitData) => {
    const db = getDB();
    const newUnit = {
        id: `unit_${Date.now()}`,
        unit_index: db.units.length + 1,
        ...unitData
    };
    db.units.push(newUnit);
    saveDB(db);
    return newUnit; // returning raw for now
};

// --- Nodes API ---
export const getNodesForUnit = (unitId) => {
    const db = getDB();
    const nodes = db.path_nodes || db.nodes || [];
    return nodes
        .filter(n => n.unit_id === unitId)
        .map(n => {
            // Find lesson title if it's a lesson
            let label = n.label || "";
            if (n.node_type === 'lesson' && n.lesson_id) {
                const lesson = (db.lessons || []).find(l => l.id === n.lesson_id);
                if (lesson) label = lesson.title;
            }
            return {
                id: n.id,
                unit_id: n.unit_id,
                order_index: n.node_index || n.order_index || 0,
                type: n.node_type || n.type,
                label: n.label || label,
                content_ref_id: n.lesson_id || n.content_ref_id,
                practice_route: n.practice_route || null,
                skill_content: n.skill_content || null,
                module_type: n.module_type || null,
                test_scope: n.test_scope || null,
                source_node_id: n.source_node_id || null,
                status: n.status || 'locked'
            };
        })
        .sort((a, b) => a.order_index - b.order_index);
};

export const addNode = (nodeData) => {
    const db = getDB();
    const unitNodes = getNodesForUnit(nodeData.unit_id);

    const newNode = {
        id: `node_${Date.now()}`,
        node_index: unitNodes.length + 1,
        status: 'locked',
        ...nodeData
    };

    if (!db.path_nodes) { db.path_nodes = []; }
    db.path_nodes.push(newNode);
    saveDB(db);
    return newNode;
};

export const updateNode = (nodeId, updates) => {
    const db = getDB();
    const nodes = db.path_nodes || [];
    const idx = nodes.findIndex(n => n.id === nodeId);
    if (idx >= 0) {
        Object.assign(nodes[idx], updates);
        saveDB(db);
    }
};

export const deleteNode = (nodeId) => {
    const db = getDB();
    db.path_nodes = (db.path_nodes || []).filter(n => n.id !== nodeId);
    saveDB(db);
};

export const updateUnit = (unitId, updates) => {
    const db = getDB();
    const idx = db.units.findIndex(u => u.id === unitId);
    if (idx >= 0) {
        Object.assign(db.units[idx], updates);
        saveDB(db);
    }
};

export const deleteUnit = (unitId) => {
    const db = getDB();
    db.units = db.units.filter(u => u.id !== unitId);
    db.path_nodes = (db.path_nodes || []).filter(n => n.unit_id !== unitId);
    saveDB(db);
};

// --- Get node by ID ---
export const getNodeById = (nodeId) => {
    const db = getDB();
    return (db.path_nodes || []).find(n => n.id === nodeId) || null;
};

// --- Goal awareness: the learner's goal gates which topics are on their path ---
// (mirrors RoadmapTab.isVisibleRoadmapNode; topic-less nodes are in every goal)
const getGoalTopicIds = () => {
    try {
        const profile = JSON.parse(localStorage.getItem('vnme_user_profile') || '{}');
        const mode = profile.learnerMode;
        if (!mode || mode === 'all') return null; // null = no gating
        const topics = LEARNER_MODES[mode]?.topics;
        return topics ? new Set(topics.map(t => t.id)) : null;
    } catch {
        return null;
    }
};

const nodeTopicOf = (db, node) => {
    if (node.topic) return node.topic;
    if (node.lesson_id) {
        const lesson = (db.lessons || []).find(l => l.id === node.lesson_id);
        return lesson?.topic || null;
    }
    return null;
};

// --- Get next node in the roadmap after the given node ---
// Goal-aware: skips nodes whose topic is outside the learner's current goal
// (so finishing a lesson never suggests an off-goal next step).
export const getNextNode = (nodeId) => {
    const db = getDB();
    const goalTopics = getGoalTopicIds();

    const rawNext = (fromId) => {
        const currentNode = (db.path_nodes || []).find(n => n.id === fromId);
        if (!currentNode) return null;

        const unitNodes = (db.path_nodes || [])
            .filter(n => n.unit_id === currentNode.unit_id)
            .sort((a, b) => (a.node_index || 0) - (b.node_index || 0));
        const currentIdx = unitNodes.findIndex(n => n.id === fromId);
        if (currentIdx >= 0 && currentIdx < unitNodes.length - 1) {
            return unitNodes[currentIdx + 1];
        }

        const currentUnit = db.units.find(u => u.id === currentNode.unit_id);
        if (!currentUnit) return null;
        const nextUnit = db.units
            .sort((a, b) => (a.unit_index || 0) - (b.unit_index || 0))
            .find(u => (u.unit_index || 0) > (currentUnit.unit_index || 0));
        if (!nextUnit) return null;

        const nextUnitNodes = (db.path_nodes || [])
            .filter(n => n.unit_id === nextUnit.id)
            .sort((a, b) => (a.node_index || 0) - (b.node_index || 0));
        return nextUnitNodes[0] || null;
    };

    let next = rawNext(nodeId);
    if (!goalTopics) return next;
    let hops = 0;
    while (next && hops++ < 200) {
        const topic = nodeTopicOf(db, next);
        if (!topic || goalTopics.has(topic)) return next;
        next = rawNext(next.id);
    }
    return next;
};

// --- Build route for a node (mirrors RoadmapTab.navigateNode) ---
export const getNodeRoute = (node) => {
    if (!node) return '/';
    const type = node.node_type || node.type;
    const lessonId = node.lesson_id || node.content_ref_id;
    if (type === 'lesson') return lessonId ? `/lesson/${lessonId}` : '/';
    if (type === 'test') return `/test/${node.id}`;
    if (type === 'scene') return node.scene_id ? `/scene/${node.scene_id}` : '/';
    if (type === 'skill') {
        if (node.skill_content?.type === 'grammar_unit' && node.skill_content.grammar_unit_id) {
            return `/grammar-unit/${node.skill_content.grammar_unit_id}?nodeId=${node.id}`;
        }
        if (node.skill_content?.route) return `${node.skill_content.route}?nodeId=${node.id}`;
        if (node.practice_route) return `${node.practice_route}?nodeId=${node.id}`;
    }
    if (node.practice_route) return `${node.practice_route}?nodeId=${node.id}`;
    return '/';
};

const lessonExerciseService = createLessonExerciseService({ getDB: getFullDB });

export const getExercisesGenerated = (...args) => lessonExerciseService.getExercisesGenerated(...args);
export const clearExerciseCache = () => lessonExerciseService.clearExerciseCache();
export const getExercisesForUnit = (...args) => lessonExerciseService.getExercisesForUnit(...args);
export const getExercisesForNode = (...args) => lessonExerciseService.getExercisesForNode(...args);

// --- Node lookup by lessonId ---
export const getNodeByLessonId = (lessonId) => {
    const db = getDB();
    const nodes = db.path_nodes || [];
    return nodes.find(n => n.lesson_id === lessonId) || null;
};

// --- Dynamic node status based on completed nodes ---
// Get the unit test node ID for the previous unit (for cross-unit gating)
const getPreviousUnitTestId = (unitId) => {
    const db = getDB();
    const units = (db.units || []).sort((a, b) => (a.unit_index || 0) - (b.unit_index || 0));
    const idx = units.findIndex(u => u.id === unitId);
    if (idx <= 0) return null; // Unit 1 or not found — no prerequisite
    const prevUnitId = units[idx - 1].id;
    const prevTest = (db.path_nodes || []).find(n => n.unit_id === prevUnitId && n.test_scope === 'unit');
    return prevTest?.id || null;
};

export const getNodesForUnitWithProgress = (unitId, completedNodeIds) => {
    const db = getDB();
    const nodes = db.path_nodes || [];
    const unitNodes = nodes.filter(n => n.unit_id === unitId);
    const lessonsById = new Map((db.lessons || []).map(lesson => [lesson.id, lesson]));
    const nodesById = new Map(nodes.map(node => [node.id, node]));

    // Sort by node_index — this IS the unlock order
    const sorted = unitNodes.sort((a, b) => (a.node_index || 0) - (b.node_index || 0));

    return sorted.map((n, i) => {
        // Auto-derive unlock status from sequential node_index order
        let status;
        if (completedNodeIds.has(n.id)) {
            status = 'completed';
        } else if (i === 0) {
            // First node in unit: gated by previous unit's test
            const prevTestId = getPreviousUnitTestId(unitId);
            status = (!prevTestId || completedNodeIds.has(prevTestId)) ? 'active' : 'locked';
        } else {
            // All other nodes: require previous node (by index) to be completed
            status = completedNodeIds.has(sorted[i - 1].id) ? 'active' : 'locked';
        }

        const lesson = n.lesson_id ? lessonsById.get(n.lesson_id) : null;
        const sourceNode = n.source_node_id ? nodesById.get(n.source_node_id) : null;
        const sourceLesson = sourceNode?.lesson_id ? lessonsById.get(sourceNode.lesson_id) : null;
        let label = n.label || '';
        if (n.node_type === 'lesson' && n.lesson_id) {
            if (lesson) label = lesson.title;
        }

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
            test_scope: n.test_scope || null,
            source_node_id: n.source_node_id || null,
            scene_id: n.scene_id || null,
            difficulty: n.difficulty || null,
            cefr_level: n.cefr_level || null,
            topic: n.topic || lesson?.topic || sourceNode?.topic || sourceLesson?.topic || null,
            vocab_introduces: n.vocab_introduces || null,
            vocab_requires: n.vocab_requires || null,
            sessions_required: n.sessions_required || null,
            status
        };
    });
};

export const getLessonBlueprint = (...args) => lessonExerciseService.getLessonBlueprint(...args);

// --- CMS Helper Functions ---

// Practice modules are now in the Library tab, not in the roadmap
export const getAvailableSkillRoutes = () => [];

export const reindexUnitNodes = (unitId) => {
    const db = getDB();
    const unitNodes = (db.path_nodes || [])
        .filter(n => n.unit_id === unitId)
        .sort((a, b) => (a.node_index || 0) - (b.node_index || 0));
    unitNodes.forEach((n, i) => { n.node_index = i + 1; });
    saveDB(db);
};

export const addNodeWithQuiz = (nodeData) => {
    const db = getDB();
    const unitNodes = (db.path_nodes || []).filter(n => n.unit_id === nodeData.unit_id);
    const maxIndex = unitNodes.reduce((max, n) => Math.max(max, n.node_index || 0), 0);

    const newNode = {
        id: `node_${Date.now()}`,
        course_id: 'course_vi_en_v1',
        node_index: maxIndex + 1,
        status: 'locked',
        ...nodeData
    };

    if (!db.path_nodes) db.path_nodes = [];
    db.path_nodes.push(newNode);

    // Auto-create mini-test for lesson nodes
    if (nodeData.node_type === 'lesson') {
        const quizNode = {
            id: `node_mt_${Date.now()}`,
            course_id: 'course_vi_en_v1',
            unit_id: nodeData.unit_id,
            node_index: maxIndex + 2,
            node_type: 'test',
            module_type: nodeData.module_type || 'orange',
            label: `${nodeData.label || 'Lesson'} Quiz`,
            test_scope: 'module',
            source_node_id: newNode.id
        };
        db.path_nodes.push(quizNode);
    }

    saveDB(db);
    reindexUnitNodes(nodeData.unit_id);
    return newNode;
};

export const deleteNodeWithQuiz = (nodeId) => {
    const db = getDB();
    const node = (db.path_nodes || []).find(n => n.id === nodeId);
    if (!node) return;
    const unitId = node.unit_id;
    db.path_nodes = (db.path_nodes || []).filter(n =>
        n.id !== nodeId && n.source_node_id !== nodeId
    );
    saveDB(db);
    reindexUnitNodes(unitId);
};

export const moveNodeWithQuiz = (unitId, nodeId, direction) => {
    const db = getDB();
    const unitNodes = (db.path_nodes || [])
        .filter(n => n.unit_id === unitId)
        .sort((a, b) => (a.node_index || 0) - (b.node_index || 0));

    const node = unitNodes.find(n => n.id === nodeId);
    if (!node) return;

    // Collect the node and its mini-test as a "group"
    const isQuiz = node.test_scope === 'module' && node.source_node_id;
    if (isQuiz) return; // Don't move quiz nodes directly

    const group = [node];
    const quiz = unitNodes.find(n => n.source_node_id === nodeId && n.test_scope === 'module');
    if (quiz) group.push(quiz);

    // Find the adjacent group to swap with
    // Find current position among top-level nodes (non-quiz nodes)
    const topLevel = unitNodes.filter(n => !(n.test_scope === 'module' && n.source_node_id));
    const topIdx = topLevel.findIndex(n => n.id === nodeId);
    const swapIdx = topIdx + direction;
    if (swapIdx < 0 || swapIdx >= topLevel.length) return;

    const swapNode = topLevel[swapIdx];
    const swapGroup = [swapNode];
    const swapQuiz = unitNodes.find(n => n.source_node_id === swapNode.id && n.test_scope === 'module');
    if (swapQuiz) swapGroup.push(swapQuiz);

    // Rebuild order: swap the two groups in place
    const ordered = [];
    for (const tl of topLevel) {
        let target = tl;
        if (tl.id === nodeId) target = swapNode;
        else if (tl.id === swapNode.id) target = node;

        ordered.push(target);
        const tQuiz = unitNodes.find(n => n.source_node_id === target.id && n.test_scope === 'module');
        if (tQuiz) ordered.push(tQuiz);
    }

    ordered.forEach((n, i) => { n.node_index = i + 1; });
    saveDB(db);
};

// --- Vocab Items API ---
export const getItems = () => {
    const db = getFullDB();
    return (db.items || []).map(item => {
        const translation = (db.translations || []).find(t => t.item_id === item.id && t.lang === 'en');
        return { ...item, en: translation ? translation.text : '' };
    });
};

// --- Lesson Content API ---
export const getLessonContent = (contentRefId) => {
    const db = getFullDB();

    // First try the old generic format in case it was created via CMS
    if (db.lessonContent) {
        const found = db.lessonContent.find(c => c.id === contentRefId);
        if (found) return found;
    }

    // Support the new format
    const lesson = (db.lessons || []).find(l => l.id === contentRefId);
    if (!lesson) return null;

    // Let's create sentences loosely from blueprints or exercises
    const blueprint = (db.lesson_blueprints || []).find(bp => bp.lesson_id === lesson.id);
    const sentences = [];

    if (blueprint && blueprint.introduced_items) {
        blueprint.introduced_items.forEach(itemId => {
            const item = (db.items || []).find(i => i.id === itemId);
            const translation = (db.translations || []).find(t => t.item_id === itemId && t.lang === 'en');
            if (item && translation) {
                sentences.push({
                    vietnamese: item.vi_text,
                    english: translation.text
                });
            }
        });
    }

    return {
        id: lesson.id,
        goal: lesson.title,
        sentences: sentences,
        exerciseProfileId: lesson.exercise_profile_id || ''
    };
};

export const saveLessonContent = (contentData) => {
    const db = getFullDB();

    // 1. Update Lesson Metadata
    const lessonIndex = db.lessons.findIndex(l => l.id === contentData.id);
    if (lessonIndex >= 0) {
        db.lessons[lessonIndex].title = contentData.goal || db.lessons[lessonIndex].title;
        // Exercise profile: '' / undefined means "inherit from CEFR level".
        if (contentData.exerciseProfileId !== undefined) {
            db.lessons[lessonIndex].exercise_profile_id = contentData.exerciseProfileId || null;
        }
    }

    // 2. Update items and translations from sentences
    const sentences = contentData.sentences || [];
    const blueprint = (db.lesson_blueprints || []).find(bp => bp.lesson_id === contentData.id);

    if (sentences.length > 0) {
        // Create or update items/translations for each sentence
        const newItemIds = [];
        sentences.forEach((s, idx) => {
            const itemId = `it_cms_${contentData.id}_${idx}`;
            const isMultiWord = s.vietnamese.split(/\s+/).length >= 3;
            const itemType = isMultiWord ? 'sentence' : 'word';

            // Upsert item
            const existingIdx = (db.items || []).findIndex(i => i.id === itemId);
            const item = {
                id: itemId,
                item_type: itemType,
                vi_text: s.vietnamese,
                vi_text_no_diacritics: s.vietnamese.normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
                audio_key: `a_${itemId}`,
                dialect: 'both'
            };
            if (existingIdx >= 0) db.items[existingIdx] = item;
            else db.items.push(item);

            // Upsert translation
            const transIdx = (db.translations || []).findIndex(t => t.item_id === itemId && t.lang === 'en');
            const trans = { item_id: itemId, lang: 'en', text: s.english };
            if (transIdx >= 0) db.translations[transIdx] = trans;
            else db.translations.push(trans);

            newItemIds.push(itemId);
        });

        // Update or create blueprint
        if (blueprint) {
            blueprint.introduced_items = newItemIds;
        } else {
            if (!db.lesson_blueprints) db.lesson_blueprints = [];
            db.lesson_blueprints.push({
                lesson_id: contentData.id,
                focus: [],
                introduced_items: newItemIds
            });
        }
    }

    // 3. Clear exercise cache so next load regenerates
    clearExerciseCache();

    // 4. Fallback for old lessonContent array
    if (!db.lessonContent) db.lessonContent = [];
    const index = db.lessonContent.findIndex(c => c.id === contentData.id);
    if (index >= 0) db.lessonContent[index] = contentData;
    else db.lessonContent.push(contentData);

    saveDB(db);
    return contentData;
};
