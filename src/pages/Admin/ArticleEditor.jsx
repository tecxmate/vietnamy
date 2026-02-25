import React, { useState, useRef } from 'react';
import { Save, Plus, Trash2, ChevronDown, ChevronRight, Search, ArrowUp, ArrowDown, Download, Upload, Check, X, Image } from 'lucide-react';

const CATEGORIES = ['culture', 'food', 'travel', 'daily-life', 'history', 'business'];
const LEVELS = ['beginner', 'intermediate', 'advanced'];
const STORAGE_KEY = 'vnme_cms_articles';

// Load from localStorage or fall back to hardcoded defaults
function loadArticles() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw);
    } catch { /* fall through */ }
    return null; // will show empty state until import
}

function saveArticles(articles) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(articles));
}

const emptySentence = () => ({ vi: '', en: '', zh: '' });
const emptyArticle = () => ({
    id: `art_${Date.now()}`,
    title_vi: '', title_en: '', title_zh: '',
    category: 'culture', level: 'beginner',
    image: '', readingTimeMins: 2,
    sentences: [emptySentence()],
});

const ArticleEditor = () => {
    const [articles, setArticles] = useState(() => loadArticles() || []);
    const [selectedIndex, setSelectedIndex] = useState(null);
    const [filterCategory, setFilterCategory] = useState('All');
    const [filterLevel, setFilterLevel] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [hasChanges, setHasChanges] = useState(false);
    const [saved, setSaved] = useState(false);
    const fileInputRef = useRef(null);

    const filteredArticles = articles
        .map((a, idx) => ({ ...a, _idx: idx }))
        .filter(a => filterCategory === 'All' || a.category === filterCategory)
        .filter(a => filterLevel === 'All' || a.level === filterLevel)
        .filter(a => {
            if (!searchQuery) return true;
            const q = searchQuery.toLowerCase();
            return a.title_en.toLowerCase().includes(q) || a.title_vi.toLowerCase().includes(q);
        });

    const selected = selectedIndex !== null ? articles[selectedIndex] : null;

    const update = (next) => { setArticles(next); setHasChanges(true); };

    const updateField = (field, value) => {
        const next = [...articles];
        next[selectedIndex] = { ...next[selectedIndex], [field]: value };
        update(next);
    };

    const updateSentence = (sIdx, field, value) => {
        const sentences = [...selected.sentences];
        sentences[sIdx] = { ...sentences[sIdx], [field]: value };
        updateField('sentences', sentences);
    };

    const addSentence = () => updateField('sentences', [...selected.sentences, emptySentence()]);

    const removeSentence = (sIdx) => {
        updateField('sentences', selected.sentences.filter((_, i) => i !== sIdx));
    };

    const moveSentence = (sIdx, dir) => {
        const newIdx = sIdx + dir;
        if (newIdx < 0 || newIdx >= selected.sentences.length) return;
        const sentences = [...selected.sentences];
        [sentences[sIdx], sentences[newIdx]] = [sentences[newIdx], sentences[sIdx]];
        updateField('sentences', sentences);
    };

    const addArticle = () => {
        const next = [...articles, emptyArticle()];
        update(next);
        setSelectedIndex(next.length - 1);
    };

    const deleteArticle = (idx) => {
        if (!confirm(`Delete "${articles[idx].title_en || 'Untitled'}"?`)) return;
        const next = articles.filter((_, i) => i !== idx);
        update(next);
        if (selectedIndex === idx) setSelectedIndex(null);
        else if (selectedIndex > idx) setSelectedIndex(selectedIndex - 1);
    };

    const handleSave = () => {
        saveArticles(articles);
        setHasChanges(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const downloadJson = () => {
        const blob = new Blob([JSON.stringify(articles, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'articles.json'; a.click();
        URL.revokeObjectURL(url);
    };

    const handleImport = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const data = JSON.parse(ev.target.result);
                const arr = Array.isArray(data) ? data : data.articles || [];
                if (arr.length) {
                    update(arr);
                    setSelectedIndex(null);
                    alert(`Imported ${arr.length} articles.`);
                } else alert('No articles found in file.');
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
        panelTitle: { margin: '0 0 16px 0', fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
        fieldLabel: { display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' },
        input: { width: '100%', padding: '8px 12px', borderRadius: 6, backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: 14, boxSizing: 'border-box' },
        textarea: { width: '100%', padding: '8px 12px', borderRadius: 6, backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: 14, minHeight: 60, resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' },
        grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
        grid3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 },
        iconBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-muted)', display: 'flex', alignItems: 'center' },
        badge: (cat) => ({
            fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, textTransform: 'uppercase',
            backgroundColor: cat === 'business' ? 'rgba(255, 209, 102, 0.2)' : cat === 'food' ? 'rgba(255, 152, 0, 0.2)' : 'rgba(33, 150, 243, 0.2)',
            color: cat === 'business' ? '#FFD166' : cat === 'food' ? '#FF9800' : '#2196F3',
        }),
        emptyState: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 16 },
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 28, margin: 0, marginBottom: 4 }}>Article Editor</h1>
                    <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                        {articles.length} articles
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
                {/* Sidebar */}
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

                    <button className="ghost" onClick={addArticle} style={{ fontSize: 14, justifyContent: 'center', width: '100%', border: '1px dashed var(--border-color)', borderRadius: 8, padding: '10px 0' }}>
                        <Plus size={16} /> Add Article
                    </button>

                    <div style={s.list}>
                        {filteredArticles.map(a => (
                            <div key={a._idx} style={s.listItem(selectedIndex === a._idx)} onClick={() => setSelectedIndex(a._idx)}>
                                <span style={s.badge(a.category)}>{a.category}</span>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {a.title_en || '(untitled)'}
                                    </div>
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{a.level} · {a.sentences?.length || 0} sentences</div>
                                </div>
                                <button style={s.iconBtn} onClick={e => { e.stopPropagation(); deleteArticle(a._idx); }}><Trash2 size={14} /></button>
                            </div>
                        ))}
                        {filteredArticles.length === 0 && <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 24 }}>No articles</div>}
                    </div>
                </div>

                {/* Editor */}
                {selected ? (
                    <div style={s.editor}>
                        <div style={s.panel}>
                            <h3 style={s.panelTitle}>Article Metadata</h3>
                            <div style={s.grid3}>
                                <div>
                                    <label style={s.fieldLabel}>Title (English)</label>
                                    <input type="text" value={selected.title_en} onChange={e => updateField('title_en', e.target.value)} style={s.input} />
                                </div>
                                <div>
                                    <label style={s.fieldLabel}>Title (Vietnamese)</label>
                                    <input type="text" value={selected.title_vi} onChange={e => updateField('title_vi', e.target.value)} style={s.input} />
                                </div>
                                <div>
                                    <label style={s.fieldLabel}>Title (Chinese)</label>
                                    <input type="text" value={selected.title_zh || ''} onChange={e => updateField('title_zh', e.target.value)} style={s.input} />
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
                                    <label style={s.fieldLabel}>Level</label>
                                    <select value={selected.level} onChange={e => updateField('level', e.target.value)} style={s.input}>
                                        {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={s.fieldLabel}>Reading Time (min)</label>
                                    <input type="number" min={1} value={selected.readingTimeMins} onChange={e => updateField('readingTimeMins', parseInt(e.target.value) || 1)} style={s.input} />
                                </div>
                            </div>
                            <div style={{ marginTop: 12 }}>
                                <label style={s.fieldLabel}>Image URL</label>
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                    <input type="text" value={selected.image || ''} onChange={e => updateField('image', e.target.value)} style={{ ...s.input, flex: 1 }} placeholder="https://..." />
                                    {selected.image && (
                                        <img src={selected.image} alt="" style={{ width: 48, height: 32, objectFit: 'cover', borderRadius: 4, border: '1px solid var(--border-color)' }} />
                                    )}
                                </div>
                            </div>
                        </div>

                        <div style={s.panel}>
                            <h3 style={s.panelTitle}>
                                Sentences ({selected.sentences?.length || 0})
                                <button className="ghost" onClick={addSentence} style={{ fontSize: 13 }}><Plus size={14} /> Add Sentence</button>
                            </h3>

                            {(selected.sentences || []).map((sent, sIdx) => (
                                <div key={sIdx} style={{ marginBottom: 12, padding: 12, backgroundColor: 'var(--bg-color)', borderRadius: 8, border: '1px solid var(--border-color)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', minWidth: 24 }}>#{sIdx + 1}</span>
                                        <div style={{ flex: 1 }} />
                                        <button style={s.iconBtn} onClick={() => moveSentence(sIdx, -1)} title="Move up"><ArrowUp size={14} /></button>
                                        <button style={s.iconBtn} onClick={() => moveSentence(sIdx, 1)} title="Move down"><ArrowDown size={14} /></button>
                                        <button style={s.iconBtn} onClick={() => removeSentence(sIdx)} title="Remove"><Trash2 size={14} /></button>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                        <input type="text" placeholder="Vietnamese" value={sent.vi} onChange={e => updateSentence(sIdx, 'vi', e.target.value)} style={s.input} />
                                        <input type="text" placeholder="English" value={sent.en} onChange={e => updateSentence(sIdx, 'en', e.target.value)} style={s.input} />
                                        <input type="text" placeholder="Chinese (optional)" value={sent.zh || ''} onChange={e => updateSentence(sIdx, 'zh', e.target.value)} style={s.input} />
                                    </div>
                                </div>
                            ))}

                            {(!selected.sentences || selected.sentences.length === 0) && (
                                <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)', border: '2px dashed var(--border-color)', borderRadius: 8 }}>
                                    No sentences. Click "Add Sentence" to start.
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div style={s.emptyState}>Select an article from the list to edit</div>
                )}
            </div>
        </div>
    );
};

export default ArticleEditor;
