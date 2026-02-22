import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUnits, getNodesForUnit, addUnit, addNode, updateNode, deleteNode, updateUnit, deleteUnit } from '../../lib/db';
import { Plus, GripVertical, Settings, Trash2, ArrowUp, ArrowDown, Pencil, Check, X } from 'lucide-react';

const NODE_TYPES = ['lesson', 'practice', 'checkpoint', 'boss'];
const STATUSES = ['locked', 'active', 'completed'];

const RoadmapMapper = () => {
    const navigate = useNavigate();
    const [units, setUnits] = useState([]);
    const [nodesMap, setNodesMap] = useState({});
    const [showAddUnit, setShowAddUnit] = useState(false);
    const [newUnitTitle, setNewUnitTitle] = useState('');
    const [editingUnit, setEditingUnit] = useState(null);
    const [editUnitTitle, setEditUnitTitle] = useState('');
    const [editingNode, setEditingNode] = useState(null);
    const [editNodeData, setEditNodeData] = useState({});

    const loadData = () => {
        const fetchedUnits = getUnits();
        setUnits(fetchedUnits);
        const map = {};
        fetchedUnits.forEach(unit => {
            map[unit.id] = getNodesForUnit(unit.id);
        });
        setNodesMap(map);
    };

    useEffect(() => { loadData(); }, []);

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
            node_type: 'lesson',
            label: 'New Lesson',
            lesson_id: `lesson-draft-${Date.now()}`,
            status: 'locked'
        });
        loadData();
    };

    const handleDeleteNode = (nodeId) => {
        if (!confirm('Delete this node?')) return;
        deleteNode(nodeId);
        setEditingNode(null);
        loadData();
    };

    const handleMoveNode = (unitId, nodeId, direction) => {
        const nodes = nodesMap[unitId] || [];
        const idx = nodes.findIndex(n => n.id === nodeId);
        const swapIdx = idx + direction;
        if (swapIdx < 0 || swapIdx >= nodes.length) return;

        const a = nodes[idx];
        const b = nodes[swapIdx];
        updateNode(a.id, { node_index: b.order_index });
        updateNode(b.id, { node_index: a.order_index });
        loadData();
    };

    const startEditNode = (node) => {
        setEditingNode(node.id);
        setEditNodeData({
            label: node.label || '',
            node_type: node.type || 'lesson',
            lesson_id: node.content_ref_id || '',
            status: node.status || 'locked'
        });
    };

    const saveEditNode = (nodeId) => {
        updateNode(nodeId, editNodeData);
        setEditingNode(null);
        loadData();
    };

    const handleDeleteUnit = (unitId) => {
        const nodes = nodesMap[unitId] || [];
        if (nodes.length > 0 && !confirm(`This unit has ${nodes.length} node(s). Delete them all?`)) return;
        deleteUnit(unitId);
        setEditingUnit(null);
        loadData();
    };

    const startEditUnit = (unit) => {
        setEditingUnit(unit.id);
        setEditUnitTitle(unit.title);
    };

    const saveEditUnit = (unitId) => {
        updateUnit(unitId, { title: editUnitTitle });
        setEditingUnit(null);
        loadData();
    };

    const s = {
        input: { padding: '6px 10px', borderRadius: 6, backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: 14 },
        select: { padding: '6px 10px', borderRadius: 6, backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: 13 },
        iconBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-muted)', display: 'flex', alignItems: 'center' },
        statusDot: (status) => ({
            width: 8, height: 8, borderRadius: '50%', display: 'inline-block',
            backgroundColor: status === 'completed' ? '#4CAF50' : status === 'active' ? 'var(--primary-color)' : 'var(--text-muted)'
        }),
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                <div>
                    <h1 style={{ fontSize: 32, margin: 0 }}>Roadmap Mapper</h1>
                    <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                        {units.length} units, {Object.values(nodesMap).flat().length} total nodes
                    </span>
                </div>
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
                        onKeyDown={(e) => e.key === 'Enter' && handleCreateUnit()}
                        style={{ flex: 1, padding: 12, borderRadius: 8, backgroundColor: 'var(--surface-color-light)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}
                        autoFocus
                    />
                    <button className="primary" onClick={handleCreateUnit}>Save</button>
                    <button className="secondary" onClick={() => setShowAddUnit(false)}>Cancel</button>
                </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {units.map(unit => (
                    <div key={unit.id} className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
                        {/* Unit Header */}
                        <div style={{ backgroundColor: 'var(--surface-color-light)', padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                                <GripVertical size={20} color="var(--text-muted)" style={{ cursor: 'grab' }} />
                                {editingUnit === unit.id ? (
                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flex: 1 }}>
                                        <input
                                            type="text"
                                            value={editUnitTitle}
                                            onChange={(e) => setEditUnitTitle(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && saveEditUnit(unit.id)}
                                            style={{ ...s.input, flex: 1, fontSize: 16, fontWeight: 700 }}
                                            autoFocus
                                        />
                                        <button style={{ ...s.iconBtn, color: '#4CAF50' }} onClick={() => saveEditUnit(unit.id)}><Check size={18} /></button>
                                        <button style={s.iconBtn} onClick={() => setEditingUnit(null)}><X size={18} /></button>
                                    </div>
                                ) : (
                                    <h3 style={{ margin: 0, fontSize: 18, flex: 1 }}>
                                        Unit {unit.order_index}: {unit.title}
                                        <span style={{ color: 'var(--text-muted)', fontSize: 13, fontWeight: 400, marginLeft: 12 }}>
                                            {(nodesMap[unit.id] || []).length} nodes
                                        </span>
                                    </h3>
                                )}
                            </div>
                            <div style={{ display: 'flex', gap: 4 }}>
                                <button style={s.iconBtn} onClick={() => startEditUnit(unit)} title="Edit unit"><Pencil size={16} /></button>
                                <button style={{ ...s.iconBtn, color: '#EF4444' }} onClick={() => handleDeleteUnit(unit.id)} title="Delete unit"><Trash2 size={16} /></button>
                            </div>
                        </div>

                        {/* Nodes Table */}
                        <div style={{ padding: 20 }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ textAlign: 'left', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)', fontSize: 13 }}>
                                        <th style={{ paddingBottom: 12, width: 50 }}>#</th>
                                        <th style={{ paddingBottom: 12 }}>Label</th>
                                        <th style={{ paddingBottom: 12, width: 100 }}>Type</th>
                                        <th style={{ paddingBottom: 12 }}>Content Ref</th>
                                        <th style={{ paddingBottom: 12, width: 80 }}>Status</th>
                                        <th style={{ paddingBottom: 12, textAlign: 'right', width: 140 }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(nodesMap[unit.id] || []).map((node, nIdx) => (
                                        <tr key={node.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                            {editingNode === node.id ? (
                                                <>
                                                    <td style={{ padding: '8px 0' }}>{node.order_index}</td>
                                                    <td style={{ padding: '8px 4px' }}>
                                                        <input
                                                            type="text"
                                                            value={editNodeData.label}
                                                            onChange={(e) => setEditNodeData(d => ({ ...d, label: e.target.value }))}
                                                            style={{ ...s.input, width: '100%' }}
                                                        />
                                                    </td>
                                                    <td style={{ padding: '8px 4px' }}>
                                                        <select value={editNodeData.node_type} onChange={(e) => setEditNodeData(d => ({ ...d, node_type: e.target.value }))} style={s.select}>
                                                            {NODE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                                        </select>
                                                    </td>
                                                    <td style={{ padding: '8px 4px' }}>
                                                        <input
                                                            type="text"
                                                            value={editNodeData.lesson_id}
                                                            onChange={(e) => setEditNodeData(d => ({ ...d, lesson_id: e.target.value }))}
                                                            style={{ ...s.input, width: '100%', fontFamily: 'monospace', fontSize: 12 }}
                                                        />
                                                    </td>
                                                    <td style={{ padding: '8px 4px' }}>
                                                        <select value={editNodeData.status} onChange={(e) => setEditNodeData(d => ({ ...d, status: e.target.value }))} style={s.select}>
                                                            {STATUSES.map(st => <option key={st} value={st}>{st}</option>)}
                                                        </select>
                                                    </td>
                                                    <td style={{ padding: '8px 0', textAlign: 'right' }}>
                                                        <div style={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                                                            <button style={{ ...s.iconBtn, color: '#4CAF50' }} onClick={() => saveEditNode(node.id)}><Check size={16} /></button>
                                                            <button style={s.iconBtn} onClick={() => setEditingNode(null)}><X size={16} /></button>
                                                        </div>
                                                    </td>
                                                </>
                                            ) : (
                                                <>
                                                    <td style={{ padding: '12px 0' }}>{node.order_index}</td>
                                                    <td style={{ padding: '12px 0', fontWeight: 700 }}>{node.label || 'Unnamed Node'}</td>
                                                    <td style={{ padding: '12px 0' }}>
                                                        <span style={{
                                                            padding: '2px 8px', borderRadius: 4, fontSize: 12,
                                                            backgroundColor: node.type === 'lesson' ? 'rgba(76,175,80,0.15)' : node.type === 'boss' ? 'rgba(239,68,68,0.15)' : 'rgba(59,130,246,0.15)',
                                                            color: node.type === 'lesson' ? '#4CAF50' : node.type === 'boss' ? '#EF4444' : '#3B82F6'
                                                        }}>
                                                            {node.type}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '12px 0', fontFamily: 'monospace', color: 'var(--secondary-color)', fontSize: 13 }}>{node.content_ref_id}</td>
                                                    <td style={{ padding: '12px 0' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                            <span style={s.statusDot(node.status)} />
                                                            <span style={{ fontSize: 12 }}>{node.status}</span>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '12px 0', textAlign: 'right' }}>
                                                        <div style={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                                                            <button style={s.iconBtn} onClick={() => handleMoveNode(unit.id, node.id, -1)} title="Move up"><ArrowUp size={14} /></button>
                                                            <button style={s.iconBtn} onClick={() => handleMoveNode(unit.id, node.id, 1)} title="Move down"><ArrowDown size={14} /></button>
                                                            <button style={s.iconBtn} onClick={() => startEditNode(node)} title="Edit"><Pencil size={14} /></button>
                                                            <button
                                                                className="ghost"
                                                                style={{ padding: '4px 8px', fontSize: 13 }}
                                                                onClick={() => navigate(`/admin/lesson?id=${node.content_ref_id}`)}
                                                            >
                                                                Content
                                                            </button>
                                                            <button style={{ ...s.iconBtn, color: '#EF4444' }} onClick={() => handleDeleteNode(node.id)} title="Delete"><Trash2 size={14} /></button>
                                                        </div>
                                                    </td>
                                                </>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {(nodesMap[unit.id] || []).length === 0 && (
                                <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                    No nodes in this unit yet
                                </div>
                            )}

                            <div style={{ marginTop: 16 }}>
                                <button
                                    className="secondary"
                                    style={{ width: '100%', borderStyle: 'dashed', backgroundColor: 'transparent' }}
                                    onClick={() => handleAddNode(unit.id)}
                                >
                                    <Plus size={16} /> Add Node
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                {units.length === 0 && (
                    <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>
                        No units yet. Click "Add Unit" to get started.
                    </div>
                )}
            </div>
        </div>
    );
};

export default RoadmapMapper;
