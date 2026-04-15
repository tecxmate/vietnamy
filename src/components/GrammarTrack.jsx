/**
 * GrammarTrack — A collapsible grammar curriculum section for the Roadmap tab.
 *
 * Renders: Level tabs (A1/A2/B1) → Module accordion → Unit cards
 * Each unit shows status (locked/active/completed), pattern, and progress.
 * Tapping an active unit navigates to /grammar-unit/:unitId
 */
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    BookOpenText, ChevronDown, ChevronRight, Check, Lock,
    Award, Zap, Play
} from 'lucide-react';
import { useProgress } from '../context/ProgressContext';
import { DEFAULT_LEARNER_MODE } from '../data/learnerModes';
import {
    getLevels, getModuleProgress, getLevelProgress,
    getUnitStatus, getNextActiveUnit, loadGrammarModules
} from '../lib/grammarModulesDB';
import { loadSettings } from './TopBar';

// ─── Color system (matches roadmap green for grammar) ───────────
const GRAMMAR_GREEN = '#06D6A0';
const GRAMMAR_DARK = '#05A67D';
const LEVEL_COLORS = {
    A1: { color: '#06D6A0', dark: '#05A67D', label: 'Beginner' },
    A2: { color: '#1CB0F6', dark: '#0D8ECF', label: 'Elementary' },
    B1: { color: '#A78BFA', dark: '#7C3AED', label: 'Intermediate' },
};

// ─── Level Tab Bar ──────────────────────────────────────────────
function LevelTabs({ activeLevel, onSelect, completedNodeIds }) {
    const levels = getLevels();
    return (
        <div style={{
            display: 'flex', gap: 6, padding: '0 16px',
            marginBottom: 12,
        }}>
            {levels.map(level => {
                const progress = getLevelProgress(level.id, completedNodeIds);
                const lc = LEVEL_COLORS[level.id];
                const isActive = activeLevel === level.id;
                return (
                    <button
                        key={level.id}
                        onClick={() => onSelect(level.id)}
                        style={{
                            flex: 1,
                            padding: '10px 8px',
                            borderRadius: 12,
                            border: `2px solid ${isActive ? lc.color : 'var(--border-color)'}`,
                            backgroundColor: isActive ? `${lc.color}15` : 'var(--surface-color)',
                            cursor: 'pointer',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                        }}
                    >
                        <div style={{
                            fontSize: 16, fontWeight: 800,
                            color: isActive ? lc.color : 'var(--text-muted)',
                        }}>
                            {level.id}
                        </div>
                        <div style={{
                            fontSize: 10, fontWeight: 600,
                            color: isActive ? lc.color : 'var(--text-muted)',
                            textTransform: 'uppercase', letterSpacing: 0.5,
                        }}>
                            {lc.label}
                        </div>
                        <div style={{
                            width: '100%', height: 4, borderRadius: 2,
                            backgroundColor: `${lc.color}20`,
                            overflow: 'hidden',
                        }}>
                            <div style={{
                                width: `${progress.percent}%`, height: '100%',
                                backgroundColor: lc.color,
                                borderRadius: 2,
                                transition: 'width 0.3s ease',
                            }} />
                        </div>
                        <div style={{
                            fontSize: 10, color: 'var(--text-muted)',
                        }}>
                            {progress.completed}/{progress.total}
                        </div>
                    </button>
                );
            })}
        </div>
    );
}

// ─── Module Accordion ───────────────────────────────────────────
function ModuleRow({ module, levelColor, completedNodeIds, onUnitClick, testMode }) {
    const [expanded, setExpanded] = useState(false);
    const progress = getModuleProgress(module.id, completedNodeIds);
    const isLocked = progress.status === 'locked';
    const isCompleted = progress.status === 'completed';
    const isActive = progress.status === 'active';

    return (
        <div style={{
            borderRadius: 14,
            border: `1.5px solid ${isLocked ? 'var(--border-color)' : isCompleted ? `${levelColor}50` : `${levelColor}40`}`,
            overflow: 'hidden',
            backgroundColor: isLocked ? 'var(--surface-color)' : `${levelColor}08`,
            transition: 'all 0.2s ease',
        }}>
            {/* Module header */}
            <div
                onClick={() => !isLocked && setExpanded(e => !e)}
                style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '14px 16px',
                    cursor: isLocked ? 'default' : 'pointer',
                }}
            >
                {/* Status icon */}
                <div style={{
                    width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backgroundColor: isCompleted ? levelColor : isActive ? `${levelColor}20` : 'var(--border-color)',
                    color: isCompleted ? '#fff' : isActive ? levelColor : 'var(--text-muted)',
                }}>
                    {isCompleted ? <Check size={18} strokeWidth={3} /> :
                        isLocked ? <Lock size={16} /> :
                            <BookOpenText size={18} />}
                </div>

                {/* Title + progress */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                        fontSize: 14, fontWeight: 700,
                        color: isLocked ? 'var(--text-muted)' : 'var(--text-main)',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                        {module.title}
                    </div>
                    <div style={{
                        fontSize: 11, color: isLocked ? 'var(--text-muted)' : levelColor,
                        fontWeight: 600, marginTop: 2,
                    }}>
                        {progress.completed}/{progress.total} units
                        {isCompleted && ' ✓'}
                    </div>
                </div>

                {/* Progress ring / chevron */}
                {!isLocked && (
                    <>
                        {/* Mini progress bar */}
                        <div style={{
                            width: 40, height: 4, borderRadius: 2,
                            backgroundColor: `${levelColor}20`, flexShrink: 0,
                        }}>
                            <div style={{
                                width: `${progress.percent}%`, height: '100%',
                                backgroundColor: levelColor, borderRadius: 2,
                            }} />
                        </div>
                        {expanded ?
                            <ChevronDown size={18} color={levelColor} /> :
                            <ChevronRight size={18} color={levelColor} />
                        }
                    </>
                )}
            </div>

            {/* Expanded unit list */}
            {expanded && !isLocked && (
                <div style={{
                    padding: '0 12px 12px',
                    display: 'flex', flexDirection: 'column', gap: 6,
                }}>
                    {module.units.map((unit, idx) => {
                        const status = getUnitStatus(unit, completedNodeIds);
                        const unitLocked = status === 'locked';
                        const unitCompleted = status === 'completed';
                        const unitActive = status === 'active';

                        return (
                            <div
                                key={unit.id}
                                onClick={() => (unitActive || (testMode && unitLocked)) && onUnitClick(unit.id)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 10,
                                    padding: '10px 12px',
                                    borderRadius: 10,
                                    backgroundColor: unitActive ? `${levelColor}12` : unitCompleted ? `${levelColor}08` : 'var(--surface-color)',
                                    border: `1.5px solid ${unitActive ? `${levelColor}40` : unitCompleted ? `${levelColor}25` : 'var(--border-color)'}`,
                                    cursor: unitActive || (testMode && unitLocked) ? 'pointer' : 'default',
                                    opacity: unitLocked && !testMode ? 0.5 : 1,
                                    transition: 'all 0.15s ease',
                                }}
                            >
                                {/* Unit number circle */}
                                <div style={{
                                    width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 12, fontWeight: 800,
                                    backgroundColor: unitCompleted ? levelColor : unitActive ? `${levelColor}20` : 'var(--border-color)',
                                    color: unitCompleted ? '#fff' : unitActive ? levelColor : 'var(--text-muted)',
                                }}>
                                    {unitCompleted ? <Check size={14} strokeWidth={3} /> :
                                        unitLocked ? <Lock size={12} /> :
                                            idx + 1}
                                </div>

                                {/* Title + pattern */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{
                                        fontSize: 13, fontWeight: 600,
                                        color: unitLocked ? 'var(--text-muted)' : 'var(--text-main)',
                                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                    }}>
                                        {unit.title}
                                    </div>
                                    {unit.pattern && (
                                        <div style={{
                                            fontSize: 11, color: unitActive ? levelColor : 'var(--text-muted)',
                                            fontWeight: 500, marginTop: 1,
                                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                        }}>
                                            {unit.pattern}
                                        </div>
                                    )}
                                </div>

                                {/* Action indicator */}
                                {unitActive && (
                                    <div style={{
                                        fontSize: 10, fontWeight: 800, color: levelColor,
                                        textTransform: 'uppercase', letterSpacing: 0.5,
                                        flexShrink: 0,
                                    }}>
                                        START
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// ─── Main GrammarTrack Component ────────────────────────────────
export default function GrammarTrack({ currentMode }) {
    const navigate = useNavigate();
    const { completedNodes } = useProgress();
    const mode = currentMode || DEFAULT_LEARNER_MODE;
    const modeCompletedNodes = useMemo(() => completedNodes[mode] || new Set(), [completedNodes, mode]);
    const { testMode } = loadSettings();
    const [activeLevel, setActiveLevel] = useState('A1');
    const [collapsed, setCollapsed] = useState(false);
    const [, setReady] = useState(false);

    // Ensure grammar data is loaded (lazy-loaded chunk)
    useEffect(() => { loadGrammarModules().then(() => setReady(true)); }, []);

    const levels = getLevels();
    const currentLevel = levels.find(l => l.id === activeLevel);
    const levelColor = LEVEL_COLORS[activeLevel]?.color || GRAMMAR_GREEN;
    const nextUnit = useMemo(() => getNextActiveUnit(modeCompletedNodes), [modeCompletedNodes]);

    const handleUnitClick = (unitId) => {
        navigate(`/grammar-unit/${unitId}`);
    };

    // Overall progress
    const totalProgress = useMemo(() => {
        let completed = 0, total = 0;
        for (const lv of levels) {
            const p = getLevelProgress(lv.id, modeCompletedNodes);
            completed += p.completed;
            total += p.total;
        }
        return { completed, total, percent: total > 0 ? Math.round((completed / total) * 100) : 0 };
    }, [modeCompletedNodes]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div style={{
            margin: '20px 0',
            borderRadius: 20,
            border: '1.5px solid var(--border-color)',
            overflow: 'hidden',
            backgroundColor: 'var(--bg-color)',
        }}>
            {/* Section Header — "Grammar" */}
            <div
                onClick={() => setCollapsed(c => !c)}
                style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '16px 16px',
                    cursor: 'pointer',
                    backgroundColor: `${GRAMMAR_GREEN}08`,
                    borderBottom: collapsed ? 'none' : '1px solid var(--border-color)',
                }}
            >
                <div style={{
                    width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backgroundColor: `${GRAMMAR_GREEN}15`,
                }}>
                    <BookOpenText size={22} color={GRAMMAR_GREEN} />
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-main)' }}>
                        Grammar
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                        {totalProgress.completed}/{totalProgress.total} units · {totalProgress.percent}%
                    </div>
                </div>

                {/* Overall progress bar */}
                <div style={{
                    width: 60, height: 5, borderRadius: 3,
                    backgroundColor: `${GRAMMAR_GREEN}20`, flexShrink: 0,
                }}>
                    <div style={{
                        width: `${totalProgress.percent}%`, height: '100%',
                        backgroundColor: GRAMMAR_GREEN, borderRadius: 3,
                    }} />
                </div>

                {collapsed ? <ChevronRight size={20} color="var(--text-muted)" /> :
                    <ChevronDown size={20} color="var(--text-muted)" />}
            </div>

            {!collapsed && (
                <div style={{ padding: '12px 0' }}>
                    {/* Continue button */}
                    {nextUnit && (
                        <div style={{ padding: '0 16px 12px' }}>
                            <button
                                onClick={() => handleUnitClick(nextUnit.unit.id)}
                                style={{
                                    width: '100%',
                                    display: 'flex', alignItems: 'center', gap: 12,
                                    padding: '12px 16px',
                                    borderRadius: 12,
                                    border: `1.5px solid ${GRAMMAR_GREEN}40`,
                                    backgroundColor: `${GRAMMAR_GREEN}10`,
                                    cursor: 'pointer',
                                    color: 'var(--text-main)',
                                }}
                            >
                                <Play size={18} color={GRAMMAR_GREEN} fill={GRAMMAR_GREEN} />
                                <div style={{ flex: 1, textAlign: 'left' }}>
                                    <div style={{ fontSize: 13, fontWeight: 700 }}>
                                        Continue: {nextUnit.unit.title}
                                    </div>
                                    <div style={{ fontSize: 11, color: GRAMMAR_GREEN, fontWeight: 600, marginTop: 1 }}>
                                        {nextUnit.module.title} · {nextUnit.level.id}
                                    </div>
                                </div>
                                <ChevronRight size={16} color={GRAMMAR_GREEN} />
                            </button>
                        </div>
                    )}

                    {/* Level tabs */}
                    <LevelTabs
                        activeLevel={activeLevel}
                        onSelect={setActiveLevel}
                        completedNodeIds={modeCompletedNodes}
                    />

                    {/* Module list */}
                    {currentLevel && (
                        <div style={{
                            padding: '0 16px',
                            display: 'flex', flexDirection: 'column', gap: 8,
                        }}>
                            {currentLevel.modules.map(mod => (
                                <ModuleRow
                                    key={mod.id}
                                    module={mod}
                                    levelColor={levelColor}
                                    completedNodeIds={modeCompletedNodes}
                                    onUnitClick={handleUnitClick}
                                    testMode={testMode}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
