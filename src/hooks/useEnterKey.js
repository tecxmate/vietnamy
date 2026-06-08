import { useEffect, useRef } from 'react';

// Map the Enter key to the lesson's primary action (Check / Continue / Next).
// Binds once and always calls the latest handler, so callers can pass an inline
// closure over current state without re-binding the listener each render.
export function useEnterKey(handler) {
    const ref = useRef(handler);
    useEffect(() => { ref.current = handler; });
    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Enter') ref.current?.(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);
}
