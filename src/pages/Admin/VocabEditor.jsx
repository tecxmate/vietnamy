import React, { useState, useRef } from 'react';
import { Save, Plus, Trash2, Search, Download, Upload, Check, X } from 'lucide-react';

const CATEGORIES = ['food', 'animals', 'objects', 'nature', 'people'];
const STORAGE_KEY = 'vnme_cms_vocab';

function loadVocab() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw);
    } catch { /* fall through */ }
    return null;
}

function saveVocab(words) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(words));
}

const emptyWord = () => ({
    id: Date.now(),
    vietnamese: '', english: '', emoji: '',
    category: 'food', example: '', image: '',
});

const VocabEditor = () => {
    const [words, setWords] = useState(() => loadVocab() || []);
    const [selectedIndex, setSelectedIndex] = useState(null);
    const [filterCategory, setFilterCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [hasChanges, setHasChanges] = useState(false);
    const [saved, setSaved] = useState(false);
    const fileInputRef = useRef(null);

    const filtered = words
        .map((w, idx) => ({ ...w, _idx: idx }))
        .filter(w => filterCategory === 'All' || w.category === filterCategory)
        .filter(w => {
            if (!searchQuery) return true;
            const q = searchQuery.toLowerCase();
            return w.vietnamese.toLowerCase().includes(q) || w.english.toLowerCase().includes(q);
        });

    const selected = selectedIndex !== null ? words[selectedIndex] : null;
    const update = (next) => { setWords(next); setHasChanges(true); };

    const updateField = (field, value) => {
        const next = [...words];
        next[selectedIndex] = { ...next[selectedIndex], [field]: value };
        update(next);
    };

    const addWord = () => {
        const next = [...words, emptyWord()];
        update(next);
        setSelectedIndex(next.length - 1);
    };

    const deleteWord = (idx) => {
        if (!confirm(`Delete "${words[idx].vietnamese || 'Untitled'}"?`)) return;
        const next = words.filter((_, i) => i !== idx);
        update(next);
        if (selectedIndex === idx) setSelectedIndex(null);
        else if (selectedIndex > idx) setSelectedIndex(selectedIndex - 1);
    };

    const handleSave = () => {
        saveVocab(words);
        setHasChanges(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const downloadJson = () => {
        const blob = new Blob([JSON.stringify(words, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'vocab_words.json'; a.click();
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
                if (arr.length) { update(arr); setSelectedIndex(null); alert(`Imported ${arr.length} words.`); }
                else alert('No words found.');
            } catch { alert('Failed to parse JSON.'); }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    const s = {
        page: { display: 'flex', gap: 24, height: 'calc(100vh - 64px)' },
        sidebar: { width: 340, minWidth: 340, display: 'flex', flexDirection: 'column', gap: 12 },
        filterRow: { display: 'flex', gap: 8, alignItems: 'center' },
        searchBox: { flex: 1, padding: '8px 12px', borderRadius: 8, backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: 14 },
        select: { padding: '8px 12px', borderRadius: 8, backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: 14 },
        list: { flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 },
        listItem: (sel) => ({
            padding: '10px 12px', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
            backgroundColor: sel ? 'rgba(255, 209, 102, 0.15)' : 'var(--surface-color)',
            border: sel ? '1px solid var(--primary-color)' : '1px solid var(--border-color)',
        }),
        editor: { flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 40 },
        panel: { backgroundColor: 'var(--surface-color)', borderRadius: 12, padding: 20, border: '1px solid var(--border-color)' },
        panelTitle: { margin: '0 0 16px 0', fontSize: 16, fontWeight: 700 },
        fieldLabel: { display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' },
        input: { width: '100%', padding: '8px 12px', borderRadius: 6, backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: 14, boxSizing: 'border-box' },
        grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
        grid3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 },
        iconBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-muted)', display: 'flex', alignItems: 'center' },
        emptyState: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 16 },
    };

    const catCounts = {};
    words.forEach(w => { catCounts[w.category] = (catCounts[w.category] || 0) + 1; });

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 28, margin: 0, marginBottom: 4 }}>Vocabulary Editor</h1>
                    <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                        {words.length} words — {Object.entries(catCounts).map(([c, n]) => `${c}: ${n}`).join(', ')}
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

            <div style={s.page}>
                <div style={s.sidebar}>
                    <div style={s.filterRow}>
                        <div style={{ position: 'relative', flex: 1 }}>
                            <Search size={14} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--text-muted)' }} />
                            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search..." style={{ ...s.searchBox, paddingLeft: 30 }} />
                        </div>
                        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} style={s.select}>
                            <option value="All">All</option>
                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>

                    <button className="ghost" onClick={addWord} style={{ fontSize: 14, justifyContent: 'center', width: '100%', border: '1px dashed var(--border-color)', borderRadius: 8, padding: '10px 0' }}>
                        <Plus size={16} /> Add Word
                    </button>

                    <div style={s.list}>
                        {filtered.map(w => (
                            <div key={w._idx} style={s.listItem(selectedIndex === w._idx)} onClick={() => setSelectedIndex(w._idx)}>
                                <span style={{ fontSize: 20, width: 28, textAlign: 'center' }}>{w.emoji || '📝'}</span>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {w.vietnamese || '(empty)'}
                                    </div>
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{w.english}</div>
                                </div>
                                <button style={s.iconBtn} onClick={e => { e.stopPropagation(); deleteWord(w._idx); }}><Trash2 size={14} /></button>
                            </div>
                        ))}
                        {filtered.length === 0 && <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 24 }}>No words</div>}
                    </div>
                </div>

                {selected ? (
                    <div style={s.editor}>
                        <div style={s.panel}>
                            <h3 style={s.panelTitle}>Word Details</h3>
                            <div style={s.grid2}>
                                <div>
                                    <label style={s.fieldLabel}>Vietnamese</label>
                                    <input type="text" value={selected.vietnamese} onChange={e => updateField('vietnamese', e.target.value)} style={s.input} />
                                </div>
                                <div>
                                    <label style={s.fieldLabel}>English</label>
                                    <input type="text" value={selected.english} onChange={e => updateField('english', e.target.value)} style={s.input} />
                                </div>
                            </div>
                            <div style={{ ...s.grid3, marginTop: 12 }}>
                                <div>
                                    <label style={s.fieldLabel}>Category</label>
                                    <select value={selected.category} onChange={e => updateField('category', e.target.value)} style={s.input}>
                                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={s.fieldLabel}>Emoji</label>
                                    <input type="text" value={selected.emoji || ''} onChange={e => updateField('emoji', e.target.value)} style={s.input} placeholder="🍜" />
                                </div>
                                <div>
                                    <label style={s.fieldLabel}>ID</label>
                                    <input type="text" value={selected.id} disabled style={{ ...s.input, opacity: 0.5 }} />
                                </div>
                            </div>
                            <div style={{ marginTop: 12 }}>
                                <label style={s.fieldLabel}>Example Sentence</label>
                                <input type="text" value={selected.example || ''} onChange={e => updateField('example', e.target.value)} style={s.input} placeholder="Cho tôi một bát phở." />
                            </div>
                            <div style={{ marginTop: 12 }}>
                                <label style={s.fieldLabel}>Image URL</label>
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                    <input type="text" value={selected.image || ''} onChange={e => updateField('image', e.target.value)} style={{ ...s.input, flex: 1 }} placeholder="https://..." />
                                    {selected.image && <img src={selected.image} alt="" style={{ width: 48, height: 32, objectFit: 'cover', borderRadius: 4, border: '1px solid var(--border-color)' }} />}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div style={s.emptyState}>Select a word from the list to edit</div>
                )}
            </div>
        </div>
    );
};

export default VocabEditor;
