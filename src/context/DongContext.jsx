import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { NODE_ID_MIGRATION } from '../lib/db';
import { useAuth } from './AuthContext';

const DongContext = createContext();

export function useDong() {
    return useContext(DongContext);
}

// ─── Constants ──────────────────────────────────────────────────
const SESSIONS_TO_COMPLETE = 4; // sessions needed to fully complete a node
const MAX_HEARTS = 5;
const HEART_REGEN_MS = 30 * 60 * 1000; // regenerate 1 heart every 30 minutes
const COINS_PER_LESSON = 10;
const COINS_PER_TEST = 25;

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
            // Regenerate hearts based on time elapsed
            let hearts = p.hearts ?? MAX_HEARTS;
            const lastHeartLoss = p.lastHeartLoss ?? null;
            if (hearts < MAX_HEARTS && lastHeartLoss) {
                const elapsed = Date.now() - lastHeartLoss;
                const regen = Math.floor(elapsed / HEART_REGEN_MS);
                hearts = Math.min(MAX_HEARTS, hearts + regen);
            }
            return {
                dailyStreak: p.dailyStreak ?? 0,
                lastVisitDate: p.lastVisitDate ?? null,
                completedNodes: new Set((p.completedNodes ?? []).map(id => NODE_ID_MIGRATION[id] || id)),
                nodeSessionCounts: Object.fromEntries(
                    Object.entries(p.nodeSessionCounts ?? {}).map(([id, v]) => [NODE_ID_MIGRATION[id] || id, v])
                ),
                unlockedStages: new Set(p.unlockedStages ?? ['arrival']),
                hearts,
                lastHeartLoss: hearts >= MAX_HEARTS ? null : lastHeartLoss,
                coins: p.coins ?? 0,
            };
        }
    } catch { /* ignore */ }
    return {
        dailyStreak: 0,
        lastVisitDate: null,
        completedNodes: new Set(),
        nodeSessionCounts: {},
        unlockedStages: new Set(['arrival']),
        hearts: MAX_HEARTS,
        lastHeartLoss: null,
        coins: 0,
    };
}

// ─── Provider ───────────────────────────────────────────────────
export function DongProvider({ children }) {
    const { syncProgress } = useAuth();
    const init = useMemo(() => loadState(), []);

    const [dailyStreak, setDailyStreak] = useState(init.dailyStreak);
    const [lastVisitDate, setLastVisitDate] = useState(init.lastVisitDate);
    const [completedNodes, setCompletedNodes] = useState(init.completedNodes);
    const [nodeSessionCounts, setNodeSessionCounts] = useState(init.nodeSessionCounts);
    const [unlockedStages, setUnlockedStages] = useState(init.unlockedStages);
    const [hearts, setHearts] = useState(init.hearts);
    const [lastHeartLoss, setLastHeartLoss] = useState(init.lastHeartLoss);
    const [coins, setCoins] = useState(init.coins);

    // ── Heart regeneration timer ──
    useEffect(() => {
        if (hearts >= MAX_HEARTS) return;
        const interval = setInterval(() => {
            setHearts(h => {
                const next = Math.min(MAX_HEARTS, h + 1);
                if (next >= MAX_HEARTS) setLastHeartLoss(null);
                return next;
            });
        }, HEART_REGEN_MS);
        return () => clearInterval(interval);
    }, [hearts]);

    const loseHeart = useCallback(() => {
        setHearts(h => Math.max(0, h - 1));
        setLastHeartLoss(Date.now());
    }, []);

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
            hearts,
            lastHeartLoss,
            coins,
        }));
        syncProgress?.();
    }, [dailyStreak, lastVisitDate, completedNodes, nodeSessionCounts, unlockedStages, hearts, lastHeartLoss, coins]);

    const addCoins = useCallback((amount) => {
        setCoins(c => c + amount);
    }, []);

    // ── Roadmap progress ──
    const completeNode = useCallback((nodeId, { immediate = false, isTest = false, sessionsRequired } = {}) => {
        const reward = isTest ? COINS_PER_TEST : COINS_PER_LESSON;
        if (immediate) {
            setCompletedNodes(prev => new Set([...prev, nodeId]));
            addCoins(reward);
            return;
        }
        setNodeSessionCounts(prev => {
            const newCount = (prev[nodeId] ?? 0) + 1;
            const target = sessionsRequired ?? SESSIONS_TO_COMPLETE;
            if (newCount >= target) {
                setCompletedNodes(prevNodes => new Set([...prevNodes, nodeId]));
            }
            return { ...prev, [nodeId]: newCount };
        });
        addCoins(reward);
    }, [addCoins]);

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
        setHearts(MAX_HEARTS);
        setLastHeartLoss(null);
        setCoins(0);
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
        // Hearts
        hearts,
        maxHearts: MAX_HEARTS,
        loseHeart,
        // Coins
        coins,
        addCoins,
    };

    return (
        <DongContext.Provider value={value}>
            {children}
        </DongContext.Provider>
    );
}
