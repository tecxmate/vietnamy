import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Play, ArrowUp, ArrowDown, RotateCcw, Download, Upload } from 'lucide-react';
import { getCurriculum, getCoverage, getAvailableBases, loadBase, isBaseLoaded } from '../../data/curricula';
import {
    hasOverrides,
    resetMode,
    exportMode,
    importMode,
    moveUnit,
    moveLesson,
} from '../../data/curricula/overrides';
import CurriculumLessonPlayer from './CurriculumLessonPlayer';

const MODES = [
    { id: 'explore_vietnam', label: 'Explore Vietnam (a1+a2+b1_tourist)' },
    { id: 'professional',    label: 'Professional (a1+a2+b1_manager)' },
    { id: 'heritage',        label: 'Heritage (a1+a2+b1_heritage)' },
    { id: 'placement',       label: 'Placement Test' },
];

const BASE_LABELS = {
    en: 'English',
    zh: '繁中 (Taiwan)',
    zh_cn: '简中 (Mainland)',
    ja: '日本語',
    ko: '한국어',
};

const TYPE_COLORS = {
    Phonetics:  '#A78BFA',
    Vocabulary: '#1CB0F6',
    Grammar:    '#F59E0B',
    Scene:      '#10B981',
    Quiz:       '#F26B5A',
    Placement:  '#6B7280',
};

const Card = ({ children, style }) => (
    <div style={{ background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: 16, ...style }}>{children}</div>
);

const Pill = ({ children, color = 'var(--text-muted)', bg = 'rgba(0,0,0,0.05)' }) => (
    <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 999, background: bg, color, whiteSpace: 'nowrap' }}>{children}</span>
);

export default function CurriculumPreview() {
    const [mode, setMode] = useState('explore_vietnam');
    const [base, setBase] = useState('en');
    const [selectedLessonId, setSelectedLessonId] = useState(null);
    const [filterType, setFilterType] = useState('');
    const [search, setSearch] = useState('');
    const [playing, setPlaying] = useState(null);
    const [flagOn, setFlagOn] = useState(() => {
        try { return localStorage.getItem('vnme_use_study_import') === '1'; } catch { return false; }
    });
    const [baseLoading, setBaseLoading] = useState(false);
    const [overridesNonce, setOverridesNonce] = useState(0); // bumps to re-read after mutations
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (base === 'en' || isBaseLoaded(base)) return;
        setBaseLoading(true);
        loadBase(base).finally(() => setBaseLoading(false));
    }, [base]);

    const toggleFlag = () => {
        const next = !flagOn;
        try {
            localStorage.setItem('vnme_use_study_import', next ? '1' : '0');
            localStorage.removeItem('vnme_mock_db_v24_cv');
        } catch { /* ignore */ }
        setFlagOn(next);
        if (typeof window !== 'undefined') window.location.reload();
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const curriculum = useMemo(() => getCurriculum(mode, base), [mode, base, overridesNonce]);
    const coverage = useMemo(() => getCoverage(), []);
    const availableBases = useMemo(() => getAvailableBases(), []);
    const isModified = useMemo(() => hasOverrides(mode), [mode, overridesNonce]);

    const filterActive = !!(filterType || search);

    // Group lessons by their (now display-order) unit_index for the editable view.
    const grouped = useMemo(() => {
        const map = new Map();
        for (const l of curriculum.lessons) {
            const arr = map.get(l.unit_index) || [];
            arr.push(l);
            map.set(l.unit_index, arr);
        }
        return curriculum.units.map(u => ({ unit: u, lessons: map.get(u.index) || [] }));
    }, [curriculum]);

    const filteredFlatLessons = useMemo(() => {
        let l = curriculum.lessons;
        if (filterType) l = l.filter(x => x.lesson_type === filterType);
        if (search) {
            const q = search.toLowerCase();
            l = l.filter(x =>
                x.lesson_title.toLowerCase().includes(q) ||
                x.unit_title.toLowerCase().includes(q) ||
                x.words.some(w => w.vi.toLowerCase().includes(q)) ||
                x.sentences.some(s => s.vi.toLowerCase().includes(q))
            );
        }
        return l;
    }, [curriculum, filterType, search]);

    const selected = useMemo(
        () => curriculum.lessons.find(l => l.id === selectedLessonId) || null,
        [curriculum, selectedLessonId]
    );

    const trCoverage = useMemo(() => {
        const tracks = curriculum.meta.tracks || [];
        let total = 0, covered = 0;
        for (const t of tracks) {
            const ltCov = coverage?.[t.meta?.track ? `${t.meta.level}_${t.meta.track}` : '']?.by_base?.[base];
            if (ltCov) {
                total += ltCov.lessons || 0;
                covered += ltCov.matched_authoritative || 0;
            }
        }
        return { total, covered };
    }, [curriculum, coverage, base]);

    const stats = curriculum.meta.stats;

    const onMoveUnit = (uid, direction) => {
        moveUnit(mode, curriculum.units.map(u => u._uid), uid, direction);
        setOverridesNonce(n => n + 1);
    };
    const onMoveLesson = (unitUid, currentIds, lessonId, direction) => {
        moveLesson(mode, unitUid, currentIds, lessonId, direction);
        setOverridesNonce(n => n + 1);
    };
    const onReset = () => {
        if (!isModified) return;
        if (!confirm(`Reset all reordering for "${MODES.find(m => m.id === mode)?.label}"?`)) return;
        resetMode(mode);
        setOverridesNonce(n => n + 1);
    };
    const onExport = () => {
        const payload = exportMode(mode);
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `vnme-curriculum-${mode}-${new Date().toISOString().slice(0,10)}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    };
    const onImportClick = () => fileInputRef.current?.click();
    const onImportFile = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        try {
            const text = await file.text();
            const payload = JSON.parse(text);
            importMode(mode, payload);
            setOverridesNonce(n => n + 1);
        } catch (err) {
            alert(`Import failed: ${err.message || err}`);
        }
    };

    return (
        <div style={{ flex: 1, padding: 24, overflow: 'auto', display: 'grid', gridTemplateRows: 'auto auto 1fr', gap: 16, maxHeight: '100vh' }}>
            {/* Header */}
            <Card>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                    <h1 style={{ margin: 0, fontSize: 22 }}>
                        Study Curriculum Editor{' '}
                        <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--text-muted)' }}>
                            study_import schema · {curriculum.meta.generated?.slice(0,10)}
                        </span>
                        {isModified && <span style={{ marginLeft: 10 }}><Pill color="#F59E0B" bg="rgba(245,158,11,0.15)">MODIFIED</Pill></span>}
                    </h1>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button onClick={onReset} disabled={!isModified} title="Reset all reordering for this mode" style={toolbarBtn(!isModified)}>
                            <RotateCcw size={14} /> Reset
                        </button>
                        <button onClick={onExport} title="Download overrides JSON for backup or sharing" style={toolbarBtn(false)}>
                            <Download size={14} /> Export
                        </button>
                        <button onClick={onImportClick} title="Load overrides JSON from a file" style={toolbarBtn(false)}>
                            <Upload size={14} /> Import
                        </button>
                        <input ref={fileInputRef} type="file" accept="application/json,.json" style={{ display: 'none' }} onChange={onImportFile} />
                        <button
                            onClick={toggleFlag}
                            title={flagOn ? 'Turn off — main app reverts to legacy unified_db.json' : 'Turn on — main app loads study_import lessons into the roadmap'}
                            style={{
                                padding: '8px 14px',
                                borderRadius: 8,
                                border: '2px solid ' + (flagOn ? '#10B981' : 'var(--border-color)'),
                                background: flagOn ? 'rgba(16,185,129,0.12)' : 'transparent',
                                color: flagOn ? '#10B981' : 'var(--text-muted)',
                                fontWeight: 700, fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap',
                            }}
                        >
                            {flagOn ? '✓ STUDY_IMPORT LIVE' : '○ Use legacy lessons'}
                        </button>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Mode</span>
                        <select value={mode} onChange={e => { setMode(e.target.value); setSelectedLessonId(null); }} style={selectStyle}>
                            {MODES.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
                        </select>
                    </label>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Base language</span>
                        <select value={base} onChange={e => setBase(e.target.value)} style={selectStyle}>
                            {availableBases.map(b => <option key={b} value={b}>{BASE_LABELS[b] || b}</option>)}
                        </select>
                    </label>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Filter type</span>
                        <select value={filterType} onChange={e => setFilterType(e.target.value)} style={selectStyle}>
                            <option value="">All types</option>
                            {['Phonetics','Vocabulary','Grammar','Scene','Quiz','Placement'].map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </label>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 200 }}>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Search vi / title</span>
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="xin chào, greetings…" style={selectStyle} />
                    </label>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                    <Pill color="#1CB0F6" bg="rgba(28,176,246,0.1)">{stats.units} units</Pill>
                    <Pill color="#10B981" bg="rgba(16,185,129,0.1)">{stats.lessons} lessons</Pill>
                    <Pill color="#A78BFA" bg="rgba(167,139,250,0.1)">{stats.words} words</Pill>
                    <Pill color="#F59E0B" bg="rgba(245,158,11,0.1)">{stats.sentences} sentences</Pill>
                    <Pill color="#F26B5A" bg="rgba(242,107,90,0.1)">{stats.matches} match-pairs</Pill>
                    {baseLoading && <Pill color="#A78BFA" bg="rgba(167,139,250,0.15)">Loading {base.toUpperCase()} chunk…</Pill>}
                    {!baseLoading && base !== 'en' && trCoverage.total > 0 && (
                        <Pill color={trCoverage.covered === trCoverage.total ? '#10B981' : '#F59E0B'} bg={trCoverage.covered === trCoverage.total ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.15)'}>
                            {base.toUpperCase()} coverage: {trCoverage.covered}/{trCoverage.total} ({Math.round(trCoverage.covered / trCoverage.total * 100)}%) — gaps fall back to EN
                        </Pill>
                    )}
                    {filterActive && <Pill color="#F26B5A" bg="rgba(242,107,90,0.15)">Reordering disabled while filter/search is active</Pill>}
                </div>
            </Card>

            {/* Two-pane: lesson list + detail */}
            <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: 16, minHeight: 0 }}>
                <Card style={{ overflow: 'auto', padding: 0 }}>
                    {filterActive ? (
                        <FlatList lessons={filteredFlatLessons} selectedId={selectedLessonId} onSelect={setSelectedLessonId} />
                    ) : (
                        <GroupedList
                            grouped={grouped}
                            selectedId={selectedLessonId}
                            onSelect={setSelectedLessonId}
                            onMoveUnit={onMoveUnit}
                            onMoveLesson={onMoveLesson}
                        />
                    )}
                </Card>

                <Card style={{ overflow: 'auto' }}>
                    {!selected && (
                        <div style={{ color: 'var(--text-muted)', fontSize: 14, textAlign: 'center', padding: 40 }}>
                            Select a lesson on the left to inspect its content.
                        </div>
                    )}
                    {selected && <LessonDetail lesson={selected} base={base} onPlay={() => setPlaying(selected)} />}
                </Card>
            </div>

            {playing && <CurriculumLessonPlayer lesson={playing} onClose={() => setPlaying(null)} />}
        </div>
    );
}

function GroupedList({ grouped, selectedId, onSelect, onMoveUnit, onMoveLesson }) {
    if (grouped.length === 0) {
        return <div style={{ padding: 16, color: 'var(--text-muted)', fontSize: 13 }}>No units.</div>;
    }
    const lastUnitIdx = grouped.length - 1;
    return (
        <div>
            {grouped.map(({ unit, lessons }, ui) => {
                const lessonIds = lessons.map(l => l.id);
                const lastLessonIdx = lessons.length - 1;
                return (
                    <div key={unit._uid}>
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '10px 12px',
                            background: 'rgba(0,0,0,0.04)',
                            borderTop: ui === 0 ? 'none' : '1px solid var(--border-color)',
                            borderBottom: '1px solid var(--border-color)',
                            position: 'sticky', top: 0, zIndex: 1,
                        }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                    Unit {ui + 1} · {unit.track}
                                </div>
                                <div style={{ fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {unit.title}
                                </div>
                            </div>
                            <ReorderBtn disabled={ui === 0} onClick={() => onMoveUnit(unit._uid, 'up')} dir="up" label="Move unit up" />
                            <ReorderBtn disabled={ui === lastUnitIdx} onClick={() => onMoveUnit(unit._uid, 'down')} dir="down" label="Move unit down" />
                        </div>
                        {lessons.length === 0 && (
                            <div style={{ padding: '8px 14px', color: 'var(--text-muted)', fontSize: 12 }}>(empty unit)</div>
                        )}
                        {lessons.map((l, li) => {
                            const isSel = l.id === selectedId;
                            return (
                                <div key={l.id} style={{
                                    display: 'flex', alignItems: 'stretch',
                                    borderBottom: '1px solid var(--border-color)',
                                    background: isSel ? 'rgba(242,107,90,0.1)' : 'transparent',
                                }}>
                                    <button
                                        onClick={() => onSelect(l.id)}
                                        style={{
                                            flex: 1, textAlign: 'left', border: 'none', background: 'transparent',
                                            padding: '10px 12px', cursor: 'pointer',
                                            display: 'flex', flexDirection: 'column', gap: 4,
                                            color: isSel ? 'var(--primary-color)' : 'var(--text-main)',
                                        }}
                                    >
                                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                            <Pill color={TYPE_COLORS[l.lesson_type]} bg={`${TYPE_COLORS[l.lesson_type]}22`}>{l.lesson_type}</Pill>
                                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{l.node_id}</span>
                                        </div>
                                        <div style={{ fontSize: 14, fontWeight: 600 }}>{l.lesson_title}</div>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                            {l.words.length}w / {l.sentences.length}s / {l.matches.length}m · {l.xp_reward} XP
                                        </div>
                                    </button>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '8px 8px', justifyContent: 'center' }}>
                                        <ReorderBtn disabled={li === 0} onClick={() => onMoveLesson(unit._uid, lessonIds, l.id, 'up')} dir="up" label="Move lesson up" small />
                                        <ReorderBtn disabled={li === lastLessonIdx} onClick={() => onMoveLesson(unit._uid, lessonIds, l.id, 'down')} dir="down" label="Move lesson down" small />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                );
            })}
        </div>
    );
}

function FlatList({ lessons, selectedId, onSelect }) {
    if (lessons.length === 0) {
        return <div style={{ padding: 16, color: 'var(--text-muted)', fontSize: 13 }}>No lessons match.</div>;
    }
    return lessons.map(l => {
        const isSel = l.id === selectedId;
        return (
            <button
                key={l.id}
                onClick={() => onSelect(l.id)}
                style={{
                    width: '100%', textAlign: 'left', border: 'none', borderBottom: '1px solid var(--border-color)',
                    padding: '10px 14px', background: isSel ? 'rgba(242,107,90,0.1)' : 'transparent',
                    cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 4,
                    color: isSel ? 'var(--primary-color)' : 'var(--text-main)',
                }}
            >
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <Pill color={TYPE_COLORS[l.lesson_type]} bg={`${TYPE_COLORS[l.lesson_type]}22`}>{l.lesson_type}</Pill>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{l.node_id}</span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{l.lesson_title}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {l.unit_title} · {l.words.length}w / {l.sentences.length}s / {l.matches.length}m · {l.xp_reward} XP
                </div>
            </button>
        );
    });
}

function ReorderBtn({ disabled, onClick, dir, label, small = false }) {
    const size = small ? 14 : 16;
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            title={label}
            aria-label={label}
            style={{
                background: disabled ? 'transparent' : 'var(--bg-color)',
                border: '1px solid ' + (disabled ? 'transparent' : 'var(--border-color)'),
                borderRadius: 6,
                padding: small ? 3 : 4,
                cursor: disabled ? 'not-allowed' : 'pointer',
                color: disabled ? 'var(--border-color)' : 'var(--text-muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
        >
            {dir === 'up' ? <ArrowUp size={size} /> : <ArrowDown size={size} />}
        </button>
    );
}

function LessonDetail({ lesson, base, onPlay }) {
    const playable = lesson.words.some(w => w.translation) || lesson.matches.length >= 3;
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6, flexWrap: 'wrap' }}>
                        <Pill color={TYPE_COLORS[lesson.lesson_type]} bg={`${TYPE_COLORS[lesson.lesson_type]}22`}>{lesson.lesson_type}</Pill>
                        <Pill>{lesson.node_id}</Pill>
                        {lesson.quiz_id && <Pill color="#F26B5A" bg="rgba(242,107,90,0.1)">{lesson.quiz_id}</Pill>}
                        <Pill>{lesson.xp_reward} XP</Pill>
                        <Pill>unit {lesson.unit_index + 1}</Pill>
                    </div>
                    <h2 style={{ margin: 0, fontSize: 20 }}>{lesson.lesson_title}</h2>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{lesson.unit_title}</div>
                </div>
                <button
                    onClick={onPlay}
                    disabled={!playable}
                    title={playable ? 'Play this lesson (sandbox — no progress saved)' : 'Not enough content for exercises'}
                    style={{
                        padding: '10px 16px',
                        background: playable ? 'var(--primary-color)' : 'var(--border-color)',
                        color: playable ? 'white' : 'var(--text-muted)',
                        border: 'none', borderRadius: 8, fontWeight: 700, cursor: playable ? 'pointer' : 'not-allowed',
                        display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
                    }}
                >
                    <Play size={16} /> Play (sandbox)
                </button>
            </div>

            <Section title="Lesson metadata">
                <KV k="Lesson ID" v={lesson.id} />
                <KV k="Content types" v={lesson.content_types.join(', ') || '—'} />
                <KV k="Grammar tags" v={lesson.grammar_tags.length ? lesson.grammar_tags.join(', ') : '— (none auto-detected)'} />
                <KV k="Unlock rule" v={
                    lesson.unlock_rule.type === 'start' ? 'Starting lesson (always unlocked)' :
                    lesson.unlock_rule.type === 'sequential' ? `After: ${lesson.unlock_rule.requires.join(', ')}` :
                    lesson.unlock_rule.type === 'unit_complete' ? `After all ${lesson.unlock_rule.requires.length} non-quiz lessons in this unit` :
                    JSON.stringify(lesson.unlock_rule)
                } />
            </Section>

            {lesson.words.length > 0 && (
                <Section title={`Vocabulary (${lesson.words.length})`}>
                    <Table cols={['Vietnamese', BASE_LABELS[base] || base, 'Category', 'IPA']} rows={lesson.words.map(w => [
                        w.vi,
                        w.translation || <Missing base={base} />,
                        w.category,
                        w.ipa || '—',
                    ])} />
                </Section>
            )}

            {lesson.sentences.length > 0 && (
                <Section title={`Sentences (${lesson.sentences.length})`}>
                    <Table cols={['Vietnamese', BASE_LABELS[base] || base]} rows={lesson.sentences.map(s => [
                        s.vi,
                        s.translation || <Missing base={base} />,
                    ])} />
                </Section>
            )}

            {lesson.matches.length > 0 && (
                <Section title={`Match-pairs (${lesson.matches.length})`}>
                    <Table cols={['Text', 'Target']} rows={lesson.matches.map(m => [
                        m.text,
                        m.target || <Missing base={base} />,
                    ])} />
                </Section>
            )}
        </div>
    );
}

const Section = ({ title, children }) => (
    <div>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8, letterSpacing: 0.5 }}>{title}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>{children}</div>
    </div>
);

const KV = ({ k, v }) => (
    <div style={{ display: 'flex', gap: 12, fontSize: 13 }}>
        <div style={{ width: 110, color: 'var(--text-muted)', flexShrink: 0 }}>{k}</div>
        <div style={{ flex: 1, fontFamily: 'ui-monospace, monospace', wordBreak: 'break-word' }}>{v}</div>
    </div>
);

const Table = ({ cols, rows }) => (
    <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', fontSize: 13 }}>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols.length}, 1fr)`, background: 'rgba(0,0,0,0.04)', padding: '6px 10px', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            {cols.map(c => <div key={c}>{c}</div>)}
        </div>
        {rows.map((r, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: `repeat(${cols.length}, 1fr)`, padding: '6px 10px', borderTop: '1px solid var(--border-color)' }}>
                {r.map((cell, j) => <div key={j} style={{ wordBreak: 'break-word' }}>{cell}</div>)}
            </div>
        ))}
    </div>
);

const Missing = ({ base }) => (
    <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: 12 }}>
        — no {base.toUpperCase()} translation (falls back to EN at runtime)
    </span>
);

const selectStyle = {
    padding: '6px 10px',
    background: 'var(--bg-color)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-main)',
    fontSize: 13,
};

const toolbarBtn = (disabled) => ({
    padding: '8px 12px',
    borderRadius: 8,
    border: '1px solid var(--border-color)',
    background: 'var(--bg-color)',
    color: disabled ? 'var(--border-color)' : 'var(--text-main)',
    fontWeight: 600, fontSize: 12,
    cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'flex', alignItems: 'center', gap: 6,
});
