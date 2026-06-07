import React, { useState } from 'react';
import { Save, Plus, Trash2, Check, Lightbulb } from 'lucide-react';
import { getAllConcepts, saveAllConcepts } from '../../lib/concepts';
import { getDB } from '../../lib/db';

// Lessons available to attach a concept to (id + human title), sorted by id.
function loadLessons() {
    try {
        const db = getDB();
        return (db.lessons || [])
            .map(l => ({ id: l.id, title: l.title || l.id }))
            .sort((a, b) => a.id.localeCompare(b.id));
    } catch {
        return [];
    }
}

const newConcept = () => ({
    id: `concept_${Date.now().toString(36)}`,
    lessonId: '',
    title: '',
    body: '',
    examples: [],
});

const ConceptEditor = () => {
    const [concepts, setConcepts] = useState(() => getAllConcepts());
    const [lessons] = useState(loadLessons);
    const [hasChanges, setHasChanges] = useState(false);
    const [saved, setSaved] = useState(false);

    const update = (next) => { setConcepts(next); setHasChanges(true); };

    const updateConcept = (idx, field, value) => {
        const next = [...concepts];
        next[idx] = { ...next[idx], [field]: value };
        update(next);
    };

    const addConcept = () => update([...concepts, newConcept()]);
    const deleteConcept = (idx) => update(concepts.filter((_, i) => i !== idx));

    const updateExample = (cIdx, eIdx, field, value) => {
        const next = [...concepts];
        const examples = [...(next[cIdx].examples || [])];
        examples[eIdx] = { ...examples[eIdx], [field]: value };
        next[cIdx] = { ...next[cIdx], examples };
        update(next);
    };
    const addExample = (cIdx) => {
        const next = [...concepts];
        next[cIdx] = { ...next[cIdx], examples: [...(next[cIdx].examples || []), { vi: '', en: '' }] };
        update(next);
    };
    const removeExample = (cIdx, eIdx) => {
        const next = [...concepts];
        next[cIdx] = { ...next[cIdx], examples: (next[cIdx].examples || []).filter((_, i) => i !== eIdx) };
        update(next);
    };

    const handleSave = () => {
        // Drop empty example rows before persisting.
        const cleaned = concepts.map(c => ({
            ...c,
            examples: (c.examples || []).filter(e => (e.vi || '').trim()),
        }));
        saveAllConcepts(cleaned);
        setConcepts(cleaned);
        setHasChanges(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const inputStyle = { width: '100%', padding: '8px 12px', borderRadius: 6, backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', color: 'var(--text-main)', boxSizing: 'border-box' };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 32, margin: 0, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Lightbulb size={28} color="var(--primary-color)" /> Concept Editor
                    </h1>
                    <span style={{ color: 'var(--text-muted)' }}>
                        Short teaching cards shown in a lesson's intro, before the vocab. {concepts.length} concept{concepts.length === 1 ? '' : 's'}.
                    </span>
                </div>
                <button className="primary" onClick={handleSave} style={{ minWidth: 160 }} disabled={!hasChanges && !saved}>
                    {saved ? <><Check size={20} /> Saved!</> : <><Save size={20} /> Publish Changes</>}
                </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {concepts.map((c, idx) => (
                    <div key={c.id || idx} className="glass-panel">
                        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                                    <div style={{ flex: '1 1 200px' }}>
                                        <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Shows in lesson</label>
                                        <select value={c.lessonId} onChange={(e) => updateConcept(idx, 'lessonId', e.target.value)} style={inputStyle}>
                                            <option value="">— select a lesson —</option>
                                            {lessons.map(l => (
                                                <option key={l.id} value={l.id}>{l.id} · {l.title}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div style={{ flex: '2 1 300px' }}>
                                        <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Title</label>
                                        <input type="text" value={c.title} onChange={(e) => updateConcept(idx, 'title', e.target.value)} placeholder="e.g. Vietnamese is tonal" style={inputStyle} />
                                    </div>
                                </div>
                                <div>
                                    <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Body</label>
                                    <textarea value={c.body} onChange={(e) => updateConcept(idx, 'body', e.target.value)} rows={3} placeholder="Explain the idea in a sentence or two…" style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} />
                                </div>
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                        <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Examples (tappable to hear)</label>
                                        <button className="ghost" style={{ fontSize: 13 }} onClick={() => addExample(idx)}><Plus size={14} /> Add example</button>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        {(c.examples || []).map((ex, eIdx) => (
                                            <div key={eIdx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                                <input type="text" value={ex.vi || ''} onChange={(e) => updateExample(idx, eIdx, 'vi', e.target.value)} placeholder="Vietnamese" style={{ ...inputStyle, flex: 1 }} />
                                                <input type="text" value={ex.en || ''} onChange={(e) => updateExample(idx, eIdx, 'en', e.target.value)} placeholder="English (optional)" style={{ ...inputStyle, flex: 1 }} />
                                                <button className="ghost" onClick={() => removeExample(idx, eIdx)} style={{ color: 'var(--danger-color)', flexShrink: 0 }}><Trash2 size={16} /></button>
                                            </div>
                                        ))}
                                        {(c.examples || []).length === 0 && (
                                            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>No examples yet.</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <button className="ghost" onClick={() => deleteConcept(idx)} style={{ color: 'var(--danger-color)', flexShrink: 0 }} title="Delete concept">
                                <Trash2 size={20} />
                            </button>
                        </div>
                    </div>
                ))}

                {concepts.length === 0 && (
                    <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', borderStyle: 'dashed', borderWidth: 2, borderColor: 'var(--border-color)', borderRadius: 8 }}>
                        No concepts yet. Click "Add Concept" to create a teaching card.
                    </div>
                )}

                <button className="secondary" onClick={addConcept} style={{ alignSelf: 'flex-start' }}>
                    <Plus size={18} /> Add Concept
                </button>
            </div>
        </div>
    );
};

export default ConceptEditor;
