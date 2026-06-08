import { Music, MessageCircle, Pen, Zap } from 'lucide-react';
import { getGrammarModulesSync } from './grammarModulesDB';

// ─────────────────────────────────────────────────────────────────────────
// The four roadmap MODULE KINDS — single source of truth.
//
// A "unit" on the roadmap is built from these four module kinds (repeating).
// Seed data (initialData.js), the roadmap renderer (RoadmapTab), and the admin
// (RoadmapMapper) all derive a module's node shape, COLOR, and EDIT RULES from
// here — so "the same module" always looks and edits the same way everywhere.
//
// Each kind defines:
//   nodeType / moduleType — the path_node shape it produces
//   color                 — the one colour for this kind everywhere
//   target                — the editable "what content does it open" field
//   editor                — how the admin edits that target:
//                             'practiceRoute' → pick a /practice drill
//                             'grammarUnit'   → pick a grammar unit
//                             'lessonPage'    → open the Lesson editor
//                             'auto'          → derived, not directly edited
// ─────────────────────────────────────────────────────────────────────────
export const MODULE_KINDS = {
    pronunciation: {
        id: 'pronunciation', label: 'Pronunciation', short: 'Pron',
        nodeType: 'skill', moduleType: 'blue', color: '#1CB0F6', icon: Music,
        target: 'practice_route', editor: 'practiceRoute',
    },
    vocabulary: {
        id: 'vocabulary', label: 'Vocabulary', short: 'Vocab',
        nodeType: 'lesson', moduleType: 'orange', color: '#FFB703', icon: MessageCircle,
        target: 'lesson_id', editor: 'lessonPage',
    },
    grammar: {
        id: 'grammar', label: 'Grammar', short: 'Grammar',
        nodeType: 'skill', moduleType: 'purple', color: '#A78BFA', icon: Pen,
        target: 'grammar_unit_id', editor: 'grammarUnit', // stored under skill_content
    },
    test: {
        id: 'test', label: 'Test', short: 'Test',
        nodeType: 'test', moduleType: 'test', color: '#EF4444', icon: Zap,
        target: 'test_scope', editor: 'auto',
    },
};

export const MODULE_KIND_LIST = Object.values(MODULE_KINDS);

// Map a path node to its module kind. Returns null for things that aren't
// top-level modules (mini-quizzes, scenes).
export function moduleKindOf(node) {
    if (!node) return null;
    if (node.test_scope === 'module' && node.source_node_id) return null; // mini-quiz
    const mt = node.module_type;
    if (mt === 'test' || node.test_scope === 'unit') return MODULE_KINDS.test;
    if (mt === 'orange' || node.node_type === 'lesson' || node.type === 'lesson') return MODULE_KINDS.vocabulary;
    if (mt === 'blue') return MODULE_KINDS.pronunciation;
    if (mt === 'purple' || node.skill_content?.type === 'grammar_unit' || node.skill_content?.type === 'grammar_lesson') return MODULE_KINDS.grammar;
    return null; // green / scene etc.
}

// Read the content target value off a node (kind-aware).
export function getModuleTarget(node) {
    const kind = moduleKindOf(node);
    if (!kind) return null;
    if (kind.id === 'grammar') return node.skill_content?.grammar_unit_id || null;
    if (kind.id === 'pronunciation') return node.practice_route || null;
    if (kind.id === 'vocabulary') return node.lesson_id || node.content_ref_id || null;
    return null;
}

// The available pronunciation drills (the /practice routes) for the picker.
export const PRACTICE_ROUTES = [
    { route: '/practice/alphabet', label: 'The alphabet' },
    { route: '/practice/vowels-single-1', label: 'Basic vowels' },
    { route: '/practice/vowels-single-2', label: 'Special vowels' },
    { route: '/practice/vowels-diph-1', label: 'Vowel combos · centering' },
    { route: '/practice/vowels-diph-2', label: 'Vowel combos · gliding' },
    { route: '/practice/vowels-diph-3', label: 'Vowel combos · advanced' },
    { route: '/practice/consonants', label: 'Consonants' },
    { route: '/practice/consonants-final', label: 'Final consonants' },
    { route: '/practice/tones/level1', label: 'Tones · level vs falling' },
    { route: '/practice/tones/level2', label: 'Tones · + rising' },
    { route: '/practice/tones/level3', label: 'Tones · + dipping' },
    { route: '/practice/tones/level4', label: 'Tones · hỏi vs ngã' },
    { route: '/practice/tones/level5', label: 'Tones · all 6' },
    { route: '/practice/tones/speak', label: 'Tones · say a tone' },
    { route: '/practice/tonemarks-basic', label: 'Tone marks · basics' },
    { route: '/practice/tonemarks-special', label: 'Tone marks · special' },
    { route: '/practice/tonemarks-master', label: 'Tone marks · master' },
];

// Flat list of grammar units for the picker: { id, title, label }.
// Requires loadGrammarModules() to have resolved (returns [] otherwise).
export function listGrammarUnits() {
    const data = getGrammarModulesSync();
    if (!data) return [];
    const out = [];
    for (const level of (data.levels || [])) {
        for (const mod of (level.modules || [])) {
            for (const unit of (mod.units || [])) {
                out.push({ id: unit.id, title: unit.title, label: `${level.id} · ${unit.title}` });
            }
        }
    }
    return out;
}

// Pronunciation practice routes whose content is an editable drill JSON
// (DrillEditor). Other routes (alphabet/vowels/tone-marks) are defined in code.
const PRACTICE_DRILL_IDS = {
    '/practice/consonants': 'consonants_initial',
    '/practice/consonants-final': 'consonants_final',
};

// Resolve WHERE to edit a module's CONTENT (not just which content it points to).
// Returns { route, label, editable:true } to open the right admin editor, or
// { editable:false } for content defined in code. This is the one systematic
// entry point the admin uses for "Edit content" across all module kinds.
export function getContentEditor(node) {
    const kind = moduleKindOf(node);
    if (!kind) return null;
    if (kind.id === 'vocabulary') {
        const id = node.lesson_id || node.content_ref_id || '';
        return { route: `/admin/lesson?id=${id}`, label: 'Edit lesson', editable: true };
    }
    if (kind.id === 'grammar') {
        const id = node.skill_content?.grammar_unit_id;
        return id ? { route: `/admin/grammar-unit?id=${id}`, label: 'Edit grammar', editable: true } : { editable: false };
    }
    if (kind.id === 'pronunciation') {
        const route = node.practice_route || '';
        const drillId = PRACTICE_DRILL_IDS[route];
        if (drillId) return { route: `/admin/drills?id=${drillId}`, label: 'Edit drill', editable: true };
        if (route.startsWith('/practice/tones') || route.startsWith('/practice/tonemarks')) {
            return { route: '/admin/tones', label: 'Edit tone words', editable: true };
        }
        if (route === '/practice/alphabet') return { route: '/admin/alphabet', label: 'Edit alphabet', editable: true };
        if (route.startsWith('/practice/vowels')) return { route: '/admin/vowels', label: 'Edit vowels', editable: true };
        return { editable: false };
    }
    return null; // test — auto
}
