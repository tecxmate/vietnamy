import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

const DongContext = createContext();

export function useDong() {
    return useContext(DongContext);
}

// ─── Constants ──────────────────────────────────────────────────
// Module pricing — null = free, number = cost in ₫
const MODULE_PRICES = {
    tones: null,
    numbers: null,
    tonemarks: null,
    vowels: null,
    vocab: null,
    pitch: null,
    telex: null,
};

// Score-based reward formula constants
const BASE_REWARD = 100;      // just for finishing
const PER_CORRECT = 30;       // per correct answer
const PERFECT_BONUS = 200;    // 100% accuracy
const STREAK_BONUSES = [
    { min: 10, bonus: 300 },
    { min: 5, bonus: 100 },
    { min: 3, bonus: 50 },
];
const REPEAT_MULTIPLIER = 0.5; // 50% on replays

// Daily streak
const MAX_STREAK_MULTIPLIER = 7; // daily bonus caps at day 7
const DAILY_BONUS_PER_DAY = 100; // 100₫ × streak day

const STORAGE_KEY = 'vietnamy_dong';
const STARTING_BALANCE = 1000;

// ─── Helpers ────────────────────────────────────────────────────
function todayISO() {
    return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

function daysBetween(dateA, dateB) {
    const a = new Date(dateA);
    const b = new Date(dateB);
    return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

function calcReward(score, total, bestStreak) {
    let reward = BASE_REWARD + (score * PER_CORRECT);
    if (score === total && total > 0) reward += PERFECT_BONUS;
    for (const { min, bonus } of STREAK_BONUSES) {
        if (bestStreak >= min) { reward += bonus; break; }
    }
    return reward;
}

function calcRewardBreakdown(score, total, bestStreak) {
    const base = BASE_REWARD;
    const accuracy = score * PER_CORRECT;
    const perfect = (score === total && total > 0) ? PERFECT_BONUS : 0;
    let streakBonus = 0;
    for (const { min, bonus } of STREAK_BONUSES) {
        if (bestStreak >= min) { streakBonus = bonus; break; }
    }
    return { base, accuracy, perfect, streakBonus, total: base + accuracy + perfect + streakBonus };
}

// ─── State persistence ──────────────────────────────────────────
function loadState() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const p = JSON.parse(raw);
            return {
                balance: p.balance ?? STARTING_BALANCE,
                unlockedModules: new Set(p.unlockedModules ?? []),
                completionCounts: p.completionCounts ?? {},     // { moduleId: number }
                dailyStreak: p.dailyStreak ?? 0,
                lastVisitDate: p.lastVisitDate ?? null,
                dailyBonusClaimed: p.dailyBonusClaimed ?? null, // ISO date
                completedNodes: new Set(p.completedNodes ?? []),
                unlockedStages: new Set(p.unlockedStages ?? ['arrival']),
                isExecutive: p.isExecutive ?? false,
            };
        }
    } catch { /* ignore */ }
    return {
        balance: STARTING_BALANCE,
        unlockedModules: new Set(),
        completionCounts: {},
        dailyStreak: 0,
        lastVisitDate: null,
        dailyBonusClaimed: null,
        completedNodes: new Set(),
        unlockedStages: new Set(['arrival']),
        isExecutive: false,
    };
}

// ─── Provider ───────────────────────────────────────────────────
export function DongProvider({ children }) {
    const init = useMemo(() => loadState(), []);

    const [balance, setBalance] = useState(init.balance);
    const [unlockedModules, setUnlockedModules] = useState(init.unlockedModules);
    const [completionCounts, setCompletionCounts] = useState(init.completionCounts);
    const [dailyStreak, setDailyStreak] = useState(init.dailyStreak);
    const [lastVisitDate, setLastVisitDate] = useState(init.lastVisitDate);
    const [dailyBonusClaimed, setDailyBonusClaimed] = useState(init.dailyBonusClaimed);
    const [completedNodes, setCompletedNodes] = useState(init.completedNodes);
    const [unlockedStages, setUnlockedStages] = useState(init.unlockedStages);
    const [isExecutive, setIsExecutive] = useState(init.isExecutive);

    const [rewardEvent, setRewardEvent] = useState(null);       // { amount, breakdown, isRepeat }
    const [dailyBonusEvent, setDailyBonusEvent] = useState(null); // { amount, streak }

    // ── Daily streak check on mount ──
    useEffect(() => {
        const today = todayISO();
        if (lastVisitDate === today) return; // already visited today

        let newStreak;
        if (lastVisitDate && daysBetween(lastVisitDate, today) === 1) {
            newStreak = dailyStreak + 1; // consecutive
        } else if (lastVisitDate && daysBetween(lastVisitDate, today) === 0) {
            newStreak = dailyStreak; // same day
        } else {
            newStreak = 1; // reset (gap or first visit)
        }

        setDailyStreak(newStreak);
        setLastVisitDate(today);

        // Award daily bonus if not claimed today
        if (dailyBonusClaimed !== today) {
            const bonusAmount = DAILY_BONUS_PER_DAY * Math.min(newStreak, MAX_STREAK_MULTIPLIER);
            setBalance(b => b + bonusAmount);
            setDailyBonusClaimed(today);
            setDailyBonusEvent({ amount: bonusAmount, streak: newStreak });
            setTimeout(() => setDailyBonusEvent(null), 5000);
        }
    }, []); // only on mount

    // ── Persist ──
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            balance,
            unlockedModules: [...unlockedModules],
            completionCounts,
            dailyStreak,
            lastVisitDate,
            dailyBonusClaimed,
            completedNodes: [...completedNodes],
            unlockedStages: [...unlockedStages],
            isExecutive,
        }));
    }, [balance, unlockedModules, completionCounts, dailyStreak, lastVisitDate, dailyBonusClaimed, completedNodes, unlockedStages, isExecutive]);

    // ── Earn Dong (score-based, repeatable) ──
    const addDong = useCallback((moduleId, { score = 0, total = 0, bestStreak = 0 } = {}) => {
        const count = completionCounts[moduleId] ?? 0;
        const isRepeat = count > 0;

        const breakdown = calcRewardBreakdown(score, total, bestStreak);
        let reward = breakdown.total;
        if (isRepeat) reward = Math.round(reward * REPEAT_MULTIPLIER);

        setBalance(b => b + reward);
        setCompletionCounts(prev => ({ ...prev, [moduleId]: count + 1 }));
        setRewardEvent({ amount: reward, breakdown, isRepeat, source: moduleId });

        setTimeout(() => setRewardEvent(null), 3000);
        return reward;
    }, [completionCounts]);

    // ── Spending ──
    const unlockModule = useCallback((moduleId) => {
        const cost = MODULE_PRICES[moduleId];
        if (cost === null || cost === undefined) return true;
        if (unlockedModules.has(moduleId)) return true;
        if (balance < cost) return false;

        setBalance(b => b - cost);
        setUnlockedModules(prev => new Set([...prev, moduleId]));
        return true;
    }, [balance, unlockedModules]);

    const isUnlocked = useCallback((moduleId) => {
        const cost = MODULE_PRICES[moduleId];
        if (cost === null || cost === undefined) return true;
        return unlockedModules.has(moduleId);
    }, [unlockedModules]);

    const getModuleCost = useCallback((moduleId) => {
        return MODULE_PRICES[moduleId] ?? null;
    }, []);

    const getCompletionCount = useCallback((moduleId) => {
        return completionCounts[moduleId] ?? 0;
    }, [completionCounts]);

    // ── Roadmap progress ──
    const completeNode = useCallback((nodeId) => {
        setCompletedNodes(prev => new Set([...prev, nodeId]));
    }, []);

    const isNodeCompleted = useCallback((nodeId) => {
        return completedNodes.has(nodeId);
    }, [completedNodes]);

    const isStageUnlocked = useCallback((stageId) => {
        return unlockedStages.has(stageId);
    }, [unlockedStages]);

    const unlockStage = useCallback((stageId, cost) => {
        if (unlockedStages.has(stageId)) return true;
        if (cost && balance < cost) return false;
        if (cost) setBalance(b => b - cost);
        setUnlockedStages(prev => new Set([...prev, stageId]));
        return true;
    }, [balance, unlockedStages]);

    // ── Executive tier ──
    const activateExecutive = useCallback(() => {
        setIsExecutive(true);
    }, []);

    const deactivateExecutive = useCallback(() => {
        setIsExecutive(false);
    }, []);

    // Reset (for testing)
    const resetDong = useCallback(() => {
        setBalance(STARTING_BALANCE);
        setUnlockedModules(new Set());
        setCompletionCounts({});
        setDailyStreak(0);
        setLastVisitDate(null);
        setDailyBonusClaimed(null);
        setCompletedNodes(new Set());
        setUnlockedStages(new Set(['arrival']));
        setIsExecutive(false);
        localStorage.removeItem(STORAGE_KEY);
    }, []);

    const value = {
        balance,
        dailyStreak,
        addDong,
        unlockModule,
        isUnlocked,
        getModuleCost,
        getCompletionCount,
        rewardEvent,
        dailyBonusEvent,
        resetDong,
        calcRewardBreakdown,
        REPEAT_MULTIPLIER,
        // Executive
        isExecutive,
        activateExecutive,
        deactivateExecutive,
        // Roadmap
        completedNodes,
        completeNode,
        isNodeCompleted,
        isStageUnlocked,
        unlockStage,
    };

    return (
        <DongContext.Provider value={value}>
            {children}
        </DongContext.Provider>
    );
}
