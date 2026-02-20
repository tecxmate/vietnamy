import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Check, Lock } from 'lucide-react';
import { getUnits, getNodesForUnit } from '../../lib/db';

const RoadmapTab = () => {
    const navigate = useNavigate();
    const [units, setUnits] = useState([]);
    const [nodesMap, setNodesMap] = useState({});

    useEffect(() => {
        // Fetch units and nodes from local DB simulation
        const fetchedUnits = getUnits();
        setUnits(fetchedUnits);

        const map = {};
        fetchedUnits.forEach(unit => {
            map[unit.id] = getNodesForUnit(unit.id);
        });
        setNodesMap(map);
    }, []);

    const getOffset = (index) => {
        const cycle = index % 4;
        switch (cycle) {
            case 0: return 0;
            case 1: return -40;
            case 2: return -60;
            case 3: return -40;
            default: return 0;
        }
    };

    const handleNodeClick = (node) => {
        if (node.status === 'active') {
            navigate(`/lesson/${node.content_ref_id}`);
        }
    };

    const handleContinueClick = () => {
        for (const unit of units) {
            const nodes = nodesMap[unit.id] || [];
            const activeNode = nodes.find(n => n.status === 'active');
            if (activeNode) {
                navigate(`/lesson/${activeNode.content_ref_id}`);
                return;
            }
        }
    };

    return (
        <div>
            {units.map((unit) => (
                <div key={unit.id} style={{ marginBottom: 64 }}>
                    <div style={{ backgroundColor: 'var(--surface-color)', padding: 'var(--spacing-4)', position: 'sticky', top: 0, zIndex: 5, borderBottom: '1px solid var(--border-color)' }}>
                        <h2 style={{ margin: 0, fontSize: 18 }}>Unit {unit.order_index}: {unit.title}</h2>
                    </div>

                    <div className="path-container relative">
                        {(nodesMap[unit.id] || []).map((node, index) => {
                            const isFirstNodeInUnit = node.label !== '' && node.type === 'lesson';
                            return (
                                <React.Fragment key={node.id}>
                                    {isFirstNodeInUnit && index !== 0 && (
                                        <div style={{ width: '100%', height: 1, backgroundColor: 'var(--border-color)', margin: '32px 0' }} />
                                    )}

                                    <div
                                        className={`path-node ${node.status}`}
                                        style={{ transform: `translateX(${getOffset(index)}px)` }}
                                        onClick={() => handleNodeClick(node)}
                                    >
                                        {node.status === 'completed' && <Check size={32} strokeWidth={3} />}
                                        {node.status === 'locked' && node.type === 'checkpoint' && <Star size={32} color="var(--text-muted)" />}
                                        {node.status === 'locked' && node.type !== 'checkpoint' && <Lock size={24} />}
                                        {node.status === 'active' && <Star size={32} color="#1A1A1A" fill="#1A1A1A" />}

                                        {node.status === 'active' && (
                                            <div style={{ position: 'absolute', top: -30, whiteSpace: 'nowrap', backgroundColor: 'var(--surface-color)', padding: '4px 12px', borderRadius: 8, border: '2px solid var(--border-color)', fontSize: 14, fontWeight: 700, animation: 'bounce 2s infinite' }}>
                                                Start
                                                <div style={{ position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)', borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: '6px solid var(--border-color)' }} />
                                            </div>
                                        )}
                                    </div>

                                    {node.label && node.type !== 'lesson' && (
                                        <div style={{ transform: `translateX(${getOffset(index)}px)`, marginTop: -8, marginBottom: 16, fontSize: 14, fontWeight: 700, color: 'var(--text-muted)' }}>
                                            {node.label}
                                        </div>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </div>
                </div>
            ))}

            <div style={{ position: 'fixed', bottom: 90, left: 16, right: 16, zIndex: 10 }}>
                <button className="primary w-full shadow-lg" style={{ fontSize: 18, padding: 16 }} onClick={handleContinueClick}>
                    CONTINUE
                </button>
            </div>

            <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
      `}</style>
        </div>
    );
};

export default RoadmapTab;
