import React, { useState, useRef } from 'react';
import { Save, Plus, Trash2, ChevronDown, ChevronRight, Search, ArrowUp, ArrowDown, Download, X, Upload, Check } from 'lucide-react';
import { getGrammarItems, saveGrammarItems, resetGrammarItems } from '../../lib/grammarDB';

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

const emptyExample = () => ({ vi: '', en: '' });
const emptySection = () => ({ heading: '', explanation: '', pattern: null, examples: [emptyExample()], note: null });
const emptyFaq = () => ({ question: '', answer: '' });
const emptyItem = () => ({
    level: 'A1',
    title: '',
    pattern: '',
    example: { vi: '', en: '' },
    sections: [emptySection()],
    faqs: [],
    extracted_patterns: []
});

const GrammarEditor = () => {
    const [items, setItems] = useState(() => JSON.parse(JSON.stringify(getGrammarItems())));
    const [selectedIndex, setSelectedIndex] = useState(null);
    const [filterLevel, setFilterLevel] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedSections, setExpandedSections] = useState({});
    const [newPatternText, setNewPatternText] = useState('');
    const [hasChanges, setHasChanges] = useState(false);
    const [saved, setSaved] = useState(false);
    const fileInputRef = useRef(null);

    // --- Filtering ---
    const filteredItems = items
        .map((item, idx) => ({ ...item, _origIdx: idx }))
        .filter(item => filterLevel === 'All' || item.level === filterLevel)
        .filter(item => {
            if (!searchQuery) return true;
            const q = searchQuery.toLowerCase();
            return item.title.toLowerCase().includes(q) || (item.pattern || '').toLowerCase().includes(q);
        });

    const selected = selectedIndex !== null ? items[selectedIndex] : null;

    // --- Mutation helpers ---
    const updateItems = (next) => {
        setItems(next);
        setHasChanges(true);
    };

    const updateSelected = (field, value) => {
        const next = [...items];
        next[selectedIndex] = { ...next[selectedIndex], [field]: value };
        updateItems(next);
    };

    const updateExample = (field, value) => {
        updateSelected('example', { ...selected.example, [field]: value });
    };

    // --- Section helpers ---
    const updateSection = (secIdx, field, value) => {
        const sections = [...selected.sections];
        sections[secIdx] = { ...sections[secIdx], [field]: value };
        updateSelected('sections', sections);
    };

    const addSection = () => {
        updateSelected('sections', [...selected.sections, emptySection()]);
    };

    const removeSection = (secIdx) => {
        if (!confirm('Delete this section?')) return;
        updateSelected('sections', selected.sections.filter((_, i) => i !== secIdx));
    };

    const moveSection = (secIdx, dir) => {
        const newIdx = secIdx + dir;
        if (newIdx < 0 || newIdx >= selected.sections.length) return;
        const sections = [...selected.sections];
        [sections[secIdx], sections[newIdx]] = [sections[newIdx], sections[secIdx]];
        updateSelected('sections', sections);
    };

    // --- Section example helpers ---
    const updateSectionExample = (secIdx, exIdx, field, value) => {
        const sections = [...selected.sections];
        const examples = [...sections[secIdx].examples];
        examples[exIdx] = { ...examples[exIdx], [field]: value };
        sections[secIdx] = { ...sections[secIdx], examples };
        updateSelected('sections', sections);
    };

    const addSectionExample = (secIdx) => {
        const sections = [...selected.sections];
        sections[secIdx] = { ...sections[secIdx], examples: [...sections[secIdx].examples, emptyExample()] };
        updateSelected('sections', sections);
    };

    const removeSectionExample = (secIdx, exIdx) => {
        const sections = [...selected.sections];
        sections[secIdx] = { ...sections[secIdx], examples: sections[secIdx].examples.filter((_, i) => i !== exIdx) };
        updateSelected('sections', sections);
    };

    // --- FAQ helpers ---
    const updateFaq = (faqIdx, field, value) => {
        const faqs = [...selected.faqs];
        faqs[faqIdx] = { ...faqs[faqIdx], [field]: value };
        updateSelected('faqs', faqs);
    };

    const addFaq = () => {
        updateSelected('faqs', [...(selected.faqs || []), emptyFaq()]);
    };

    const removeFaq = (faqIdx) => {
        updateSelected('faqs', selected.faqs.filter((_, i) => i !== faqIdx));
    };

    // --- Extracted patterns helpers ---
    const addPattern = () => {
        if (!newPatternText.trim()) return;
        updateSelected('extracted_patterns', [...(selected.extracted_patterns || []), newPatternText.trim()]);
        setNewPatternText('');
    };

    const removePattern = (pIdx) => {
        updateSelected('extracted_patterns', selected.extracted_patterns.filter((_, i) => i !== pIdx));
    };

    // --- Item CRUD ---
    const addItem = () => {
        const next = [...items, emptyItem()];
        updateItems(next);
        setSelectedIndex(next.length - 1);
    };

    const deleteItem = (idx) => {
        if (!confirm(`Delete "${items[idx].title || 'Untitled'}"?`)) return;
        const next = items.filter((_, i) => i !== idx);
        updateItems(next);
        if (selectedIndex === idx) setSelectedIndex(null);
        else if (selectedIndex > idx) setSelectedIndex(selectedIndex - 1);
    };

    // --- Toggle section collapse ---
    const toggleSection = (secIdx) => {
        setExpandedSections(prev => ({ ...prev, [secIdx]: !prev[secIdx] }));
    };

    // --- Save to localStorage ---
    const handleSave = () => {
        saveGrammarItems(items);
        setHasChanges(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    // --- Download JSON ---
    const downloadJson = () => {
        const blob = new Blob([JSON.stringify({ items }, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'vn_grammar_bank_v2.json';
        a.click();
        URL.revokeObjectURL(url);
    };

    // --- Import JSON ---
    const handleImport = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const data = JSON.parse(ev.target.result);
                if (data.items && Array.isArray(data.items)) {
                    updateItems(data.items);
                    setSelectedIndex(null);
                    alert(`Imported ${data.items.length} grammar items.`);
                } else {
                    alert('Invalid file: expected { items: [...] }');
                }
            } catch {
                alert('Failed to parse JSON file.');
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    // --- Discard ---
    const discardChanges = () => {
        if (!confirm('Discard all unsaved changes and revert to last saved state?')) return;
        resetGrammarItems();
        setItems(JSON.parse(JSON.stringify(getGrammarItems())));
        setSelectedIndex(null);
        setHasChanges(false);
    };

    // --- Styles ---
    const s = {
        page: { display: 'flex', gap: 24, height: 'calc(100vh - 64px)' },
        sidebar: { width: 340, minWidth: 340, display: 'flex', flexDirection: 'column', gap: 12 },
        sidebarHeader: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' },
        filterRow: { display: 'flex', gap: 8, alignItems: 'center' },
        searchBox: { flex: 1, padding: '8px 12px', borderRadius: 8, backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: 14 },
        levelSelect: { padding: '8px 12px', borderRadius: 8, backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: 14 },
        list: { flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 },
        listItem: (isSelected) => ({
            padding: '10px 12px', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
            backgroundColor: isSelected ? 'rgba(255, 209, 102, 0.15)' : 'var(--surface-color)',
            border: isSelected ? '1px solid var(--primary-color)' : '1px solid var(--border-color)',
            transition: 'all 0.15s'
        }),
        levelBadge: (level) => ({
            fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, minWidth: 28, textAlign: 'center',
            backgroundColor: level === 'A1' ? 'rgba(76, 175, 80, 0.2)' : level === 'A2' ? 'rgba(33, 150, 243, 0.2)' : 'rgba(156, 39, 176, 0.2)',
            color: level === 'A1' ? '#4CAF50' : level === 'A2' ? '#2196F3' : '#9C27B0'
        }),
        editor: { flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 40 },
        panel: { backgroundColor: 'var(--surface-color)', borderRadius: 12, padding: 20, border: '1px solid var(--border-color)' },
        panelTitle: { margin: '0 0 16px 0', fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
        fieldLabel: { display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' },
        input: { width: '100%', padding: '8px 12px', borderRadius: 6, backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: 14, boxSizing: 'border-box' },
        textarea: { width: '100%', padding: '8px 12px', borderRadius: 6, backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: 14, minHeight: 80, resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' },
        grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
        sectionCard: { backgroundColor: 'var(--bg-color)', borderRadius: 8, border: '1px solid var(--border-color)', marginBottom: 8, overflow: 'hidden' },
        sectionHeader: { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', cursor: 'pointer', userSelect: 'none' },
        sectionBody: { padding: '0 12px 12px', display: 'flex', flexDirection: 'column', gap: 12 },
        exampleRow: { display: 'flex', gap: 8, alignItems: 'center' },
        tag: { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 20, backgroundColor: 'rgba(255, 209, 102, 0.1)', color: 'var(--primary-color)', fontSize: 13 },
        iconBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-muted)', display: 'flex', alignItems: 'center' },
        actionBar: { display: 'flex', gap: 12, alignItems: 'center', padding: '12px 0', borderTop: '1px solid var(--border-color)', marginTop: 8 },
        emptyState: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 16 },
    };

    // --- Level counts ---
    const levelCounts = {};
    items.forEach(i => { levelCounts[i.level] = (levelCounts[i.level] || 0) + 1; });

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 28, margin: 0, marginBottom: 4 }}>Grammar Editor</h1>
                    <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                        {items.length} items — {Object.entries(levelCounts).map(([l, c]) => `${l}: ${c}`).join(', ')}
                        {hasChanges && <span style={{ color: 'var(--primary-color)', marginLeft: 8 }}>• Unsaved changes</span>}
                    </span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
                    <button className="ghost" onClick={() => fileInputRef.current.click()} style={{ fontSize: 14 }}>
                        <Upload size={16} /> Import
                    </button>
                    <button className="ghost" onClick={downloadJson} style={{ fontSize: 14 }}>
                        <Download size={16} /> Export
                    </button>
                    <button className="ghost" onClick={discardChanges} disabled={!hasChanges} style={{ fontSize: 14, opacity: hasChanges ? 1 : 0.4 }}>
                        Discard
                    </button>
                    <button className="primary" onClick={handleSave} disabled={!hasChanges && !saved} style={{ fontSize: 14, minWidth: 120 }}>
                        {saved ? <><Check size={16} /> Saved!</> : <><Save size={16} /> Save Changes</>}
                    </button>
                </div>
            </div>

            <div style={s.page}>
                {/* ====== LEFT: Item Browser ====== */}
                <div style={s.sidebar}>
                    <div style={s.filterRow}>
                        <div style={{ position: 'relative', flex: 1 }}>
                            <Search size={14} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search title or pattern..."
                                style={{ ...s.searchBox, paddingLeft: 30 }}
                            />
                        </div>
                        <select value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)} style={s.levelSelect}>
                            <option value="All">All</option>
                            {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                    </div>

                    <button className="ghost" onClick={addItem} style={{ fontSize: 14, justifyContent: 'center', width: '100%', border: '1px dashed var(--border-color)', borderRadius: 8, padding: '10px 0' }}>
                        <Plus size={16} /> Add New Item
                    </button>

                    <div style={s.list}>
                        {filteredItems.map((item) => (
                            <div
                                key={item._origIdx}
                                style={s.listItem(selectedIndex === item._origIdx)}
                                onClick={() => { setSelectedIndex(item._origIdx); setExpandedSections({}); }}
                            >
                                <span style={s.levelBadge(item.level)}>{item.level}</span>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {item.title || '(untitled)'}
                                    </div>
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {item.pattern || '—'}
                                    </div>
                                </div>
                                <button style={s.iconBtn} onClick={(e) => { e.stopPropagation(); deleteItem(item._origIdx); }} title="Delete">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                        {filteredItems.length === 0 && (
                            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 24 }}>No items match filters</div>
                        )}
                    </div>
                </div>

                {/* ====== RIGHT: Editor ====== */}
                {selected ? (
                    <div style={s.editor}>

                        {/* --- Metadata --- */}
                        <div style={s.panel}>
                            <h3 style={s.panelTitle}>Metadata</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr 1fr', gap: 12, marginBottom: 12 }}>
                                <div>
                                    <label style={s.fieldLabel}>Level</label>
                                    <select value={selected.level} onChange={(e) => updateSelected('level', e.target.value)} style={s.input}>
                                        {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={s.fieldLabel}>Title</label>
                                    <input type="text" value={selected.title} onChange={(e) => updateSelected('title', e.target.value)} style={s.input} />
                                </div>
                                <div>
                                    <label style={s.fieldLabel}>Pattern</label>
                                    <input type="text" value={selected.pattern || ''} onChange={(e) => updateSelected('pattern', e.target.value)} style={s.input} />
                                </div>
                            </div>
                            <div style={s.grid2}>
                                <div>
                                    <label style={s.fieldLabel}>Example (Vietnamese)</label>
                                    <input type="text" value={selected.example?.vi || ''} onChange={(e) => updateExample('vi', e.target.value)} style={s.input} />
                                </div>
                                <div>
                                    <label style={s.fieldLabel}>Example (English)</label>
                                    <input type="text" value={selected.example?.en || ''} onChange={(e) => updateExample('en', e.target.value)} style={s.input} />
                                </div>
                            </div>
                        </div>

                        {/* --- Sections --- */}
                        <div style={s.panel}>
                            <h3 style={s.panelTitle}>
                                Sections ({selected.sections?.length || 0})
                                <button className="ghost" onClick={addSection} style={{ fontSize: 13 }}><Plus size={14} /> Add Section</button>
                            </h3>

                            {(selected.sections || []).map((sec, secIdx) => {
                                const isExpanded = expandedSections[secIdx] !== false;
                                return (
                                    <div key={secIdx} style={s.sectionCard}>
                                        <div style={s.sectionHeader} onClick={() => toggleSection(secIdx)}>
                                            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                            <span style={{ flex: 1, fontWeight: 600, fontSize: 14 }}>
                                                {sec.heading || `Section ${secIdx + 1}`}
                                            </span>
                                            <span style={{ fontSize: 12, color: 'var(--text-muted)', marginRight: 8 }}>
                                                {sec.examples?.length || 0} examples
                                            </span>
                                            <button style={s.iconBtn} onClick={(e) => { e.stopPropagation(); moveSection(secIdx, -1); }} title="Move up"><ArrowUp size={14} /></button>
                                            <button style={s.iconBtn} onClick={(e) => { e.stopPropagation(); moveSection(secIdx, 1); }} title="Move down"><ArrowDown size={14} /></button>
                                            <button style={s.iconBtn} onClick={(e) => { e.stopPropagation(); removeSection(secIdx); }} title="Delete section"><Trash2 size={14} /></button>
                                        </div>

                                        {isExpanded && (
                                            <div style={s.sectionBody}>
                                                <div>
                                                    <label style={s.fieldLabel}>Heading</label>
                                                    <input type="text" value={sec.heading || ''} onChange={(e) => updateSection(secIdx, 'heading', e.target.value)} style={s.input} />
                                                </div>
                                                <div>
                                                    <label style={s.fieldLabel}>Explanation</label>
                                                    <textarea value={sec.explanation || ''} onChange={(e) => updateSection(secIdx, 'explanation', e.target.value)} style={s.textarea} />
                                                </div>
                                                <div style={s.grid2}>
                                                    <div>
                                                        <label style={s.fieldLabel}>Pattern</label>
                                                        <input type="text" value={sec.pattern || ''} onChange={(e) => updateSection(secIdx, 'pattern', e.target.value || null)} style={s.input} />
                                                    </div>
                                                    <div>
                                                        <label style={s.fieldLabel}>Note</label>
                                                        <input type="text" value={sec.note || ''} onChange={(e) => updateSection(secIdx, 'note', e.target.value || null)} style={s.input} />
                                                    </div>
                                                </div>

                                                {/* Section Examples */}
                                                <div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                                        <label style={{ ...s.fieldLabel, marginBottom: 0 }}>Examples</label>
                                                        <button style={{ ...s.iconBtn, fontSize: 12, color: 'var(--primary-color)' }} onClick={() => addSectionExample(secIdx)}>
                                                            <Plus size={14} /> Add
                                                        </button>
                                                    </div>
                                                    {(sec.examples || []).map((ex, exIdx) => (
                                                        <div key={exIdx} style={{ ...s.exampleRow, marginBottom: 6 }}>
                                                            <span style={{ fontSize: 12, color: 'var(--text-muted)', minWidth: 20 }}>{exIdx + 1}.</span>
                                                            <input
                                                                type="text" placeholder="Vietnamese"
                                                                value={ex.vi || ''}
                                                                onChange={(e) => updateSectionExample(secIdx, exIdx, 'vi', e.target.value)}
                                                                style={{ ...s.input, flex: 1 }}
                                                            />
                                                            <input
                                                                type="text" placeholder="English"
                                                                value={ex.en || ''}
                                                                onChange={(e) => updateSectionExample(secIdx, exIdx, 'en', e.target.value)}
                                                                style={{ ...s.input, flex: 1 }}
                                                            />
                                                            <button style={s.iconBtn} onClick={() => removeSectionExample(secIdx, exIdx)}><X size={14} /></button>
                                                        </div>
                                                    ))}
                                                    {(!sec.examples || sec.examples.length === 0) && (
                                                        <div style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>No examples</div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            {(!selected.sections || selected.sections.length === 0) && (
                                <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)', border: '2px dashed var(--border-color)', borderRadius: 8 }}>
                                    No sections. Click "Add Section" to start.
                                </div>
                            )}
                        </div>

                        {/* --- FAQs --- */}
                        <div style={s.panel}>
                            <h3 style={s.panelTitle}>
                                FAQs ({selected.faqs?.length || 0})
                                <button className="ghost" onClick={addFaq} style={{ fontSize: 13 }}><Plus size={14} /> Add FAQ</button>
                            </h3>

                            {(selected.faqs || []).map((faq, faqIdx) => (
                                <div key={faqIdx} style={{ marginBottom: 12, padding: 12, backgroundColor: 'var(--bg-color)', borderRadius: 8, border: '1px solid var(--border-color)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>Q{faqIdx + 1}</span>
                                        <input
                                            type="text" placeholder="Question"
                                            value={faq.question || ''}
                                            onChange={(e) => updateFaq(faqIdx, 'question', e.target.value)}
                                            style={{ ...s.input, flex: 1 }}
                                        />
                                        <button style={s.iconBtn} onClick={() => removeFaq(faqIdx)}><Trash2 size={14} /></button>
                                    </div>
                                    <textarea
                                        placeholder="Answer"
                                        value={faq.answer || ''}
                                        onChange={(e) => updateFaq(faqIdx, 'answer', e.target.value)}
                                        style={{ ...s.textarea, minHeight: 50 }}
                                    />
                                </div>
                            ))}

                            {(!selected.faqs || selected.faqs.length === 0) && (
                                <div style={{ textAlign: 'center', padding: 16, color: 'var(--text-muted)', fontStyle: 'italic' }}>No FAQs</div>
                            )}
                        </div>

                        {/* --- Extracted Patterns --- */}
                        <div style={s.panel}>
                            <h3 style={s.panelTitle}>Extracted Patterns</h3>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                                {(selected.extracted_patterns || []).map((p, pIdx) => (
                                    <span key={pIdx} style={s.tag}>
                                        {p}
                                        <button style={{ ...s.iconBtn, padding: 0, marginLeft: 2 }} onClick={() => removePattern(pIdx)}><X size={12} /></button>
                                    </span>
                                ))}
                                {(!selected.extracted_patterns || selected.extracted_patterns.length === 0) && (
                                    <span style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>None</span>
                                )}
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <input
                                    type="text" placeholder="Add pattern, e.g. Subject + Verb"
                                    value={newPatternText}
                                    onChange={(e) => setNewPatternText(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') addPattern(); }}
                                    style={{ ...s.input, flex: 1 }}
                                />
                                <button className="ghost" onClick={addPattern} style={{ fontSize: 13 }}><Plus size={14} /></button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div style={s.emptyState}>
                        Select a grammar item from the list to edit
                    </div>
                )}
            </div>
        </div>
    );
};

export default GrammarEditor;
