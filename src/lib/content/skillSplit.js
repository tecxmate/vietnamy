// Per-skill lesson split (S2 study restructure).
//
// Historically each A1 vocab lesson opened a single node whose generated
// exercises were a mix of all 10 types. This module regroups those mixed
// exercises into separate per-skill nodes (Vocab / Listen / Speak / Read /
// Write) by routing a subset of exercise types to each. No content is
// re-authored — the generator already emits every type; we just filter.

// Ordered skills shown within a lesson cluster.
export const SKILLS = ['vocab', 'listen', 'speak', 'read', 'write'];

// Exercise types that belong to each skill (the "auto-regroup" mapping).
export const SKILL_EXERCISE_TYPES = {
    vocab: ['match_pairs', 'picture_choice'],
    listen: ['listen_choose', 'listen_type'],
    speak: ['speak_sentence'],
    read: ['mcq_translate_to_en'],
    write: ['mcq_translate_to_vi', 'reorder_words', 'translation_word_bank', 'fill_blank'],
};

// Display metadata per skill — labelKey resolves via i18n, icon is a
// lucide-react component name, color drives the roadmap node style.
export const SKILL_META = {
    vocab: { labelKey: 'skill_vocab', icon: 'Layers', color: '#FFB703' },
    listen: { labelKey: 'skill_listen', icon: 'Headphones', color: '#1CB0F6' },
    speak: { labelKey: 'skill_speak', icon: 'Mic', color: '#06D6A0' },
    read: { labelKey: 'skill_read', icon: 'BookOpen', color: '#8B5CF6' },
    write: { labelKey: 'skill_write', icon: 'PencilLine', color: '#F4795B' },
};

// Filter a generated exercise list down to a single skill's types.
// Falls back to the full list if the skill is unknown or the filter would
// leave the node with nothing to do (a node must never be uncompletable).
export function filterExercisesBySkill(exercises, skill) {
    if (!skill || !SKILL_EXERCISE_TYPES[skill]) return exercises;
    const allowed = new Set(SKILL_EXERCISE_TYPES[skill]);
    const filtered = (exercises || []).filter(ex => allowed.has(ex.exercise_type));
    return filtered.length > 0 ? filtered : exercises;
}

const isA1 = (node) => typeof node.cefr_level === 'string' && node.cefr_level.startsWith('A1');

// Is this a vocab lesson node we should split into per-skill nodes?
// `!node.skill` keeps the transform idempotent — an already-split node
// (which is still an orange A1 lesson) is never re-split.
function isSplittableLesson(node) {
    return node
        && !node.skill
        && node.module_type === 'orange'
        && (node.node_type === 'lesson' || node.type === 'lesson')
        && node.lesson_id
        && isA1(node);
}

// Expand each A1 vocab lesson node into a Vocab/Listen/Speak/Read/Write
// cluster. Non-A1 nodes, pronunciation, grammar, tests and scenes pass
// through untouched. Module quizzes whose source was a split lesson are
// repointed to that lesson's new __vocab node so they still resolve.
export function expandLessonsIntoSkills(pathNodes) {
    if (!Array.isArray(pathNodes)) return pathNodes;

    // Map original lesson node id → its new __vocab node id (for quiz repoint).
    const vocabIdFor = {};
    for (const node of pathNodes) {
        if (isSplittableLesson(node)) vocabIdFor[node.id] = `${node.id}__vocab`;
    }

    const out = [];
    for (const node of pathNodes) {
        if (isSplittableLesson(node)) {
            const baseIndex = typeof node.node_index === 'number' ? node.node_index : 0;
            SKILLS.forEach((skill, i) => {
                out.push({
                    ...node,
                    id: `${node.id}__${skill}`,
                    node_index: baseIndex + i / 10, // x.0..x.4 keep order before quiz at x+1
                    skill,
                    // Title falls back to the lesson topic; the roadmap overrides
                    // it with the lesson title and shows the skill as the subtitle.
                    label: node.label || node.topic || 'Lesson',
                    sessions_required: 1,
                    // Only the vocab node introduces/requires vocab, so SRS and
                    // prerequisite validation are not double-counted.
                    vocab_introduces: skill === 'vocab' ? (node.vocab_introduces || []) : [],
                    vocab_requires: skill === 'vocab' ? (node.vocab_requires || []) : [],
                });
            });
        } else if (node.test_scope === 'module' && node.source_node_id && vocabIdFor[node.source_node_id]) {
            out.push({ ...node, source_node_id: vocabIdFor[node.source_node_id] });
        } else {
            out.push(node);
        }
    }
    return out;
}
