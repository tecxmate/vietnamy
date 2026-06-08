import React, { useState, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Save, Plus, Trash2, Download, Upload, Check, ChevronDown, ChevronRight, GripVertical } from 'lucide-react';

// Import all drill data files as defaults
import consonantsData from '../../data/drills/consonants_initial.json';
import classifiersBasicsData from '../../data/drills/classifiers_basics.json';
import classifiersExtendedData from '../../data/drills/classifiers_extended.json';
import particlesPoliteData from '../../data/drills/particles_politeness.json';
import particlesEmotionData from '../../data/drills/particles_emotion.json';
import questionWordsData from '../../data/drills/question_words.json';
import questionWordsAdvData from '../../data/drills/question_words_advanced.json';
import aspectMarkersData from '../../data/drills/aspect_markers.json';

const CMS_KEY_PREFIX = 'vnme_cms_drill_';

const ALL_DRILLS = [
    consonantsData,
    classifiersBasicsData,
    classifiersExtendedData,
    particlesPoliteData,
    particlesEmotionData,
    questionWordsData,
    questionWordsAdvData,
    aspectMarkersData,
];

const QUESTION_TYPES = [
    { value: 'mcq', label: 'Multiple Choice' },
    { value: 'fill_blank', label: 'Fill in the Blank' },
    { value: 'listen_pick', label: 'Listen & Pick' },
];

function loadDrill(id) {
    try {
        const raw = localStorage.getItem(CMS_KEY_PREFIX + id);
        if (raw) return JSON.parse(raw);
    } catch { /* fall through */ }
    return null;
}

function saveDrill(id, data) {
    localStorage.setItem(CMS_KEY_PREFIX + id, JSON.stringify(data));
}

function resetDrill(id) {
    localStorage.removeItem(CMS_KEY_PREFIX + id);
}

const emptyQuestion = () => ({
    type: 'mcq',
    prompt: '',
    correct: '',
    options: ['', '', '', ''],
    explanation: '',
    audio: '',
});

const inputStyle = {
    width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border-color)', background: 'var(--surface-color)',
    color: 'var(--text-main)', fontSize: '0.9rem',
};

const labelStyle = { fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4, display: 'block', fontWeight: 600 };

const DrillEditor = () => {
    const [params] = useSearchParams();
    const [activeDrillId, setActiveDrillId] = useState(() => {
        const id = params.get('id');
        return ALL_DRILLS.some(d => d.id === id) ? id : ALL_DRILLS[0].id;
    });
    const [hasChanges, setHasChanges] = useState(false);
    const [saved, setSaved] = useState(false);
    const [expandedQ, setExpandedQ] = useState(null);
    const fileInputRef = useRef(null);

    // Load drill data: CMS override or bundled default
    const defaultData = useMemo(() => ALL_DRILLS.find(d => d.id === activeDrillId), [activeDrillId]);
    const [drill, setDrill] = useState(() => loadDrill(activeDrillId) || { ...defaultData });

    const switchDrill = (id) => {
        setActiveDrillId(id);
        const def = ALL_DRILLS.find(d => d.id === id);
        setDrill(loadDrill(id) || { ...def });
        setHasChanges(false);
        setExpandedQ(null);
    };

    const update = (next) => { setDrill(next); setHasChanges(true); };

    const updateMeta = (field, value) => {
        update({ ...drill, [field]: value });
    };

    const updateQuestion = (qIdx, field, value) => {
        const questions = [...drill.questions];
        questions[qIdx] = { ...questions[qIdx], [field]: value };
        update({ ...drill, questions });
    };

    const updateOption = (qIdx, optIdx, value) => {
        const questions = [...drill.questions];
        const opts = [...questions[qIdx].options];
        opts[optIdx] = value;
        questions[qIdx] = { ...questions[qIdx], options: opts };
        update({ ...drill, questions });
    };

    const addOption = (qIdx) => {
        const questions = [...drill.questions];
        questions[qIdx] = { ...questions[qIdx], options: [...questions[qIdx].options, ''] };
        update({ ...drill, questions });
    };

    const removeOption = (qIdx, optIdx) => {
        const questions = [...drill.questions];
        const opts = questions[qIdx].options.filter((_, i) => i !== optIdx);
        questions[qIdx] = { ...questions[qIdx], options: opts };
        update({ ...drill, questions });
    };

    const addQuestion = () => {
        const questions = [...drill.questions, emptyQuestion()];
        update({ ...drill, questions });
        setExpandedQ(questions.length - 1);
    };

    const deleteQuestion = (idx) => {
        if (!confirm(`Delete question ${idx + 1}?`)) return;
        const questions = drill.questions.filter((_, i) => i !== idx);
        update({ ...drill, questions });
        if (expandedQ === idx) setExpandedQ(null);
    };

    const moveQuestion = (idx, dir) => {
        const questions = [...drill.questions];
        const newIdx = idx + dir;
        if (newIdx < 0 || newIdx >= questions.length) return;
        [questions[idx], questions[newIdx]] = [questions[newIdx], questions[idx]];
        update({ ...drill, questions });
        setExpandedQ(newIdx);
    };

    const handleSave = () => {
        saveDrill(activeDrillId, drill);
        setHasChanges(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const handleReset = () => {
        if (!confirm('Reset to default? This will discard all your edits for this drill.')) return;
        resetDrill(activeDrillId);
        setDrill({ ...defaultData });
        setHasChanges(false);
    };

    const downloadJson = () => {
        const blob = new Blob([JSON.stringify(drill, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `${drill.id}.json`; a.click();
        URL.revokeObjectURL(url);
    };

    const handleImport = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const imported = JSON.parse(ev.target.result);
                if (imported.id && imported.questions) {
                    update(imported);
                }
            } catch { alert('Invalid JSON file'); }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h1 style={{ fontSize: 24, fontWeight: 800 }}>Drill Editor</h1>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={downloadJson} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--surface-color)', color: 'var(--text-main)', cursor: 'pointer' }}>
                        <Download size={16} /> Export
                    </button>
                    <button onClick={() => fileInputRef.current?.click()} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--surface-color)', color: 'var(--text-main)', cursor: 'pointer' }}>
                        <Upload size={16} /> Import
                    </button>
                    <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
                    <button onClick={handleReset} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--surface-color)', color: 'var(--danger-color, #ef476f)', cursor: 'pointer' }}>
                        Reset
                    </button>
                    <button onClick={handleSave} disabled={!hasChanges} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: 'none', background: hasChanges ? 'var(--primary-color)' : 'var(--surface-color)', color: hasChanges ? '#1A1A1A' : 'var(--text-muted)', fontWeight: 700, cursor: hasChanges ? 'pointer' : 'default' }}>
                        {saved ? <><Check size={16} /> Saved!</> : <><Save size={16} /> Publish</>}
                    </button>
                </div>
            </div>

            {/* Drill Selector */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
                {ALL_DRILLS.map(d => (
                    <button
                        key={d.id}
                        onClick={() => switchDrill(d.id)}
                        style={{
                            padding: '8px 14px', borderRadius: 20, fontSize: '0.85rem', fontWeight: 600,
                            border: d.id === activeDrillId ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
                            background: d.id === activeDrillId ? 'rgba(255,209,102,0.1)' : 'var(--surface-color)',
                            color: d.id === activeDrillId ? 'var(--primary-color)' : 'var(--text-main)',
                            cursor: 'pointer',
                        }}
                    >
                        {d.title}
                        {loadDrill(d.id) && <span style={{ marginLeft: 4, color: 'var(--success-color)' }}>●</span>}
                    </button>
                ))}
            </div>

            {/* Drill Metadata */}
            <div style={{ background: 'var(--surface-color)', borderRadius: 12, padding: 20, marginBottom: 24, border: '1px solid var(--border-color)' }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Module Info</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                        <label style={labelStyle}>Title</label>
                        <input style={inputStyle} value={drill.title} onChange={e => updateMeta('title', e.target.value)} />
                    </div>
                    <div>
                        <label style={labelStyle}>ID</label>
                        <input style={{ ...inputStyle, opacity: 0.6 }} value={drill.id} disabled />
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                        <label style={labelStyle}>Description</label>
                        <input style={inputStyle} value={drill.description} onChange={e => updateMeta('description', e.target.value)} />
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                        <label style={labelStyle}>Intro Text (shown on start screen)</label>
                        <textarea style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} value={drill.intro || ''} onChange={e => updateMeta('intro', e.target.value)} />
                    </div>
                </div>
            </div>

            {/* Questions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h2 style={{ fontSize: 16, fontWeight: 700 }}>Questions ({drill.questions.length})</h2>
                <button onClick={addQuestion} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--surface-color)', color: 'var(--text-main)', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
                    <Plus size={16} /> Add Question
                </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {drill.questions.map((q, idx) => {
                    const isOpen = expandedQ === idx;
                    return (
                        <div key={idx} style={{ background: 'var(--surface-color)', borderRadius: 12, border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                            {/* Collapsed header */}
                            <div
                                onClick={() => setExpandedQ(isOpen ? null : idx)}
                                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', cursor: 'pointer', userSelect: 'none' }}
                            >
                                {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', minWidth: 24 }}>#{idx + 1}</span>
                                <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: 10, background: 'rgba(156,39,176,0.1)', color: '#9C27B0', fontWeight: 600 }}>{q.type}</span>
                                <span style={{ flex: 1, fontSize: '0.9rem', color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {q.prompt || '(empty)'}
                                </span>
                                <button onClick={(e) => { e.stopPropagation(); moveQuestion(idx, -1); }} disabled={idx === 0} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: idx === 0 ? 'var(--border-color)' : 'var(--text-muted)' }}>↑</button>
                                <button onClick={(e) => { e.stopPropagation(); moveQuestion(idx, 1); }} disabled={idx === drill.questions.length - 1} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: idx === drill.questions.length - 1 ? 'var(--border-color)' : 'var(--text-muted)' }}>↓</button>
                                <button onClick={(e) => { e.stopPropagation(); deleteQuestion(idx); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--danger-color, #ef476f)' }}><Trash2 size={14} /></button>
                            </div>

                            {/* Expanded editor */}
                            {isOpen && (
                                <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--border-color)' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
                                        <div>
                                            <label style={labelStyle}>Type</label>
                                            <select style={inputStyle} value={q.type} onChange={e => updateQuestion(idx, 'type', e.target.value)}>
                                                {QUESTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                            </select>
                                        </div>
                                        {q.type === 'listen_pick' && (
                                            <div>
                                                <label style={labelStyle}>Audio Text (TTS)</label>
                                                <input style={inputStyle} value={q.audio || ''} onChange={e => updateQuestion(idx, 'audio', e.target.value)} placeholder="Vietnamese word to play" />
                                            </div>
                                        )}
                                    </div>

                                    <div style={{ marginTop: 12 }}>
                                        <label style={labelStyle}>Prompt</label>
                                        <textarea style={{ ...inputStyle, minHeight: 48, resize: 'vertical' }} value={q.prompt} onChange={e => updateQuestion(idx, 'prompt', e.target.value)} />
                                    </div>

                                    <div style={{ marginTop: 12 }}>
                                        <label style={labelStyle}>Correct Answer</label>
                                        <input style={{ ...inputStyle, borderColor: 'var(--success-color, #06d6a0)' }} value={q.correct} onChange={e => updateQuestion(idx, 'correct', e.target.value)} />
                                    </div>

                                    <div style={{ marginTop: 12 }}>
                                        <label style={labelStyle}>Options</label>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                            {q.options.map((opt, oi) => (
                                                <div key={oi} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                                    <span style={{ width: 24, textAlign: 'center', fontWeight: 700, fontSize: '0.8rem', color: opt === q.correct ? 'var(--success-color, #06d6a0)' : 'var(--text-muted)' }}>{String.fromCharCode(65 + oi)}</span>
                                                    <input style={{ ...inputStyle, flex: 1, borderColor: opt === q.correct ? 'var(--success-color, #06d6a0)' : undefined }} value={opt} onChange={e => updateOption(idx, oi, e.target.value)} />
                                                    {q.options.length > 2 && (
                                                        <button onClick={() => removeOption(idx, oi)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}><Trash2 size={12} /></button>
                                                    )}
                                                </div>
                                            ))}
                                            <button onClick={() => addOption(idx)} style={{ alignSelf: 'flex-start', fontSize: '0.8rem', background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', fontWeight: 600 }}>+ Add option</button>
                                        </div>
                                    </div>

                                    <div style={{ marginTop: 12 }}>
                                        <label style={labelStyle}>Explanation (shown after answer)</label>
                                        <textarea style={{ ...inputStyle, minHeight: 48, resize: 'vertical' }} value={q.explanation || ''} onChange={e => updateQuestion(idx, 'explanation', e.target.value)} />
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default DrillEditor;
