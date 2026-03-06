import React, { useState, useEffect, useCallback } from 'react';

const segmentCache = new Map();

const TappableVietnamese = ({ text, onWordTap, bold }) => {
    const [segments, setSegments] = useState(null);
    const [selected, setSelected] = useState(new Set());

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

    const handleTap = useCallback((idx, e) => {
        e.stopPropagation();
        if (!segments) return;

        if (selected.size > 0) {
            const min = Math.min(...selected);
            const max = Math.max(...selected);

            if (idx >= min - 1 && idx <= max + 1 && !selected.has(idx)) {
                // Adjacent to current selection — extend the phrase
                const next = new Set(selected);
                next.add(idx);
                // Fill gaps between min and max
                const newMin = Math.min(...next);
                const newMax = Math.max(...next);
                for (let i = newMin; i <= newMax; i++) {
                    if (!segments[i].punct) next.add(i);
                }
                setSelected(next);

                // Fire phrase popup with combined rect
                const sorted = [...next].sort((a, b) => a - b);
                const phrase = sorted.map(i => segments[i].text).join(' ');
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
                return;
            }

            // Same word or non-adjacent — reset to just this word
        }

        // Select this single word and show its popup
        setSelected(new Set([idx]));
        const rect = e.currentTarget.getBoundingClientRect();
        onWordTap(segments[idx].text, rect, false);
    }, [segments, selected, onWordTap, text]);

    // Clear selection when user taps outside any tappable word
    useEffect(() => {
        if (selected.size === 0) return;
        const handler = (e) => {
            // Don't clear if tap was on a tappable-word (handled by handleTap)
            if (e.target.closest?.('.tappable-word')) return;
            setSelected(new Set());
        };
        // Small delay so the current tap's stopPropagation takes effect
        const t = setTimeout(() => document.addEventListener('click', handler), 50);
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
