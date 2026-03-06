import React, { useState, useEffect, useCallback, useRef } from 'react';

const segmentCache = new Map();
const LONG_PRESS_MS = 400;

const TappableVietnamese = ({ text, onWordTap, bold }) => {
    const [segments, setSegments] = useState(null);
    const [selected, setSelected] = useState(new Set());
    const longPressTimer = useRef(null);
    const didLongPress = useRef(false);

    useEffect(() => {
        if (!text) return;

        if (segmentCache.has(text)) {
            setSegments(segmentCache.get(text));
            return;
        }

        let cancelled = false;
        fetch(`/api/segment?text=${encodeURIComponent(text)}`)
            .then(r => r.json())
            .then(data => {
                if (!cancelled && data.segments) {
                    segmentCache.set(text, data.segments);
                    setSegments(data.segments);
                }
            })
            .catch(() => {
                if (!cancelled) setSegments(null);
            });

        return () => { cancelled = true; };
    }, [text]);

    // Clear selection when segments change
    useEffect(() => { setSelected(new Set()); }, [segments]);

    // --- Long-press via touch events ---
    const handleTouchStart = useCallback((idx, e) => {
        didLongPress.current = false;
        longPressTimer.current = setTimeout(() => {
            didLongPress.current = true;
            if (!segments) return;
            // Vibrate for haptic feedback if available
            if (navigator.vibrate) navigator.vibrate(30);
            setSelected(new Set([idx]));
        }, LONG_PRESS_MS);
    }, [segments]);

    const handleTouchEnd = useCallback((idx, e) => {
        clearTimeout(longPressTimer.current);
        // If long-press fired, suppress the click
        if (didLongPress.current) {
            e.preventDefault(); // prevents the subsequent click event
        }
    }, []);

    const handleTouchMove = useCallback(() => {
        // Cancel long-press if finger moves
        clearTimeout(longPressTimer.current);
    }, []);

    // --- Click handler (single tap or extend selection) ---
    const handleTap = useCallback((idx, e) => {
        e.stopPropagation();
        if (!segments) return;

        // If in selection mode, extend or reset
        if (selected.size > 0) {
            const min = Math.min(...selected);
            const max = Math.max(...selected);

            if (idx >= min - 1 && idx <= max + 1) {
                // Extend selection
                setSelected(prev => {
                    const next = new Set(prev);
                    next.add(idx);
                    const newMin = Math.min(...next);
                    const newMax = Math.max(...next);
                    for (let i = newMin; i <= newMax; i++) {
                        if (!segments[i].punct) next.add(i);
                    }
                    return next;
                });
                return;
            }

            // Not adjacent — exit selection mode, show single-word popup
            setSelected(new Set());
            const rect = e.currentTarget.getBoundingClientRect();
            onWordTap(segments[idx].text, rect, false);
            return;
        }

        // No selection — normal single tap: show popup
        const rect = e.currentTarget.getBoundingClientRect();
        onWordTap(segments[idx].text, rect, false);
    }, [segments, selected, onWordTap]);

    // When selection changes to 2+ words, fire the phrase popup
    useEffect(() => {
        if (!segments || selected.size < 2) return;

        const sorted = [...selected].sort((a, b) => a - b);
        const phrase = sorted.map(i => segments[i].text).join(' ');

        // Compute bounding rect spanning all selected words
        const els = sorted
            .map(i => document.querySelector(`[data-tw-id="${text}-${i}"]`))
            .filter(Boolean);

        if (els.length > 0) {
            const first = els[0].getBoundingClientRect();
            const last = els[els.length - 1].getBoundingClientRect();
            const combinedRect = {
                left: Math.min(first.left, last.left),
                right: Math.max(first.right, last.right),
                top: Math.min(first.top, last.top),
                bottom: Math.max(first.bottom, last.bottom),
                width: Math.max(first.right, last.right) - Math.min(first.left, last.left),
                height: Math.max(first.bottom, last.bottom) - Math.min(first.top, last.top),
            };
            onWordTap(phrase, combinedRect, true);
        }
    }, [selected, segments, text, onWordTap]);

    // Clear selection on outside tap
    useEffect(() => {
        if (selected.size === 0) return;
        const handler = () => setSelected(new Set());
        const t = setTimeout(() => document.addEventListener('click', handler, { once: true }), 100);
        return () => { clearTimeout(t); document.removeEventListener('click', handler); };
    }, [selected]);

    if (!segments) {
        return bold ? <b>{text}</b> : <>{text}</>;
    }

    return (
        <>
            {segments.map((seg, i) => {
                if (seg.punct) {
                    return <span key={i}>{seg.text}</span>;
                }
                const isSelected = selected.has(i);
                return (
                    <span key={i}>
                        {seg.leading || ''}
                        <span
                            data-tw-id={`${text}-${i}`}
                            className={`tappable-word${isSelected ? ' tappable-word--selected' : ''}`}
                            onClick={(e) => handleTap(i, e)}
                            onTouchStart={(e) => handleTouchStart(i, e)}
                            onTouchEnd={(e) => handleTouchEnd(i, e)}
                            onTouchMove={handleTouchMove}
                            onContextMenu={(e) => e.preventDefault()}
                            style={bold ? { fontWeight: 700 } : undefined}
                        >
                            {seg.text}
                        </span>
                        {seg.trailing || ''}
                        {i < segments.length - 1 && !seg.trailing?.endsWith(' ') ? ' ' : ''}
                    </span>
                );
            })}
        </>
    );
};

export default TappableVietnamese;
