import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { getLevel, loadGrammarModules, getGrammarModulesSync } from '../../lib/grammarModulesDB';
import '../Practice/PracticeShared.css';
import './Grammar.css';

// Canonical grammar browser: a level's modules → units, each unit opening the
// canonical /grammar-unit lesson. (Replaces the legacy grammarDB-backed list.)
const GrammarList = () => {
    const { level } = useParams();
    const navigate = useNavigate();
    const [ready, setReady] = useState(!!getGrammarModulesSync());

    useEffect(() => {
        if (!ready) loadGrammarModules().then(() => setReady(true));
    }, [ready]);

    const data = ready ? getLevel(level) : null;
    const modules = data?.modules || [];
    const unitCount = modules.reduce((s, m) => s + (m.units?.length || 0), 0);

    return (
        <div className="practice-layout">
            <header className="practice-header">
                <h1 className="practice-header-title">
                    <ArrowLeft size={24} onClick={() => navigate('/grammar')} style={{ cursor: 'pointer' }} />
                    {level} · {data?.label || 'Grammar'}
                </h1>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    {modules.length} modules · {unitCount} patterns
                </span>
            </header>

            <div className="grammar-list">
                {modules.map(module => (
                    <div key={module.id} style={{ marginBottom: 20 }}>
                        <div style={{ padding: '4px 2px 10px' }}>
                            <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>{module.title}</h2>
                            {module.mainPattern && (
                                <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>{module.mainPattern}</p>
                            )}
                        </div>
                        {(module.units || []).map(unit => (
                            <div
                                key={unit.id}
                                className="grammar-pattern-card"
                                onClick={() => navigate(`/grammar-unit/${unit.id}`)}
                            >
                                {unit.pattern && <span className="grammar-pattern-pill">{unit.pattern}</span>}
                                <p className="grammar-pattern-title">{unit.title}</p>
                                <p className="grammar-pattern-example">{unit.examples?.[0]?.vi || ''}</p>
                            </div>
                        ))}
                    </div>
                ))}
                {ready && modules.length === 0 && (
                    <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 32 }}>No grammar for this level yet.</p>
                )}
            </div>
        </div>
    );
};

export default GrammarList;
