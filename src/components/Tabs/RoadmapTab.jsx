import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Zap, Trophy, Pen, Check, Lock, BookOpen, Music, Clapperboard, ChevronDown, Plane, Briefcase, Heart } from 'lucide-react';
import { getUnits, getNodesForUnitWithProgress } from '../../lib/db';
import { getGrammarForUnit } from '../../lib/grammarGuide';
import GrammarGuidebook from '../GrammarGuidebook';
import { useProgress } from '../../context/ProgressContext';
import { useUser } from '../../context/UserContext';
import { loadSettings } from '../../lib/settings';
import SoundButton from '../SoundButton';
import { DEFAULT_LEARNER_MODE, ENABLE_LEARNING_PATH_CHOOSER, getProgressMode, getTopicsForMode, getModeConfig, LEARNER_MODES } from '../../data/learnerModes';
import { useT } from '../../lib/i18n';

const MODE_ICONS = { BookOpen, Plane, Briefcase, Heart };


const NODE_STYLES = {
    orange: { color: '#FFB703', dark: '#CC9202', bg: 'rgba(255,183,3,0.12)', muted: 'rgba(255,183,3,0.35)', mutedBorder: 'rgba(255,183,3,0.25)', mutedIcon: 'rgba(255,183,3,0.5)', icon: MessageCircle, label: 'Vocabulary' },
    blue:   { color: '#1CB0F6', dark: '#0D8ECF', bg: 'rgba(28,176,246,0.12)', muted: 'rgba(28,176,246,0.35)', mutedBorder: 'rgba(28,176,246,0.25)', mutedIcon: 'rgba(28,176,246,0.5)', icon: Music, label: 'Phonetics' },
    purple: { color: '#A78BFA', dark: '#7C3AED', bg: 'rgba(167,139,250,0.12)', muted: 'rgba(167,139,250,0.35)', mutedBorder: 'rgba(167,139,250,0.25)', mutedIcon: 'rgba(167,139,250,0.5)', icon: Pen, label: 'Grammar' },
    green:  { color: '#06D6A0', dark: '#05A67D', bg: 'rgba(6,214,160,0.12)', muted: 'rgba(6,214,160,0.35)', mutedBorder: 'rgba(6,214,160,0.25)', mutedIcon: 'rgba(6,214,160,0.5)', icon: Clapperboard, label: 'Scene' },
    test:   { color: '#EF4444', dark: '#B91C1C', bg: 'rgba(239,68,68,0.12)', muted: 'rgba(239,68,68,0.35)', mutedBorder: 'rgba(239,68,68,0.25)', mutedIcon: 'rgba(239,68,68,0.5)', icon: Zap, label: 'Quiz' },
    gold:   { color: '#F59E0B', dark: '#D97706', bg: 'rgba(245,158,11,0.12)', muted: 'rgba(245,158,11,0.35)', mutedBorder: 'rgba(245,158,11,0.25)', mutedIcon: 'rgba(245,158,11,0.5)', icon: Clapperboard, label: 'Scene' },
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

function getNodeLabel(node, style, t) {
    // Mini-tests get "Quiz" label, module tests show their module type
    if (node.test_scope === 'module') return t('roadmap_type_quiz');
    if (node.test_scope === 'unit') return t('roadmap_type_quizzes');
    const labels = {
        Vocabulary: 'roadmap_type_vocabulary',
        Phonetics: 'roadmap_type_phonetics',
        Grammar: 'roadmap_type_grammar',
        Scene: 'roadmap_type_scene',
        Quiz: 'roadmap_type_quiz',
    };
    return labels[style.label] ? t(labels[style.label]) : style.label;
}

const RoadmapTab = () => {
    const navigate = useNavigate();
    const t = useT();
    const { completedNodes, getNodeSessionCount, SESSIONS_TO_COMPLETE } = useProgress();
    const { userProfile, updateUserProfile } = useUser();
    const currentMode = userProfile?.learnerMode || DEFAULT_LEARNER_MODE;
    const progressMode = getProgressMode(currentMode);
    const modeCompletedNodes = React.useMemo(
        () => completedNodes[progressMode] || new Set(),
        [completedNodes, progressMode]
    );
    const currentSettings = loadSettings();
    const { testMode } = currentSettings;
    const showCefrTags = currentSettings.showCefrTags !== false;
    const units = React.useMemo(() => getUnits(), []);
    const nodesMap = React.useMemo(() => {
        const map = {};
        units.forEach(unit => {
            map[unit.id] = getNodesForUnitWithProgress(unit.id, modeCompletedNodes);
        });
        return map;
    }, [units, modeCompletedNodes]);
    const [redoNode, setRedoNode] = useState(null);
    const [showModePicker, setShowModePicker] = useState(false);
    const [guidebookUnit, setGuidebookUnit] = useState(null);

    // Grammar points per unit (derived from sentence tags) — drives the guidebook button.
    const grammarByUnit = React.useMemo(() => {
        const map = {};
        units.forEach(unit => { map[unit.id] = getGrammarForUnit(unit.id); });
        return map;
    }, [units]);

    // Topic-based filtering from learner mode
    const modeTopics = getTopicsForMode(currentMode);
    const modeConfig = getModeConfig(currentMode);
    const topicCounts = React.useMemo(() => {
        const counts = new Map();
        Object.values(nodesMap).flat().forEach(node => {
            if (
                node.test_scope === 'module' ||
                node.module_type === 'blue' ||
                node.module_type === 'purple' ||
                !node.topic
            ) {
                return;
            }
            counts.set(node.topic, (counts.get(node.topic) || 0) + 1);
        });
        return counts;
    }, [nodesMap]);
    const visibleTopics = React.useMemo(
        () => modeTopics.filter(topic => topicCounts.has(topic.id)),
        [modeTopics, topicCounts]
    );
    const [activeTopic, setActiveTopic] = useState(null);

    React.useEffect(() => {
        setActiveTopic(null);
    }, [currentMode]);

    const navigateNode = (node) => {
        switch (node.type) {
            case 'lesson':
                navigate(`/lesson/${node.content_ref_id}`);
                break;
            case 'skill':
                if (node.skill_content?.type === 'grammar_unit') {
                    navigate(`/grammar-unit/${node.skill_content.grammar_unit_id}?nodeId=${node.id}`);
                } else if (node.skill_content?.type === 'grammar_lesson') {
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

    const isVisibleRoadmapNode = React.useCallback((node) => (
        node.test_scope !== 'module' &&
        node.module_type !== 'blue' &&
        node.module_type !== 'purple' &&
        (!activeTopic || node.topic === activeTopic)
    ), [activeTopic]);

    const handleContinueClick = () => {
        for (const unit of units) {
            const nodes = nodesMap[unit.id] || [];
            const activeNode = nodes.find(n => isVisibleRoadmapNode(n) && n.status === 'active');
            if (activeNode) {
                navigateNode(activeNode);
                return;
            }
        }
    };

    const ModeIcon = MODE_ICONS[modeConfig.icon] || Plane;
    const translateUnitTitle = (unit) => {
        // Take the unit number + name from the title itself (e.g. "Unit 0 — Foundations"),
        // so inserting units doesn't renumber the rest.
        const m = unit.title.match(/^Unit\s+(-?\d+)\s+[—-]\s+(.*)$/i);
        const num = m ? m[1] : unit.order_index;
        const rawTitle = m ? m[2] : unit.title;
        const title = t(`roadmap_unit_${unit.id}`, rawTitle);
        return t('roadmap_unit_title')
            .replace('{unit}', num)
            .replace('{title}', title);
    };
    const translateNodeLabel = (node) => t(`roadmap_node_${node.id}`, node.label);

    return (
        <div>
            {/* Mode switcher + Topic chips - same row, scrollable */}
            <div className="hide-scrollbar" style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '12px 16px',
                overflowX: 'auto',
                position: 'sticky',
                top: 0,
                zIndex: 10,
                backgroundColor: 'var(--bg-color)',
                borderBottom: '1px solid var(--border-color)',
            }}>
                {ENABLE_LEARNING_PATH_CHOOSER && (
                    <>
                        {/* Mode switcher button */}
                        <button
                            onClick={() => setShowModePicker(true)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                padding: '6px 10px', borderRadius: 20,
                                backgroundColor: `${modeConfig.color}15`,
                                border: `2px solid ${modeConfig.color}`,
                                cursor: 'pointer', fontFamily: 'inherit',
                                flexShrink: 0,
                            }}
                        >
                            <div style={{
                                width: 22, height: 22, borderRadius: 6,
                                backgroundColor: modeConfig.color,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <ModeIcon size={12} color="#fff" />
                            </div>
                            <ChevronDown size={14} color={modeConfig.color} />
                        </button>

                        {/* Divider */}
                        <div style={{ width: 1, height: 24, backgroundColor: 'var(--border-color)', flexShrink: 0 }} />
                    </>
                )}

                {/* Topic chips */}
                <button
                    onClick={() => setActiveTopic(null)}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '6px 14px', borderRadius: 20,
                        border: `2px solid ${activeTopic === null ? modeConfig.color : 'var(--border-color)'}`,
                        backgroundColor: activeTopic === null ? `${modeConfig.color}15` : 'transparent',
                        color: activeTopic === null ? modeConfig.color : 'var(--text-muted)',
                        fontWeight: 700, fontSize: 13,
                        cursor: 'pointer', whiteSpace: 'nowrap',
                        transition: 'all 0.15s',
                        fontFamily: 'inherit',
                        flexShrink: 0,
                    }}
                >
                    {t('roadmap_filter_all')}
                </button>
                {visibleTopics.map(topic => {
                    const isActive = activeTopic === topic.id;
                    const color = modeConfig.color;
                    return (
                        <button
                            key={topic.id}
                            onClick={() => setActiveTopic(topic.id)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                padding: '6px 14px', borderRadius: 20,
                                border: `2px solid ${isActive ? color : 'var(--border-color)'}`,
                                backgroundColor: isActive ? `${color}15` : 'transparent',
                                color: isActive ? color : 'var(--text-muted)',
                                fontWeight: 700, fontSize: 13,
                                cursor: 'pointer', whiteSpace: 'nowrap',
                                transition: 'all 0.15s',
                                fontFamily: 'inherit',
                                flexShrink: 0,
                            }}
                        >
                            {t(`roadmap_topic_${topic.id}`, topic.label)}
                            <span style={{
                                fontSize: 11,
                                lineHeight: 1,
                                padding: '2px 6px',
                                borderRadius: 999,
                                backgroundColor: isActive ? `${color}22` : 'var(--surface-color-light)',
                                color: isActive ? color : 'var(--text-muted)',
                            }}>
                                {topicCounts.get(topic.id)}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Mode picker modal */}
            {ENABLE_LEARNING_PATH_CHOOSER && showModePicker && (
                <div
                    style={{
                        position: 'fixed', inset: 0, zIndex: 200,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: 24,
                    }}
                    onClick={() => setShowModePicker(false)}
                >
                    <div
                        style={{
                            backgroundColor: 'var(--surface-color)',
                            borderRadius: 20, padding: 20, width: '100%', maxWidth: 340,
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 800, color: 'var(--text-main)', textAlign: 'center' }}>
                            {t('learning_path')}
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {Object.values(LEARNER_MODES).map(mode => {
                                const Icon = MODE_ICONS[mode.icon] || Plane;
                                const isActive = currentMode === mode.id;
                                const isEnabled = mode.enabled !== false;
                                return (
                                    <button
                                        key={mode.id}
                                        disabled={!isEnabled}
                                        onClick={() => {
                                            if (!isEnabled) return;
                                            updateUserProfile({ learnerMode: mode.id });
                                            setShowModePicker(false);
                                        }}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 12,
                                            padding: '14px 16px', borderRadius: 14,
                                            backgroundColor: isActive ? `${mode.color}15` : 'var(--bg-color)',
                                            border: `2px solid ${isActive ? mode.color : 'var(--border-color)'}`,
                                            cursor: isEnabled ? 'pointer' : 'not-allowed', fontFamily: 'inherit',
                                            transition: 'all 0.15s',
                                            opacity: isEnabled ? 1 : 0.45,
                                        }}
                                    >
                                        <div style={{
                                            width: 40, height: 40, borderRadius: 10,
                                            backgroundColor: mode.color,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            flexShrink: 0,
                                        }}>
                                            <Icon size={22} color="#fff" />
                                        </div>
                                        <div style={{ flex: 1, textAlign: 'left' }}>
                                            <div style={{ fontWeight: 700, fontSize: 15, color: isActive ? mode.color : 'var(--text-main)' }}>
                                                {t(`learner_mode_${mode.id}`, mode.label)}
                                            </div>
                                            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                                                {isEnabled ? t(`learner_mode_${mode.id}_description`, mode.description) : t('roadmap_coming_later')}
                                            </div>
                                        </div>
                                        {isActive && (
                                            <Check size={20} color={mode.color} strokeWidth={3} />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {units.map((unit) => {
                const nodes = nodesMap[unit.id] || [];
                const visibleNodes = nodes.filter(isVisibleRoadmapNode);
                if (visibleNodes.length === 0) return null;

                const quizByParent = {};
                nodes.forEach(n => {
                    if (n.test_scope === 'module' && n.source_node_id) {
                        quizByParent[n.source_node_id] = n;
                    }
                });

                return (
                    <div key={unit.id} style={{ marginBottom: 16 }}>
                        <div style={{ backgroundColor: 'var(--surface-color)', padding: 'var(--spacing-4)', position: 'sticky', top: 54, zIndex: 5, borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: 12 }}>
                            <h2 style={{ margin: 0, fontSize: 18, flex: 1 }}>{translateUnitTitle(unit)}</h2>
                            {(grammarByUnit[unit.id]?.length > 0) && (
                                <button
                                    onClick={() => setGuidebookUnit(unit)}
                                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 20, border: '1.5px solid var(--secondary-color)', backgroundColor: 'transparent', color: 'var(--secondary-color)', fontSize: 13, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}
                                    title="See the grammar taught in this unit"
                                >
                                    <BookOpen size={16} /> {t('roadmap_guidebook', 'Guidebook')}
                                </button>
                            )}
                        </div>

                        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {visibleNodes.map((node) => {
                                const style = getNodeStyle(node);
                                const Icon = style.icon;
                                const isActive = node.status === 'active';
                                const isCompleted = node.status === 'completed';
                                // When testMode is off, treat ALL nodes as locked
                                const isLocked = !testMode || node.status === 'locked';
                                const sublabel = getNodeLabel(node, style, t);
                                const sessionCount = getNodeSessionCount(node.id, progressMode);
                                const sessionsTarget = node.sessions_required || (node.skill_content?.type === 'grammar_unit' ? 2 : SESSIONS_TO_COMPLETE);
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
                                                        {translateNodeLabel(node)}
                                                    </div>
                                                    <div style={{ fontSize: 12, color: isLocked ? style.muted : style.color, fontWeight: 600, marginTop: 2 }}>
                                                        {sublabel}{hasProgress && ` · ${sessionCount}/${sessionsTarget}`}
                                                    </div>
                                                    {showCefrTags && (node.cefr_level || node.difficulty) && (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                                                            {node.cefr_level && (
                                                                <span style={{
                                                                    fontSize: 10, fontWeight: 700, lineHeight: 1,
                                                                    padding: '2px 5px', borderRadius: 6,
                                                                    backgroundColor: isLocked ? 'var(--surface-color)' : `${style.color}18`,
                                                                    color: isLocked ? style.muted : style.color,
                                                                    border: `1px solid ${isLocked ? style.mutedBorder : `${style.color}30`}`,
                                                                }}>
                                                                    {node.cefr_level}
                                                                </span>
                                                            )}
                                                            {node.difficulty && (() => {
                                                                const total = 5;
                                                                const filled = Math.max(0, Math.min(total, Math.ceil(node.difficulty / 2)));
                                                                return (
                                                                    <span style={{ fontSize: 8, letterSpacing: 1, color: isLocked ? style.muted : `${style.color}90` }}>
                                                                        {'●'.repeat(filled)}{'○'.repeat(total - filled)}
                                                                    </span>
                                                                );
                                                            })()}
                                                        </div>
                                                    )}
                                                </div>
                                                {testMode && isActive && !hasProgress && (
                                                    <div style={{ fontSize: 12, fontWeight: 800, color: style.color, textTransform: 'uppercase', letterSpacing: '0.5px', flexShrink: 0 }}>
                                                        {t('start_upper')}
                                                    </div>
                                                )}
                                                {testMode && hasProgress && (
                                                    <div style={{ fontSize: 12, fontWeight: 800, color: style.color, textTransform: 'uppercase', letterSpacing: '0.5px', flexShrink: 0 }}>
                                                        {t('continue_upper')}
                                                    </div>
                                                )}
                                            </div>
                                            {/* Segmented progress bar */}
                                            {testMode && (isActive || hasProgress || isCompleted) && (
                                                <div style={{ display: 'flex', gap: 3, padding: '0 16px 8px' }}>
                                                    {Array.from({ length: sessionsTarget }, (_, i) => (
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

                                        {/* Trophy endcap — quiz tap target, or completion badge */}
                                        {quiz ? (
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
                                        ) : isCompleted && (
                                            <div style={{
                                                width: 52, flexShrink: 0,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                backgroundColor: style.color,
                                                borderLeft: `1.5px dashed ${style.color}`,
                                            }}>
                                                <Trophy size={22} color="#fff" fill="#fff" />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                    </div>
                );
            })}

            <div className="roadmap-bottom-spacer" aria-hidden="true" />

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
                            boxShadow: '0 8px 0 #B03E2D, 0 8px 20px rgba(0,0,0,0.2)'
                        }}
                        onClick={handleContinueClick}
                    >
                        {t('continue_upper')}
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
                            boxShadow: '0 8px 0 #B03E2D, 0 8px 20px rgba(0,0,0,0.2)',
                            opacity: 0.5,
                            cursor: 'not-allowed',
                        }}
                    >
                        {t('coming_soon_upper')}
                    </SoundButton>
                )}
            </div>

            {guidebookUnit && (
                <GrammarGuidebook
                    unitTitle={translateUnitTitle(guidebookUnit)}
                    points={grammarByUnit[guidebookUnit.id] || []}
                    onClose={() => setGuidebookUnit(null)}
                />
            )}

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
                        <h3 style={{ margin: '0 0 8px', fontSize: 18, color: 'var(--text-main)' }}>{translateNodeLabel(redoNode)}</h3>
                        <p style={{ margin: '0 0 24px', fontSize: 14, color: 'var(--text-muted)' }}>
                            {t('roadmap_redo_prompt')}
                        </p>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <button
                                className="secondary"
                                style={{ flex: 1, padding: '14px 16px', fontSize: 15, fontWeight: 700, borderRadius: 12 }}
                                onClick={() => setRedoNode(null)}
                            >
                                {t('cancel')}
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
                                {t('roadmap_redo')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RoadmapTab;
