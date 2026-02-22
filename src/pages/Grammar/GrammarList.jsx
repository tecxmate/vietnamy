import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import grammarBank from '../../data/vn_grammar_bank.json';
import '../Practice/PracticeShared.css';
import './Grammar.css';

const GrammarList = () => {
    const { level } = useParams();
    const navigate = useNavigate();

    const items = grammarBank.items.filter(i => i.level === level);

    return (
        <div className="practice-layout">
            <header className="practice-header">
                <h1 className="practice-header-title">
                    <ArrowLeft size={24} onClick={() => navigate('/')} style={{ cursor: 'pointer' }} />
                    {level} Grammar
                </h1>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    {items.length} patterns
                </span>
            </header>

            <div className="grammar-list">
                {items.map((item, idx) => (
                    <div
                        key={idx}
                        className="grammar-pattern-card"
                        onClick={() => navigate(`/grammar/${level}/${idx}`)}
                    >
                        <span className="grammar-pattern-pill">{item.pattern}</span>
                        <p className="grammar-pattern-title">{item.title}</p>
                        <p className="grammar-pattern-example">{item.example}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default GrammarList;
