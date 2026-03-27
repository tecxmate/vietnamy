import { useMemo, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useDong } from '../context/DongContext';
import { getNextNode, getNodeRoute } from '../lib/db';

/**
 * Shared hook for practice modules to integrate with roadmap progression.
 *
 * Reads `?nodeId=xxx` from URL. When present:
 * - markComplete() increments the node's session count (4 = fully complete)
 * - nextRoute points to the next roadmap node
 *
 * When no nodeId (standalone practice from Practice tab):
 * - markComplete() is a no-op
 * - nextRoute falls back to "/"
 */
export function usePracticeCompletion() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const dongCtx = useDong();
    const completedRef = useRef(false);

    const nodeId = searchParams.get('nodeId') || null;
    const session = nodeId ? dongCtx.getNodeSessionCount(nodeId) : 0;

    const nextRoute = useMemo(() => {
        if (!nodeId) return '/';
        const next = getNextNode(nodeId);
        return next ? getNodeRoute(next) : '/';
    }, [nodeId]);

    const markComplete = useCallback(() => {
        if (!nodeId || completedRef.current) return;
        completedRef.current = true;
        dongCtx.completeNode(nodeId);
    }, [nodeId, dongCtx]);

    const goNext = useCallback(() => {
        navigate(nextRoute);
    }, [navigate, nextRoute]);

    // Back navigation: roadmap if opened from roadmap, otherwise practice tab
    const backPath = '/';
    const backState = nodeId ? { state: { tab: 'study' } } : { state: { tab: 'practice' } };

    const goBack = useCallback(() => {
        navigate(backPath, backState);
    }, [navigate, backPath, backState]);

    return { nodeId, session, markComplete, nextRoute, goNext, backPath, backState, goBack };
}
