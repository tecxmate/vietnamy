import modules from '../../data/lessons.json';
import { getImageForWord } from '../../utils/vocabImageLookup';
import { generateExercises } from '../exerciseGenerator';
import { resolveExerciseProfile } from '../exerciseProfiles';
import { getDueItemIds } from '../srs';
import { getWeakItems as _getWeakItems, extractItemIds as _extractItemIds } from '../wordGrades';

// Max total items per lesson (new + review combined)
const MAX_LESSON_ITEMS = 8;
// Number of new words introduced per session (Duolingo-style progressive introduction)
const ITEMS_PER_SESSION = 2;

// Default values for known placeholders. Fallback used when profile has no value.
const PLACEHOLDER_DEFAULTS = {
    NAME: { vi: 'Bạn', en: 'me' },
    ROLE: { vi: 'sinh viên', en: 'student' },
};

const getUserProfile = () => {
    try {
        const raw = localStorage.getItem('vnme_user_profile');
        if (raw) return JSON.parse(raw);
    } catch { /* ignore */ }
    return {};
};

const substituteTemplate = (text, lang = 'vi') => {
    if (!text) return text;
    const profile = getUserProfile();
    const values = {
        NAME: profile.name || PLACEHOLDER_DEFAULTS.NAME[lang],
        ROLE: profile.role || profile.occupation || PLACEHOLDER_DEFAULTS.ROLE[lang],
    };
    let out = text.replace(/\{([A-Z_]+)\}/g, (match, key) => {
        if (values[key]) return values[key];
        const def = PLACEHOLDER_DEFAULTS[key];
        if (def) return def[lang] || def.en || '';
        return '\0PLACEHOLDER\0';
    });
    return out
        .replace(/\b(a|an|the)\s+\0PLACEHOLDER\0/gi, '')
        .replace(/\0PLACEHOLDER\0/g, '')
        .replace(/\s+/g, ' ')
        .replace(/\s+([.,!?;:])/g, '$1')
        .trim();
};

const isSentenceItem = (item) =>
    item.id?.startsWith('it_s_') ||
    item.id?.startsWith('it_p_') ||
    item.item_type === 'sentence' ||
    item.item_type === 'phrase';

export const createLessonExerciseService = ({ getDB }) => {
    const exerciseCache = new Map();

    const resolveItems = (db, itemIds) => {
        return itemIds.map(itemId => {
            const item = (db.items || []).find(i => i.id === itemId);
            const translation = (db.translations || []).find(t => t.item_id === itemId && t.lang === 'en');
            if (!item || !translation) return null;
            return {
                id: item.id,
                vi_text: substituteTemplate(item.vi_text, 'vi'),
                vi_text_no_diacritics: item.vi_text_no_diacritics ? substituteTemplate(item.vi_text_no_diacritics, 'vi') : null,
                en_text: substituteTemplate(translation.text, 'en'),
                audio_key: item.audio_key,
                item_type: item.item_type
            };
        }).filter(Boolean);
    };

    const getKnownVocabulary = (lessonId) => {
        const db = getDB();
        const targetNode = (db.path_nodes || []).find(n => n.lesson_id === lessonId);
        if (!targetNode) return { knownItemIds: new Set(), knownItems: [] };

        const targetUnit = (db.units || []).find(u => u.id === targetNode.unit_id);
        if (!targetUnit) return { knownItemIds: new Set(), knownItems: [] };

        const allLessonNodes = (db.path_nodes || [])
            .filter(n => n.node_type === 'lesson' && n.lesson_id)
            .map(n => {
                const unit = (db.units || []).find(u => u.id === n.unit_id);
                return { ...n, _unitIndex: unit ? (unit.unit_index ?? 999) : 999 };
            })
            .sort((a, b) => a._unitIndex - b._unitIndex || (a.node_index || 0) - (b.node_index || 0));

        const knownItemIds = new Set();
        for (const node of allLessonNodes) {
            const bp = (db.lesson_blueprints || []).find(b => b.lesson_id === node.lesson_id);
            if (bp) {
                (bp.introduced_items || []).forEach(id => knownItemIds.add(id));
            }
            if (node.lesson_id === lessonId) break;
        }

        return { knownItemIds, knownItems: resolveItems(db, [...knownItemIds]) };
    };

    const getDistractorPool = (db, lessonId) => {
        const { knownItems } = getKnownVocabulary(lessonId);
        const blueprint = (db.lesson_blueprints || []).find(b => b.lesson_id === lessonId);
        const currentItemIds = new Set(blueprint?.introduced_items || []);
        return knownItems.filter(item => !currentItemIds.has(item.id));
    };

    const getExercisesGenerated = (lessonId, session = 0, options = {}) => {
        const skill = options.skill || '';
        const useAllLessonItems = options.useAllLessonItems === true;
        const today = new Date().toISOString().slice(0, 10);
        const cacheKey = `${lessonId}_s${session}_${skill}_${useAllLessonItems ? 'all' : 'slice'}_${today}`;
        if (exerciseCache.has(cacheKey)) return exerciseCache.get(cacheKey);

        const db = getDB();
        const blueprint = (db.lesson_blueprints || []).find(bp => bp.lesson_id === lessonId);
        if (!blueprint) return [];

        const allBlueprintItems = resolveItems(db, blueprint.introduced_items || []);
        if (allBlueprintItems.length === 0) return [];

        const newStart = session * ITEMS_PER_SESSION;
        const sessionNewItems = useAllLessonItems
            ? allBlueprintItems
            : allBlueprintItems.slice(newStart, newStart + ITEMS_PER_SESSION);
        const previouslyIntroduced = useAllLessonItems ? [] : allBlueprintItems.slice(0, newStart);

        const newItems = sessionNewItems.length > 0 ? sessionNewItems : [];
        let reviewFromLesson = previouslyIntroduced;

        if (session >= 2 && reviewFromLesson.length > 0) {
            const weakOrder = _getWeakItems(reviewFromLesson.map(i => i.id));
            const byId = new Map(reviewFromLesson.map(i => [i.id, i]));
            reviewFromLesson = weakOrder.map(id => byId.get(id)).filter(Boolean);
        }

        const blueprintItemIds = new Set(blueprint.introduced_items || []);
        const { knownItemIds } = getKnownVocabulary(lessonId);
        const dueIds = getDueItemIds().filter(id => !blueprintItemIds.has(id) && knownItemIds.has(id));
        const srsSlots = Math.max(0, MAX_LESSON_ITEMS - newItems.length - reviewFromLesson.length);
        const srsReviewItems = resolveItems(db, dueIds.slice(0, srsSlots));

        let allItems = [...newItems, ...reviewFromLesson, ...srsReviewItems];
        if (allItems.length === 0) return [];

        const SENTENCE_TARGET = 2;
        const presentSentences = allItems.filter(isSentenceItem).length;
        if (presentSentences < SENTENCE_TARGET) {
            const presentIds = new Set(allItems.map(i => i.id));
            const blueprintSentences = allBlueprintItems.filter(i => isSentenceItem(i) && !presentIds.has(i.id));
            const toAdd = blueprintSentences.slice(0, SENTENCE_TARGET - presentSentences);
            if (toAdd.length > 0) {
                const head = [...newItems, ...toAdd];
                allItems = [...allItems, ...toAdd];
                if (allItems.length > MAX_LESSON_ITEMS) {
                    const overflow = allItems.length - MAX_LESSON_ITEMS;
                    const tail = allItems.filter(i => !head.includes(i));
                    allItems = [...head, ...tail.slice(0, Math.max(0, tail.length - overflow))];
                }
            }
        }

        const distractorPool = getDistractorPool(db, lessonId);
        const imageMap = {};
        const wordHints = {};

        allItems.forEach(item => {
            const imgData = getImageForWord(item.vi_text);
            if (imgData) {
                imageMap[item.vi_text.toLowerCase()] = imgData;
            } else if (item.emoji) {
                imageMap[item.vi_text.toLowerCase()] = { image: null, emoji: item.emoji };
            }
            wordHints[item.vi_text.toLowerCase()] = item.en_text;
        });

        // Resolve which exercise profile drives this lesson's question types.
        // A lesson can pin a profile via exercise_profile_id (set in the Lesson
        // Builder); otherwise it's derived from the lesson's CEFR level on its
        // roadmap node (A1 → beginner, no typing).
        const lessonRecord = (db.lessons || []).find(l => l.id === lessonId);
        const lessonNode = (db.path_nodes || []).find(n => n.lesson_id === lessonId && (!skill || n.skill === skill))
            || (db.path_nodes || []).find(n => n.lesson_id === lessonId);
        const profile = resolveExerciseProfile({
            profileId: lessonRecord?.exercise_profile_id,
            cefrLevel: lessonNode?.cefr_level,
        });

        const generated = generateExercises(lessonId, allItems, distractorPool, imageMap, session, {
            ...profile.options,
            mcqTypeIds: lessonRecord?.mcq_type_ids || lessonRecord?.mcqTypeIds || profile.options?.mcqTypeIds,
        });
        const exercises = filterExercisesBySkill(generated, skill);
        exercises.forEach(ex => { ex.wordHints = wordHints; });

        exerciseCache.set(cacheKey, exercises);
        return exercises;
    };

    const getExercisesForUnit = (unitId) => {
        const db = getDB();
        const unitNodes = (db.path_nodes || []).filter(n => n.unit_id === unitId && n.node_type === 'lesson');
        const lessonIds = unitNodes.map(n => n.lesson_id).filter(Boolean);
        const allExercises = lessonIds.flatMap(lid => getExercisesGenerated(lid));

        const allItemIds = [...new Set(allExercises.flatMap(ex => _extractItemIds(ex, db)))];
        if (allItemIds.length > 0) {
            const weakIds = new Set(_getWeakItems(allItemIds));
            allExercises.sort((a, b) => {
                const aWeak = _extractItemIds(a, db).some(id => weakIds.has(id)) ? 0 : 1;
                const bWeak = _extractItemIds(b, db).some(id => weakIds.has(id)) ? 0 : 1;
                if (aWeak !== bWeak) return aWeak - bWeak;
                return Math.random() - 0.5;
            });
        }

        return allExercises;
    };

    const getExercisesForNode = (nodeId) => {
        const db = getDB();
        const node = (db.path_nodes || []).find(n => n.id === nodeId);
        if (!node) return [];

        if (node.test_scope === 'module' && node.source_node_id) {
            const sourceNode = (db.path_nodes || []).find(n => n.id === node.source_node_id);
            if (sourceNode?.lesson_id) {
                return getExercisesGenerated(sourceNode.lesson_id, 0, {
                    skill: sourceNode.skill || '',
                    useAllLessonItems: Boolean(sourceNode.skill),
                });
            }
        }

        if (node.lesson_id) {
            return getExercisesGenerated(node.lesson_id, 0, {
                skill: node.skill || '',
                useAllLessonItems: Boolean(node.skill),
            });
        }

        return [];
    };

    const getLessonBlueprint = (lessonId, session = 0, options = {}) => {
        const db = getDB();
        const blueprint = (db.lesson_blueprints || []).find(bp => bp.lesson_id === lessonId);
        if (!blueprint) return null;
        const useAllLessonItems = options.useAllLessonItems === true;

        const moduleId = parseInt(lessonId.replace('lesson_', ''));
        const moduleData = modules.find(m => m.id === moduleId);

        const allItemIds = blueprint.introduced_items || [];
        const newStart = session * ITEMS_PER_SESSION;
        const sessionItemIds = useAllLessonItems
            ? allItemIds
            : allItemIds.slice(newStart, newStart + ITEMS_PER_SESSION);

        const words = sessionItemIds.map(itemId => {
            const item = (db.items || []).find(i => i.id === itemId);
            const translation = (db.translations || []).find(t => t.item_id === itemId && t.lang === 'en');
            if (item && translation) {
                return {
                    id: item.id,
                    vietnamese: substituteTemplate(item.vi_text, 'vi'),
                    english: substituteTemplate(translation.text, 'en')
                };
            }
            return null;
        }).filter(Boolean);

        return {
            lessonId,
            title: moduleData?.title || blueprint.title || 'Lesson',
            goal: moduleData?.goal || blueprint.goal || '',
            focus: blueprint.focus,
            words,
            dialogue: moduleData?.dialogue || null,
            patterns: moduleData?.patterns || null,
            pronunciation_focus: moduleData?.pronunciation_focus || null
        };
    };

    return {
        getExercisesGenerated,
        clearExerciseCache: () => exerciseCache.clear(),
        getExercisesForUnit,
        getExercisesForNode,
        getLessonBlueprint,
    };
};
