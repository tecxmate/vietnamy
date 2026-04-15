import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, BookOpen, Volume2 } from 'lucide-react';

const LEVEL_COLORS = {
    A1: '#06D6A0',
    A2: '#118AB2',
    B1: '#EF476F',
};

const GrammarTab = () => {
    const [modules, setModules] = useState(null);
    const [expandedLevel, setExpandedLevel] = useState('A1');
    const [expandedModule, setExpandedModule] = useState(null);
    const [expandedUnit, setExpandedUnit] = useState(null);

    const playTTS = (text) => {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'vi-VN';
            utterance.rate = 0.8;
            speechSynthesis.speak(utterance);
        }
    };

    useEffect(() => {
        import('../../data/grammar_modules.json').then(mod => {
            setModules(mod.default);
        });
    }, []);

    if (!modules) {
        return (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                Loading grammar guide...
            </div>
        );
    }

    return (
        <div style={{ paddingBottom: 100 }}>
            {/* Header */}
            <div style={{
                padding: '24px 16px 16px',
                borderBottom: '1px solid var(--border-color)',
                backgroundColor: 'var(--surface-color)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <div style={{
                        width: 48, height: 48, borderRadius: 12,
                        backgroundColor: 'rgba(167,139,250,0.12)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <BookOpen size={24} color="#A78BFA" />
                    </div>
                    <div>
                        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Grammar Guide</h1>
                        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
                            Reference for Vietnamese patterns
                        </p>
                    </div>
                </div>
            </div>

            {/* Level Tabs */}
            <div style={{
                display: 'flex',
                gap: 8,
                padding: '12px 16px',
                borderBottom: '1px solid var(--border-color)',
                backgroundColor: 'var(--surface-color)',
                position: 'sticky',
                top: 0,
                zIndex: 10,
            }}>
                {modules.levels.map(level => (
                    <button
                        key={level.id}
                        onClick={() => { setExpandedLevel(level.id); setExpandedModule(null); setExpandedUnit(null); }}
                        style={{
                            flex: 1,
                            padding: '10px 12px',
                            borderRadius: 10,
                            border: `2px solid ${expandedLevel === level.id ? LEVEL_COLORS[level.id] : 'var(--border-color)'}`,
                            backgroundColor: expandedLevel === level.id ? `${LEVEL_COLORS[level.id]}15` : 'transparent',
                            color: expandedLevel === level.id ? LEVEL_COLORS[level.id] : 'var(--text-muted)',
                            fontWeight: 700,
                            fontSize: 14,
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            transition: 'all 0.15s',
                        }}
                    >
                        {level.id}
                        <div style={{ fontSize: 10, fontWeight: 500, marginTop: 2 }}>
                            {level.module_count} topics
                        </div>
                    </button>
                ))}
            </div>

            {/* Modules for selected level */}
            {modules.levels.filter(l => l.id === expandedLevel).map(level => (
                <div key={level.id}>
                    <div style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: 13 }}>
                        {level.description}
                    </div>

                    {level.modules.map((mod, modIdx) => {
                        const isModExpanded = expandedModule === mod.id;
                        return (
                            <div key={mod.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                {/* Module Header */}
                                <button
                                    onClick={() => { setExpandedModule(isModExpanded ? null : mod.id); setExpandedUnit(null); }}
                                    style={{
                                        width: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 12,
                                        padding: '14px 16px',
                                        backgroundColor: isModExpanded ? `${LEVEL_COLORS[level.id]}08` : 'transparent',
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontFamily: 'inherit',
                                        textAlign: 'left',
                                    }}
                                >
                                    <span style={{
                                        width: 28, height: 28, borderRadius: 8,
                                        backgroundColor: `${LEVEL_COLORS[level.id]}20`,
                                        color: LEVEL_COLORS[level.id],
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 12, fontWeight: 700, flexShrink: 0,
                                    }}>
                                        {modIdx + 1}
                                    </span>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-main)' }}>
                                            {mod.title}
                                        </div>
                                        {mod.main_pattern && (
                                            <code style={{
                                                fontSize: 12,
                                                color: LEVEL_COLORS[level.id],
                                                backgroundColor: `${LEVEL_COLORS[level.id]}10`,
                                                padding: '2px 6px',
                                                borderRadius: 4,
                                                marginTop: 4,
                                                display: 'inline-block',
                                            }}>
                                                {mod.main_pattern}
                                            </code>
                                        )}
                                    </div>
                                    {isModExpanded ? <ChevronDown size={20} color="var(--text-muted)" /> : <ChevronRight size={20} color="var(--text-muted)" />}
                                </button>

                                {/* Module Content (expanded) */}
                                {isModExpanded && (
                                    <div style={{ padding: '0 16px 16px', backgroundColor: `${LEVEL_COLORS[level.id]}05` }}>
                                        {mod.description && (
                                            <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                                                {mod.description}
                                            </p>
                                        )}

                                        {/* Units */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                            {mod.units.map((unit, unitIdx) => {
                                                const isUnitExpanded = expandedUnit === unit.id;
                                                return (
                                                    <div key={unit.id} style={{
                                                        backgroundColor: 'var(--surface-color)',
                                                        borderRadius: 12,
                                                        border: '1px solid var(--border-color)',
                                                        overflow: 'hidden',
                                                    }}>
                                                        {/* Unit Header */}
                                                        <button
                                                            onClick={() => setExpandedUnit(isUnitExpanded ? null : unit.id)}
                                                            style={{
                                                                width: '100%',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: 10,
                                                                padding: '12px 14px',
                                                                backgroundColor: 'transparent',
                                                                border: 'none',
                                                                cursor: 'pointer',
                                                                fontFamily: 'inherit',
                                                                textAlign: 'left',
                                                            }}
                                                        >
                                                            <span style={{
                                                                fontSize: 11, fontWeight: 700,
                                                                color: 'var(--text-muted)',
                                                                minWidth: 20,
                                                            }}>
                                                                {unitIdx + 1}.
                                                            </span>
                                                            <div style={{ flex: 1 }}>
                                                                <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-main)' }}>
                                                                    {unit.title}
                                                                </div>
                                                                <code style={{ fontSize: 11, color: LEVEL_COLORS[level.id] }}>
                                                                    {unit.pattern}
                                                                </code>
                                                            </div>
                                                            {isUnitExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                                        </button>

                                                        {/* Unit Content (expanded) */}
                                                        {isUnitExpanded && (
                                                            <div style={{ padding: '0 14px 14px', borderTop: '1px solid var(--border-color)' }}>
                                                                {/* Explanation */}
                                                                <p style={{ margin: '12px 0', fontSize: 13, color: 'var(--text-main)', lineHeight: 1.6 }}>
                                                                    {unit.explanation}
                                                                </p>
                                                                {unit.note && (
                                                                    <p style={{
                                                                        margin: '0 0 12px',
                                                                        fontSize: 12,
                                                                        color: LEVEL_COLORS[level.id],
                                                                        backgroundColor: `${LEVEL_COLORS[level.id]}10`,
                                                                        padding: '8px 10px',
                                                                        borderRadius: 8,
                                                                        borderLeft: `3px solid ${LEVEL_COLORS[level.id]}`,
                                                                    }}>
                                                                        {unit.note}
                                                                    </p>
                                                                )}

                                                                {/* Examples */}
                                                                {unit.examples && unit.examples.length > 0 && (
                                                                    <div style={{ marginTop: 12 }}>
                                                                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>
                                                                            Examples
                                                                        </div>
                                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                                                            {unit.examples.slice(0, 4).map((ex, i) => (
                                                                                <div
                                                                                    key={i}
                                                                                    onClick={() => playTTS(ex.vi)}
                                                                                    style={{
                                                                                        backgroundColor: 'var(--bg-color)',
                                                                                        padding: '8px 10px',
                                                                                        borderRadius: 8,
                                                                                        cursor: 'pointer',
                                                                                        display: 'flex',
                                                                                        alignItems: 'flex-start',
                                                                                        gap: 10,
                                                                                    }}
                                                                                >
                                                                                    <div style={{ flex: 1 }}>
                                                                                        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-main)' }}>
                                                                                            {ex.vi}
                                                                                        </div>
                                                                                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                                                                                            {ex.en}
                                                                                        </div>
                                                                                    </div>
                                                                                    <Volume2 size={16} color={LEVEL_COLORS[level.id]} style={{ flexShrink: 0, marginTop: 2 }} />
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* FAQs */}
                                        {mod.faqs && mod.faqs.length > 0 && (
                                            <div style={{ marginTop: 16 }}>
                                                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>
                                                    Common Questions
                                                </div>
                                                {mod.faqs.map((faq, i) => (
                                                    <div key={i} style={{
                                                        backgroundColor: 'var(--surface-color)',
                                                        padding: '10px 12px',
                                                        borderRadius: 8,
                                                        marginBottom: 6,
                                                    }}>
                                                        <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-main)', marginBottom: 4 }}>
                                                            {faq.question}
                                                        </div>
                                                        <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                                                            {faq.answer}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            ))}
        </div>
    );
};

export default GrammarTab;
