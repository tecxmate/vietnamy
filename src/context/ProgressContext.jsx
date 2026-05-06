/**
 * ProgressContext — Simplified progress tracking for roadmap lessons.
 *
 * Tracks per-mode:
 * - completedNodes: Set of node IDs that are fully completed
 * - nodeSessionCounts: How many sessions completed per node (4 = done)
 */
import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { NODE_ID_MIGRATION, getNodeById } from '../lib/db';
import { MODE_IDS, DEFAULT_LEARNER_MODE } from '../data/learnerModes';

const ProgressContext = createContext();

export function useProgress() {
    return useContext(ProgressContext);
}

const SESSIONS_TO_COMPLETE = 4;
const STORAGE_KEY = 'vietnamy_progress';

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
    const init = useMemo(() => loadState(), []);
    const [completedNodes, setCompletedNodes] = useState(init.completedNodes);
    const [nodeSessionCounts, setNodeSessionCounts] = useState(init.nodeSessionCounts);

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
    }, [completedNodes, nodeSessionCounts]);

    const completeNode = useCallback((nodeId, { immediate = false, sessionsRequired, mode = DEFAULT_LEARNER_MODE } = {}) => {
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
            // Resolution order: explicit caller override > per-node sessions_required > engine default.
            const nodeOverride = sessionsRequired == null ? getNodeById(nodeId)?.sessions_required : null;
            const target = sessionsRequired ?? nodeOverride ?? SESSIONS_TO_COMPLETE;
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
    }, []);

    const getNodeSessionCount = useCallback((nodeId, mode = DEFAULT_LEARNER_MODE) => {
        return nodeSessionCounts[mode]?.[nodeId] ?? 0;
    }, [nodeSessionCounts]);

    const resetProgress = useCallback(() => {
        const empty = createEmptyModeProgress();
        setCompletedNodes(empty.completedNodes);
        setNodeSessionCounts(empty.nodeSessionCounts);
        localStorage.removeItem(STORAGE_KEY);
    }, []);

    const value = {
        completedNodes,
        completeNode,
        getNodeSessionCount,
        SESSIONS_TO_COMPLETE,
        resetProgress,
    };

    return (
        <ProgressContext.Provider value={value}>
            {children}
        </ProgressContext.Provider>
    );
}
