import React, { useState, useEffect } from 'react';
import { getLessonContent, saveLessonContent } from '../../lib/db';
import { Search, Plus, Trash2, Save } from 'lucide-react';

const LessonBuilder = () => {
    // In a real app, 'lesson_001' would come from URL params or selection state
    const targetLessonId = 'lesson_001';

    const [goal, setGoal] = useState('');
    const [sentences, setSentences] = useState([]);
    const [vocabSearch, setVocabSearch] = useState('');

    // Mock dictionary for the autocomplete UI concept
    const mockDictionary = [
        { word: 'Xin chào', pos: 'greeting', en: 'Hello' },
        { word: 'Cảm ơn', pos: 'verb', en: 'Thank you' },
        { word: 'Tạm biệt', pos: 'greeting', en: 'Goodbye' },
        { word: 'Bạn', pos: 'pronoun', en: 'You (friend)' }
    ];

    useEffect(() => {
        const data = getLessonContent(targetLessonId);
        if (data) {
            setGoal(data.goal || '');
            setSentences(data.sentences || []);
        } else {
            // Initialize if missing
            setGoal('New Lesson Goal');
            setSentences([]);
        }
    }, [targetLessonId]);

    const handleSave = () => {
        saveLessonContent({
            id: targetLessonId,
            goal,
            sentences
        });
        alert('Lesson saved successfully! Real app would compile audio and run logic validations here.');
    };

    const addSentence = () => {
        setSentences([...sentences, { vietnamese: '', english: '' }]);
    };

    const updateSentence = (index, field, value) => {
        const next = [...sentences];
        next[index][field] = value;
        setSentences(next);
    };

    const removeSentence = (index) => {
        setSentences(sentences.filter((_, i) => i !== index));
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                <div>
                    <h1 style={{ fontSize: 32, margin: 0, marginBottom: 8 }}>Lesson Builder</h1>
                    <span style={{ color: 'var(--text-muted)' }}>Editing Content Ref: {targetLessonId}</span>
                </div>
                <button className="primary" onClick={handleSave}>
                    <Save size={20} /> Publish Changes
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
                            style={{ width: '100%', padding: 12, borderRadius: 8, backgroundColor: 'var(--surface-color-light)', border: '1px solid var(--border-color)', color: 'white', fontSize: 16 }}
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
                                    <div style={{ width: 24, height: 24, borderRadius: '50%', backgroundColor: 'var(--surface-color-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>
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
                                                style={{ width: '100%', padding: '8px 12px', borderRadius: 4, backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', color: 'white' }}
                                            />
                                        </div>
                                        <div style={{ flex: '1 1 200px' }}>
                                            <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>English Meaning</label>
                                            <input
                                                type="text"
                                                value={s.english}
                                                onChange={(e) => updateSentence(idx, 'english', e.target.value)}
                                                placeholder="e.g. Hello friend"
                                                style={{ width: '100%', padding: '8px 12px', borderRadius: 4, backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', color: 'white' }}
                                            />
                                        </div>
                                    </div>
                                    <button className="ghost" onClick={() => removeSentence(idx)} style={{ color: 'var(--danger-color)' }}>
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            ))}

                            {sentences.length === 0 && (
                                <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)', borderStyle: 'dashed', borderWidth: 2, borderColor: 'var(--border-color)', borderRadius: 8 }}>
                                    No sentences. This might be a pure dictionary or vocab lesson.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Tools */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

                    <div className="glass-panel">
                        <h3 style={{ marginTop: 0, fontSize: 16 }}>Vocab Selector</h3>
                        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Search dictionary to attach core vocabulary requirements to this lesson.</p>

                        <div style={{ position: 'relative', marginBottom: 16 }}>
                            <Search size={16} position="absolute" style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                value={vocabSearch}
                                onChange={(e) => setVocabSearch(e.target.value)}
                                placeholder="Search database..."
                                style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: 8, backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)', color: 'white' }}
                            />
                        </div>

                        {vocabSearch && (
                            <div style={{ border: '1px solid var(--border-color)', borderRadius: 8, overflow: 'hidden' }}>
                                {mockDictionary.filter(w => w.word.toLowerCase().includes(vocabSearch.toLowerCase()) || w.en.toLowerCase().includes(vocabSearch.toLowerCase())).map(w => (
                                    <div key={w.word} style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', backgroundColor: 'var(--surface-color-light)', cursor: 'pointer' }}>
                                        <div>
                                            <span style={{ fontWeight: 700 }}>{w.word}</span> <span style={{ fontSize: 10, color: 'var(--primary-color)' }}>{w.pos}</span>
                                        </div>
                                        <Plus size={16} />
                                    </div>
                                ))}
                            </div>
                        )}

                        <div style={{ marginTop: 16 }}>
                            <h4 style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>Attached (0)</h4>
                        </div>
                    </div>

                    <div className="glass-panel" style={{ backgroundColor: 'rgba(17, 138, 178, 0.1)' }}>
                        <h3 style={{ marginTop: 0, fontSize: 16, color: 'var(--secondary-color)' }}>AI Audio Generator</h3>
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
                            Automatically generate Google TTS .mp3 links for all Vietnamese target sentences.
                        </p>
                        <button className="primary" style={{ width: '100%', fontSize: 14 }}>
                            Generate 2 Audio Files
                        </button>
                    </div>

                </div>

            </div>
        </div>
    );
};

export default LessonBuilder;
