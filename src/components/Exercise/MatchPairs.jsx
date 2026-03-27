import React, { useState, useMemo, useCallback } from 'react';
import { playSuccess, playError } from '../../utils/sound';
import speak from '../../utils/speak';

/** Fisher-Yates shuffle (pure — returns new array) */
function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

/**
 * MatchPairs — Tap-to-match two-column exercise.
 *
 * Handles all matching logic internally. Calls onComplete() when
 * all pairs are matched.
 *
 * Accepts pairs as either {vi, en} or {vi_text, en_text} format.
 */
export default function MatchPairs({
    pairs: rawPairs = [],
    onComplete,
    accentColor,
}) {
    // Normalize field names: accept both {vi, en} and {vi_text, en_text}
    const pairs = useMemo(() =>
        rawPairs.map(p => ({
            vi: p.vi ?? p.vi_text ?? '',
            en: p.en ?? p.en_text ?? '',
        })),
        [rawPairs]
    );

    // Shuffle once via lazy state initializer (avoids Math.random in render)
    const [shuffledLeft] = useState(() => shuffle(rawPairs.map(p => ({
        vi: p.vi ?? p.vi_text ?? '',
        en: p.en ?? p.en_text ?? '',
    }))));
    const [shuffledRight] = useState(() => shuffle(rawPairs.map(p => ({
        vi: p.vi ?? p.vi_text ?? '',
        en: p.en ?? p.en_text ?? '',
    }))));

    const [selectedLeft, setSelectedLeft] = useState(null);
    const [selectedRight, setSelectedRight] = useState(null);
    const [matchedSet, setMatchedSet] = useState(new Set());
    const [flashWrong, setFlashWrong] = useState(false);

    const accent = accentColor || 'var(--accent-color)';

    const pairKey = (p) => `${p.vi}::${p.en}`;

    const tryMatch = useCallback((leftIdx, rightIdx) => {
        const left = shuffledLeft[leftIdx];
        const right = shuffledRight[rightIdx];

        if (left.vi === right.vi && left.en === right.en) {
            playSuccess();
            const newMatched = new Set(matchedSet);
            newMatched.add(pairKey(left));
            setMatchedSet(newMatched);
            setSelectedLeft(null);
            setSelectedRight(null);

            if (newMatched.size === pairs.length) {
                setTimeout(() => onComplete?.(), 400);
            }
        } else {
            playError();
            setFlashWrong(true);
            setTimeout(() => {
                setFlashWrong(false);
                setSelectedLeft(null);
                setSelectedRight(null);
            }, 500);
        }
    }, [shuffledLeft, shuffledRight, matchedSet, pairs.length, onComplete]);

    const handleTap = useCallback((side, index) => {
        const pair = side === 'left' ? shuffledLeft[index] : shuffledRight[index];
        if (matchedSet.has(pairKey(pair))) return;

        if (side === 'left') {
            // Speak Vietnamese text on tap
            if (pair.vi) speak(pair.vi);
            setSelectedLeft(index);
            if (selectedRight !== null) {
                tryMatch(index, selectedRight);
            }
        } else {
            setSelectedRight(index);
            if (selectedLeft !== null) {
                tryMatch(selectedLeft, index);
            }
        }
    }, [selectedLeft, selectedRight, shuffledLeft, shuffledRight, matchedSet, tryMatch]);

    const getButtonStyle = (pair, isSelected, isMatched, isWrong) => ({
        padding: '14px 12px',
        borderRadius: 12,
        fontSize: 16,
        fontWeight: 600,
        textAlign: 'center',
        transition: 'all 0.2s',
        cursor: isMatched ? 'default' : 'pointer',
        backgroundColor: isMatched
            ? 'rgba(88, 204, 2, 0.1)'
            : isWrong
                ? 'rgba(239, 68, 68, 0.1)'
                : isSelected
                    ? `color-mix(in srgb, ${accent} 12%, transparent)`
                    : 'var(--surface-color)',
        border: isMatched
            ? '2px solid #58CC02'
            : isWrong
                ? '2px solid #EF4444'
                : isSelected
                    ? `2px solid ${accent}`
                    : '2px solid var(--border-color)',
        color: isMatched
            ? '#58CC02'
            : isWrong
                ? '#EF4444'
                : isSelected
                    ? accent
                    : 'var(--text-main)',
        opacity: isMatched ? 0.6 : 1,
        boxShadow: isMatched ? 'none' : '0 2px 0 var(--border-color)',
    });

    const headerStyle = {
        fontSize: 13,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: 1,
        color: 'var(--text-muted)',
        textAlign: 'center',
        paddingBottom: 4,
    };

    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto 1fr',
            gap: 12,
        }}>
            {/* Column headers */}
            <div style={headerStyle}>Ti&#7871;ng Vi&#7879;t</div>
            <div />
            <div style={headerStyle}>English</div>

            {/* Left column: Vietnamese */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {shuffledLeft.map((pair, idx) => {
                    const isMatched = matchedSet.has(pairKey(pair));
                    const isSelected = selectedLeft === idx;
                    const isWrong = flashWrong && isSelected;
                    return (
                        <button
                            key={`l-${idx}`}
                            onClick={() => handleTap('left', idx)}
                            disabled={isMatched}
                            style={getButtonStyle(pair, isSelected, isMatched, isWrong)}
                        >
                            {pair.vi}
                        </button>
                    );
                })}
            </div>

            {/* Divider */}
            <div style={{
                width: 2,
                backgroundColor: 'var(--border-color)',
                borderRadius: 1,
            }} />

            {/* Right column: English */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {shuffledRight.map((pair, idx) => {
                    const isMatched = matchedSet.has(pairKey(pair));
                    const isSelected = selectedRight === idx;
                    const isWrong = flashWrong && isSelected;
                    return (
                        <button
                            key={`r-${idx}`}
                            onClick={() => handleTap('right', idx)}
                            disabled={isMatched}
                            style={getButtonStyle(pair, isSelected, isMatched, isWrong)}
                        >
                            {pair.en}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
