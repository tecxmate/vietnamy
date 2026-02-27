import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Zap, Trophy, BookOpenText, Check, Lock } from 'lucide-react';
import { getUnits, getNodesForUnitWithProgress } from '../../lib/db';
import { useDong } from '../../context/DongContext';

const NODE_STYLES = {
    lesson:  { color: '#E5A700', dark: '#CC9202', bg: 'rgba(229,167,0,0.12)', muted: 'rgba(229,167,0,0.35)', mutedBorder: 'rgba(229,167,0,0.25)', mutedIcon: 'rgba(229,167,0,0.5)', icon: MessageCircle, label: 'Lesson' },
    skill:   { color: '#A78BFA', dark: '#7C3AED', bg: 'rgba(167,139,250,0.12)', muted: 'rgba(167,139,250,0.35)', mutedBorder: 'rgba(167,139,250,0.25)', mutedIcon: 'rgba(167,139,250,0.5)', icon: Zap, label: 'Skill' },
    grammar: { color: '#06D6A0', dark: '#05A67D', bg: 'rgba(6,214,160,0.12)', muted: 'rgba(6,214,160,0.35)', mutedBorder: 'rgba(6,214,160,0.25)', mutedIcon: 'rgba(6,214,160,0.5)', icon: BookOpenText, label: 'Grammar' },
    test:    { color: '#F97316', dark: '#C2410C', bg: 'rgba(249,115,22,0.12)', muted: 'rgba(249,115,22,0.35)', mutedBorder: 'rgba(249,115,22,0.25)', mutedIcon: 'rgba(249,115,22,0.5)', icon: Trophy, label: 'Test' },
};

function getNodeStyle(node) {
    if (node.type === 'test') return NODE_STYLES.test;
    if (node.type === 'grammar_tip') return NODE_STYLES.grammar;
    if (node.type === 'skill' && node.skill_content?.type === 'grammar_lesson') return NODE_STYLES.grammar;
    if (node.type === 'skill') return NODE_STYLES.skill;
    return NODE_STYLES.lesson;
}

const RoadmapTab = () => {
    const navigate = useNavigate();
    const { completedNodes } = useDong();
    const [units, setUnits] = useState([]);
    const [nodesMap, setNodesMap] = useState({});
    const [redoNode, setRedoNode] = useState(null);

    useEffect(() => {
        const fetchedUnits = getUnits();
        setUnits(fetchedUnits);

        const map = {};
        fetchedUnits.forEach(unit => {
            map[unit.id] = getNodesForUnitWithProgress(unit.id, completedNodes);
        });
        setNodesMap(map);
    }, [completedNodes]);

    const navigateNode = (node) => {
        switch (node.type) {
            case 'lesson':
                navigate(`/lesson/${node.content_ref_id}`);
                break;
            case 'grammar_tip':
                navigate(`/grammar-lesson/${node.id}`);
                break;
            case 'skill':
                if (node.skill_content?.type === 'grammar_lesson') {
                    navigate(`/grammar-lesson/${node.id}`);
                } else if (node.skill_content?.route) {
                    navigate(node.skill_content.route);
                } else if (node.practice_route) {
                    navigate(node.practice_route);
                }
                break;
            case 'test':
                navigate(`/test/${node.id}`);
                break;
            default:
                if (node.practice_route) navigate(node.practice_route);
                else navigate(`/lesson/${node.content_ref_id}`);
        }
    };

    const handleNodeClick = (node) => {
        if (node.status === 'active') navigateNode(node);
        else if (node.status === 'completed') setRedoNode(node);
    };

    const handleContinueClick = () => {
        for (const unit of units) {
            const nodes = nodesMap[unit.id] || [];
            const activeNode = nodes.find(n => n.status === 'active');
            if (activeNode) {
                navigateNode(activeNode);
                return;
            }
        }
    };

    const reversedUnits = [...units].reverse();

    return (
        <div>
            {reversedUnits.map((unit) => {
                const reversedNodes = [...(nodesMap[unit.id] || [])].reverse();
                return (
                <div key={unit.id} style={{ marginBottom: 16 }}>
                    <div style={{ backgroundColor: 'var(--surface-color)', padding: 'var(--spacing-4)', position: 'sticky', top: 0, zIndex: 5, borderBottom: '1px solid var(--border-color)' }}>
                        <h2 style={{ margin: 0, fontSize: 18 }}>{unit.title}</h2>
                    </div>

                    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {reversedNodes.map((node) => {
                            const style = getNodeStyle(node);
                            const Icon = style.icon;
                            const isActive = node.status === 'active';
                            const isCompleted = node.status === 'completed';
                            const isLocked = node.status === 'locked';

                            return (
                                <div
                                    key={node.id}
                                    onClick={() => handleNodeClick(node)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 14,
                                        width: '100%',
                                        padding: '12px 16px',
                                        borderRadius: 16,
                                        backgroundColor: isLocked ? 'var(--surface-color)' : style.bg,
                                        border: `2px solid ${isLocked ? style.mutedBorder : style.color}`,
                                        cursor: (isActive || isCompleted) ? 'pointer' : 'default',
                                        transition: 'transform 0.1s',
                                        boxShadow: isActive ? `0 4px 0 ${style.dark}` : isCompleted ? `0 3px 0 ${style.dark}` : 'none',
                                    }}
                                >
                                    <div style={{
                                        width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        backgroundColor: isLocked ? style.muted : style.color,
                                        color: '#fff',
                                    }}>
                                        {isCompleted ? <Check size={22} strokeWidth={3} /> :
                                         isLocked ? <Icon size={20} fill="rgba(255,255,255,0.6)" color="rgba(255,255,255,0.6)" /> :
                                         <Icon size={22} fill="#fff" />}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontWeight: 700, fontSize: 15, color: isLocked ? style.mutedIcon : 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {node.label}
                                        </div>
                                        <div style={{ fontSize: 12, color: isLocked ? style.muted : style.color, fontWeight: 600, marginTop: 2 }}>
                                            {style.label}
                                        </div>
                                    </div>
                                    {isActive && (
                                        <div style={{ fontSize: 12, fontWeight: 800, color: style.color, textTransform: 'uppercase', letterSpacing: '0.5px', flexShrink: 0 }}>
                                            START
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
                );
            })}

            <div style={{
                position: 'fixed',
                bottom: 110,
                left: 24,
                right: 24,
                zIndex: 100,
                display: 'flex',
                justifyContent: 'center'
            }}>
                <button
                    className="primary w-full shadow-lg"
                    style={{
                        maxWidth: 400,
                        fontSize: 18,
                        padding: '18px 24px',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        borderRadius: 16,
                        boxShadow: '0 8px 0 #DCAE45, 0 8px 20px rgba(0,0,0,0.2)'
                    }}
                    onClick={handleContinueClick}
                >
                    CONTINUE
                </button>
            </div>

            {redoNode && (
                <div
                    style={{
                        position: 'fixed', inset: 0, zIndex: 200,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: 24,
                    }}
                    onClick={() => setRedoNode(null)}
                >
                    <div
                        style={{
                            backgroundColor: 'var(--surface-color)',
                            borderRadius: 20, padding: 24, width: '100%', maxWidth: 340,
                            textAlign: 'center',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{
                            width: 56, height: 56, borderRadius: '50%', margin: '0 auto 16px',
                            backgroundColor: getNodeStyle(redoNode).color,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            {React.createElement(getNodeStyle(redoNode).icon, { size: 28, fill: '#fff', color: '#fff' })}
                        </div>
                        <h3 style={{ margin: '0 0 8px', fontSize: 18, color: 'var(--text-main)' }}>{redoNode.label}</h3>
                        <p style={{ margin: '0 0 24px', fontSize: 14, color: 'var(--text-muted)' }}>
                            You already completed this. Redo it?
                        </p>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <button
                                className="secondary"
                                style={{ flex: 1, padding: '14px 16px', fontSize: 15, fontWeight: 700, borderRadius: 12 }}
                                onClick={() => setRedoNode(null)}
                            >
                                Cancel
                            </button>
                            <button
                                className="primary"
                                style={{
                                    flex: 1, padding: '14px 16px', fontSize: 15, fontWeight: 700, borderRadius: 12,
                                    backgroundColor: getNodeStyle(redoNode).color,
                                    boxShadow: `0 4px 0 ${getNodeStyle(redoNode).dark}`,
                                }}
                                onClick={() => { setRedoNode(null); navigateNode(redoNode); }}
                            >
                                Redo
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RoadmapTab;
