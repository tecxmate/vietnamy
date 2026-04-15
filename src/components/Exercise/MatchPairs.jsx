import React, { useState, useMemo, useCallback } from 'react';
import { playSuccess, playError, playTap } from '../../utils/sound';
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
 * Duolingo-style:
 * - Press animation
 * - Sound feedback
 * - Smooth match animation
 * - Celebration on complete
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
    const [justMatched, setJustMatched] = useState(new Set());
    const [pressedLeft, setPressedLeft] = useState(null);
    const [pressedRight, setPressedRight] = useState(null);

    const accent = accentColor || 'var(--lesson-selected-border)';

    const pairKey = (p) => `${p.vi}::${p.en}`;

    const tryMatch = useCallback((leftIdx, rightIdx) => {
        const left = shuffledLeft[leftIdx];
        const right = shuffledRight[rightIdx];

        if (left.vi === right.vi && left.en === right.en) {
            playSuccess();
            const newMatched = new Set(matchedSet);
            newMatched.add(pairKey(left));
            setMatchedSet(newMatched);

            // Flash green briefly
            setJustMatched(new Set([pairKey(left)]));
            setTimeout(() => setJustMatched(new Set()), 400);

            setSelectedLeft(null);
            setSelectedRight(null);

            if (newMatched.size === pairs.length) {
                setTimeout(() => onComplete?.(), 500);
            }
        } else {
            playError();
            setFlashWrong(true);
            setTimeout(() => {
                setFlashWrong(false);
                setSelectedLeft(null);
                setSelectedRight(null);
            }, 400);
        }
    }, [shuffledLeft, shuffledRight, matchedSet, pairs.length, onComplete]);

    const handleTap = useCallback((side, index) => {
        const pair = side === 'left' ? shuffledLeft[index] : shuffledRight[index];
        if (matchedSet.has(pairKey(pair))) return;

        playTap();

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

    const getButtonStyle = (pair, isSelected, isMatched, isWrong, isJustMatched, isPressed) => {
        let bg = 'var(--surface-color)';
        let borderColor = 'var(--border-color)';
        let textColor = 'var(--text-main)';
        let shadowSize = 3;
        let scale = 1;

        if (isMatched) {
            bg = 'rgba(88, 204, 2, 0.12)';
            borderColor = '#58CC02';
            textColor = '#58CC02';
            shadowSize = 0;
        } else if (isJustMatched) {
            bg = 'rgba(88, 204, 2, 0.25)';
            borderColor = '#58CC02';
            textColor = '#58CC02';
            scale = 1.02;
        } else if (isWrong) {
            bg = 'rgba(239, 68, 68, 0.15)';
            borderColor = '#EF4444';
            textColor = '#EF4444';
        } else if (isSelected) {
            bg = 'var(--lesson-selected-fill)';
            borderColor = accent;
            textColor = accent;
        }

        if (isPressed && !isMatched) {
            shadowSize = 0;
            scale = 0.98;
        }

        return {
            padding: '14px 12px',
            borderRadius: 12,
            fontSize: 16,
            fontWeight: 600,
            textAlign: 'center',
            cursor: isMatched ? 'default' : 'pointer',
            backgroundColor: bg,
            border: `2px solid ${borderColor}`,
            color: textColor,
            opacity: isMatched ? 0.7 : 1,
            boxShadow: shadowSize > 0 ? `0 ${shadowSize}px 0 var(--border-color)` : 'none',
            transform: `translateY(${isPressed ? 3 : 0}px) scale(${scale})`,
            transition: 'transform 0.1s ease, box-shadow 0.1s ease, background-color 0.15s ease, border-color 0.15s ease, opacity 0.2s ease',
            WebkitTapHighlightColor: 'transparent',
        };
    };

    const headerStyle = {
        fontSize: 12,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: 1,
        color: 'var(--text-muted)',
        textAlign: 'center',
        paddingBottom: 6,
    };

    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto 1fr',
            gap: 12,
        }}>
            {/* Column headers */}
            <div style={headerStyle}>Tiếng Việt</div>
            <div />
            <div style={headerStyle}>English</div>

            {/* Left column: Vietnamese */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {shuffledLeft.map((pair, idx) => {
                    const key = pairKey(pair);
                    const isMatched = matchedSet.has(key);
                    const isSelected = selectedLeft === idx;
                    const isWrong = flashWrong && isSelected;
                    const isJustMatched = justMatched.has(key);
                    const isPressed = pressedLeft === idx;
                    return (
                        <button
                            key={`l-${idx}`}
                            onPointerDown={() => !isMatched && setPressedLeft(idx)}
                            onPointerUp={() => setPressedLeft(null)}
                            onPointerLeave={() => setPressedLeft(null)}
                            onClick={() => handleTap('left', idx)}
                            disabled={isMatched}
                            style={getButtonStyle(pair, isSelected, isMatched, isWrong, isJustMatched, isPressed)}
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
                marginTop: 4,
            }} />

            {/* Right column: English */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {shuffledRight.map((pair, idx) => {
                    const key = pairKey(pair);
                    const isMatched = matchedSet.has(key);
                    const isSelected = selectedRight === idx;
                    const isWrong = flashWrong && isSelected;
                    const isJustMatched = justMatched.has(key);
                    const isPressed = pressedRight === idx;
                    return (
                        <button
                            key={`r-${idx}`}
                            onPointerDown={() => !isMatched && setPressedRight(idx)}
                            onPointerUp={() => setPressedRight(null)}
                            onPointerLeave={() => setPressedRight(null)}
                            onClick={() => handleTap('right', idx)}
                            disabled={isMatched}
                            style={getButtonStyle(pair, isSelected, isMatched, isWrong, isJustMatched, isPressed)}
                        >
                            {pair.en}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
