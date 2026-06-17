import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getLessonContent, saveLessonContent, getItems, getExercisesGenerated, clearExerciseCache } from '../../lib/db';
import { EXERCISE_PROFILES } from '../../lib/exerciseProfiles';
import { MCQ_TYPE_OPTIONS, normalizeMcqTypeIds } from '../../lib/mcqTypes';
import { getCanonicalCurriculum, getCurriculumCounts, validateCanonicalCurriculum } from '../../lib/content/canonicalCurriculumStore';
import { Search, Plus, Trash2, Save, ArrowLeft, Check, Eye, FileCheck } from 'lucide-react';

const splitCsv = (value) => String(value || '').split(',').map(part => part.trim()).filter(Boolean);

const toNumberOrUndefined = (value) => {
    if (value === '' || value === null || value === undefined) return undefined;
    const next = Number(value);
    return Number.isFinite(next) ? next : undefined;
};

const LessonBuilder = () => {
    const { search } = useLocation();
    const navigate = useNavigate();
    const query = new URLSearchParams(search);
    const targetLessonId = query.get('id') || 'lesson_001';

    return <LessonBuilderEditor key={targetLessonId} targetLessonId={targetLessonId} navigate={navigate} />;
};

const buildInitialEditorState = (targetLessonId) => {
    const data = getLessonContent(targetLessonId);
    const validation = validateCanonicalCurriculum(getCanonicalCurriculum());
    const counts = getCurriculumCounts();
    return {
        goal: data?.goal || 'New Lesson Goal',
        exerciseProfileId: data?.exerciseProfileId || '',
        mcqTypeIds: normalizeMcqTypeIds(data?.mcqTypeIds || data?.lesson?.mcqTypeIds),
        lessonMeta: {
            unitId: data?.lesson?.unitId || '',
            orderIndex: data?.lesson?.orderIndex ?? '',
            nodeId: data?.lesson?.nodeId || '',
            quizId: data?.lesson?.quizId || '',
            topic: data?.lesson?.topic || '',
            cefrLevel: data?.lesson?.cefrLevel || '',
            difficulty: data?.lesson?.difficulty ?? '',
            xpReward: data?.lesson?.xpReward ?? '',
            focus: (data?.lesson?.focus || []).join(', '),
        },
        sentences: data?.sentences || [],
        conversations: data?.conversations || [],
        attachedItems: data?.attachedItems || [],
        allItems: getItems().filter(item => item.item_type !== 'sentence'),
        validation,
        counts,
    };
};

const LessonBuilderEditor = ({ targetLessonId, navigate }) => {
    const initialState = useMemo(() => buildInitialEditorState(targetLessonId), [targetLessonId]);
    const [goal, setGoal] = useState(initialState.goal);
    const [exerciseProfileId, setExerciseProfileId] = useState(initialState.exerciseProfileId);
    const [mcqTypeIds, setMcqTypeIds] = useState(initialState.mcqTypeIds);
    const [lessonMeta, setLessonMeta] = useState(initialState.lessonMeta);
    const [sentences, setSentences] = useState(initialState.sentences);
    const [conversations, setConversations] = useState(initialState.conversations);
    const [vocabSearch, setVocabSearch] = useState('');
    const [allItems] = useState(initialState.allItems);
    const [attachedItems, setAttachedItems] = useState(initialState.attachedItems);
    const [saved, setSaved] = useState(false);
    const [previewExercises, setPreviewExercises] = useState(null);
    const [validation, setValidation] = useState(initialState.validation);
    const [counts, setCounts] = useState(initialState.counts);

    const handleSave = () => {
        try {
            saveLessonContent({
                id: targetLessonId,
                goal,
                exerciseProfileId,
                lesson: {
                    id: targetLessonId,
                    title: goal,
                    unitId: lessonMeta.unitId || undefined,
                    orderIndex: toNumberOrUndefined(lessonMeta.orderIndex),
                    nodeId: lessonMeta.nodeId || undefined,
                    quizId: lessonMeta.quizId || undefined,
                    topic: lessonMeta.topic || undefined,
                    cefrLevel: lessonMeta.cefrLevel || undefined,
                    difficulty: toNumberOrUndefined(lessonMeta.difficulty),
                    xpReward: toNumberOrUndefined(lessonMeta.xpReward),
                    exerciseProfileId: exerciseProfileId || undefined,
                    mcqTypeIds,
                    focus: splitCsv(lessonMeta.focus),
                },
                sentences,
                attachedItems,
                conversations,
                mcqTypeIds,
            });
            setValidation(validateCanonicalCurriculum(getCanonicalCurriculum()));
            setCounts(getCurriculumCounts());
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
            return true;
        } catch (err) {
            alert(`Save failed: ${err.message || err}`);
            setValidation(validateCanonicalCurriculum(getCanonicalCurriculum()));
            return false;
        }
    };

    const updateLessonMeta = (field, value) => {
        setLessonMeta(current => ({ ...current, [field]: value }));
    };

    const toggleMcqType = (typeId) => {
        setMcqTypeIds(current => (
            current.includes(typeId)
                ? current.filter(id => id !== typeId)
                : [...current, typeId]
        ));
    };

    const addSentence = () => {
        setSentences([...sentences, { vietnamese: '', english: '' }]);
    };

    const updateSentence = (index, field, value) => {
        const next = [...sentences];
        next[index] = { ...next[index], [field]: value };
        setSentences(next);
    };

    const removeSentence = (index) => {
        setSentences(sentences.filter((_, i) => i !== index));
    };

    const addConversation = () => {
        setConversations([
            ...conversations,
            {
                id: `conv_${targetLessonId}_${conversations.length + 1}`,
                title: '',
                context: '',
                lines: [
                    { speaker: 'A', vi: '', en: '' },
                    { speaker: 'B', vi: '', en: '' },
                ],
            },
        ]);
    };

    const updateConversation = (index, field, value) => {
        const next = [...conversations];
        next[index] = { ...next[index], [field]: value };
        setConversations(next);
    };

    const removeConversation = (index) => {
        setConversations(conversations.filter((_, i) => i !== index));
    };

    const addConversationLine = (conversationIndex) => {
        const next = [...conversations];
        const lines = next[conversationIndex].lines || [];
        const lastSpeaker = lines[lines.length - 1]?.speaker;
        next[conversationIndex] = {
            ...next[conversationIndex],
            lines: [...lines, { speaker: lastSpeaker === 'A' ? 'B' : 'A', vi: '', en: '' }],
        };
        setConversations(next);
    };

    const updateConversationLine = (conversationIndex, lineIndex, field, value) => {
        const next = [...conversations];
        const lines = [...(next[conversationIndex].lines || [])];
        lines[lineIndex] = { ...lines[lineIndex], [field]: value };
        next[conversationIndex] = { ...next[conversationIndex], lines };
        setConversations(next);
    };

    const removeConversationLine = (conversationIndex, lineIndex) => {
        const next = [...conversations];
        next[conversationIndex] = {
            ...next[conversationIndex],
            lines: (next[conversationIndex].lines || []).filter((_, i) => i !== lineIndex),
        };
        setConversations(next);
    };

    const attachItem = (item) => {
        if (attachedItems.find(a => a.id === item.id)) return;
        setAttachedItems([...attachedItems, { id: item.id, vi_text: item.vi_text, en: item.en, pos: item.pos }]);
    };

    const detachItem = (itemId) => {
        setAttachedItems(attachedItems.filter(a => a.id !== itemId));
    };

    const filteredVocab = vocabSearch
        ? allItems.filter(w =>
            (w.vi_text || '').toLowerCase().includes(vocabSearch.toLowerCase()) ||
            (w.en || '').toLowerCase().includes(vocabSearch.toLowerCase())
        ).slice(0, 10)
        : [];

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                        <button
                            className="ghost"
                            onClick={() => navigate('/admin/mapper')}
                            style={{ padding: '4px 8px', fontSize: 14 }}
                        >
                            <ArrowLeft size={16} /> Back to Mapper
                        </button>
                    </div>
                    <h1 style={{ fontSize: 32, margin: 0, marginBottom: 8 }}>Lesson Builder</h1>
                    <span style={{ color: 'var(--text-muted)' }}>Editing canonical lesson: <code style={{ color: 'var(--secondary-color)' }}>{targetLessonId}</code></span>
                </div>
                <button className="primary" onClick={handleSave} style={{ minWidth: 160 }}>
                    {saved ? <><Check size={20} /> Saved!</> : <><Save size={20} /> Publish Changes</>}
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24 }}>

                {/* Left Column: Lesson Content */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    <div className="glass-panel">
                        <h3 style={{ marginTop: 0 }}>Lesson Metadata</h3>
                        <label style={{ display: 'block', fontSize: 14, color: 'var(--text-muted)', marginBottom: 8 }}>Title</label>
                        <input
                            type="text"
                            value={goal}
                            onChange={(e) => setGoal(e.target.value)}
                            style={{ width: '100%', padding: 12, borderRadius: 8, backgroundColor: 'var(--surface-color-light)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: 16, boxSizing: 'border-box' }}
                        />

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginTop: 16 }}>
                            {[
                                ['unitId', 'Unit ID'],
                                ['orderIndex', 'Order'],
                                ['nodeId', 'Node ID'],
                                ['quizId', 'Quiz ID'],
                                ['topic', 'Topic'],
                                ['cefrLevel', 'CEFR'],
                                ['difficulty', 'Difficulty'],
                                ['xpReward', 'XP'],
                            ].map(([field, label]) => (
                                <label key={field} style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)' }}>
                                    {label}
                                    <input
                                        type={['orderIndex', 'difficulty', 'xpReward'].includes(field) ? 'number' : 'text'}
                                        value={lessonMeta[field] ?? ''}
                                        onChange={(e) => updateLessonMeta(field, e.target.value)}
                                        style={{ width: '100%', marginTop: 4, padding: 10, borderRadius: 6, backgroundColor: 'var(--surface-color-light)', border: '1px solid var(--border-color)', color: 'var(--text-main)', boxSizing: 'border-box' }}
                                    />
                                </label>
                            ))}
                        </div>

                        <label style={{ display: 'block', fontSize: 14, color: 'var(--text-muted)', marginTop: 16, marginBottom: 8 }}>Focus tags</label>
                        <input
                            type="text"
                            value={lessonMeta.focus || ''}
                            onChange={(e) => updateLessonMeta('focus', e.target.value)}
                            placeholder="comma-separated tags"
                            style={{ width: '100%', padding: 12, borderRadius: 8, backgroundColor: 'var(--surface-color-light)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: 16, boxSizing: 'border-box' }}
                        />

                        <label style={{ display: 'block', fontSize: 14, color: 'var(--text-muted)', marginTop: 20, marginBottom: 8 }}>Exercise Profile</label>
                        <select
                            value={exerciseProfileId}
                            onChange={(e) => setExerciseProfileId(e.target.value)}
                            style={{ width: '100%', padding: 12, borderRadius: 8, backgroundColor: 'var(--surface-color-light)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: 16, boxSizing: 'border-box' }}
                        >
                            <option value="">Auto (by level — A1 = Beginner)</option>
                            {Object.values(EXERCISE_PROFILES).map(p => (
                                <option key={p.id} value={p.id}>{p.label}</option>
                            ))}
                        </select>
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '8px 0 0' }}>
                            Controls which question types this lesson generates. "Beginner" replaces typing with multiple-choice. Use Preview to see the effect.
                        </p>

                        <div style={{ marginTop: 20, padding: 14, borderRadius: 10, border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                                <div>
                                    <h4 style={{ margin: 0, fontSize: 14 }}>MCQ Formats</h4>
                                    <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0' }}>
                                        Leave empty to use the full profile mix. Select formats to limit this lesson's choice-style questions.
                                    </p>
                                </div>
                                {mcqTypeIds.length > 0 && (
                                    <button
                                        className="ghost"
                                        type="button"
                                        onClick={() => setMcqTypeIds([])}
                                        style={{ fontSize: 12, padding: '6px 8px', flexShrink: 0 }}
                                    >
                                        Auto
                                    </button>
                                )}
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 8 }}>
                                {MCQ_TYPE_OPTIONS.map(option => {
                                    const checked = mcqTypeIds.includes(option.id);
                                    return (
                                        <label
                                            key={option.id}
                                            style={{
                                                display: 'flex',
                                                gap: 10,
                                                alignItems: 'flex-start',
                                                padding: 10,
                                                borderRadius: 8,
                                                border: `1px solid ${checked ? 'var(--secondary-color)' : 'var(--border-color)'}`,
                                                backgroundColor: checked ? 'rgba(17, 138, 178, 0.12)' : 'var(--surface-color)',
                                                cursor: 'pointer',
                                            }}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={() => toggleMcqType(option.id)}
                                                style={{ marginTop: 2 }}
                                            />
                                            <span>
                                                <span style={{ display: 'block', fontSize: 13, fontWeight: 800, color: 'var(--text-main)' }}>
                                                    {option.label}
                                                </span>
                                                <span style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.35, marginTop: 2 }}>
                                                    {option.description}
                                                </span>
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="glass-panel">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <h3 style={{ margin: 0 }}>Sentence Constructor</h3>
                            <button className="ghost" style={{ fontSize: 14 }} onClick={addSentence}>
                                <Plus size={16} /> Add Pair
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {sentences.map((s, idx) => (
                                <div key={idx} style={{ display: 'flex', gap: 16, alignItems: 'flex-start', padding: 16, backgroundColor: 'var(--bg-color)', borderRadius: 8, border: '1px solid var(--border-color)' }}>
                                    <div style={{ width: 24, height: 24, borderRadius: '50%', backgroundColor: 'var(--surface-color-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                                        {idx + 1}
                                    </div>
                                    <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                                        <div style={{ flex: '1 1 200px' }}>
                                            <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Sentence ID</label>
                                            <input
                                                type="text"
                                                value={s.id || ''}
                                                onChange={(e) => updateSentence(idx, 'id', e.target.value)}
                                                placeholder={`it_cms_${targetLessonId}_${idx}`}
                                                style={{ width: '100%', padding: '8px 12px', borderRadius: 4, backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', color: 'var(--text-main)', boxSizing: 'border-box' }}
                                            />
                                        </div>
                                        <div style={{ flex: '1 1 200px' }}>
                                            <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Vietnamese Target</label>
                                            <input
                                                type="text"
                                                value={s.vietnamese}
                                                onChange={(e) => updateSentence(idx, 'vietnamese', e.target.value)}
                                                placeholder="e.g. Xin chào bạn"
                                                style={{ width: '100%', padding: '8px 12px', borderRadius: 4, backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', color: 'var(--text-main)', boxSizing: 'border-box' }}
                                            />
                                        </div>
                                        <div style={{ flex: '1 1 200px' }}>
                                            <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>English Meaning</label>
                                            <input
                                                type="text"
                                                value={s.english}
                                                onChange={(e) => updateSentence(idx, 'english', e.target.value)}
                                                placeholder="e.g. Hello friend"
                                                style={{ width: '100%', padding: '8px 12px', borderRadius: 4, backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', color: 'var(--text-main)', boxSizing: 'border-box' }}
                                            />
                                        </div>
                                        <div style={{ flex: '1 1 100%' }}>
                                            <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Grammar note</label>
                                            <input
                                                type="text"
                                                value={s.note || ''}
                                                onChange={(e) => updateSentence(idx, 'note', e.target.value)}
                                                placeholder="optional note"
                                                style={{ width: '100%', padding: '8px 12px', borderRadius: 4, backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', color: 'var(--text-main)', boxSizing: 'border-box' }}
                                            />
                                        </div>
                                    </div>
                                    <button className="ghost" onClick={() => removeSentence(idx)} style={{ color: 'var(--danger-color)', flexShrink: 0 }}>
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            ))}

                            {sentences.length === 0 && (
                                <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)', borderStyle: 'dashed', borderWidth: 2, borderColor: 'var(--border-color)', borderRadius: 8 }}>
                                    No sentences yet. Click "Add Pair" to start building lesson content.
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="glass-panel">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <div>
                                <h3 style={{ margin: 0 }}>Dialogue Preview</h3>
                                <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                                    These lines appear when a learner taps a study card before starting.
                                </p>
                            </div>
                            <button className="ghost" style={{ fontSize: 14 }} onClick={addConversation}>
                                <Plus size={16} /> Add Dialogue
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                            {conversations.map((conversation, convIdx) => (
                                <div key={conversation.id || convIdx} style={{ padding: 16, backgroundColor: 'var(--bg-color)', borderRadius: 10, border: '1px solid var(--border-color)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(130px, 0.8fr) minmax(160px, 1fr) minmax(160px, 1fr)', gap: 12, flex: 1 }}>
                                            <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)' }}>
                                                Dialogue ID
                                                <input
                                                    type="text"
                                                    value={conversation.id || ''}
                                                    onChange={(e) => updateConversation(convIdx, 'id', e.target.value)}
                                                    style={{ width: '100%', marginTop: 4, padding: '8px 10px', borderRadius: 6, backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', color: 'var(--text-main)', boxSizing: 'border-box' }}
                                                />
                                            </label>
                                            <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)' }}>
                                                Title
                                                <input
                                                    type="text"
                                                    value={conversation.title || ''}
                                                    onChange={(e) => updateConversation(convIdx, 'title', e.target.value)}
                                                    placeholder="Meeting someone"
                                                    style={{ width: '100%', marginTop: 4, padding: '8px 10px', borderRadius: 6, backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', color: 'var(--text-main)', boxSizing: 'border-box' }}
                                                />
                                            </label>
                                            <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)' }}>
                                                Context
                                                <input
                                                    type="text"
                                                    value={conversation.context || ''}
                                                    onChange={(e) => updateConversation(convIdx, 'context', e.target.value)}
                                                    placeholder="At a cafe"
                                                    style={{ width: '100%', marginTop: 4, padding: '8px 10px', borderRadius: 6, backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', color: 'var(--text-main)', boxSizing: 'border-box' }}
                                                />
                                            </label>
                                        </div>
                                        <button className="ghost" onClick={() => removeConversation(convIdx)} style={{ color: 'var(--danger-color)', flexShrink: 0 }}>
                                            <Trash2 size={20} />
                                        </button>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                        {(conversation.lines || []).map((line, lineIdx) => (
                                            <div key={lineIdx} style={{ display: 'grid', gridTemplateColumns: '72px minmax(180px, 1fr) minmax(180px, 1fr) 36px', gap: 10, alignItems: 'center' }}>
                                                <input
                                                    type="text"
                                                    value={line.speaker || ''}
                                                    onChange={(e) => updateConversationLine(convIdx, lineIdx, 'speaker', e.target.value)}
                                                    placeholder="A"
                                                    aria-label="Speaker"
                                                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', color: 'var(--text-main)', boxSizing: 'border-box' }}
                                                />
                                                <input
                                                    type="text"
                                                    value={line.vi || ''}
                                                    onChange={(e) => updateConversationLine(convIdx, lineIdx, 'vi', e.target.value)}
                                                    placeholder="Vietnamese line"
                                                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', color: 'var(--text-main)', boxSizing: 'border-box' }}
                                                />
                                                <input
                                                    type="text"
                                                    value={line.en || ''}
                                                    onChange={(e) => updateConversationLine(convIdx, lineIdx, 'en', e.target.value)}
                                                    placeholder="English meaning"
                                                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', color: 'var(--text-main)', boxSizing: 'border-box' }}
                                                />
                                                <button
                                                    className="ghost"
                                                    onClick={() => removeConversationLine(convIdx, lineIdx)}
                                                    style={{ color: 'var(--danger-color)', padding: 8 }}
                                                    aria-label="Remove dialogue line"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    <button className="ghost" style={{ marginTop: 12, fontSize: 13 }} onClick={() => addConversationLine(convIdx)}>
                                        <Plus size={14} /> Add Line
                                    </button>
                                </div>
                            ))}

                            {conversations.length === 0 && (
                                <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)', borderStyle: 'dashed', borderWidth: 2, borderColor: 'var(--border-color)', borderRadius: 8 }}>
                                    No dialogue yet. Add one if learners should preview a conversation before the lesson.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Tools */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

                    <div className="glass-panel" style={{ borderColor: validation.ok ? 'rgba(76,175,80,0.35)' : 'rgba(239,68,68,0.45)' }}>
                        <h3 style={{ marginTop: 0, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <FileCheck size={18} /> Canonical Contract
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12, color: 'var(--text-muted)' }}>
                            <span>Units: {counts.units}</span>
                            <span>Lessons: {counts.lessons}</span>
                            <span>Words: {counts.words}</span>
                            <span>Sentences: {counts.sentences}</span>
                        </div>
                        <div style={{ marginTop: 12, fontSize: 12, color: validation.ok ? '#4CAF50' : 'var(--danger-color)' }}>
                            {validation.ok ? 'Valid canonical curriculum' : `${validation.errors.length} validation issue${validation.errors.length === 1 ? '' : 's'}`}
                        </div>
                        {!validation.ok && (
                            <ul style={{ margin: '8px 0 0', paddingLeft: 18, fontSize: 11, color: 'var(--danger-color)' }}>
                                {validation.errors.slice(0, 3).map((err, idx) => <li key={idx}>{err}</li>)}
                            </ul>
                        )}
                    </div>

                    <div className="glass-panel">
                        <h3 style={{ marginTop: 0, fontSize: 16 }}>Vocab Selector</h3>
                        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                            Search the {allItems.length} items in the database to attach vocabulary to this lesson.
                        </p>

                        <div style={{ position: 'relative', marginBottom: 16 }}>
                            <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                value={vocabSearch}
                                onChange={(e) => setVocabSearch(e.target.value)}
                                placeholder="Search Vietnamese or English..."
                                style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: 8, backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)', color: 'var(--text-main)', boxSizing: 'border-box' }}
                            />
                        </div>

                        {filteredVocab.length > 0 && (
                            <div style={{ border: '1px solid var(--border-color)', borderRadius: 8, overflow: 'hidden', marginBottom: 12 }}>
                                {filteredVocab.map(w => {
                                    const isAttached = attachedItems.some(a => a.id === w.id);
                                    return (
                                        <div
                                            key={w.id}
                                            onClick={() => !isAttached && attachItem(w)}
                                            style={{
                                                padding: '8px 12px', borderBottom: '1px solid var(--border-color)',
                                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                backgroundColor: isAttached ? 'rgba(76,175,80,0.1)' : 'var(--surface-color-light)',
                                                cursor: isAttached ? 'default' : 'pointer',
                                                opacity: isAttached ? 0.6 : 1
                                            }}
                                        >
                                            <div style={{ minWidth: 0 }}>
                                                <span style={{ fontWeight: 700 }}>{w.vi_text}</span>
                                                <span style={{ fontSize: 10, color: 'var(--primary-color)', marginLeft: 6 }}>{w.item_type}</span>
                                                <div style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{w.en}</div>
                                            </div>
                                            {isAttached ? <Check size={16} color="#4CAF50" /> : <Plus size={16} />}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        <div style={{ marginTop: 8 }}>
                            <h4 style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>
                                Attached ({attachedItems.length})
                            </h4>
                            {attachedItems.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                    {attachedItems.map(a => (
                                        <div key={a.id} style={{
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                            padding: '6px 10px', borderRadius: 6,
                                            backgroundColor: 'rgba(242, 107, 90, 0.08)', border: '1px solid var(--border-color)'
                                        }}>
                                            <div>
                                                <span style={{ fontWeight: 600, fontSize: 13 }}>{a.vi_text}</span>
                                                <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 6 }}>{a.en}</span>
                                            </div>
                                            <button
                                                onClick={() => detachItem(a.id)}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2, display: 'flex' }}
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                    Search above to attach vocab items
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="glass-panel" style={{ backgroundColor: 'rgba(17, 138, 178, 0.1)' }}>
                        <h3 style={{ marginTop: 0, fontSize: 16, color: 'var(--secondary-color)' }}>Auto-Generate</h3>
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
                            Exercises are auto-generated from your words/sentences. Add items above and they'll produce match pairs, MCQ, reorder, fill-blank, and listening exercises automatically.
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <button className="primary" onClick={handleSave} style={{ width: '100%', fontSize: 14 }}>
                                <Save size={16} /> Publish Changes
                            </button>
                            <button
                                className="secondary"
                                onClick={() => {
                                    clearExerciseCache();
                                    if (!handleSave()) return;
                                    const exercises = getExercisesGenerated(targetLessonId);
                                    setPreviewExercises(exercises);
                                }}
                                style={{ width: '100%', fontSize: 14 }}
                            >
                                <Eye size={16} /> Preview Exercises
                            </button>
                        </div>
                    </div>

                    {previewExercises && (
                        <div className="glass-panel">
                            <h3 style={{ marginTop: 0, fontSize: 16 }}>
                                Exercise Preview ({previewExercises.length})
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {previewExercises.map((ex, i) => (
                                    <div key={i} style={{ padding: '8px 10px', borderRadius: 6, backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)', fontSize: 12 }}>
                                        <div style={{ fontWeight: 700, color: 'var(--secondary-color)', marginBottom: 2, textTransform: 'uppercase', fontSize: 10 }}>
                                            {ex.exercise_type.replace(/_/g, ' ')}
                                        </div>
                                        <div style={{ color: 'var(--text-muted)' }}>
                                            {ex.prompt.instruction}
                                            {ex.prompt.source_text_en && ` — "${ex.prompt.source_text_en}"`}
                                            {ex.prompt.source_text_vi && ` — "${ex.prompt.source_text_vi}"`}
                                            {ex.prompt.template_vi && ` — "${ex.prompt.template_vi}"`}
                                            {ex.prompt.pairs && ` — ${ex.prompt.pairs.length} pairs`}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                </div>

            </div>
        </div>
    );
};

export default LessonBuilder;
