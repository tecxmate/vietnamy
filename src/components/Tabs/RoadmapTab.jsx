import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Zap, Trophy, Pen, Check, Lock, BookOpen, Music, Clapperboard, ChevronDown, ChevronRight, Plane, Briefcase, Heart, Flame, Sparkles, Bell, Layers, Headphones, Mic, PencilLine, X } from 'lucide-react';
import { getUnits, getNodesForUnitWithProgress } from '../../lib/roadmapDb';
import { getCanonicalLessonContent } from '../../lib/content/canonicalCurriculumStore';
import GrammarGuidebook from '../GrammarGuidebook';
import RecommendedNext from '../RecommendedNext';
import { useProgress } from '../../context/ProgressContext';
import { useUser } from '../../context/UserContext';
import { useNotifications } from '../../context/NotificationContext';
import { loadSettings } from '../../lib/settings';
import SoundButton from '../SoundButton';
import { DEFAULT_LEARNER_MODE, ALL_LEARNER_MODE, ENABLE_LEARNING_PATH_CHOOSER, getProgressMode, getTopicsForMode, getModeConfig, LEARNER_MODES } from '../../data/learnerModes';
import { useT, normalizeLang } from '../../lib/i18n';
import MobileAccountBar from '../MobileAccountBar';
import { getDueItems } from '../../lib/srs';

const MODE_ICONS = { BookOpen, Plane, Briefcase, Heart };
const BeKhe = React.lazy(() => import('../BeKhe/BeKhe'));


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
    if (node.type === 'skill') return NODE_STYLES.purple;
    return NODE_STYLES.orange;
}

function getNodeLabel(node, style, t) {
    // Mini-tests get "Quiz" label, module tests show their module type
    if (node.test_scope === 'module') return t('roadmap_type_quiz');
    if (node.test_scope === 'unit') return t('roadmap_type_quizzes');
    // Foundations nodes are pronunciation drills, not vocab lessons.
    if (node.unit_id === 'phase_0_foundations') return t('roadmap_type_phonetics');
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
    const { completedNodes, getNodeSessionCount, SESSIONS_TO_COMPLETE, dailyStreak, getStreakStatus, consumeStreakMoment } = useProgress();
    const [streakMoment, setStreakMoment] = useState(null);
    const { userProfile, updateUserProfile } = useUser();
    const { unreadCount, openPanel } = useNotifications();
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
    const [grammarByUnit, setGrammarByUnit] = useState({});
    const [recommendedNodeIds, setRecommendedNodeIds] = useState(() => new Set());
    const [emptyLine, setEmptyLine] = useState(null);
    const [previewNode, setPreviewNode] = useState(null);

    React.useEffect(() => {
        let cancelled = false;
        import('../../lib/grammarGuide').then(({ getGrammarForUnit }) => {
            if (cancelled) return;
            const map = {};
            units.forEach(unit => { map[unit.id] = getGrammarForUnit(unit.id); });
            setGrammarByUnit(map);
        }).catch(() => {
            if (!cancelled) setGrammarByUnit({});
        });
        return () => { cancelled = true; };
    }, [units]);

    React.useEffect(() => {
        let cancelled = false;
        import('../../lib/recommendations').then(({ getRecommendations }) => {
            if (cancelled) return;
            const { recs } = getRecommendations(modeCompletedNodes, currentMode, { limit: 3 });
            setRecommendedNodeIds(new Set(recs.map(r => r.lesson?.nodeId).filter(Boolean)));
        }).catch(() => {
            if (!cancelled) setRecommendedNodeIds(new Set());
        });
        return () => { cancelled = true; };
    }, [modeCompletedNodes, currentMode]);

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
        setPreviewNode(node);
    };

    const modeTopicIds = React.useMemo(() => new Set(modeTopics.map(tp => tp.id)), [modeTopics]);
    const isVisibleRoadmapNode = React.useCallback((node) => (
        // Pronunciation (blue) and Grammar (purple) are first-class unit modules again
        // (4-module structure). Only module-scope mini-quizzes stay hidden.
        node.test_scope !== 'module' &&
        // The learning goal SHAPES the path: topic-bearing nodes outside the
        // current goal's topics are hidden ("All" shows the union; foundations,
        // grammar and tests carry no topic and appear in every goal).
        (currentMode === ALL_LEARNER_MODE || !node.topic || modeTopicIds.has(node.topic)) &&
        (!activeTopic || node.topic === activeTopic)
    ), [activeTopic, currentMode, modeTopicIds]);

    // Per-goal unlock: re-derive status over the goal-visible subsequence so the
    // path stays continuous when off-goal nodes are hidden (otherwise the linear
    // "active" node could be an invisible one and the path would appear stuck).
    // Unit gate stays the previous unit's test (tests are visible in every goal).
    const visibleNodesMap = React.useMemo(() => {
        const out = {};
        let prevTestId = null;
        for (const unit of units) {
            const vis = (nodesMap[unit.id] || []).filter(isVisibleRoadmapNode);
            out[unit.id] = vis.map((n, i) => {
                let status;
                if (modeCompletedNodes.has(n.id)) status = 'completed';
                else if (i === 0) status = (!prevTestId || modeCompletedNodes.has(prevTestId)) ? 'active' : 'locked';
                else status = modeCompletedNodes.has(vis[i - 1].id) ? 'active' : 'locked';
                return n.status === status ? n : { ...n, status };
            });
            const unitTest = vis.find(n => n.type === 'test' && n.test_scope !== 'module');
            if (unitTest) prevTestId = unitTest.id;
        }
        return out;
    }, [units, nodesMap, isVisibleRoadmapNode, modeCompletedNodes]);

    const hasAnyVisibleNodes = React.useMemo(
        () => units.some(unit => (visibleNodesMap[unit.id] || []).length > 0),
        [units, visibleNodesMap]
    );

    const handleRecommendedLessonSelect = React.useCallback((lessonId) => {
        const node = Object.values(visibleNodesMap).flat().find(n => n.content_ref_id === lessonId)
            || Object.values(nodesMap).flat().find(n => n.content_ref_id === lessonId);
        if (!node) {
            navigate(`/lesson/${lessonId}`);
            return;
        }
        setPreviewNode(node.status === 'locked' ? { ...node, status: 'active' } : node);
    }, [navigate, nodesMap, visibleNodesMap]);

    const mascotLang = normalizeLang(userProfile?.nativeLang);

    React.useEffect(() => {
        if (hasAnyVisibleNodes) {
            setEmptyLine(null);
            return undefined;
        }

        let cancelled = false;
        import('../../lib/mascot').then(({ getLine }) => {
            if (!cancelled) setEmptyLine(getLine('empty', { slot: 'roadmap', lang: mascotLang }));
        }).catch(() => {
            if (!cancelled) setEmptyLine(null);
        });

        return () => { cancelled = true; };
    }, [hasAnyVisibleNodes, mascotLang]);

    // Bé Khế streak moment on entering Study — at most one, once per day.
    // Pick the single canonical kind for the current streak state, THEN gate it
    // (don't let an already-shown kind fall through to a different one).
    React.useEffect(() => {
        const s = getStreakStatus();
        let kind = null, cat = null;
        if (s.brokenFrom > 0) { kind = 'lost'; cat = 'streak_lost'; }
        else if (s.awayDays != null && s.awayDays >= 3) { kind = 'return'; cat = 'return'; }
        else if (s.atRisk) { kind = 'save'; cat = 'streak_save'; }
        if (kind && consumeStreakMoment(kind)) {
            import('../../lib/mascot').then(({ getLine }) => {
                const r = getLine(cat, { lang: mascotLang });
                // Intentional one-shot greeting on mount, gated to once/day.
                if (r) setStreakMoment(r);
            }).catch(() => {});
        }
    }, [getStreakStatus, consumeStreakMoment, mascotLang]);

    const handleContinueClick = async () => {
        for (const unit of units) {
            const nodes = visibleNodesMap[unit.id] || [];
            const activeNode = nodes.find(n => n.status === 'active');
            if (activeNode) {
                // Sequencer-primary (Layer 3+): when the next linear step is a LESSON,
                // follow the sequencer's top pick instead (purpose/performance-aware,
                // prereq-safe). Non-lesson nodes (foundations practice, grammar units,
                // tests) keep their hard order — they're the structural spine.
                // When the user has FILTERED the roadmap to a topic, respect the
                // filter: stay linear within it (no surprise off-topic jumps).
                if (activeNode.type === 'lesson' && !activeTopic) {
                    try {
                        const { getRecommendations } = await import('../../lib/recommendations');
                        const top = getRecommendations(modeCompletedNodes, currentMode, { limit: 1 }).recs[0];
                        if (top?.lesson?.id) {
                            const recommendedNode = Object.values(visibleNodesMap)
                                .flat()
                                .find(node => node.content_ref_id === top.lesson.id);
                            if (recommendedNode) {
                                setPreviewNode(recommendedNode);
                                return;
                            }
                        }
                    } catch { /* fall back to the visible linear node */ }
                }
                setPreviewNode(activeNode);
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
    const previewContent = React.useMemo(() => {
        if (!previewNode) return null;

        const style = getNodeStyle(previewNode);
        const lessonContent = previewNode.content_ref_id
            ? getCanonicalLessonContent(previewNode.content_ref_id)
            : null;
        const conversation = lessonContent?.conversations?.[0] || null;
        const words = (lessonContent?.words || []).slice(0, 6);
        const sentences = (lessonContent?.sentences || []).slice(0, 4);
        const dueReviewCount = previewNode.type === 'lesson' ? getDueItems().length : 0;
        const sessionCount = getNodeSessionCount(previewNode.id, progressMode);
        const sessionsTarget = previewNode.sessions_required || (previewNode.skill_content?.type === 'grammar_unit' ? 2 : SESSIONS_TO_COMPLETE);

        return {
            style,
            Icon: style.icon,
            title: translateNodeLabel(previewNode),
            sublabel: getNodeLabel(previewNode, style, t),
            conversation,
            words,
            sentences,
            dueReviewCount,
            sessionCount,
            sessionsTarget,
            canStart: previewNode.status !== 'locked' || testMode,
            isCompleted: previewNode.status === 'completed',
            isLocked: previewNode.status === 'locked' && !testMode,
            hasProgress: sessionCount > 0 && previewNode.status !== 'completed',
        };
    }, [previewNode, getNodeSessionCount, progressMode, SESSIONS_TO_COMPLETE, t, testMode]);

    return (
        <div>
            {/* Unified header: avatar + streak (pinned) + mode switcher + topic chips (scroll) — one line */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 16px',
                paddingTop: 'calc(8px + var(--safe-area-top, 0px))',
                position: 'sticky',
                top: 0,
                zIndex: 10,
                backgroundColor: 'var(--bg-color)',
                borderBottom: '1px solid var(--border-color)',
            }}>
                <MobileAccountBar inline />
                <div className="hide-scrollbar" style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    overflowX: 'auto', flex: 1, minWidth: 0,
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
                {/* Streak + notifications — pinned top-right */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <div
                        style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                        title={t('home_stats_streak')}
                    >
                        <Flame size={18} color="#FF6B35" />
                        <span style={{ fontWeight: 800, fontSize: 16 }}>{dailyStreak}</span>
                    </div>
                    <button
                        className="notif-bell-btn"
                        onClick={openPanel}
                        aria-label={t('notifications')}
                    >
                        <Bell size={20} />
                        {unreadCount > 0 && (
                            <span className="notif-bell-badge">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {streakMoment && (
                <div style={{ padding: '8px 16px 0' }}>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '10px 12px', borderRadius: 12,
                        backgroundColor: 'rgba(255, 209, 102, 0.12)', border: '1px solid rgba(255, 209, 102, 0.35)',
                    }}>
                        <React.Suspense fallback={null}>
                            <BeKhe expression={streakMoment.expression} size={44} />
                        </React.Suspense>
                        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-main)' }}>{streakMoment.text}</span>
                    </div>
                </div>
            )}

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

            <RecommendedNext
                completedNodeIds={modeCompletedNodes}
                purpose={currentMode}
                onLessonSelect={handleRecommendedLessonSelect}
            />

            {units.map((unit) => {
                const nodes = nodesMap[unit.id] || [];
                const visibleNodes = visibleNodesMap[unit.id] || [];
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
                                const isLocked = node.status === 'locked' && !testMode;
                                const sublabel = getNodeLabel(node, style, t);
                                const sessionCount = getNodeSessionCount(node.id, progressMode);
                                const sessionsTarget = node.sessions_required || (node.skill_content?.type === 'grammar_unit' ? 2 : SESSIONS_TO_COMPLETE);
                                const hasProgress = sessionCount > 0 && !isCompleted;
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
                                            role="button"
                                            tabIndex={0}
                                            onClick={() => handleNodeClick(node)}
                                            onPointerUp={() => handleNodeClick(node)}
                                            onKeyDown={(event) => {
                                                if (event.key === 'Enter' || event.key === ' ') {
                                                    event.preventDefault();
                                                    handleNodeClick(node);
                                                }
                                            }}
                                            style={{
                                                flex: 1, minWidth: 0,
                                                display: 'flex', flexDirection: 'column',
                                                backgroundColor: isLocked ? 'var(--surface-color)' : style.bg,
                                                cursor: 'pointer',
                                                outline: 'none',
                                                textAlign: 'left',
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
                                                    <div style={{ fontWeight: 700, fontSize: 15, color: isLocked ? style.mutedIcon : 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', gap: 5 }}>
                                                        {translateNodeLabel(node)}
                                                        {recommendedNodeIds.has(node.id) && !isCompleted && (
                                                            <Sparkles size={13} color={style.color} style={{ flexShrink: 0 }} aria-label="Recommended" />
                                                        )}
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
                                                {isLocked && (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 800, color: style.muted, textTransform: 'uppercase', letterSpacing: '0.5px', flexShrink: 0 }}>
                                                        <Lock size={14} /> Locked
                                                    </div>
                                                )}
                                                {!isLocked && isActive && !hasProgress && (
                                                    <div style={{ fontSize: 12, fontWeight: 800, color: style.color, textTransform: 'uppercase', letterSpacing: '0.5px', flexShrink: 0 }}>
                                                        {t('start_upper')}
                                                    </div>
                                                )}
                                                {!isLocked && hasProgress && (
                                                    <div style={{ fontSize: 12, fontWeight: 800, color: style.color, textTransform: 'uppercase', letterSpacing: '0.5px', flexShrink: 0 }}>
                                                        {t('continue_upper')}
                                                    </div>
                                                )}
                                            </div>
                                            {/* Segmented progress bar */}
                                            {!isLocked && (isActive || hasProgress || isCompleted) && (
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
                                            <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); handleNodeClick(quiz); }}
                                                onPointerUp={(e) => { e.stopPropagation(); handleNodeClick(quiz); }}
                                                style={{
                                                    width: 52, flexShrink: 0,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    backgroundColor: !isLocked && quizDone ? style.color : !isLocked && quizReady ? `${style.color}30` : isLocked ? 'var(--surface-color)' : `${style.color}15`,
                                                    borderLeft: `1.5px dashed ${isLocked ? style.mutedBorder : style.color}`,
                                                    cursor: 'pointer',
                                                    borderTop: 'none',
                                                    borderRight: 'none',
                                                    borderBottom: 'none',
                                                    padding: 0,
                                                    font: 'inherit',
                                                }}
                                            >
                                                <Trophy size={22}
                                                    color={!isLocked && quizDone ? '#fff' : !isLocked && quizReady ? style.color : style.muted}
                                                    fill={!isLocked && quizDone ? '#fff' : 'none'}
                                                />
                                            </button>
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

            {!hasAnyVisibleNodes && emptyLine && (
                <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    gap: 12, padding: '48px 24px', textAlign: 'center',
                }}>
                    <React.Suspense fallback={null}>
                        <BeKhe expression={emptyLine.expression} size={72} />
                    </React.Suspense>
                    <p style={{ margin: 0, fontSize: 15, color: 'var(--text-muted)', maxWidth: 320, lineHeight: 1.5 }}>
                        {emptyLine.text}
                    </p>
                </div>
            )}

            <div className="roadmap-bottom-spacer" aria-hidden="true" />

            <div className="roadmap-continue-wrapper">
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
            </div>

            {previewNode && previewContent && (
                <div
                    style={{
                        position: 'fixed', inset: 0, zIndex: 220,
                        backgroundColor: 'rgba(0,0,0,0.52)',
                        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                        padding: '16px 12px calc(16px + var(--safe-area-bottom-effective))',
                    }}
                    onClick={() => setPreviewNode(null)}
                >
                    <div
                        style={{
                            width: '100%', maxWidth: 440, maxHeight: '86vh', overflowY: 'auto',
                            backgroundColor: 'var(--surface-color)', borderRadius: '22px 22px 18px 18px',
                            border: '1px solid var(--border-color)', boxShadow: '0 18px 60px rgba(0,0,0,0.34)',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '18px 18px 14px', borderBottom: '1px solid var(--border-color)' }}>
                            <div style={{
                                width: 52, height: 52, borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                backgroundColor: previewContent.isLocked ? previewContent.style.muted : previewContent.style.color,
                                color: '#fff', boxShadow: `0 4px 0 ${previewContent.isLocked ? previewContent.style.mutedBorder : previewContent.style.dark}`,
                                flexShrink: 0,
                            }}>
                                {previewContent.isLocked ? <Lock size={24} /> : <previewContent.Icon size={25} fill="#fff" color="#fff" />}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 12, fontWeight: 800, color: previewContent.style.color, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                                    {previewContent.sublabel}
                                </div>
                                <h3 style={{ margin: '3px 0 0', fontSize: 20, lineHeight: 1.2, color: 'var(--text-main)' }}>
                                    {previewContent.title}
                                </h3>
                            </div>
                            <button
                                onClick={() => setPreviewNode(null)}
                                aria-label="Close preview"
                                style={{
                                    width: 36, height: 36, borderRadius: '50%', border: 'none',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    backgroundColor: 'var(--surface-color-light)', color: 'var(--text-muted)',
                                    cursor: 'pointer', flexShrink: 0,
                                }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {(previewContent.hasProgress || previewContent.isCompleted) && (
                                <div style={{ display: 'flex', gap: 4 }}>
                                    {Array.from({ length: previewContent.sessionsTarget }, (_, i) => (
                                        <div key={i} style={{
                                            flex: 1, height: 8, borderRadius: 999,
                                            backgroundColor: i < previewContent.sessionCount || previewContent.isCompleted
                                                ? previewContent.style.color
                                                : `${previewContent.style.color}25`,
                                        }} />
                                    ))}
                                </div>
                            )}

                            {previewContent.dueReviewCount > 0 && previewContent.canStart && (
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: 10,
                                    padding: '11px 12px', borderRadius: 12,
                                    backgroundColor: 'rgba(6, 214, 160, 0.1)',
                                    border: '1px solid rgba(6, 214, 160, 0.26)',
                                }}>
                                    <Sparkles size={18} color="#06D6A0" style={{ flexShrink: 0 }} />
                                    <div style={{ fontSize: 13, color: 'var(--text-main)', lineHeight: 1.35 }}>
                                        <strong>{previewContent.dueReviewCount} due review{previewContent.dueReviewCount === 1 ? '' : 's'}</strong> can appear inside this lesson when they fit.
                                    </div>
                                </div>
                            )}

                            {previewContent.conversation ? (
                                <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    <div>
                                        <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                                            Dialogue preview
                                        </div>
                                        {previewContent.conversation.title && (
                                            <div style={{ marginTop: 3, fontSize: 15, fontWeight: 800, color: 'var(--text-main)' }}>
                                                {previewContent.conversation.title}
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        {(previewContent.conversation.lines || []).slice(0, 5).map((line, index) => (
                                            <div key={`${line.speaker || 'line'}-${index}`} style={{
                                                padding: '10px 12px', borderRadius: 12,
                                                backgroundColor: index % 2 === 0 ? `${previewContent.style.color}12` : 'var(--bg-color)',
                                                border: `1px solid ${index % 2 === 0 ? `${previewContent.style.color}28` : 'var(--border-color)'}`,
                                            }}>
                                                <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
                                                    {line.speaker && (
                                                        <span style={{ fontSize: 12, fontWeight: 900, color: previewContent.style.color }}>
                                                            {line.speaker}
                                                        </span>
                                                    )}
                                                    <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.35 }}>
                                                        {line.vi}
                                                    </span>
                                                </div>
                                                {line.en && (
                                                    <div style={{ marginTop: 4, fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.35 }}>
                                                        {line.en}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            ) : null}

                            {previewContent.words.length > 0 && (
                                <section>
                                    <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 8 }}>
                                        New words
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                        {previewContent.words.map(word => (
                                            <span key={word.id} style={{
                                                display: 'inline-flex', flexDirection: 'column', gap: 2,
                                                padding: '8px 10px', borderRadius: 12,
                                                backgroundColor: `${previewContent.style.color}12`,
                                                border: `1px solid ${previewContent.style.color}28`,
                                            }}>
                                                <strong style={{ fontSize: 14, color: 'var(--text-main)' }}>{word.vi}</strong>
                                                {word.en && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{word.en}</span>}
                                            </span>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {!previewContent.conversation && previewContent.sentences.length > 0 && (
                                <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                                        Practice lines
                                    </div>
                                    {previewContent.sentences.map(sentence => (
                                        <div key={sentence.id} style={{ padding: '10px 12px', borderRadius: 12, backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)' }}>
                                            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-main)' }}>{sentence.vi}</div>
                                            {sentence.en && <div style={{ marginTop: 4, fontSize: 13, color: 'var(--text-muted)' }}>{sentence.en}</div>}
                                        </div>
                                    ))}
                                </section>
                            )}

                            {!previewContent.conversation && previewContent.words.length === 0 && previewContent.sentences.length === 0 && (
                                <div style={{ padding: '12px 14px', borderRadius: 12, backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.45 }}>
                                    {previewContent.isLocked
                                        ? 'Complete the previous card to unlock this step.'
                                        : 'Open this card to begin the next guided practice.'}
                                </div>
                            )}
                        </div>

                        <div style={{ padding: 18, paddingTop: 0 }}>
                            <button
                                className={previewContent.canStart ? 'primary' : 'disabled'}
                                disabled={!previewContent.canStart}
                                onClick={() => {
                                    if (!previewContent.canStart) return;
                                    setPreviewNode(null);
                                    navigateNode(previewNode);
                                }}
                                style={{
                                    width: '100%', padding: '15px 18px', borderRadius: 14,
                                    fontSize: 16, fontWeight: 900, textTransform: 'uppercase',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                    opacity: previewContent.canStart ? 1 : 0.55,
                                    cursor: previewContent.canStart ? 'pointer' : 'not-allowed',
                                }}
                            >
                                {previewContent.isLocked
                                    ? 'Locked'
                                    : previewContent.isCompleted
                                        ? t('roadmap_redo')
                                        : previewContent.hasProgress
                                            ? t('continue_upper')
                                            : t('start_upper')}
                                {previewContent.canStart && <ChevronRight size={18} />}
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
