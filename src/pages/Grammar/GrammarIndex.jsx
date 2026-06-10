import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { getLevels, loadGrammarModules, getGrammarModulesSync } from '../../lib/grammarModulesDB';
import '../Practice/PracticeShared.css';

// Canonical grammar reference: level cards → /grammar/:level → /grammar-unit.
const LEVEL_COLOR = {
    A1: '#06D6A0', A2: '#1CB0F6', B1: '#A78BFA',
    B2: '#FF9F1C', C1: '#EF476F', C2: '#9B5DE5',
};

const GrammarIndex = () => {
    const navigate = useNavigate();
    const [ready, setReady] = useState(!!getGrammarModulesSync());

    useEffect(() => {
        if (!ready) loadGrammarModules().then(() => setReady(true));
    }, [ready]);

    const levels = ready ? getLevels() : [];

    return (
        <div className="practice-layout">
            <header className="practice-header">
                <h1 className="practice-header-title">
                    <ArrowLeft size={24} onClick={() => navigate('/', { state: { tab: 'library' } })} style={{ cursor: 'pointer' }} />
                    Grammar
                </h1>
            </header>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '8px 16px 32px' }}>
                {levels.map(level => {
                    const accent = LEVEL_COLOR[level.id] || 'var(--primary-color)';
                    const unitCount = (level.modules || []).reduce((s, m) => s + (m.units?.length || 0), 0);
                    const samples = (level.modules || []).slice(0, 3).map(m => m.title);
                    return (
                        <button
                            key={level.id}
                            onClick={() => navigate(`/grammar/${level.id}`)}
                            style={{
                                width: '100%', boxSizing: 'border-box', textAlign: 'left',
                                border: `2px solid ${accent}30`, borderLeft: `5px solid ${accent}`,
                                borderRadius: 14, background: 'var(--surface-color)', padding: '14px 16px',
                                cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 8, fontFamily: 'inherit',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 12 }}>
                                <span style={{ fontWeight: 800, fontSize: 18, color: accent }}>
                                    {level.id} <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>· {level.label}</span>
                                </span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--text-muted)' }}>
                                    {unitCount} patterns <ChevronRight size={14} />
                                </span>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                {samples.map((s, i) => (
                                    <span key={i} style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--bg-color)', borderRadius: 8, padding: '3px 8px' }}>{s}</span>
                                ))}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default GrammarIndex;
