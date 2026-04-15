import React, { useState } from 'react';
import { playTap } from '../../utils/sound';

/**
 * ReorderWords — Tap words from a bank to build a sentence.
 *
 * Duolingo-style:
 * - Press animation on tap
 * - Sound feedback
 * - Smooth transitions
 */
export default function ReorderWords({
    shuffledWords = [],
    hintText = '',
    selectedWords = [],
    onToggleWord,
    isChecking = false,
    isCorrect = null,
    correctAnswer = '',
}) {
    const [pressedBank, setPressedBank] = useState(null);
    const [pressedSelected, setPressedSelected] = useState(null);

    // Track which bank words have been placed (by index, not value, to handle dupes)
    const usedIndices = new Set();
    for (const sw of selectedWords) {
        for (let i = 0; i < shuffledWords.length; i++) {
            if (!usedIndices.has(i) && shuffledWords[i] === sw) {
                usedIndices.add(i);
                break;
            }
        }
    }

    const borderColor = isChecking
        ? isCorrect
            ? '#58CC02'
            : '#EF4444'
        : 'var(--border-color)';

    const handleBankTap = (w, i) => {
        if (isChecking || usedIndices.has(i)) return;
        playTap();
        onToggleWord(w, i);
    };

    const handleSelectedTap = (w, i) => {
        if (isChecking) return;
        playTap();
        onToggleWord(w, i);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Header */}
            <div style={{ textAlign: 'center' }}>
                <div style={{
                    fontSize: 12, fontWeight: 700, textTransform: 'uppercase',
                    letterSpacing: 1, color: 'var(--text-muted)', marginBottom: 8,
                }}>
                    Arrange the words
                </div>
                {hintText && (
                    <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>
                        {hintText}
                    </div>
                )}
            </div>

            {/* Selected words area */}
            <div style={{
                minHeight: 56,
                padding: '12px 14px',
                borderRadius: 14,
                border: `2px solid ${borderColor}`,
                backgroundColor: 'var(--surface-color)',
                display: 'flex',
                flexWrap: 'wrap',
                gap: 8,
                transition: 'border-color 0.2s ease',
            }}>
                {selectedWords.length === 0 && (
                    <span style={{ color: 'var(--text-muted)', fontSize: 14, padding: '6px 0' }}>
                        Tap words below...
                    </span>
                )}
                {selectedWords.map((w, i) => {
                    const isPressed = pressedSelected === i;
                    return (
                        <button
                            key={`sel-${i}`}
                            onPointerDown={() => !isChecking && setPressedSelected(i)}
                            onPointerUp={() => setPressedSelected(null)}
                            onPointerLeave={() => setPressedSelected(null)}
                            onClick={() => handleSelectedTap(w, i)}
                            disabled={isChecking}
                            style={{
                                padding: '8px 14px',
                                borderRadius: 10,
                                backgroundColor: 'var(--lesson-selected-fill)',
                                border: '2px solid var(--lesson-selected-border)',
                                color: 'var(--text-main)',
                                fontWeight: 600,
                                fontSize: 15,
                                cursor: isChecking ? 'default' : 'pointer',
                                boxShadow: isPressed ? 'none' : '0 2px 0 color-mix(in srgb, var(--lesson-selected-border) 50%, transparent)',
                                transform: isPressed ? 'translateY(2px) scale(0.98)' : 'translateY(0) scale(1)',
                                transition: 'transform 0.1s ease, box-shadow 0.1s ease',
                                WebkitTapHighlightColor: 'transparent',
                            }}
                        >
                            {w}
                        </button>
                    );
                })}
            </div>

            {/* Available word bank */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {shuffledWords.map((w, i) => {
                    const isUsed = usedIndices.has(i);
                    const isPressed = pressedBank === i;
                    return (
                        <button
                            key={`bank-${i}`}
                            onPointerDown={() => !isChecking && !isUsed && setPressedBank(i)}
                            onPointerUp={() => setPressedBank(null)}
                            onPointerLeave={() => setPressedBank(null)}
                            onClick={() => handleBankTap(w, i)}
                            disabled={isChecking || isUsed}
                            style={{
                                padding: '8px 14px',
                                borderRadius: 10,
                                backgroundColor: isUsed ? 'var(--surface-color-light)' : 'var(--surface-color)',
                                border: isUsed ? '2px dashed var(--border-color)' : '2px solid var(--border-color)',
                                color: isUsed ? 'transparent' : 'var(--text-main)',
                                fontWeight: 600,
                                fontSize: 15,
                                cursor: isChecking || isUsed ? 'default' : 'pointer',
                                boxShadow: isUsed || isPressed ? 'none' : '0 3px 0 var(--border-color)',
                                transform: isPressed ? 'translateY(3px) scale(0.98)' : 'translateY(0) scale(1)',
                                transition: 'transform 0.1s ease, box-shadow 0.1s ease, opacity 0.15s ease',
                                opacity: isUsed ? 0.5 : 1,
                                WebkitTapHighlightColor: 'transparent',
                            }}
                        >
                            {w}
                        </button>
                    );
                })}
            </div>

            {/* Show correct answer on wrong */}
            {isChecking && !isCorrect && correctAnswer && (
                <div style={{
                    padding: '12px 16px',
                    borderRadius: 12,
                    backgroundColor: 'rgba(88, 204, 2, 0.1)',
                    border: '1px solid rgba(88, 204, 2, 0.3)',
                }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#58CC02', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Correct answer
                    </span>
                    <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-main)', marginTop: 4 }}>
                        {correctAnswer}
                    </div>
                </div>
            )}
        </div>
    );
}
