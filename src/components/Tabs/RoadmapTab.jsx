import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Zap, Trophy, BookOpenText, Check, Lock, BookOpen, Music, Theater, ChevronRight } from 'lucide-react';
import { getUnits, getNodesForUnitWithProgress } from '../../lib/db';
import { getDueItems } from '../../lib/srs';
import { useDong } from '../../context/DongContext';
import { loadSettings } from '../TopBar';
import SoundButton from '../SoundButton';

// ── Bonus shelf config: contextual shortcuts shown after each phase ──
// These are purely UI links — they don't affect the curriculum, SRS, or completedNodes.
const PHASE_BONUS_SHELVES = {
    phase_1_first_words: [
        { emoji: '🎵', label: 'Tone Basics', sublabel: 'Practice', route: '/practice/tones-1', color: '#1CB0F6' },
        { emoji: '🔤', label: 'Vowel Sounds', sublabel: 'Practice', route: '/practice/vowels-single-1', color: '#1CB0F6' },
        { emoji: '✏️', label: 'Tone Marks', sublabel: 'Practice', route: '/practice/tonemarks-basic', color: '#1CB0F6' },
    ],
    phase_2_polite: [
        { emoji: '👪', label: 'Kinship Terms', sublabel: 'Practice', route: '/practice/kinship-foundation', color: '#A78BFA' },
        { emoji: '🗣️', label: 'Pronouns: Core', sublabel: 'Practice', route: '/practice/pronouns-1', color: '#A78BFA' },
        { emoji: '🎵', label: 'All 6 Tones', sublabel: 'Practice', route: '/practice/tones-4', color: '#1CB0F6' },
    ],
    phase_3_cafe: [
        { emoji: '☕', label: 'At the Café', sublabel: 'Scene', route: '/scene/scene_cafe_001', color: '#F59E0B' },
        { emoji: '🔢', label: 'Numbers 0-10', sublabel: 'Practice', route: '/practice/numbers-1', color: '#06D6A0' },
        { emoji: '⌨️', label: 'TELEX Typing', sublabel: 'Practice', route: '/practice/telex-1', color: '#06D6A0' },
    ],
    phase_4_food: [
        { emoji: '🎯', label: 'Pitch: Easy', sublabel: 'Practice', route: '/practice/pitch-1', color: '#1CB0F6' },
        { emoji: '📖', label: 'Classifiers', sublabel: 'Practice', route: '/practice/classifiers-1', color: '#A78BFA' },
        { emoji: '🔢', label: 'Number Challenge', sublabel: 'Practice', route: '/practice/numbers-3', color: '#06D6A0' },
    ],
    phase_5_market: [
        { emoji: '🧮', label: 'Kinship Calc', sublabel: 'Tool', route: '/practice/kinship-calculator', color: '#A78BFA' },
        { emoji: '🗣️', label: 'Pronouns+', sublabel: 'Practice', route: '/practice/pronouns-2', color: '#A78BFA' },
        { emoji: '📝', label: 'Particles', sublabel: 'Practice', route: '/practice/particles-1', color: '#06D6A0' },
    ],
    phase_6_numbers: [
        { emoji: '🎯', label: 'Pitch: Hard', sublabel: 'Practice', route: '/practice/pitch-2', color: '#1CB0F6' },
        { emoji: '💬', label: 'Teen Code', sublabel: 'Practice', route: '/practice/teencode-1', color: '#EF4444' },
        { emoji: '❓', label: 'Question Words', sublabel: 'Practice', route: '/practice/question-words-1', color: '#06D6A0' },
    ],
    phase_7_transport: [
        { emoji: '🔗', label: 'Connectors', sublabel: 'Practice', route: '/practice/connectors', color: '#A78BFA' },
        { emoji: '📏', label: 'Prepositions', sublabel: 'Practice', route: '/practice/prepositions', color: '#06D6A0' },
        { emoji: '⌨️', label: 'TELEX Full', sublabel: 'Practice', route: '/practice/telex-3', color: '#06D6A0' },
    ],
    phase_8_daily: [
        { emoji: '⏱️', label: 'Aspect Markers', sublabel: 'Practice', route: '/practice/aspect-markers', color: '#A78BFA' },
        { emoji: '💪', label: 'Intensifiers', sublabel: 'Practice', route: '/practice/intensifiers', color: '#06D6A0' },
        { emoji: '🔤', label: 'Vowels: Adv', sublabel: 'Practice', route: '/practice/vowels-diph-3', color: '#1CB0F6' },
    ],
    phase_9_social: [
        { emoji: '🎛️', label: 'Pronoun Engine', sublabel: 'Tool', route: '/practice/kinship-engine', color: '#A78BFA' },
        { emoji: '📐', label: 'Quantifiers', sublabel: 'Practice', route: '/practice/quantifiers', color: '#06D6A0' },
        { emoji: '🎓', label: 'Degree Adverbs', sublabel: 'Practice', route: '/practice/degree-adverbs', color: '#06D6A0' },
    ],
};

const NODE_STYLES = {
    orange: { color: '#FFB703', dark: '#CC9202', bg: 'rgba(255,183,3,0.12)', muted: 'rgba(255,183,3,0.35)', mutedBorder: 'rgba(255,183,3,0.25)', mutedIcon: 'rgba(255,183,3,0.5)', icon: MessageCircle, label: 'Conversation' },
    blue:   { color: '#1CB0F6', dark: '#0D8ECF', bg: 'rgba(28,176,246,0.12)', muted: 'rgba(28,176,246,0.35)', mutedBorder: 'rgba(28,176,246,0.25)', mutedIcon: 'rgba(28,176,246,0.5)', icon: Music, label: 'Phonetics' },
    purple: { color: '#A78BFA', dark: '#7C3AED', bg: 'rgba(167,139,250,0.12)', muted: 'rgba(167,139,250,0.35)', mutedBorder: 'rgba(167,139,250,0.25)', mutedIcon: 'rgba(167,139,250,0.5)', icon: Zap, label: 'Skill' },
    green:  { color: '#06D6A0', dark: '#05A67D', bg: 'rgba(6,214,160,0.12)', muted: 'rgba(6,214,160,0.35)', mutedBorder: 'rgba(6,214,160,0.25)', mutedIcon: 'rgba(6,214,160,0.5)', icon: BookOpenText, label: 'Grammar' },
    test:   { color: '#EF4444', dark: '#B91C1C', bg: 'rgba(239,68,68,0.12)', muted: 'rgba(239,68,68,0.35)', mutedBorder: 'rgba(239,68,68,0.25)', mutedIcon: 'rgba(239,68,68,0.5)', icon: Trophy, label: 'Quiz' },
    gold:   { color: '#F59E0B', dark: '#D97706', bg: 'rgba(245,158,11,0.12)', muted: 'rgba(245,158,11,0.35)', mutedBorder: 'rgba(245,158,11,0.25)', mutedIcon: 'rgba(245,158,11,0.5)', icon: Theater, label: 'Scene' },
};

function getNodeStyle(node) {
    // Module-type based coloring (new cycle system)
    if (node.module_type === 'orange') return NODE_STYLES.orange;
    if (node.module_type === 'blue') return NODE_STYLES.blue;
    if (node.module_type === 'purple') return NODE_STYLES.purple;
    if (node.module_type === 'green') return NODE_STYLES.green;
    if (node.module_type === 'test') return NODE_STYLES.test;
    if (node.module_type === 'gold') return NODE_STYLES.gold;

    // Fallback for legacy nodes without module_type
    if (node.type === 'test') return NODE_STYLES.test;
    if (node.type === 'skill' && node.skill_content?.type === 'grammar_lesson') return NODE_STYLES.green;
    if (node.type === 'skill') return NODE_STYLES.purple;
    return NODE_STYLES.orange;
}

function getNodeLabel(node, style) {
    // Mini-tests get "Quiz" label, module tests show their module type
    if (node.test_scope === 'module') return 'Quiz';
    if (node.test_scope === 'unit') return 'Quizzes';
    return style.label;
}

const RoadmapTab = ({ onNavigateToVocabDeck } = {}) => {
    const navigate = useNavigate();
    const { completedNodes, getNodeSessionCount, SESSIONS_TO_COMPLETE } = useDong();
    const { testMode } = loadSettings();
    const [units, setUnits] = useState([]);
    const [nodesMap, setNodesMap] = useState({});
    const [dueCount, setDueCount] = useState(0);
    const [redoNode, setRedoNode] = useState(null);
    const activeFilters = new Set(['orange', 'test', 'gold']);

    useEffect(() => {
        const fetchedUnits = getUnits();
        setUnits(fetchedUnits);

        const map = {};
        fetchedUnits.forEach(unit => {
            map[unit.id] = getNodesForUnitWithProgress(unit.id, completedNodes);
        });
        setNodesMap(map);
        setDueCount(getDueItems().length);
    }, [completedNodes]);

    const navigateNode = (node) => {
        switch (node.type) {
            case 'lesson':
                navigate(`/lesson/${node.content_ref_id}`);
                break;
            case 'skill':
                if (node.skill_content?.type === 'grammar_lesson') {
                    navigate(`/grammar-lesson/${node.id}`);
                } else if (node.skill_content?.route) {
                    navigate(`${node.skill_content.route}?nodeId=${node.id}`);
                } else if (node.practice_route) {
                    navigate(`${node.practice_route}?nodeId=${node.id}`);
                }
                break;
            case 'test':
                navigate(`/test/${node.id}`);
                break;
            case 'scene':
                navigate(`/scene/${node.scene_id}`);
                break;
            default:
                if (node.practice_route) navigate(node.practice_route);
                else navigate(`/lesson/${node.content_ref_id}`);
        }
    };

    const handleNodeClick = (node) => {
        if (node.status === 'active' || (testMode && node.status === 'locked')) navigateNode(node);
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

    return (
        <div>
            {dueCount > 0 && (
                <button
                    onClick={() => onNavigateToVocabDeck?.('__srs__')}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        width: 'calc(100% - 32px)', margin: '16px auto',
                        padding: '12px 16px', borderRadius: 12,
                        backgroundColor: 'rgba(28, 176, 246, 0.1)',
                        border: '1px solid rgba(28, 176, 246, 0.3)',
                        color: '#1CB0F6', fontWeight: 700, fontSize: 14,
                        cursor: 'pointer', fontFamily: 'inherit',
                    }}
                >
                    <BookOpen size={20} />
                    <span>{dueCount} word{dueCount > 1 ? 's' : ''} to review</span>
                    <span style={{ marginLeft: 'auto', fontSize: 12, opacity: 0.7 }}>Tap to review</span>
                </button>
            )}
            {/* Skills moved to Practice tab — no filter chips needed */}

            {units.map((unit) => (
                <div key={unit.id} style={{ marginBottom: 16 }}>
                    <div style={{ backgroundColor: 'var(--surface-color)', padding: 'var(--spacing-4)', position: 'sticky', top: 0, zIndex: 5, borderBottom: '1px solid var(--border-color)' }}>
                        <h2 style={{ margin: 0, fontSize: 18 }}>{unit.title}</h2>
                    </div>

                    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {(() => {
                            const nodes = nodesMap[unit.id] || [];
                            const quizByParent = {};
                            nodes.forEach(n => {
                                if (n.test_scope === 'module' && n.source_node_id) {
                                    quizByParent[n.source_node_id] = n;
                                }
                            });
                            return nodes.filter(n => n.test_scope !== 'module').filter(n => {
                                return activeFilters.has(n.module_type || 'orange');
                            }).map((node) => {
                                const style = getNodeStyle(node);
                                const Icon = style.icon;
                                const isActive = node.status === 'active';
                                const isCompleted = node.status === 'completed';
                                // When testMode is off, treat ALL nodes as locked
                                const isLocked = !testMode || node.status === 'locked';
                                const sublabel = getNodeLabel(node, style);
                                const sessionCount = getNodeSessionCount(node.id);
                                const hasProgress = testMode && sessionCount > 0 && !isCompleted;
                                const quiz = quizByParent[node.id];
                                const quizDone = quiz?.status === 'completed';
                                const quizReady = quiz?.status === 'active';

                                return (
                                    <div
                                        key={node.id}
                                        style={{
                                            display: 'flex', alignItems: 'stretch',
                                            width: '100%',
                                            borderRadius: 16,
                                            border: `2px solid ${isLocked ? style.mutedBorder : style.color}`,
                                            boxShadow: !isLocked && isActive ? `0 4px 0 ${style.dark}` : !isLocked && isCompleted ? `0 3px 0 ${style.dark}` : 'none',
                                            overflow: 'hidden',
                                            transition: 'transform 0.1s',
                                        }}
                                    >
                                        {/* Main card content */}
                                        <div
                                            onClick={() => testMode && handleNodeClick(node)}
                                            style={{
                                                flex: 1, minWidth: 0,
                                                display: 'flex', flexDirection: 'column',
                                                backgroundColor: isLocked ? 'var(--surface-color)' : style.bg,
                                                cursor: testMode && (isActive || isCompleted) ? 'pointer' : 'default',
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px' }}>
                                                <div style={{
                                                    width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    backgroundColor: isLocked ? style.muted : style.color,
                                                    color: '#fff',
                                                }}>
                                                    {!isLocked && isCompleted ? <Check size={22} strokeWidth={3} /> :
                                                        isLocked ? <Icon size={20} fill="rgba(255,255,255,0.6)" color="rgba(255,255,255,0.6)" /> :
                                                            <Icon size={22} fill="#fff" />}
                                                </div>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ fontWeight: 700, fontSize: 15, color: isLocked ? style.mutedIcon : 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {node.label}
                                                    </div>
                                                    <div style={{ fontSize: 12, color: isLocked ? style.muted : style.color, fontWeight: 600, marginTop: 2 }}>
                                                        {sublabel}{hasProgress && ` · ${sessionCount}/${SESSIONS_TO_COMPLETE}`}
                                                    </div>
                                                </div>
                                                {testMode && isActive && !hasProgress && (
                                                    <div style={{ fontSize: 12, fontWeight: 800, color: style.color, textTransform: 'uppercase', letterSpacing: '0.5px', flexShrink: 0 }}>
                                                        START
                                                    </div>
                                                )}
                                                {testMode && hasProgress && (
                                                    <div style={{ fontSize: 12, fontWeight: 800, color: style.color, textTransform: 'uppercase', letterSpacing: '0.5px', flexShrink: 0 }}>
                                                        CONTINUE
                                                    </div>
                                                )}
                                            </div>
                                            {/* Segmented progress bar */}
                                            {testMode && (isActive || hasProgress || isCompleted) && (
                                                <div style={{ display: 'flex', gap: 3, padding: '0 16px 8px' }}>
                                                    {Array.from({ length: SESSIONS_TO_COMPLETE }, (_, i) => (
                                                        <div key={i} style={{
                                                            flex: 1, height: 6, borderRadius: 3,
                                                            backgroundColor: i < sessionCount || isCompleted
                                                                ? style.color
                                                                : isLocked ? style.mutedBorder : `${style.color}30`,
                                                        }} />
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Quiz endcap strip */}
                                        {quiz && (
                                            <div
                                                onClick={(e) => { e.stopPropagation(); if (testMode) handleNodeClick(quiz); }}
                                                style={{
                                                    width: 52, flexShrink: 0,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    backgroundColor: !isLocked && quizDone ? style.color : !isLocked && quizReady ? `${style.color}30` : isLocked ? 'var(--surface-color)' : `${style.color}15`,
                                                    borderLeft: `1.5px dashed ${isLocked ? style.mutedBorder : style.color}`,
                                                    cursor: testMode && (quizReady || quizDone) ? 'pointer' : 'default',
                                                }}
                                            >
                                                <Trophy size={22}
                                                    color={!isLocked && quizDone ? '#fff' : !isLocked && quizReady ? style.color : style.muted}
                                                    fill={!isLocked && quizDone ? '#fff' : 'none'}
                                                />
                                            </div>
                                        )}
                                    </div>
                                );
                            });
                        })()}
                    </div>

                    {/* Bonus shelf — contextual practice shortcuts */}
                    {PHASE_BONUS_SHELVES[unit.id] && (
                        <div style={{ padding: '4px 16px 12px' }}>
                            <div style={{
                                fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                                letterSpacing: 1.5, color: 'var(--text-muted)',
                                marginBottom: 8, paddingLeft: 2,
                            }}>
                                Explore & Practice
                            </div>
                            <div className="hide-scrollbar" style={{
                                display: 'flex', gap: 8, overflowX: 'auto',
                                paddingBottom: 4,
                            }}>
                                {PHASE_BONUS_SHELVES[unit.id].map((item, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => navigate(item.route)}
                                        style={{
                                            flexShrink: 0,
                                            display: 'flex', alignItems: 'center', gap: 10,
                                            padding: '10px 14px',
                                            borderRadius: 12,
                                            border: `1.5px solid ${item.color}30`,
                                            backgroundColor: `${item.color}0D`,
                                            cursor: 'pointer',
                                            color: 'var(--text-main)',
                                            minWidth: 0,
                                        }}
                                    >
                                        <span style={{ fontSize: 20, lineHeight: 1 }}>{item.emoji}</span>
                                        <div style={{ textAlign: 'left' }}>
                                            <div style={{
                                                fontSize: 13, fontWeight: 700,
                                                whiteSpace: 'nowrap',
                                                color: 'var(--text-main)',
                                            }}>
                                                {item.label}
                                            </div>
                                            <div style={{
                                                fontSize: 10, fontWeight: 600,
                                                color: item.color,
                                                textTransform: 'uppercase',
                                                letterSpacing: 0.5,
                                            }}>
                                                {item.sublabel}
                                            </div>
                                        </div>
                                        <ChevronRight size={14} color={item.color} style={{ flexShrink: 0, opacity: 0.6 }} />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ))}

            <div className="roadmap-continue-wrapper">
                {testMode ? (
                    <SoundButton
                        id="roadmap-continue-btn"
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
                    </SoundButton>
                ) : (
                    <SoundButton
                        id="roadmap-continue-btn"
                        className="disabled w-full shadow-lg"
                        style={{
                            maxWidth: 400,
                            fontSize: 18,
                            padding: '18px 24px',
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                            borderRadius: 16,
                            boxShadow: '0 8px 0 #DCAE45, 0 8px 20px rgba(0,0,0,0.2)',
                            opacity: 0.5,
                            cursor: 'not-allowed',
                        }}
                    >
                        COMING SOON
                    </SoundButton>
                )}
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
