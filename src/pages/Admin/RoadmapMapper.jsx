import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    getUnits, getNodesForUnit, addUnit, updateUnit, deleteUnit,
    updateNode, addNodeWithQuiz, deleteNodeWithQuiz, moveNodeWithQuiz,
    reindexUnitNodes, getAvailableSkillRoutes
} from '../../lib/db';
import { getGrammarItems } from '../../lib/grammarDB';
import { Plus, Trash2, ArrowUp, ArrowDown, Pencil, Check, X, GripVertical, ExternalLink } from 'lucide-react';

const MODULE_TYPES = [
    { value: 'lesson', label: 'Lesson', nodeType: 'lesson', moduleType: 'orange', color: '#FFB703' },
    { value: 'skill', label: 'Skill', nodeType: 'skill', moduleType: 'purple', color: '#A78BFA' },
    { value: 'grammar', label: 'Grammar', nodeType: 'skill', moduleType: 'green', color: '#06D6A0' },
    { value: 'unit_test', label: 'Quizzes', nodeType: 'test', moduleType: 'test', color: '#EF4444' },
];

function getModuleColor(node) {
    const mt = node.module_type;
    if (mt === 'orange') return '#FFB703';
    if (mt === 'purple') return '#A78BFA';
    if (mt === 'green') return '#06D6A0';
    if (mt === 'test') return '#EF4444';
    return 'var(--text-muted)';
}

function getModuleLabel(node) {
    if (node.test_scope === 'module') return 'Quiz';
    if (node.test_scope === 'unit') return 'Quizzes';
    if (node.module_type === 'orange') return 'Lesson';
    if (node.module_type === 'purple') return 'Skill';
    if (node.module_type === 'green') return 'Grammar';
    return node.type || 'Node';
}

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
    const [addingToUnit, setAddingToUnit] = useState(null); // unitId when adding
    const [addType, setAddType] = useState(null); // MODULE_TYPES value
    const [addForm, setAddForm] = useState({});

    const skillRoutes = getAvailableSkillRoutes();
    const grammarItems = getGrammarItems();

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

    // --- Unit CRUD ---
    const handleCreateUnit = () => {
        if (!newUnitTitle.trim()) return;
        addUnit({ title: newUnitTitle, unlockCondition: 'free' });
        setNewUnitTitle('');
        setShowAddUnit(false);
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

    const handleDeleteUnit = (unitId) => {
        const nodes = nodesMap[unitId] || [];
        if (nodes.length > 0 && !confirm(`This unit has ${nodes.length} node(s). Delete them all?`)) return;
        deleteUnit(unitId);
        setEditingUnit(null);
        loadData();
    };

    // --- Node Add ---
    const startAdd = (unitId, typeValue) => {
        setAddingToUnit(unitId);
        setAddType(typeValue);
        const defaults = { label: '' };
        if (typeValue === 'lesson') defaults.lesson_id = `lesson_draft_${Date.now()}`;
        if (typeValue === 'skill') defaults.practice_route = skillRoutes[0]?.route || '';
        if (typeValue === 'grammar') {
            defaults.grammar_level = 'A1';
            defaults.grammar_index = 0;
        }
        setAddForm(defaults);
    };

    const cancelAdd = () => {
        setAddingToUnit(null);
        setAddType(null);
        setAddForm({});
    };

    const confirmAdd = (unitId) => {
        const mt = MODULE_TYPES.find(m => m.value === addType);
        if (!mt) return;

        const nodeData = {
            unit_id: unitId,
            node_type: mt.nodeType,
            module_type: mt.moduleType,
            label: addForm.label || mt.label,
        };

        if (addType === 'lesson') {
            nodeData.lesson_id = addForm.lesson_id;
        } else if (addType === 'skill') {
            nodeData.practice_route = addForm.practice_route;
            const route = skillRoutes.find(r => r.route === addForm.practice_route);
            if (!nodeData.label || nodeData.label === 'Skill') nodeData.label = route?.label || 'Skill Practice';
        } else if (addType === 'grammar') {
            nodeData.skill_content = {
                type: 'grammar_lesson',
                grammar_level: addForm.grammar_level,
                grammar_index: parseInt(addForm.grammar_index) || 0
            };
            const gi = grammarItems.filter(g => g.level === addForm.grammar_level);
            const item = gi[addForm.grammar_index];
            if (!nodeData.label || nodeData.label === 'Grammar') {
                nodeData.label = item ? `Grammar: ${item.title}` : 'Grammar Lesson';
            }
        } else if (addType === 'unit_test') {
            nodeData.test_scope = 'unit';
            if (!nodeData.label || nodeData.label === 'Quizzes') {
                const unit = units.find(u => u.id === unitId);
                nodeData.label = unit ? `${unit.title} Quiz` : 'Quizzes';
            }
        }

        // unlock order is auto-derived from node_index — no manual wiring needed
        addNodeWithQuiz(nodeData);
        cancelAdd();
        loadData();
    };

    // --- Node Edit ---
    const startEditNode = (node) => {
        setEditingNode(node.id);
        setEditNodeData({ label: node.label || '' });
    };

    const saveEditNode = (nodeId) => {
        updateNode(nodeId, { label: editNodeData.label });
        setEditingNode(null);
        loadData();
    };

    // --- Node Delete & Move ---
    const handleDeleteNode = (nodeId) => {
        if (!confirm('Delete this node?')) return;
        deleteNodeWithQuiz(nodeId);
        setEditingNode(null);
        loadData();
    };

    const handleMoveNode = (unitId, nodeId, direction) => {
        moveNodeWithQuiz(unitId, nodeId, direction);
        loadData();
    };

    // --- Content navigation ---
    const getContentAction = (node) => {
        if (node.test_scope === 'module') return null; // auto-managed
        if (node.module_type === 'orange' || node.type === 'lesson') {
            return { label: 'Edit', onClick: () => navigate(`/admin/lesson?id=${node.content_ref_id}`) };
        }
        if (node.module_type === 'green' || node.skill_content?.type === 'grammar_lesson') {
            return { label: 'Edit', onClick: () => navigate('/admin/grammar') };
        }
        if (node.test_scope === 'unit') return null; // auto from unit lessons
        if (node.module_type === 'purple') return null; // self-contained
        return null;
    };

    const s = {
        input: { padding: '6px 10px', borderRadius: 6, backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: 14, boxSizing: 'border-box' },
        select: { padding: '6px 10px', borderRadius: 6, backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: 13 },
        iconBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-muted)', display: 'flex', alignItems: 'center' },
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
                {units.map(unit => {
                    const nodes = nodesMap[unit.id] || [];
                    return (
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
                                                {nodes.length} nodes
                                            </span>
                                        </h3>
                                    )}
                                </div>
                                <div style={{ display: 'flex', gap: 4 }}>
                                    <button style={s.iconBtn} onClick={() => startEditUnit(unit)} title="Edit unit"><Pencil size={16} /></button>
                                    <button style={{ ...s.iconBtn, color: '#EF4444' }} onClick={() => handleDeleteUnit(unit.id)} title="Delete unit"><Trash2 size={16} /></button>
                                </div>
                            </div>

                            {/* Node List */}
                            <div style={{ padding: 20 }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                    {nodes.map((node) => {
                                        const color = getModuleColor(node);
                                        const isMiniQuiz = node.test_scope === 'module' && node.source_node_id;
                                        const contentAction = getContentAction(node);

                                        return (
                                            <div
                                                key={node.id}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: 10,
                                                    padding: isMiniQuiz ? '6px 12px 6px 40px' : '10px 12px',
                                                    borderRadius: 8,
                                                    borderLeft: isMiniQuiz ? 'none' : `3px solid ${color}`,
                                                    backgroundColor: isMiniQuiz ? 'transparent' : 'var(--surface-color-light)',
                                                    opacity: isMiniQuiz ? 0.6 : 1,
                                                }}
                                            >
                                                {/* Color dot */}
                                                <div style={{
                                                    width: isMiniQuiz ? 8 : 10,
                                                    height: isMiniQuiz ? 8 : 10,
                                                    borderRadius: '50%',
                                                    backgroundColor: color,
                                                    flexShrink: 0,
                                                }} />

                                                {/* Label */}
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    {editingNode === node.id ? (
                                                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                                            <input
                                                                type="text"
                                                                value={editNodeData.label}
                                                                onChange={(e) => setEditNodeData(d => ({ ...d, label: e.target.value }))}
                                                                onKeyDown={(e) => e.key === 'Enter' && saveEditNode(node.id)}
                                                                style={{ ...s.input, flex: 1 }}
                                                                autoFocus
                                                            />
                                                            <button style={{ ...s.iconBtn, color: '#4CAF50' }} onClick={() => saveEditNode(node.id)}><Check size={14} /></button>
                                                            <button style={s.iconBtn} onClick={() => setEditingNode(null)}><X size={14} /></button>
                                                        </div>
                                                    ) : (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                            <span style={{
                                                                fontWeight: isMiniQuiz ? 400 : 600,
                                                                fontSize: isMiniQuiz ? 13 : 14,
                                                                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                                            }}>
                                                                {isMiniQuiz ? `└─ ${node.label}` : node.label || 'Unnamed'}
                                                            </span>
                                                            {node.content_ref_id && !isMiniQuiz && (
                                                                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                                                                    {node.content_ref_id}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Type badge */}
                                                <span style={{
                                                    padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
                                                    backgroundColor: `${color}20`,
                                                    color: color,
                                                    whiteSpace: 'nowrap',
                                                }}>
                                                    {getModuleLabel(node)}
                                                </span>

                                                {/* Content action */}
                                                <div style={{ width: 56, textAlign: 'center', flexShrink: 0 }}>
                                                    {contentAction ? (
                                                        <button
                                                            className="ghost"
                                                            style={{ padding: '2px 8px', fontSize: 12 }}
                                                            onClick={contentAction.onClick}
                                                        >
                                                            <ExternalLink size={12} /> {contentAction.label}
                                                        </button>
                                                    ) : isMiniQuiz ? (
                                                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>auto</span>
                                                    ) : null}
                                                </div>

                                                {/* Actions (not for mini-quizzes) */}
                                                {!isMiniQuiz && editingNode !== node.id && (
                                                    <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                                                        <button style={s.iconBtn} onClick={() => handleMoveNode(unit.id, node.id, -1)} title="Move up"><ArrowUp size={14} /></button>
                                                        <button style={s.iconBtn} onClick={() => handleMoveNode(unit.id, node.id, 1)} title="Move down"><ArrowDown size={14} /></button>
                                                        <button style={s.iconBtn} onClick={() => startEditNode(node)} title="Rename"><Pencil size={14} /></button>
                                                        <button style={{ ...s.iconBtn, color: '#EF4444' }} onClick={() => handleDeleteNode(node.id)} title="Delete"><Trash2 size={14} /></button>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                {nodes.length === 0 && (
                                    <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                        No nodes in this unit yet
                                    </div>
                                )}

                                {/* Add Node Buttons */}
                                {addingToUnit === unit.id && addType ? (
                                    <div style={{
                                        marginTop: 16, padding: 16, borderRadius: 8,
                                        border: `2px dashed ${MODULE_TYPES.find(m => m.value === addType)?.color || 'var(--border-color)'}`,
                                        backgroundColor: 'var(--surface-color-light)',
                                    }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                            <div style={{ fontSize: 13, fontWeight: 700, color: MODULE_TYPES.find(m => m.value === addType)?.color }}>
                                                Add {MODULE_TYPES.find(m => m.value === addType)?.label}
                                            </div>

                                            <div>
                                                <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Label</label>
                                                <input
                                                    type="text"
                                                    value={addForm.label || ''}
                                                    onChange={(e) => setAddForm(f => ({ ...f, label: e.target.value }))}
                                                    placeholder={MODULE_TYPES.find(m => m.value === addType)?.label}
                                                    style={{ ...s.input, width: '100%' }}
                                                    autoFocus
                                                />
                                            </div>

                                            {addType === 'lesson' && (
                                                <div>
                                                    <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Lesson ID</label>
                                                    <input
                                                        type="text"
                                                        value={addForm.lesson_id || ''}
                                                        onChange={(e) => setAddForm(f => ({ ...f, lesson_id: e.target.value }))}
                                                        style={{ ...s.input, width: '100%', fontFamily: 'monospace', fontSize: 12 }}
                                                    />
                                                </div>
                                            )}

                                            {addType === 'skill' && (
                                                <div>
                                                    <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Practice Module</label>
                                                    <select
                                                        value={addForm.practice_route || ''}
                                                        onChange={(e) => {
                                                            const route = skillRoutes.find(r => r.route === e.target.value);
                                                            setAddForm(f => ({ ...f, practice_route: e.target.value, label: f.label || route?.label || '' }));
                                                        }}
                                                        style={{ ...s.select, width: '100%' }}
                                                    >
                                                        {skillRoutes.map(r => (
                                                            <option key={r.route} value={r.route}>{r.label}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}

                                            {addType === 'grammar' && (
                                                <div style={{ display: 'flex', gap: 12 }}>
                                                    <div style={{ flex: 1 }}>
                                                        <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Level</label>
                                                        <select
                                                            value={addForm.grammar_level || 'A1'}
                                                            onChange={(e) => setAddForm(f => ({ ...f, grammar_level: e.target.value, grammar_index: 0 }))}
                                                            style={{ ...s.select, width: '100%' }}
                                                        >
                                                            {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map(l => (
                                                                <option key={l} value={l}>{l}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div style={{ flex: 2 }}>
                                                        <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Grammar Topic</label>
                                                        <select
                                                            value={addForm.grammar_index ?? 0}
                                                            onChange={(e) => setAddForm(f => ({ ...f, grammar_index: parseInt(e.target.value) }))}
                                                            style={{ ...s.select, width: '100%' }}
                                                        >
                                                            {grammarItems
                                                                .filter(g => g.level === (addForm.grammar_level || 'A1'))
                                                                .map((g, i) => (
                                                                    <option key={i} value={i}>{g.title}</option>
                                                                ))
                                                            }
                                                        </select>
                                                    </div>
                                                </div>
                                            )}

                                            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                                <button className="secondary" style={{ padding: '6px 16px', fontSize: 13 }} onClick={cancelAdd}>Cancel</button>
                                                <button
                                                    className="primary"
                                                    style={{ padding: '6px 16px', fontSize: 13 }}
                                                    onClick={() => confirmAdd(unit.id)}
                                                >
                                                    Add
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                        {MODULE_TYPES.map(mt => (
                                            <button
                                                key={mt.value}
                                                className="secondary"
                                                style={{
                                                    flex: '1 1 auto',
                                                    borderStyle: 'dashed',
                                                    backgroundColor: 'transparent',
                                                    borderColor: mt.color,
                                                    color: mt.color,
                                                    fontSize: 13,
                                                    padding: '8px 12px',
                                                }}
                                                onClick={() => startAdd(unit.id, mt.value)}
                                            >
                                                <Plus size={14} /> {mt.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}

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
