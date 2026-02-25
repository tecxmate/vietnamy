import React, { useState, useRef } from 'react';
import { Save, Plus, Trash2, Search, Download, Upload, Check } from 'lucide-react';

const TONE_IDS = ['ngang', 'sac', 'huyen', 'hoi', 'nga', 'nang'];
const TONE_LABELS = {
    ngang: 'Ngang (Level)', sac: 'Sắc (Rising)', huyen: 'Huyền (Falling)',
    hoi: 'Hỏi (Dipping)', nga: 'Ngã (Glottal)', nang: 'Nặng (Heavy)',
};
const TONE_COLORS = {
    ngang: '#4CAF50', sac: '#2196F3', huyen: '#9C27B0',
    hoi: '#FF9800', nga: '#E91E63', nang: '#795548',
};

const STORAGE_KEY = 'vnme_cms_tonewords';

function loadWords() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw);
    } catch { /* fall through */ }
    return null;
}

function saveWords(words) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(words));
}

const ToneWordEditor = () => {
    const [words, setWords] = useState(() => loadWords() || []);
    const [filterTone, setFilterTone] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [hasChanges, setHasChanges] = useState(false);
    const [saved, setSaved] = useState(false);
    const fileInputRef = useRef(null);

    const filtered = words
        .map((w, idx) => ({ ...w, _idx: idx }))
        .filter(w => filterTone === 'All' || w.tone === filterTone)
        .filter(w => {
            if (!searchQuery) return true;
            const q = searchQuery.toLowerCase();
            return w.word.toLowerCase().includes(q) || (w.meaning || '').toLowerCase().includes(q);
        });

    const update = (next) => { setWords(next); setHasChanges(true); };

    const updateWord = (idx, field, value) => {
        const next = [...words];
        next[idx] = { ...next[idx], [field]: value };
        update(next);
    };

    const addWord = () => {
        update([...words, { word: '', tone: 'ngang', meaning: '' }]);
    };

    const deleteWord = (idx) => {
        update(words.filter((_, i) => i !== idx));
    };

    const handleSave = () => {
        saveWords(words);
        setHasChanges(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const downloadJson = () => {
        const blob = new Blob([JSON.stringify(words, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'tone_words.json'; a.click();
        URL.revokeObjectURL(url);
    };

    const handleImport = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const data = JSON.parse(ev.target.result);
                const arr = Array.isArray(data) ? data : data.words || [];
                if (arr.length) { update(arr); alert(`Imported ${arr.length} words.`); }
                else alert('No words found.');
            } catch { alert('Failed to parse JSON.'); }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    const toneCounts = {};
    words.forEach(w => { toneCounts[w.tone] = (toneCounts[w.tone] || 0) + 1; });

    const s = {
        input: { padding: '8px 12px', borderRadius: 6, backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: 14, boxSizing: 'border-box' },
        select: { padding: '8px 12px', borderRadius: 8, backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: 14 },
        searchBox: { flex: 1, padding: '8px 12px', borderRadius: 8, backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: 14 },
        iconBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-muted)', display: 'flex', alignItems: 'center' },
        toneBadge: (tone) => ({
            fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, minWidth: 50, textAlign: 'center',
            backgroundColor: `${TONE_COLORS[tone] || '#666'}22`, color: TONE_COLORS[tone] || '#666',
        }),
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 28, margin: 0, marginBottom: 4 }}>Tone Practice Words</h1>
                    <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                        {words.length} words — {TONE_IDS.map(t => `${t}: ${toneCounts[t] || 0}`).join(', ')}
                        {hasChanges && <span style={{ color: 'var(--primary-color)', marginLeft: 8 }}>• Unsaved changes</span>}
                    </span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
                    <button className="ghost" onClick={() => fileInputRef.current.click()} style={{ fontSize: 14 }}><Upload size={16} /> Import</button>
                    <button className="ghost" onClick={downloadJson} style={{ fontSize: 14 }}><Download size={16} /> Export</button>
                    <button className="primary" onClick={handleSave} disabled={!hasChanges && !saved} style={{ fontSize: 14, minWidth: 120 }}>
                        {saved ? <><Check size={16} /> Saved!</> : <><Save size={16} /> Save</>}
                    </button>
                </div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1, maxWidth: 300 }}>
                    <Search size={14} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--text-muted)' }} />
                    <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search word or meaning..." style={{ ...s.searchBox, paddingLeft: 30, width: '100%' }} />
                </div>
                <select value={filterTone} onChange={e => setFilterTone(e.target.value)} style={s.select}>
                    <option value="All">All Tones</option>
                    {TONE_IDS.map(t => <option key={t} value={t}>{TONE_LABELS[t]}</option>)}
                </select>
                <button className="ghost" onClick={addWord} style={{ fontSize: 14 }}><Plus size={16} /> Add Word</button>
            </div>

            {/* Table-style list */}
            <div style={{ backgroundColor: 'var(--surface-color)', borderRadius: 12, border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 2fr 40px', padding: '10px 16px', borderBottom: '1px solid var(--border-color)', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    <span>Tone</span><span>Word</span><span>Meaning</span><span />
                </div>
                <div style={{ maxHeight: 'calc(100vh - 240px)', overflowY: 'auto' }}>
                    {filtered.map(w => (
                        <div key={w._idx} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 2fr 40px', padding: '8px 16px', borderBottom: '1px solid var(--border-color)', alignItems: 'center', gap: 8 }}>
                            <select value={w.tone} onChange={e => updateWord(w._idx, 'tone', e.target.value)} style={{ ...s.input, padding: '4px 6px', fontSize: 12 }}>
                                {TONE_IDS.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                            <input type="text" value={w.word} onChange={e => updateWord(w._idx, 'word', e.target.value)} style={{ ...s.input, padding: '6px 10px' }} placeholder="e.g. ba" />
                            <input type="text" value={w.meaning || ''} onChange={e => updateWord(w._idx, 'meaning', e.target.value)} style={{ ...s.input, padding: '6px 10px' }} placeholder="three / father" />
                            <button style={s.iconBtn} onClick={() => deleteWord(w._idx)}><Trash2 size={14} /></button>
                        </div>
                    ))}
                    {filtered.length === 0 && (
                        <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
                            {words.length === 0 ? 'No words yet. Click "Add Word" or import a JSON file.' : 'No words match your filter.'}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ToneWordEditor;
