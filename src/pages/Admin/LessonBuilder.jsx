import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getLessonContent, saveLessonContent, getItems } from '../../lib/db';
import { Search, Plus, Trash2, Save, ArrowLeft, Check } from 'lucide-react';

const LessonBuilder = () => {
    const { search } = useLocation();
    const navigate = useNavigate();
    const query = new URLSearchParams(search);
    const targetLessonId = query.get('id') || 'lesson_001';

    const [goal, setGoal] = useState('');
    const [sentences, setSentences] = useState([]);
    const [vocabSearch, setVocabSearch] = useState('');
    const [allItems, setAllItems] = useState([]);
    const [attachedItems, setAttachedItems] = useState([]);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        const data = getLessonContent(targetLessonId);
        if (data) {
            setGoal(data.goal || '');
            setSentences(data.sentences || []);
            setAttachedItems(data.attachedItems || []);
        } else {
            setGoal('New Lesson Goal');
            setSentences([]);
            setAttachedItems([]);
        }
        setAllItems(getItems());
    }, [targetLessonId]);

    const handleSave = () => {
        saveLessonContent({
            id: targetLessonId,
            goal,
            sentences,
            attachedItems
        });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
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

    const attachItem = (item) => {
        if (attachedItems.find(a => a.id === item.id)) return;
        setAttachedItems([...attachedItems, { id: item.id, vi_text: item.vi_text, en: item.en }]);
    };

    const detachItem = (itemId) => {
        setAttachedItems(attachedItems.filter(a => a.id !== itemId));
    };

    const filteredVocab = vocabSearch
        ? allItems.filter(w =>
            w.vi_text.toLowerCase().includes(vocabSearch.toLowerCase()) ||
            w.en.toLowerCase().includes(vocabSearch.toLowerCase())
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
                    <span style={{ color: 'var(--text-muted)' }}>Editing: <code style={{ color: 'var(--secondary-color)' }}>{targetLessonId}</code></span>
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
                        <label style={{ display: 'block', fontSize: 14, color: 'var(--text-muted)', marginBottom: 8 }}>Lesson Goal (Instructor notes)</label>
                        <input
                            type="text"
                            value={goal}
                            onChange={(e) => setGoal(e.target.value)}
                            style={{ width: '100%', padding: 12, borderRadius: 8, backgroundColor: 'var(--surface-color-light)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: 16, boxSizing: 'border-box' }}
                        />
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
                </div>

                {/* Right Column: Tools */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

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
                                            backgroundColor: 'rgba(255, 209, 102, 0.08)', border: '1px solid var(--border-color)'
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
                            Publishing will auto-generate {sentences.length * 3} exercises (MCQ, reorder, dictation) from your {sentences.length} sentence pair{sentences.length !== 1 ? 's' : ''}.
                        </p>
                        <button className="primary" onClick={handleSave} style={{ width: '100%', fontSize: 14 }}>
                            <Save size={16} /> Publish & Generate
                        </button>
                    </div>

                </div>

            </div>
        </div>
    );
};

export default LessonBuilder;
