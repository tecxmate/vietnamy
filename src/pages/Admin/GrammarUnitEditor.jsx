import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Save, Plus, Trash2, RotateCcw, Check, ArrowLeft } from 'lucide-react';
import { loadGrammarModules, getUnit, saveGrammarUnitOverride, resetGrammarUnitOverride } from '../../lib/grammarModulesDB';

// Editor for a single grammar_modules.json unit (the content a Grammar module
// opens). Edits the lesson content — title, pattern, explanation, note, and
// examples — and persists a per-unit override in localStorage so the lesson
// (GrammarUnitLesson, via getUnit) reflects the change.
const GrammarUnitEditor = () => {
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const unitId = params.get('id') || '';

    const [unit, setUnit] = useState(null);
    const [form, setForm] = useState(null);
    const [hasChanges, setHasChanges] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        let cancelled = false;
        loadGrammarModules().then(() => {
            if (cancelled) return;
            const found = getUnit(unitId);
            setUnit(found);
            if (found) {
                const u = found.unit;
                setForm({
                    title: u.title || '', pattern: u.pattern || '',
                    explanation: u.explanation || '', note: u.note || '',
                    examples: (u.examples || []).map(e => ({ vi: e.vi || '', en: e.en || '' })),
                });
            }
        });
        return () => { cancelled = true; };
    }, [unitId]);

    const set = (field, value) => { setForm(f => ({ ...f, [field]: value })); setHasChanges(true); setSaved(false); };
    const setExample = (i, field, value) => set('examples', form.examples.map((e, idx) => idx === i ? { ...e, [field]: value } : e));
    const addExample = () => set('examples', [...form.examples, { vi: '', en: '' }]);
    const delExample = (i) => set('examples', form.examples.filter((_, idx) => idx !== i));

    const save = () => {
        saveGrammarUnitOverride(unitId, form);
        setHasChanges(false); setSaved(true);
        setTimeout(() => setSaved(false), 1800);
    };
    const reset = () => {
        if (!confirm('Discard your edits and restore the original grammar content?')) return;
        resetGrammarUnitOverride(unitId);
        const found = getUnit(unitId);
        const u = found.unit;
        setForm({ title: u.title || '', pattern: u.pattern || '', explanation: u.explanation || '', note: u.note || '', examples: (u.examples || []).map(e => ({ vi: e.vi || '', en: e.en || '' })) });
        setHasChanges(false);
    };

    const s = {
        input: { width: '100%', padding: '8px 10px', borderRadius: 6, backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: 14, boxSizing: 'border-box', fontFamily: 'inherit' },
        label: { fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4, fontWeight: 600 },
        field: { marginBottom: 16 },
    };

    if (!unitId) return <div style={{ padding: 32 }}>No grammar unit id. Open from the Roadmap Mapper.</div>;
    if (!form) return <div style={{ padding: 32 }}>{unit === null ? `Grammar unit "${unitId}" not found.` : 'Loading…'}</div>;

    return (
        <div className="admin-roadmap" style={{ maxWidth: 760 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <button className="ghost" onClick={() => navigate('/admin/mapper')} style={{ marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}><ArrowLeft size={16} /> Roadmap Mapper</button>
                    <h1 style={{ fontSize: 28, margin: 0 }}>Edit Grammar</h1>
                    <span style={{ color: 'var(--text-muted)', fontSize: 13, fontFamily: 'monospace' }}>{unitId} · {unit?.module?.title}</span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button className="secondary" onClick={reset} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><RotateCcw size={16} /> Reset</button>
                    <button className="primary" onClick={save} disabled={!hasChanges} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        {saved ? <><Check size={16} /> Saved</> : <><Save size={16} /> Save</>}
                    </button>
                </div>
            </div>

            <div className="glass-panel" style={{ padding: 20 }}>
                <div style={s.field}>
                    <label style={s.label}>Title</label>
                    <input style={s.input} value={form.title} onChange={(e) => set('title', e.target.value)} />
                </div>
                <div style={s.field}>
                    <label style={s.label}>Pattern</label>
                    <input style={{ ...s.input, fontFamily: 'monospace' }} value={form.pattern} onChange={(e) => set('pattern', e.target.value)} />
                </div>
                <div style={s.field}>
                    <label style={s.label}>Explanation</label>
                    <textarea style={{ ...s.input, minHeight: 80, resize: 'vertical' }} value={form.explanation} onChange={(e) => set('explanation', e.target.value)} />
                </div>
                <div style={s.field}>
                    <label style={s.label}>Note</label>
                    <textarea style={{ ...s.input, minHeight: 56, resize: 'vertical' }} value={form.note} onChange={(e) => set('note', e.target.value)} />
                </div>

                <div style={{ ...s.field, marginBottom: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <label style={{ ...s.label, marginBottom: 0 }}>Examples (Vietnamese → English)</label>
                        <button className="ghost" onClick={addExample} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12 }}><Plus size={14} /> Add</button>
                    </div>
                    {form.examples.map((ex, i) => (
                        <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                            <input style={s.input} placeholder="Vietnamese" value={ex.vi} onChange={(e) => setExample(i, 'vi', e.target.value)} />
                            <input style={s.input} placeholder="English" value={ex.en} onChange={(e) => setExample(i, 'en', e.target.value)} />
                            <button className="ghost" onClick={() => delExample(i)} style={{ color: '#EF4444', padding: 4 }} title="Remove"><Trash2 size={15} /></button>
                        </div>
                    ))}
                    {form.examples.length === 0 && <div style={{ color: 'var(--text-muted)', fontSize: 13, fontStyle: 'italic' }}>No examples yet.</div>}
                </div>
            </div>
        </div>
    );
};

export default GrammarUnitEditor;
