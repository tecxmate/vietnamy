/**
 * ProgressContext — Simplified progress tracking for roadmap lessons.
 *
 * Tracks per-mode:
 * - completedNodes: Set of node IDs that are fully completed
 * - nodeSessionCounts: How many sessions completed per node (4 = done)
 */
import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { NODE_ID_MIGRATION } from '../lib/nodeMigration';
import { MODE_IDS, DEFAULT_LEARNER_MODE } from '../data/learnerModes';
import { advanceStreak, streakStatus as computeStreakStatus, todayStr } from '../lib/streak';
import { useAuth } from './AuthContext';

const ProgressContext = createContext();

export function useProgress() {
    return useContext(ProgressContext);
}

const SESSIONS_TO_COMPLETE = 4;
const STORAGE_KEY = 'vietnamy_progress';

// Hearts (lives/tries). Kept minimal for now — count down on wrong answers,
// refill on demand. The full heart-count UI + regeneration lands later.
const MAX_HEARTS = 5;
const HEARTS_STORAGE_KEY = 'vnme_hearts';

function loadHearts() {
    try {
        const raw = localStorage.getItem(HEARTS_STORAGE_KEY);
        if (raw != null) {
            const n = parseInt(raw, 10);
            if (Number.isFinite(n)) return Math.max(0, Math.min(MAX_HEARTS, n));
        }
    } catch { /* ignore */ }
    return MAX_HEARTS;
}

// Daily streak — consecutive calendar days with any study activity.
const STREAK_STORAGE_KEY = 'vnme_streak';
const EMPTY_STREAK = { count: 0, lastActiveDate: null, best: 0, moments: {} };

function loadStreak() {
    try {
        const raw = localStorage.getItem(STREAK_STORAGE_KEY);
        if (raw) return { ...EMPTY_STREAK, ...JSON.parse(raw) };
    } catch { /* ignore */ }
    return { ...EMPTY_STREAK };
}

function createEmptyModeProgress() {
    const completedNodes = {};
    const nodeSessionCounts = {};
    MODE_IDS.forEach(mode => {
        completedNodes[mode] = new Set();
        nodeSessionCounts[mode] = {};
    });
    return { completedNodes, nodeSessionCounts };
}

function loadState() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        // Also check old key for migration
        const oldRaw = localStorage.getItem('vietnamy_dong');
        const data = raw ? JSON.parse(raw) : (oldRaw ? JSON.parse(oldRaw) : null);

        if (data) {
            let completedNodes, nodeSessionCounts;

            if (data.completedNodes && typeof data.completedNodes === 'object' && !Array.isArray(data.completedNodes)) {
                // Per-mode structure
                const empty = createEmptyModeProgress();
                completedNodes = empty.completedNodes;
                nodeSessionCounts = empty.nodeSessionCounts;

                MODE_IDS.forEach(mode => {
                    if (data.completedNodes[mode]) {
                        completedNodes[mode] = new Set(
                            (data.completedNodes[mode] ?? []).map(id => NODE_ID_MIGRATION[id] || id)
                        );
                    }
                    if (data.nodeSessionCounts?.[mode]) {
                        nodeSessionCounts[mode] = Object.fromEntries(
                            Object.entries(data.nodeSessionCounts[mode] ?? {}).map(([id, v]) => [NODE_ID_MIGRATION[id] || id, v])
                        );
                    }
                });
            } else {
                // Flat structure - migrate to default mode
                const empty = createEmptyModeProgress();
                completedNodes = empty.completedNodes;
                nodeSessionCounts = empty.nodeSessionCounts;

                completedNodes[DEFAULT_LEARNER_MODE] = new Set(
                    (data.completedNodes ?? []).map(id => NODE_ID_MIGRATION[id] || id)
                );
                nodeSessionCounts[DEFAULT_LEARNER_MODE] = Object.fromEntries(
                    Object.entries(data.nodeSessionCounts ?? {}).map(([id, v]) => [NODE_ID_MIGRATION[id] || id, v])
                );
            }

            return { completedNodes, nodeSessionCounts };
        }
    } catch { /* ignore */ }
    return createEmptyModeProgress();
}

export function ProgressProvider({ children }) {
    const { syncProgress } = useAuth();
    const init = useMemo(() => loadState(), []);
    const [completedNodes, setCompletedNodes] = useState(init.completedNodes);
    const [nodeSessionCounts, setNodeSessionCounts] = useState(init.nodeSessionCounts);
    const [hearts, setHearts] = useState(loadHearts);
    const [streak, setStreak] = useState(loadStreak);
    // Mirror of streak for synchronous reads inside consumeStreakMoment / getStreakStatus
    // (both run in effects, never during render). Synced after each commit.
    const streakRef = useRef(streak);
    useEffect(() => { streakRef.current = streak; }, [streak]);

    // Persist to localStorage
    useEffect(() => {
        const serializedCompletedNodes = {};
        const serializedSessionCounts = {};
        MODE_IDS.forEach(mode => {
            serializedCompletedNodes[mode] = [...(completedNodes[mode] || [])];
            serializedSessionCounts[mode] = nodeSessionCounts[mode] || {};
        });

        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            completedNodes: serializedCompletedNodes,
            nodeSessionCounts: serializedSessionCounts,
        }));
        syncProgress?.();
    }, [completedNodes, nodeSessionCounts, syncProgress]);

    // Mark today active on any completed study activity (idempotent per day).
    const recordActivity = useCallback(() => {
        setStreak(prev => {
            const next = advanceStreak(prev, todayStr());
            return { ...prev, count: next.count, lastActiveDate: next.lastActiveDate, best: next.best };
        });
    }, []);

    const completeNode = useCallback((nodeId, { immediate = false, sessionsRequired, mode = DEFAULT_LEARNER_MODE } = {}) => {
        recordActivity();
        if (immediate) {
            setCompletedNodes(prev => ({
                ...prev,
                [mode]: new Set([...(prev[mode] || []), nodeId])
            }));
            return;
        }
        setNodeSessionCounts(prev => {
            const modeSessionCounts = prev[mode] || {};
            const newCount = (modeSessionCounts[nodeId] ?? 0) + 1;
            const target = sessionsRequired ?? SESSIONS_TO_COMPLETE;
            if (newCount >= target) {
                setCompletedNodes(prevNodes => ({
                    ...prevNodes,
                    [mode]: new Set([...(prevNodes[mode] || []), nodeId])
                }));
            }
            return {
                ...prev,
                [mode]: { ...modeSessionCounts, [nodeId]: newCount }
            };
        });
    }, [recordActivity]);

    const getNodeSessionCount = useCallback((nodeId, mode = DEFAULT_LEARNER_MODE) => {
        return nodeSessionCounts[mode]?.[nodeId] ?? 0;
    }, [nodeSessionCounts]);

    // Persist hearts.
    useEffect(() => {
        localStorage.setItem(HEARTS_STORAGE_KEY, String(hearts));
        syncProgress?.();
    }, [hearts, syncProgress]);

    const loseHeart = useCallback(() => {
        setHearts(h => Math.max(0, h - 1));
    }, []);

    const refillHearts = useCallback(() => {
        setHearts(MAX_HEARTS);
    }, []);

    // Persist streak.
    useEffect(() => {
        localStorage.setItem(STREAK_STORAGE_KEY, JSON.stringify(streak));
        syncProgress?.();
    }, [streak, syncProgress]);

    // Read-only streak view for UI / on-open decisions.
    const getStreakStatus = useCallback(() => computeStreakStatus(streakRef.current, todayStr()), []);

    // Returns true at most once per local day per `kind` (milestone/return/lost/save),
    // so a moment fires once and not on every render/mount that day.
    const consumeStreakMoment = useCallback((kind) => {
        const today = todayStr();
        if (streakRef.current.moments?.[kind] === today) return false;
        const next = { ...streakRef.current, moments: { ...streakRef.current.moments, [kind]: today } };
        streakRef.current = next;
        setStreak(next);
        return true;
    }, []);

    const dailyStreak = useMemo(() => computeStreakStatus(streak, todayStr()).count, [streak]);

    const resetProgress = useCallback(() => {
        const empty = createEmptyModeProgress();
        setCompletedNodes(empty.completedNodes);
        setNodeSessionCounts(empty.nodeSessionCounts);
        setStreak({ ...EMPTY_STREAK });
        setHearts(MAX_HEARTS);
        localStorage.removeItem(STREAK_STORAGE_KEY);
        localStorage.removeItem(HEARTS_STORAGE_KEY);
        localStorage.removeItem(STORAGE_KEY);
    }, []);

    const value = {
        completedNodes,
        completeNode,
        getNodeSessionCount,
        SESSIONS_TO_COMPLETE,
        resetProgress,
        hearts,
        loseHeart,
        refillHearts,
        MAX_HEARTS,
        dailyStreak,
        bestStreak: streak.best || 0,
        getStreakStatus,
        consumeStreakMoment,
        recordActivity,
    };

    return (
        <ProgressContext.Provider value={value}>
            {children}
        </ProgressContext.Provider>
    );
}
