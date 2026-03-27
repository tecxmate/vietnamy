import React from 'react';
import { Check, X } from 'lucide-react';

/**
 * FeedbackBanner — Colored banner showing correct/incorrect feedback
 * with a Continue button.
 */
export default function FeedbackBanner({
    isCorrect,
    correctAnswer = '',
    onContinue,
    fuzzyHint = null,
}) {
    const color = isCorrect ? '#58CC02' : '#EF4444';
    const bgColor = isCorrect
        ? 'rgba(88, 204, 2, 0.1)'
        : 'rgba(239, 68, 68, 0.1)';
    const shadowColor = isCorrect ? '#46A302' : '#B91C1C';

    return (
        <div style={{
            display: 'flex', flexDirection: 'column', gap: 12,
        }}>
            {/* Status banner */}
            <div style={{
                padding: '12px 16px',
                borderRadius: 12,
                backgroundColor: bgColor,
                border: `1px solid ${color}40`,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
            }}>
                {isCorrect ? (
                    <Check size={20} color={color} strokeWidth={3} />
                ) : (
                    <X size={20} color={color} strokeWidth={3} />
                )}
                <div style={{ flex: 1 }}>
                    <span style={{
                        fontWeight: 700, fontSize: 15, color,
                    }}>
                        {isCorrect
                            ? fuzzyHint
                                ? 'Good!'
                                : 'Correct!'
                            : 'Not quite'}
                    </span>
                    {/* Show fuzzy hint or correct answer */}
                    {isCorrect && fuzzyHint && (
                        <div style={{
                            fontSize: 13, color: 'var(--text-muted)',
                            marginTop: 2,
                        }}>
                            Try with diacritics: <strong style={{ color: 'var(--text-main)' }}>{fuzzyHint}</strong>
                        </div>
                    )}
                    {!isCorrect && correctAnswer && (
                        <div style={{
                            fontSize: 13, color: 'var(--text-muted)',
                            marginTop: 2,
                        }}>
                            Correct answer: <strong style={{ color: 'var(--text-main)' }}>{correctAnswer}</strong>
                        </div>
                    )}
                </div>
            </div>

            {/* Continue button */}
            <button
                onClick={onContinue}
                style={{
                    width: '100%',
                    padding: '14px 20px',
                    borderRadius: 14,
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: color,
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: 16,
                    boxShadow: `0 4px 0 ${shadowColor}`,
                }}
            >
                CONTINUE
            </button>
        </div>
    );
}
