import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUnits, getNodesForUnit, addUnit, addNode } from '../../lib/db';
import { Plus, GripVertical, Settings } from 'lucide-react';

const RoadmapMapper = () => {
    const navigate = useNavigate();
    const [units, setUnits] = useState([]);
    const [nodesMap, setNodesMap] = useState({});
    const [showAddUnit, setShowAddUnit] = useState(false);
    const [newUnitTitle, setNewUnitTitle] = useState('');

    const loadData = () => {
        const fetchedUnits = getUnits();
        setUnits(fetchedUnits);

        const map = {};
        fetchedUnits.forEach(unit => {
            map[unit.id] = getNodesForUnit(unit.id);
        });
        setNodesMap(map);
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleCreateUnit = () => {
        if (!newUnitTitle.trim()) return;
        addUnit({ title: newUnitTitle, unlockCondition: 'free' });
        setNewUnitTitle('');
        setShowAddUnit(false);
        loadData();
    };

    const handleAddNode = (unitId) => {
        addNode({
            unit_id: unitId,
            type: 'lesson',
            label: 'New Lesson',
            content_ref_id: `lesson-draft-${Date.now()}`
        });
        loadData();
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                <h1 style={{ fontSize: 32, margin: 0 }}>Roadmap Mapper</h1>
                <button className="primary" onClick={() => setShowAddUnit(true)}>
                    <Plus size={20} /> Add Unit
                </button>
            </div>

            {showAddUnit && (
                <div className="glass-panel" style={{ marginBottom: 24, display: 'flex', gap: 16 }}>
                    <input
                        type="text"
                        placeholder="Unit Title (e.g. Food & Drink)"
                        value={newUnitTitle}
                        onChange={(e) => setNewUnitTitle(e.target.value)}
                        style={{ flex: 1, padding: 12, borderRadius: 8, backgroundColor: 'var(--surface-color-light)', border: '1px solid var(--border-color)', color: 'white' }}
                    />
                    <button className="primary" onClick={handleCreateUnit}>Save</button>
                    <button className="secondary" onClick={() => setShowAddUnit(false)}>Cancel</button>
                </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {units.map(unit => (
                    <div key={unit.id} className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
                        <div style={{ backgroundColor: 'var(--surface-color-light)', padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <GripVertical size={20} color="var(--text-muted)" style={{ cursor: 'grab' }} />
                                <h3 style={{ margin: 0, fontSize: 18 }}>Unit {unit.order_index}: {unit.title}</h3>
                            </div>
                            <button className="ghost"><Settings size={20} /></button>
                        </div>

                        <div style={{ padding: 20 }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ textAlign: 'left', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)' }}>
                                        <th style={{ paddingBottom: 12, width: 60 }}>Order</th>
                                        <th style={{ paddingBottom: 12 }}>Label</th>
                                        <th style={{ paddingBottom: 12 }}>Type</th>
                                        <th style={{ paddingBottom: 12 }}>Content Ref</th>
                                        <th style={{ paddingBottom: 12, textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(nodesMap[unit.id] || []).map(node => (
                                        <tr key={node.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                            <td style={{ padding: '12px 0' }}>{node.order_index}</td>
                                            <td style={{ padding: '12px 0', fontWeight: 700 }}>{node.label || 'Unnamed Node'}</td>
                                            <td style={{ padding: '12px 0' }}>{node.type}</td>
                                            <td style={{ padding: '12px 0', fontFamily: 'monospace', color: 'var(--secondary-color)' }}>{node.content_ref_id}</td>
                                            <td style={{ padding: '12px 0', textAlign: 'right' }}>
                                                <button
                                                    className="ghost"
                                                    style={{ padding: '4px 8px', fontSize: 14 }}
                                                    onClick={() => navigate(`/admin/lesson?id=${node.content_ref_id}`)}
                                                >
                                                    Edit Content
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <div style={{ marginTop: 16 }}>
                                <button
                                    className="secondary"
                                    style={{ width: '100%', borderStyle: 'dashed', backgroundColor: 'transparent' }}
                                    onClick={() => handleAddNode(unit.id)}
                                >
                                    <Plus size={16} /> Add Node to {unit.title}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RoadmapMapper;
