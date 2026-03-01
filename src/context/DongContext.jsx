import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

const DongContext = createContext();

export function useDong() {
    return useContext(DongContext);
}

// ─── Constants ──────────────────────────────────────────────────
const SESSIONS_TO_COMPLETE = 4; // sessions needed to fully complete a node

const STORAGE_KEY = 'vietnamy_dong';

// ─── Helpers ────────────────────────────────────────────────────
function todayISO() {
    return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

function daysBetween(dateA, dateB) {
    const a = new Date(dateA);
    const b = new Date(dateB);
    return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

// ─── State persistence ──────────────────────────────────────────
function loadState() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const p = JSON.parse(raw);
            return {
                dailyStreak: p.dailyStreak ?? 0,
                lastVisitDate: p.lastVisitDate ?? null,
                completedNodes: new Set(p.completedNodes ?? []),
                nodeSessionCounts: p.nodeSessionCounts ?? {},
                unlockedStages: new Set(p.unlockedStages ?? ['arrival']),
            };
        }
    } catch { /* ignore */ }
    return {
        dailyStreak: 0,
        lastVisitDate: null,
        completedNodes: new Set(),
        nodeSessionCounts: {},
        unlockedStages: new Set(['arrival']),
    };
}

// ─── Provider ───────────────────────────────────────────────────
export function DongProvider({ children }) {
    const init = useMemo(() => loadState(), []);

    const [dailyStreak, setDailyStreak] = useState(init.dailyStreak);
    const [lastVisitDate, setLastVisitDate] = useState(init.lastVisitDate);
    const [completedNodes, setCompletedNodes] = useState(init.completedNodes);
    const [nodeSessionCounts, setNodeSessionCounts] = useState(init.nodeSessionCounts);
    const [unlockedStages, setUnlockedStages] = useState(init.unlockedStages);

    // ── Daily streak check on mount ──
    useEffect(() => {
        const today = todayISO();
        if (lastVisitDate === today) return;

        let newStreak;
        if (lastVisitDate && daysBetween(lastVisitDate, today) === 1) {
            newStreak = dailyStreak + 1;
        } else if (lastVisitDate && daysBetween(lastVisitDate, today) === 0) {
            newStreak = dailyStreak;
        } else {
            newStreak = 1;
        }

        setDailyStreak(newStreak);
        setLastVisitDate(today);
    }, []); // only on mount

    // ── Persist ──
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            dailyStreak,
            lastVisitDate,
            completedNodes: [...completedNodes],
            nodeSessionCounts,
            unlockedStages: [...unlockedStages],
        }));
    }, [dailyStreak, lastVisitDate, completedNodes, nodeSessionCounts, unlockedStages]);

    // ── Roadmap progress ──
    const completeNode = useCallback((nodeId, { immediate = false } = {}) => {
        if (immediate) {
            setCompletedNodes(prev => new Set([...prev, nodeId]));
            return;
        }
        setNodeSessionCounts(prev => {
            const newCount = (prev[nodeId] ?? 0) + 1;
            if (newCount >= SESSIONS_TO_COMPLETE) {
                setCompletedNodes(prevNodes => new Set([...prevNodes, nodeId]));
            }
            return { ...prev, [nodeId]: newCount };
        });
    }, []);

    const isNodeCompleted = useCallback((nodeId) => {
        return completedNodes.has(nodeId);
    }, [completedNodes]);

    const getNodeSessionCount = useCallback((nodeId) => {
        return nodeSessionCounts[nodeId] ?? 0;
    }, [nodeSessionCounts]);

    const isStageUnlocked = useCallback((stageId) => {
        return unlockedStages.has(stageId);
    }, [unlockedStages]);

    const unlockStage = useCallback((stageId) => {
        setUnlockedStages(prev => new Set([...prev, stageId]));
        return true;
    }, []);

    // Reset (for testing)
    const resetDong = useCallback(() => {
        setDailyStreak(0);
        setLastVisitDate(null);
        setCompletedNodes(new Set());
        setNodeSessionCounts({});
        setUnlockedStages(new Set(['arrival']));
        localStorage.removeItem(STORAGE_KEY);
    }, []);

    const value = {
        dailyStreak,
        lastVisitDate,
        resetDong,
        // Roadmap
        completedNodes,
        completeNode,
        isNodeCompleted,
        getNodeSessionCount,
        SESSIONS_TO_COMPLETE,
        isStageUnlocked,
        unlockStage,
    };

    return (
        <DongContext.Provider value={value}>
            {children}
        </DongContext.Provider>
    );
}
