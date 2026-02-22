import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { getGrammarItems } from '../../lib/grammarDB';

const LEVEL_COLORS = {
    A1: '#06D6A0',
    A2: '#118AB2',
    B1: '#EF476F',
};

const LEVELS = ['A1', 'A2', 'B1'];

const GrammarTab = () => {
    const navigate = useNavigate();
    const allItems = getGrammarItems();
    const grouped = allItems.reduce((acc, item) => {
        acc[item.level] = acc[item.level] || [];
        acc[item.level].push(item);
        return acc;
    }, {});

    return (
        <div className="grammar-level-cards">
            {LEVELS.map(level => {
                const items = grouped[level] || [];
                const samples = items.slice(0, 3).map(i => i.title);
                return (
                    <div
                        key={level}
                        className="grammar-level-card"
                        style={{ '--accent': LEVEL_COLORS[level] }}
                        onClick={() => navigate(`/grammar/${level}`)}
                    >
                        <div className="grammar-level-card-header">
                            <span className="grammar-level-badge" style={{ color: LEVEL_COLORS[level] }}>
                                {level}
                            </span>
                            <span className="grammar-level-count">
                                {items.length} patterns <ChevronRight size={14} />
                            </span>
                        </div>
                        <div className="grammar-level-samples">
                            {samples.map((s, i) => (
                                <span key={i} className="grammar-level-sample">{s}</span>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default GrammarTab;
