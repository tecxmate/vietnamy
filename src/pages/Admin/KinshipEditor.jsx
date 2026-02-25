import React, { useState, useRef } from 'react';
import { Save, Plus, Trash2, Download, Upload, Check } from 'lucide-react';

const GENDERS = ['male', 'female', 'neutral'];
const GENERATIONS = [2, 1, 0, -1, -2];
const GEN_LABELS = { 2: 'Grandparents', 1: 'Parents', 0: 'Same Gen', '-1': 'Children', '-2': 'Grandchildren' };

const STORAGE_KEY = 'vnme_cms_kinship';

function loadData() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw);
    } catch { /* fall through */ }
    return null;
}

function saveData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

const KinshipEditor = () => {
    const [data, setData] = useState(() => loadData() || { members: [], pronounMap: {} });
    const [hasChanges, setHasChanges] = useState(false);
    const [saved, setSaved] = useState(false);
    const [activeTab, setActiveTab] = useState('members');
    const [newRelKey, setNewRelKey] = useState('');
    const [newRelVal, setNewRelVal] = useState('');
    const fileInputRef = useRef(null);

    const members = data.members || [];
    const pronounMap = data.pronounMap || {};

    const update = (next) => { setData(next); setHasChanges(true); };

    const updateMember = (idx, field, value) => {
        const next = [...members];
        next[idx] = { ...next[idx], [field]: value };
        update({ ...data, members: next });
    };

    const addMember = () => {
        update({ ...data, members: [...members, { id: `m_${Date.now()}`, label: '', relationType: '', gender: 'male', generation: 0, ageOffset: 0 }] });
    };

    const deleteMember = (idx) => {
        update({ ...data, members: members.filter((_, i) => i !== idx) });
    };

    const updatePronoun = (key, value) => {
        update({ ...data, pronounMap: { ...pronounMap, [key]: value } });
    };

    const deletePronoun = (key) => {
        const next = { ...pronounMap };
        delete next[key];
        update({ ...data, pronounMap: next });
    };

    const addPronoun = () => {
        if (!newRelKey.trim()) return;
        update({ ...data, pronounMap: { ...pronounMap, [newRelKey.trim()]: newRelVal.trim() } });
        setNewRelKey('');
        setNewRelVal('');
    };

    const handleSave = () => {
        saveData(data);
        setHasChanges(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const downloadJson = () => {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'kinship_data.json'; a.click();
        URL.revokeObjectURL(url);
    };

    const handleImport = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const d = JSON.parse(ev.target.result);
                if (d.members || d.pronounMap) {
                    update(d);
                    alert(`Imported ${d.members?.length || 0} members and ${Object.keys(d.pronounMap || {}).length} pronoun mappings.`);
                } else alert('Invalid format: expected { members, pronounMap }');
            } catch { alert('Failed to parse JSON.'); }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    const s = {
        input: { padding: '8px 12px', borderRadius: 6, backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: 14, boxSizing: 'border-box' },
        iconBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-muted)', display: 'flex', alignItems: 'center' },
        tab: (active) => ({
            padding: '10px 20px', cursor: 'pointer', fontWeight: 700, fontSize: 14, borderRadius: '8px 8px 0 0',
            backgroundColor: active ? 'var(--surface-color)' : 'transparent',
            color: active ? 'var(--primary-color)' : 'var(--text-muted)',
            border: active ? '1px solid var(--border-color)' : '1px solid transparent',
            borderBottom: active ? '1px solid var(--surface-color)' : '1px solid var(--border-color)',
        }),
    };

    // Group members by generation
    const membersByGen = {};
    members.forEach((m, idx) => {
        const g = m.generation || 0;
        if (!membersByGen[g]) membersByGen[g] = [];
        membersByGen[g].push({ ...m, _idx: idx });
    });

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 28, margin: 0, marginBottom: 4 }}>Kinship & Pronouns</h1>
                    <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                        {members.length} members · {Object.keys(pronounMap).length} pronoun mappings
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

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border-color)', marginBottom: 20 }}>
                <div style={s.tab(activeTab === 'members')} onClick={() => setActiveTab('members')}>Family Members</div>
                <div style={s.tab(activeTab === 'pronouns')} onClick={() => setActiveTab('pronouns')}>Pronoun Map</div>
            </div>

            {activeTab === 'members' && (
                <div>
                    <button className="ghost" onClick={addMember} style={{ fontSize: 14, marginBottom: 16 }}><Plus size={16} /> Add Member</button>

                    {GENERATIONS.map(gen => {
                        const group = membersByGen[gen];
                        if (!group || group.length === 0) return null;
                        return (
                            <div key={gen} style={{ marginBottom: 20 }}>
                                <h3 style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                                    {GEN_LABELS[gen] || `Generation ${gen}`}
                                </h3>
                                <div style={{ backgroundColor: 'var(--surface-color)', borderRadius: 12, border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '50px 1fr 1fr 90px 70px 70px 40px', padding: '8px 16px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', borderBottom: '1px solid var(--border-color)' }}>
                                        <span>ID</span><span>Label</span><span>Relation Type</span><span>Gender</span><span>Gen</span><span>Age Δ</span><span />
                                    </div>
                                    {group.map(m => (
                                        <div key={m._idx} style={{ display: 'grid', gridTemplateColumns: '50px 1fr 1fr 90px 70px 70px 40px', padding: '6px 16px', borderBottom: '1px solid var(--border-color)', alignItems: 'center', gap: 6 }}>
                                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{m.id.slice(0, 4)}</span>
                                            <input type="text" value={m.label} onChange={e => updateMember(m._idx, 'label', e.target.value)} style={{ ...s.input, padding: '4px 8px', fontSize: 13 }} />
                                            <input type="text" value={m.relationType} onChange={e => updateMember(m._idx, 'relationType', e.target.value)} style={{ ...s.input, padding: '4px 8px', fontSize: 13 }} />
                                            <select value={m.gender} onChange={e => updateMember(m._idx, 'gender', e.target.value)} style={{ ...s.input, padding: '4px 6px', fontSize: 12 }}>
                                                {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                                            </select>
                                            <input type="number" value={m.generation} onChange={e => updateMember(m._idx, 'generation', parseInt(e.target.value) || 0)} style={{ ...s.input, padding: '4px 8px', fontSize: 13 }} />
                                            <input type="number" value={m.ageOffset} onChange={e => updateMember(m._idx, 'ageOffset', parseInt(e.target.value) || 0)} style={{ ...s.input, padding: '4px 8px', fontSize: 13 }} />
                                            <button style={s.iconBtn} onClick={() => deleteMember(m._idx)}><Trash2 size={14} /></button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}

                    {members.length === 0 && (
                        <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', border: '2px dashed var(--border-color)', borderRadius: 12 }}>
                            No members. Click "Add Member" or import a JSON file.
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'pronouns' && (
                <div>
                    <div style={{ backgroundColor: 'var(--surface-color)', borderRadius: 12, border: '1px solid var(--border-color)', overflow: 'hidden', marginBottom: 16 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 40px', padding: '10px 16px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', borderBottom: '1px solid var(--border-color)' }}>
                            <span>Relation Key</span><span>Vietnamese Pronoun</span><span />
                        </div>
                        {Object.entries(pronounMap).map(([key, val]) => (
                            <div key={key} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 40px', padding: '6px 16px', borderBottom: '1px solid var(--border-color)', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontSize: 14, fontFamily: 'monospace', color: 'var(--text-muted)' }}>{key}</span>
                                <input type="text" value={val} onChange={e => updatePronoun(key, e.target.value)} style={{ ...s.input, padding: '4px 8px', fontSize: 14 }} />
                                <button style={s.iconBtn} onClick={() => deletePronoun(key)}><Trash2 size={14} /></button>
                            </div>
                        ))}
                        {Object.keys(pronounMap).length === 0 && (
                            <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>No pronoun mappings.</div>
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <input type="text" value={newRelKey} onChange={e => setNewRelKey(e.target.value)} placeholder="relation_key" style={{ ...s.input, flex: 1 }} />
                        <input type="text" value={newRelVal} onChange={e => setNewRelVal(e.target.value)} placeholder="Vietnamese pronoun" style={{ ...s.input, flex: 1 }} />
                        <button className="ghost" onClick={addPronoun} style={{ fontSize: 14 }}><Plus size={16} /> Add</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default KinshipEditor;
