import bakedCurriculum from '../../../content/curriculum.json';
import {
    createCurriculumDraftEnvelope,
    getCurriculumFromDraftPayload,
} from './curriculumDraftContract';

const STORAGE_KEY = 'vnme_canonical_curriculum_v1';

const clone = (value) => JSON.parse(JSON.stringify(value));

const asArray = (value) => Array.isArray(value) ? value : [];

const hasText = (value) => typeof value === 'string' && value.trim().length > 0;

const normalizeCurriculum = (curriculum) => ({
    ...clone(curriculum),
    meta: { ...(curriculum.meta || {}) },
    units: asArray(curriculum.units).map(unit => ({ ...unit })),
    lessons: asArray(curriculum.lessons).map(lesson => ({
        ...lesson,
        focus: asArray(lesson.focus),
        targets: asArray(lesson.targets),
        wordIds: asArray(lesson.wordIds),
        sentenceIds: asArray(lesson.sentenceIds),
        conversationIds: asArray(lesson.conversationIds),
    })),
    words: asArray(curriculum.words).map(word => ({ ...word })),
    sentences: asArray(curriculum.sentences).map(sentence => ({
        ...sentence,
        accepted: asArray(sentence.accepted),
        grammarTagIds: asArray(sentence.grammarTagIds),
    })),
    conversations: asArray(curriculum.conversations).map(conversation => ({
        ...conversation,
        lines: asArray(conversation.lines).map(line => ({ ...line })),
    })),
    grammarTags: asArray(curriculum.grammarTags).map(tag => ({ ...tag })),
});

const findDuplicates = (ids) => {
    const seen = new Set();
    const duplicates = new Set();
    ids.filter(Boolean).forEach(id => {
        if (seen.has(id)) duplicates.add(id);
        seen.add(id);
    });
    return [...duplicates];
};

export function validateCanonicalCurriculum(curriculum) {
    const errors = [];

    if (!curriculum || typeof curriculum !== 'object') {
        return { ok: false, errors: ['Curriculum must be a JSON object.'] };
    }

    if (!curriculum.meta || typeof curriculum.meta !== 'object') errors.push('Missing meta object.');
    if (!hasText(curriculum.meta?.mode)) errors.push('meta.mode is required.');
    if (!hasText(curriculum.meta?.version)) errors.push('meta.version is required.');

    ['units', 'lessons', 'words', 'sentences'].forEach(key => {
        if (!Array.isArray(curriculum[key])) errors.push(`${key} must be an array.`);
    });

    if (errors.length) return { ok: false, errors };

    const units = asArray(curriculum.units);
    const lessons = asArray(curriculum.lessons);
    const words = asArray(curriculum.words);
    const sentences = asArray(curriculum.sentences);
    const conversations = asArray(curriculum.conversations);
    const grammarTags = asArray(curriculum.grammarTags);

    [
        ['unit', units],
        ['lesson', lessons],
        ['word', words],
        ['sentence', sentences],
        ['conversation', conversations],
        ['grammar tag', grammarTags],
    ].forEach(([label, rows]) => {
        const duplicates = findDuplicates(rows.map(row => row.id));
        if (duplicates.length) errors.push(`Duplicate ${label} ids: ${duplicates.slice(0, 8).join(', ')}.`);
    });

    const unitIds = new Set(units.map(unit => unit.id));
    const lessonIds = new Set(lessons.map(lesson => lesson.id));
    const wordIds = new Set(words.map(word => word.id));
    const sentenceIds = new Set(sentences.map(sentence => sentence.id));
    const conversationIds = new Set(conversations.map(conversation => conversation.id));
    const grammarTagIds = new Set(grammarTags.map(tag => tag.id));

    units.forEach((unit, index) => {
        if (!hasText(unit.id)) errors.push(`units[${index}].id is required.`);
        if (!Number.isInteger(unit.orderIndex)) errors.push(`${unit.id || `units[${index}]`}.orderIndex must be an integer.`);
        if (!hasText(unit.title)) errors.push(`${unit.id || `units[${index}]`}.title is required.`);
    });

    lessons.forEach((lesson, index) => {
        const label = lesson.id || `lessons[${index}]`;
        if (!hasText(lesson.id)) errors.push(`lessons[${index}].id is required.`);
        if (!hasText(lesson.unitId)) errors.push(`${label}.unitId is required.`);
        if (hasText(lesson.unitId) && !unitIds.has(lesson.unitId)) errors.push(`${label}.unitId references missing unit ${lesson.unitId}.`);
        if (!Number.isInteger(lesson.orderIndex)) errors.push(`${label}.orderIndex must be an integer.`);
        if (!hasText(lesson.title)) errors.push(`${label}.title is required.`);
        asArray(lesson.wordIds).forEach(id => {
            if (!wordIds.has(id)) errors.push(`${label}.wordIds references missing word ${id}.`);
        });
        asArray(lesson.sentenceIds).forEach(id => {
            if (!sentenceIds.has(id)) errors.push(`${label}.sentenceIds references missing sentence ${id}.`);
        });
        asArray(lesson.conversationIds).forEach(id => {
            if (!conversationIds.has(id)) errors.push(`${label}.conversationIds references missing conversation ${id}.`);
        });
    });

    words.forEach((word, index) => {
        const label = word.id || `words[${index}]`;
        if (!hasText(word.id)) errors.push(`words[${index}].id is required.`);
        if (!hasText(word.vi)) errors.push(`${label}.vi is required.`);
        if (hasText(word.lessonId) && !lessonIds.has(word.lessonId)) errors.push(`${label}.lessonId references missing lesson ${word.lessonId}.`);
    });

    sentences.forEach((sentence, index) => {
        const label = sentence.id || `sentences[${index}]`;
        if (!hasText(sentence.id)) errors.push(`sentences[${index}].id is required.`);
        if (!hasText(sentence.vi)) errors.push(`${label}.vi is required.`);
        if (hasText(sentence.lessonId) && !lessonIds.has(sentence.lessonId)) errors.push(`${label}.lessonId references missing lesson ${sentence.lessonId}.`);
        asArray(sentence.grammarTagIds).forEach(id => {
            if (!grammarTagIds.has(id)) errors.push(`${label}.grammarTagIds references missing grammar tag ${id}.`);
        });
    });

    conversations.forEach((conversation, index) => {
        const label = conversation.id || `conversations[${index}]`;
        if (!hasText(conversation.id)) errors.push(`conversations[${index}].id is required.`);
        if (hasText(conversation.lessonId) && !lessonIds.has(conversation.lessonId)) errors.push(`${label}.lessonId references missing lesson ${conversation.lessonId}.`);
        if (!Array.isArray(conversation.lines)) errors.push(`${label}.lines must be an array.`);
    });

    return { ok: errors.length === 0, errors };
}

export function getCanonicalCurriculum() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return normalizeCurriculum(bakedCurriculum);
        const parsed = JSON.parse(raw);
        const normalized = normalizeCurriculum(parsed);
        const validation = validateCanonicalCurriculum(normalized);
        return validation.ok ? normalized : normalizeCurriculum(bakedCurriculum);
    } catch {
        return normalizeCurriculum(bakedCurriculum);
    }
}

export function saveCanonicalCurriculum(curriculum) {
    const normalized = normalizeCurriculum(curriculum);
    const validation = validateCanonicalCurriculum(normalized);
    if (!validation.ok) {
        throw new Error(validation.errors.slice(0, 8).join('\n'));
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    return normalized;
}

export function exportCanonicalCurriculum() {
    const curriculum = getCanonicalCurriculum();
    return createCurriculumDraftEnvelope(curriculum, {
        counts: getCurriculumCounts(curriculum),
    });
}

export function importCanonicalCurriculum(payload) {
    const curriculum = getCurriculumFromDraftPayload(payload);
    if (!curriculum || typeof curriculum !== 'object') {
        throw new Error('Import payload is missing a curriculum object.');
    }
    return saveCanonicalCurriculum(curriculum);
}

export function getCurriculumCounts(curriculum = getCanonicalCurriculum()) {
    return {
        units: asArray(curriculum.units).length,
        lessons: asArray(curriculum.lessons).length,
        words: asArray(curriculum.words).length,
        sentences: asArray(curriculum.sentences).length,
        conversations: asArray(curriculum.conversations).length,
        grammarTags: asArray(curriculum.grammarTags).length,
    };
}

export function getCanonicalLessonContent(lessonId, curriculum = getCanonicalCurriculum()) {
    const lesson = asArray(curriculum.lessons).find(row => row.id === lessonId);
    if (!lesson) return null;
    const wordIdSet = new Set(asArray(lesson.wordIds));
    const sentenceIdSet = new Set(asArray(lesson.sentenceIds));
    const conversationIdSet = new Set(asArray(lesson.conversationIds));
    return {
        lesson: clone(lesson),
        words: asArray(curriculum.words).filter(row => wordIdSet.has(row.id) || row.lessonId === lesson.id).map(clone),
        sentences: asArray(curriculum.sentences).filter(row => sentenceIdSet.has(row.id) || row.lessonId === lesson.id).map(clone),
        conversations: asArray(curriculum.conversations).filter(row => conversationIdSet.has(row.id) || row.lessonId === lesson.id).map(clone),
    };
}

const upsertRows = (rows, nextRows) => {
    const byId = new Map(rows.map(row => [row.id, row]));
    nextRows.forEach(row => byId.set(row.id, row));
    return [...byId.values()];
};

export function saveCanonicalLessonContent(contentData) {
    const curriculum = getCanonicalCurriculum();
    const lessonIndex = curriculum.lessons.findIndex(row => row.id === contentData.lesson.id);
    if (lessonIndex < 0) throw new Error(`Lesson ${contentData.lesson.id} was not found.`);

    const lessonId = contentData.lesson.id;
    const words = asArray(contentData.words).map(row => ({ ...row, lessonId: row.lessonId || lessonId }));
    const sentences = asArray(contentData.sentences).map(row => ({
        ...row,
        lessonId: row.lessonId || lessonId,
        accepted: asArray(row.accepted).filter(Boolean),
        grammarTagIds: asArray(row.grammarTagIds).filter(Boolean),
    }));
    const conversations = asArray(contentData.conversations).map(row => ({
        ...row,
        lessonId: row.lessonId || lessonId,
        lines: asArray(row.lines),
    }));

    const previous = getCanonicalLessonContent(lessonId, curriculum);
    const previousWordIds = new Set(asArray(previous?.lesson.wordIds));
    const previousSentenceIds = new Set(asArray(previous?.lesson.sentenceIds));
    const previousConversationIds = new Set(asArray(previous?.lesson.conversationIds));

    const nextWordIds = words.map(row => row.id).filter(Boolean);
    const nextSentenceIds = sentences.map(row => row.id).filter(Boolean);
    const nextConversationIds = conversations.map(row => row.id).filter(Boolean);

    curriculum.lessons[lessonIndex] = {
        ...curriculum.lessons[lessonIndex],
        ...contentData.lesson,
        wordIds: nextWordIds,
        sentenceIds: nextSentenceIds,
        conversationIds: nextConversationIds,
    };

    const removeOwned = (row, previousIds, nextIds) => {
        if (!previousIds.has(row.id) || nextIds.has(row.id)) return true;
        return row.lessonId && row.lessonId !== lessonId;
    };

    curriculum.words = upsertRows(
        curriculum.words.filter(row => removeOwned(row, previousWordIds, new Set(nextWordIds))),
        words,
    );
    curriculum.sentences = upsertRows(
        curriculum.sentences.filter(row => removeOwned(row, previousSentenceIds, new Set(nextSentenceIds))),
        sentences,
    );
    curriculum.conversations = upsertRows(
        curriculum.conversations.filter(row => removeOwned(row, previousConversationIds, new Set(nextConversationIds))),
        conversations,
    );

    curriculum.meta = {
        ...curriculum.meta,
        editedAt: new Date().toISOString(),
        source: curriculum.meta?.source || 'admin',
    };

    return saveCanonicalCurriculum(curriculum);
}

export function listCanonicalWords(curriculum = getCanonicalCurriculum()) {
    return asArray(curriculum.words).map(clone);
}

export function listCanonicalLessons(curriculum = getCanonicalCurriculum()) {
    return asArray(curriculum.lessons).map(clone);
}
