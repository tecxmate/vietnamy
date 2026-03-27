import React from 'react';

/**
 * FillBlankInput — Adaptive fill-in-the-blank component.
 *
 * mode="input"  Text input field (Grammar style)
 * mode="bank"   Tappable word bank buttons
 */
export default function FillBlankInput({
    sentenceWithBlank = '',
    hintText = '',
    value = '',
    onChange,
    isChecking = false,
    isCorrect = null,
    correctAnswer = '',
    mode = 'input',
    wordBankChoices = [],
    onBankSelect,
}) {
    const borderColor = isChecking
        ? isCorrect
            ? '#58CC02'
            : '#EF4444'
        : 'var(--border-color)';

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Sentence with blank */}
            <div style={{ textAlign: 'center' }}>
                <div style={{
                    fontSize: 12, fontWeight: 700, textTransform: 'uppercase',
                    letterSpacing: 1, color: 'var(--text-muted)', marginBottom: 8,
                }}>
                    Fill in the blank
                </div>
                <div style={{
                    fontSize: 20, fontWeight: 700,
                    color: 'var(--text-main)', lineHeight: 1.4,
                }}>
                    {sentenceWithBlank}
                </div>
                {hintText && (
                    <div style={{
                        fontSize: 13, color: 'var(--text-muted)', marginTop: 4,
                    }}>
                        Hint: {hintText}
                    </div>
                )}
            </div>

            {/* Input mode */}
            {mode === 'input' && (
                <input
                    type="text"
                    value={value}
                    onChange={e => !isChecking && onChange(e.target.value)}
                    placeholder="Type the missing word..."
                    autoFocus
                    disabled={isChecking}
                    style={{
                        padding: '14px 16px',
                        borderRadius: 12,
                        fontSize: 16,
                        border: `2px solid ${borderColor}`,
                        backgroundColor: 'var(--surface-color)',
                        color: 'var(--text-main)',
                        outline: 'none',
                        fontFamily: 'inherit',
                        transition: 'border-color 0.15s ease',
                    }}
                />
            )}

            {/* Word bank mode */}
            {mode === 'bank' && (
                <>
                    {/* Selected value display */}
                    <div style={{
                        minHeight: 50,
                        padding: '10px 16px',
                        borderRadius: 12,
                        border: `2px solid ${borderColor}`,
                        backgroundColor: 'var(--surface-color)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 16,
                        fontWeight: 600,
                        color: value ? 'var(--text-main)' : 'var(--text-muted)',
                    }}>
                        {value || 'Tap a word below...'}
                    </div>

                    {/* Word bank */}
                    <div style={{
                        display: 'flex', flexWrap: 'wrap', gap: 8,
                        justifyContent: 'center',
                    }}>
                        {wordBankChoices.map((word, i) => {
                            const isSelected = value === word;
                            return (
                                <button
                                    key={i}
                                    onClick={() => {
                                        if (isChecking) return;
                                        onBankSelect?.(word);
                                    }}
                                    disabled={isChecking}
                                    style={{
                                        padding: '8px 16px',
                                        borderRadius: 10,
                                        border: `2px solid ${isSelected ? 'var(--accent-color)' : 'var(--border-color)'}`,
                                        backgroundColor: isSelected
                                            ? 'color-mix(in srgb, var(--accent-color) 10%, transparent)'
                                            : 'var(--surface-color)',
                                        color: 'var(--text-main)',
                                        fontWeight: 600,
                                        fontSize: 15,
                                        cursor: isChecking ? 'default' : 'pointer',
                                        boxShadow: '0 2px 0 var(--border-color)',
                                    }}
                                >
                                    {word}
                                </button>
                            );
                        })}
                    </div>
                </>
            )}

            {/* Show correct answer on wrong */}
            {isChecking && !isCorrect && correctAnswer && (
                <div style={{
                    fontSize: 14, color: 'var(--accent-color)', fontWeight: 600,
                }}>
                    Correct answer: {correctAnswer}
                </div>
            )}
        </div>
    );
}
