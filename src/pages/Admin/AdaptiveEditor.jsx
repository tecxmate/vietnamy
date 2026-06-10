import React, { useMemo, useState } from 'react';
import { Save, Check, RotateCcw, Download, Sparkles, Activity } from 'lucide-react';
import curriculum from '../../../content/curriculum.json';
import { getPurposeOverrides, savePurposeOverrides, PURPOSE_IDS } from '../../lib/recommendations';
import { getEngagementEvents } from '../../lib/engagement';

// Admin: tune per-lesson purpose weights (the sequencer's purposeMatch signal —
// generated weights are coarse binary) + inspect/export Layer-5 engagement data.
// Overrides persist in localStorage (vnme_cms_purpose_weights), id-keyed like the
// other CMS editors, and overlay the generated adaptive.purposes at read time.

const PURPOSE_LABELS = { explore_vietnam: 'Explore', professional: 'Work', heritage: 'Heritage' };

function EngagementPanel() {
    const events = useMemo(() => getEngagementEvents(), []);
    const stats = useMemo(() => {
        const byKind = {};
        const respByType = {};
        const quitByLesson = {};
        for (const e of events) {
            byKind[e.kind] = (byKind[e.kind] || 0) + 1;
            if (e.kind === 'exercise' && Number.isFinite(e.responseMs)) {
                (respByType[e.exerciseType] = respByType[e.exerciseType] || []).push(e.responseMs);
            }
            if (e.kind === 'lesson_quit') quitByLesson[e.lessonId] = (quitByLesson[e.lessonId] || 0) + 1;
        }
        const avgResp = Object.entries(respByType).map(([type, arr]) => ({
            type, n: arr.length, avgMs: Math.round(arr.reduce((a, b) => a + b, 0) / arr.length),
        })).sort((a, b) => b.n - a.n);
        const quits = Object.entries(quitByLesson).sort((a, b) => b[1] - a[1]).slice(0, 8);
        return { byKind, avgResp, quits };
    }, [events]);

    const download = () => {
        const blob = new Blob([JSON.stringify(events, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `vnme_engagement_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(a.href);
    };

    return (
        <div className="glass-panel" style={{ padding: 20, marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h2 style={{ margin: 0, fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}><Activity size={18} /> Engagement (Layer 5, capture-only)</h2>
                <button className="secondary" onClick={download} disabled={!events.length} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                    <Download size={14} /> Export JSON ({events.length})
                </button>
            </div>
            {!events.length ? (
                <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>No events captured on this device yet. Events accumulate as lessons are played (responses, quits, completes).</p>
            ) : (
                <div style={{ fontSize: 13 }}>
                    <p style={{ margin: '0 0 10px', color: 'var(--text-muted)' }}>
                        {Object.entries(stats.byKind).map(([k, n]) => `${k}: ${n}`).join(' · ')}
                    </p>
                    {stats.avgResp.length > 0 && (
                        <table style={{ borderCollapse: 'collapse', marginBottom: 10 }}>
                            <tbody>
                                <tr style={{ color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase' }}>
                                    <td style={{ paddingRight: 16 }}>Exercise type</td><td style={{ paddingRight: 16 }}>n</td><td>avg response</td>
                                </tr>
                                {stats.avgResp.map(r => (
                                    <tr key={r.type}><td style={{ paddingRight: 16 }}>{r.type}</td><td style={{ paddingRight: 16 }}>{r.n}</td><td>{(r.avgMs / 1000).toFixed(1)}s</td></tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                    {stats.quits.length > 0 && (
                        <p style={{ margin: 0, color: 'var(--text-muted)' }}>Most-quit: {stats.quits.map(([id, n]) => `${id} (${n})`).join(', ')}</p>
                    )}
                </div>
            )}
        </div>
    );
}

const AdaptiveEditor = () => {
    const lessons = useMemo(() => (curriculum.lessons || []).map(l => ({
        id: l.id, title: l.title, topic: l.topic, cefr: l.cefrLevel,
        generated: Object.fromEntries((l.adaptive?.purposes || []).map(p => [p.id, p.weight])),
    })), []);
    const [overrides, setOverrides] = useState(() => getPurposeOverrides());
    const [levelFilter, setLevelFilter] = useState('A1');
    const [hasChanges, setHasChanges] = useState(false);
    const [saved, setSaved] = useState(false);

    const levels = useMemo(() => [...new Set(lessons.map(l => l.cefr).filter(Boolean))], [lessons]);
    const shown = lessons.filter(l => l.cefr === levelFilter);

    const valueFor = (lesson, pid) => {
        const o = overrides[lesson.id];
        if (o && o[pid] !== undefined) return o[pid];
        return lesson.generated[pid] ?? 0;
    };
    const setWeight = (lessonId, pid, raw) => {
        const v = Math.max(0, Math.min(1, Number(raw)));
        if (Number.isNaN(v)) return;
        setOverrides(prev => ({ ...prev, [lessonId]: { ...(prev[lessonId] || {}), [pid]: v } }));
        setHasChanges(true); setSaved(false);
    };
    const save = () => { savePurposeOverrides(overrides); setHasChanges(false); setSaved(true); setTimeout(() => setSaved(false), 1800); };
    const resetAll = () => {
        if (!confirm('Discard ALL purpose-weight overrides and restore generated weights?')) return;
        setOverrides({}); savePurposeOverrides({}); setHasChanges(false);
    };

    return (
        <div className="admin-roadmap" style={{ maxWidth: 860 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 28, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}><Sparkles size={24} /> Adaptive Sequencer</h1>
                    <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Per-lesson purpose weights (0–1) for the recommendation scorer · engagement capture</span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button className="secondary" onClick={resetAll} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><RotateCcw size={16} /> Reset all</button>
                    <button className="primary" onClick={save} disabled={!hasChanges} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        {saved ? <><Check size={16} /> Saved</> : <><Save size={16} /> Save</>}
                    </button>
                </div>
            </div>

            <EngagementPanel />

            <div className="glass-panel" style={{ padding: 20 }}>
                <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
                    {levels.map(lv => (
                        <button key={lv} className={levelFilter === lv ? 'primary' : 'secondary'} style={{ padding: '4px 14px', fontSize: 13 }} onClick={() => setLevelFilter(lv)}>{lv}</button>
                    ))}
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                        <tr style={{ color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', textAlign: 'left' }}>
                            <th style={{ padding: '6px 4px' }}>Lesson</th>
                            <th style={{ padding: '6px 4px' }}>Topic</th>
                            {PURPOSE_IDS.map(pid => <th key={pid} style={{ padding: '6px 4px', width: 76 }}>{PURPOSE_LABELS[pid]}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {shown.map(l => (
                            <tr key={l.id} style={{ borderTop: '1px solid var(--border-color)' }}>
                                <td style={{ padding: '6px 4px' }}>
                                    <div style={{ fontWeight: 600 }}>{l.title}</div>
                                    <div style={{ color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: 11 }}>{l.id}{overrides[l.id] ? ' · overridden' : ''}</div>
                                </td>
                                <td style={{ padding: '6px 4px', color: 'var(--text-muted)' }}>{l.topic}</td>
                                {PURPOSE_IDS.map(pid => (
                                    <td key={pid} style={{ padding: '6px 4px' }}>
                                        <input
                                            type="number" min="0" max="1" step="0.1"
                                            value={valueFor(l, pid)}
                                            onChange={(e) => setWeight(l.id, pid, e.target.value)}
                                            style={{ width: 60, padding: '4px 6px', borderRadius: 6, border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-main)', fontFamily: 'inherit' }}
                                        />
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdaptiveEditor;
