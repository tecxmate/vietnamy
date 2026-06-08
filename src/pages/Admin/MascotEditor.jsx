import React, { useState, useRef } from 'react';
import {
    Save, Check, Plus, Trash2, Sparkles, Download, Upload,
    RotateCcw, Play, Zap, Lock, Image as ImageIcon,
} from 'lucide-react';
import {
    getMascotData, saveMascotData, resetMascotData, getLine,
    EXPRESSIONS, getMascotAssets, setMascotAsset, removeMascotAsset,
} from '../../lib/mascot';
import BeKhe from '../../components/BeKhe/BeKhe';

// Uploaded art guards (data-URLs live in localStorage — keep them lean).
const ASSET_WARN_BYTES = 512 * 1024;   // warn past 512 KB
const ASSET_MAX_BYTES = 2 * 1024 * 1024; // hard cap 2 MB

// Which tiers actually speak at each chattiness level (mirrors mascot.js TIER_ALLOWED).
const TIER_ALLOWED = {
    minimal: { core: true, flavor: false, ambient: false },
    normal: { core: true, flavor: true, ambient: false },
    chatty: { core: true, flavor: true, ambient: true },
};

const CHATTINESS = ['minimal', 'normal', 'chatty'];

const TIER_COLORS = {
    core: 'var(--primary-color)',
    flavor: 'var(--success-color)',
    ambient: 'var(--text-muted)',
};

const newPoolLine = () => ({ id: 'l' + Date.now().toString(36), enabled: true, weight: 1, text: { en: '', zh: '' } });

const downloadJson = (data, filename) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
};

const MascotEditor = () => {
    const [data, setData] = useState(() => getMascotData());
    const [activeLang, setActiveLang] = useState('en'); // 'en' | 'zh'
    const [selectedId, setSelectedId] = useState(() => Object.keys(getMascotData().categories || {})[0] || null);
    const [hasChanges, setHasChanges] = useState(false);
    const [saved, setSaved] = useState(false);
    const [preview, setPreview] = useState(null); // { text } | { silent:true } | null
    const [assets, setAssets] = useState(() => getMascotAssets());
    const importInputRef = useRef(null);
    const artInputRef = useRef(null);
    const [uploadTarget, setUploadTarget] = useState(null); // expression awaiting a file

    const update = (next) => { setData(next); setHasChanges(true); };

    const categories = data.categories || {};
    const categoryIds = Object.keys(categories);
    const selected = selectedId ? categories[selectedId] : null;

    // --- config edits ---
    const setConfig = (field, value) => update({ ...data, config: { ...data.config, [field]: value } });

    // --- category edits ---
    const setCategory = (id, patch) => update({
        ...data,
        categories: { ...categories, [id]: { ...categories[id], ...patch } },
    });

    // --- line edits ---
    const setLines = (id, lines) => setCategory(id, { lines });
    const updateLine = (id, idx, patch) => {
        const lines = [...(categories[id].lines || [])];
        lines[idx] = { ...lines[idx], ...patch };
        setLines(id, lines);
    };
    const updateLineText = (id, idx, lang, value) => {
        const lines = [...(categories[id].lines || [])];
        lines[idx] = { ...lines[idx], text: { ...lines[idx].text, [lang]: value } };
        setLines(id, lines);
    };
    const addLine = (id) => {
        const cat = categories[id];
        const blank = cat.kind === 'slots'
            ? { id: 'l' + Date.now().toString(36), key: '', enabled: true, text: { en: '', zh: '' } }
            : newPoolLine();
        setLines(id, [...(cat.lines || []), blank]);
    };
    const deleteLine = (id, idx) => setLines(id, (categories[id].lines || []).filter((_, i) => i !== idx));

    const handleSave = () => {
        saveMascotData(data);
        setHasChanges(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const handleReset = () => {
        if (!confirm('Reset all mascot scripts to the bundled default? This discards every CMS edit and cannot be undone.')) return;
        resetMascotData();
        const fresh = getMascotData();
        setData(fresh);
        setSelectedId(Object.keys(fresh.categories || {})[0] || null);
        setHasChanges(false);
        setPreview(null);
    };

    // --- custom artwork (saved immediately to its own key, not via Save button) ---
    const handleArtFile = (expression, file) => {
        if (!file) return;
        const isSvg = file.type === 'image/svg+xml' || /\.svg$/i.test(file.name);
        const isGif = file.type === 'image/gif' || /\.gif$/i.test(file.name);
        if (!isSvg && !isGif) { alert('Please choose an SVG or GIF file.'); return; }
        if (file.size > ASSET_MAX_BYTES) {
            alert(`That file is ${(file.size / 1024 / 1024).toFixed(1)} MB — too large (max 2 MB). Uploads are stored in the browser; please optimize it first.`);
            return;
        }
        if (file.size > ASSET_WARN_BYTES && !confirm(`That file is ${Math.round(file.size / 1024)} KB. Large art can fill the browser's storage. Upload anyway?`)) return;
        const reader = new FileReader();
        reader.onload = () => {
            try {
                setMascotAsset(expression, { type: isSvg ? 'svg' : 'gif', dataUrl: String(reader.result), name: file.name });
                setAssets(getMascotAssets());
            } catch {
                alert("Couldn't save — the browser's storage is full. Remove some art or use a smaller file.");
            }
        };
        reader.onerror = () => alert('Could not read that file.');
        reader.readAsDataURL(file);
    };
    const handleRemoveArt = (expression) => {
        removeMascotAsset(expression);
        setAssets(getMascotAssets());
    };

    const handleExport = () => downloadJson(data, 'mascot.json');

    const handleImport = async (file) => {
        if (!file) return;
        try {
            const parsed = JSON.parse(await file.text());
            if (!parsed || !parsed.categories) throw new Error('Not a mascot scripts file (missing "categories").');
            update(parsed);
            setSelectedId(Object.keys(parsed.categories)[0] || null);
            setPreview(null);
        } catch (err) {
            alert(`Import failed: ${err.message || err}`);
        }
    };

    const handleRoll = () => {
        if (!selectedId) return;
        // getLine reads the persisted blob, so save current edits first — the preview
        // then faithfully reflects exactly what's on screen.
        saveMascotData(data);
        setHasChanges(false);
        // For slots categories a slot is required, else getLine always returns null
        // and the preview looks broken — roll against the first enabled slot's key.
        const cat = data.categories?.[selectedId];
        const slot = cat?.kind === 'slots'
            ? (cat.lines || []).find((l) => l.enabled !== false)?.key ?? null
            : null;
        const r = getLine(selectedId, { lang: activeLang === 'zh' ? 'zh-t' : 'en', slot });
        setPreview(r ? { text: r.text } : { silent: true });
    };

    // styles
    const inputStyle = { width: '100%', padding: '8px 12px', borderRadius: 6, backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', color: 'var(--text-main)', boxSizing: 'border-box' };
    const segWrap = { display: 'inline-flex', border: '1px solid var(--border-color)', borderRadius: 8, overflow: 'hidden' };
    const segBtn = (active) => ({
        padding: '6px 12px', fontSize: 13, cursor: 'pointer', border: 'none',
        background: active ? 'var(--primary-color)' : 'transparent',
        color: active ? '#fff' : 'var(--text-muted)', fontWeight: active ? 600 : 400,
    });
    const tierBadge = (tier) => ({
        fontSize: 11, padding: '1px 8px', borderRadius: 10,
        border: `1px solid ${TIER_COLORS[tier] || 'var(--border-color)'}`,
        color: TIER_COLORS[tier] || 'var(--text-muted)',
    });

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h1 style={{ fontSize: 32, margin: 0, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Sparkles size={28} color="var(--primary-color)" /> Mascot Scripts
                    </h1>
                    <span style={{ color: 'var(--text-muted)' }}>
                        Bé Khế's lines for every learning beat. Same load → edit → save pattern as the other editors.
                    </span>
                </div>
                <button className="primary" onClick={handleSave} style={{ minWidth: 160 }} disabled={!hasChanges && !saved}>
                    {saved ? <><Check size={20} /> Saved!</> : <><Save size={20} /> Save</>}
                </button>
            </div>

            {/* Global config bar */}
            <div className="glass-panel" style={{ position: 'sticky', top: 0, zIndex: 5, marginBottom: 16 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 20 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 500 }}>
                        <input type="checkbox" checked={!!data.config?.enabled} onChange={(e) => setConfig('enabled', e.target.checked)} style={{ width: 18, height: 18 }} />
                        Bé Khế enabled
                    </label>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Chattiness</span>
                        <div style={segWrap}>
                            {CHATTINESS.map((c) => (
                                <button key={c} style={segBtn(data.config?.chattiness === c)} onClick={() => setConfig('chattiness', c)}>
                                    {c[0].toUpperCase() + c.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Repeat window</span>
                        <input
                            type="number" min={0}
                            value={data.config?.avoidRepeatWindow ?? 3}
                            onChange={(e) => setConfig('avoidRepeatWindow', Number(e.target.value))}
                            style={{ ...inputStyle, width: 64 }}
                        />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
                        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Lang</span>
                        <div style={segWrap}>
                            <button style={segBtn(activeLang === 'en')} onClick={() => setActiveLang('en')}>EN</button>
                            <button style={segBtn(activeLang === 'zh')} onClick={() => setActiveLang('zh')} title="Chinese (Traditional) — Simplified is auto-derived">中 (繁)</button>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button className="ghost" onClick={handleExport} style={{ fontSize: 13 }}><Download size={16} /> Export</button>
                        <button className="ghost" onClick={() => importInputRef.current?.click()} style={{ fontSize: 13 }}><Upload size={16} /> Import</button>
                        <input
                            ref={importInputRef} type="file" accept="application/json,.json" style={{ display: 'none' }}
                            onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; handleImport(f); }}
                        />
                        <button className="ghost" onClick={handleReset} style={{ fontSize: 13, color: 'var(--danger-color)' }}><RotateCcw size={16} /> Reset to default</button>
                    </div>
                </div>
            </div>

            {/* Two-pane: category list + lines */}
            <div style={{ display: 'grid', gridTemplateColumns: '240px minmax(0, 1fr)', gap: 16, alignItems: 'start' }}>
                {/* Category list */}
                <div className="glass-panel" style={{ padding: 8 }}>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '6px 8px 8px' }}>Categories</p>
                    {categoryIds.map((id) => {
                        const cat = categories[id];
                        const isActive = id === selectedId;
                        const suppressed = !TIER_ALLOWED[data.config?.chattiness]?.[cat.tier];
                        return (
                            <div
                                key={id}
                                onClick={() => { setSelectedId(id); setPreview(null); }}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
                                    background: isActive ? 'var(--surface-color-light)' : 'transparent',
                                    opacity: suppressed ? 0.55 : 1,
                                }}
                            >
                                <input
                                    type="checkbox" checked={cat.enabled !== false}
                                    onClick={(e) => e.stopPropagation()}
                                    onChange={(e) => setCategory(id, { enabled: e.target.checked })}
                                    style={{ width: 15, height: 15, flexShrink: 0 }}
                                    aria-label={`${cat.label} enabled`}
                                />
                                <span style={{ flex: 1, fontSize: 13, fontWeight: isActive ? 600 : 400, color: isActive ? 'var(--primary-color)' : 'var(--text-main)' }}>{cat.label}</span>
                                <span style={tierBadge(cat.tier)}>{cat.tier}</span>
                            </div>
                        );
                    })}
                    {categoryIds.length === 0 && (
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 10, fontStyle: 'italic' }}>No categories.</p>
                    )}
                    {data.config?.chattiness !== 'chatty' && (
                        <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '8px 10px 4px' }}>
                            Dimmed tiers are suppressed at "{data.config?.chattiness}".
                        </p>
                    )}
                </div>

                {/* Lines panel */}
                <div className="glass-panel">
                    {!selected && <p style={{ color: 'var(--text-muted)' }}>Select a category.</p>}
                    {selected && (
                        <>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                                <div>
                                    <span style={{ fontSize: 16, fontWeight: 600 }}>{selected.label}</span>
                                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}> &nbsp;{selected.kind} · {selected.tier}</span>
                                </div>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-muted)', cursor: 'pointer' }}>
                                    category
                                    <input
                                        type="checkbox" checked={selected.enabled !== false}
                                        onChange={(e) => setCategory(selectedId, { enabled: e.target.checked })}
                                        style={{ width: 16, height: 16 }}
                                    />
                                </label>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '8px 0 14px', fontSize: 12, color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Zap size={14} /> fires on {selected.trigger}</span>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, borderLeft: '1px solid var(--border-color)', paddingLeft: 14 }}>
                                    <BeKhe expression={selected.fx?.expression ?? 'idle'} asset={assets[selected.fx?.expression] ?? null} size={28} />
                                    expression
                                    <select
                                        value={selected.fx?.expression ?? 'idle'}
                                        onChange={(e) => setCategory(selectedId, { fx: { ...selected.fx, expression: e.target.value } })}
                                        style={{ padding: '3px 6px', borderRadius: 6, background: 'var(--surface-color)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}
                                    >
                                        {EXPRESSIONS.map((ex) => <option key={ex} value={ex}>{ex}</option>)}
                                    </select>
                                </span>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                                    <Lock size={13} /> {selected.fx?.sound ?? '—'} · {selected.fx?.haptic ?? '—'} (locked)
                                </span>
                            </div>

                            {/* Lines */}
                            {(selected.lines || []).map((line, idx) => {
                                const zhMissing = !((line.text?.zh || '').trim());
                                return (
                                    <div key={line.id || idx} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderTop: '1px solid var(--border-color)', opacity: line.enabled === false ? 0.5 : 1 }}>
                                        <input
                                            type="checkbox" checked={line.enabled !== false}
                                            onChange={(e) => updateLine(selectedId, idx, { enabled: e.target.checked })}
                                            style={{ width: 16, height: 16, flexShrink: 0 }}
                                            aria-label="line enabled"
                                        />
                                        {selected.kind === 'pool' ? (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                                                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>wt</span>
                                                <input
                                                    type="number" min={0} value={line.weight ?? 1}
                                                    onChange={(e) => updateLine(selectedId, idx, { weight: Number(e.target.value) })}
                                                    style={{ ...inputStyle, width: 56, padding: '4px 6px' }}
                                                />
                                            </div>
                                        ) : (
                                            <input
                                                type="text" value={line.key || ''} placeholder="key"
                                                onChange={(e) => updateLine(selectedId, idx, { key: e.target.value })}
                                                style={{ ...inputStyle, width: 120, padding: '4px 8px', flexShrink: 0 }}
                                                aria-label="slot key"
                                            />
                                        )}
                                        <input
                                            type="text"
                                            value={line.text?.[activeLang] || ''}
                                            onChange={(e) => updateLineText(selectedId, idx, activeLang, e.target.value)}
                                            placeholder={activeLang === 'zh' && zhMissing ? 'falls back to EN' : `text (${activeLang})`}
                                            style={{ ...inputStyle, flex: 1, ...(activeLang === 'zh' && zhMissing ? { borderColor: 'var(--primary-color)', color: 'var(--text-muted)', fontStyle: 'italic' } : null) }}
                                        />
                                        <button className="ghost" onClick={() => deleteLine(selectedId, idx)} style={{ color: 'var(--danger-color)', flexShrink: 0 }} title="Delete line">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                );
                            })}

                            <button className="ghost" onClick={() => addLine(selectedId)} style={{ marginTop: 10, fontSize: 13 }}>
                                <Plus size={15} /> Add line
                            </button>

                            {/* Preview */}
                            <div style={{ background: 'var(--surface-color)', borderRadius: 8, padding: '10px 12px', marginTop: 16, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                                <button className="secondary" onClick={handleRoll} style={{ fontSize: 13 }}><Play size={15} /> Roll a line</button>
                                <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>
                                    {preview == null ? '→ saves your edits, then rolls a line' : preview.silent ? '→ (silent — suppressed by current toggles/chattiness)' : `→ "${preview.text}"`}
                                </span>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Expression artwork */}
            <div className="glass-panel" style={{ marginTop: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <ImageIcon size={18} color="var(--primary-color)" />
                    <span style={{ fontSize: 16, fontWeight: 600 }}>Expression artwork</span>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '6px 0 14px' }}>
                    Upload custom SVG or GIF art per state — it overrides the built-in face everywhere that expression fires. Each category picks which state it uses via the <em>expression</em> dropdown above. Saved instantly; leave empty to keep the built-in Bé Khế. (Max 2 MB; SVG preferred — uploads live in the browser.)
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 12 }}>
                    {EXPRESSIONS.map((ex) => {
                        const a = assets[ex];
                        return (
                            <div key={ex} style={{ border: '1px solid var(--border-color)', borderRadius: 10, padding: 10, textAlign: 'center' }}>
                                <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <BeKhe expression={ex} asset={a ?? null} size={56} />
                                </div>
                                <div style={{ fontSize: 13, fontWeight: 500, margin: '6px 0 2px' }}>{ex}</div>
                                <div style={{ fontSize: 11, color: a ? 'var(--success-color)' : 'var(--text-muted)', marginBottom: 8 }}>
                                    {a ? `custom ${a.type.toUpperCase()}` : 'built-in'}
                                </div>
                                <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                                    <button className="ghost" style={{ fontSize: 12 }} onClick={() => { setUploadTarget(ex); artInputRef.current?.click(); }}>
                                        <Upload size={13} /> {a ? 'Replace' : 'Upload'}
                                    </button>
                                    {a && (
                                        <button className="ghost" style={{ fontSize: 12, color: 'var(--danger-color)' }} onClick={() => handleRemoveArt(ex)} title="Remove custom art">
                                            <Trash2 size={13} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
                <input
                    ref={artInputRef} type="file" accept="image/svg+xml,image/gif,.svg,.gif" style={{ display: 'none' }}
                    onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (uploadTarget) handleArtFile(uploadTarget, f); setUploadTarget(null); }}
                />
            </div>
        </div>
    );
};

export default MascotEditor;
