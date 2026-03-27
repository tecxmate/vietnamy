import React from 'react';

/**
 * ReorderWords — Tap words from a bank to build a sentence.
 *
 * Renders an answer area (tap to remove) and a word bank (tap to add).
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
                minHeight: 50,
                padding: '10px 12px',
                borderRadius: 12,
                border: `2px solid ${borderColor}`,
                backgroundColor: 'var(--surface-color)',
                display: 'flex',
                flexWrap: 'wrap',
                gap: 6,
                transition: 'border-color 0.15s ease',
            }}>
                {selectedWords.length === 0 && (
                    <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                        Tap words below...
                    </span>
                )}
                {selectedWords.map((w, i) => (
                    <button
                        key={`sel-${i}`}
                        onClick={() => !isChecking && onToggleWord(w, i)}
                        disabled={isChecking}
                        style={{
                            padding: '6px 12px',
                            borderRadius: 8,
                            backgroundColor: 'color-mix(in srgb, var(--accent-color) 8%, transparent)',
                            border: '1px solid color-mix(in srgb, var(--accent-color) 25%, transparent)',
                            color: 'var(--text-main)',
                            fontWeight: 600,
                            fontSize: 14,
                            cursor: isChecking ? 'default' : 'pointer',
                        }}
                    >
                        {w}
                    </button>
                ))}
            </div>

            {/* Available word bank */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {shuffledWords.map((w, i) => {
                    const isUsed = usedIndices.has(i);
                    return (
                        <button
                            key={`bank-${i}`}
                            onClick={() => !isChecking && !isUsed && onToggleWord(w, i)}
                            disabled={isChecking || isUsed}
                            style={{
                                padding: '6px 12px',
                                borderRadius: 8,
                                backgroundColor: isUsed ? 'var(--border-color)' : 'var(--surface-color)',
                                border: '1px solid var(--border-color)',
                                color: isUsed ? 'transparent' : 'var(--text-main)',
                                fontWeight: 600,
                                fontSize: 14,
                                cursor: isChecking || isUsed ? 'default' : 'pointer',
                                opacity: isUsed ? 0.4 : 1,
                                boxShadow: isUsed ? 'none' : '0 2px 0 var(--border-color)',
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
                    fontSize: 14, color: 'var(--accent-color)', fontWeight: 600,
                }}>
                    Correct: {correctAnswer}
                </div>
            )}
        </div>
    );
}
