import React, { useState, useEffect } from 'react';
import { Check, X } from 'lucide-react';
import { playTap } from '../../utils/sound';

/**
 * FeedbackBanner — Colored banner showing correct/incorrect feedback
 * with a Continue button.
 *
 * Duolingo-style:
 * - Slides in from bottom
 * - Button has press animation
 * - Shake animation on wrong answer
 */
export default function FeedbackBanner({
    isCorrect,
    correctAnswer = '',
    onContinue,
    fuzzyHint = null,
    alternatives = null, // Array of alternative accepted translations
}) {
    const [isVisible, setIsVisible] = useState(false);
    const [isPressed, setIsPressed] = useState(false);
    const [shouldShake, setShouldShake] = useState(false);

    useEffect(() => {
        // Trigger slide-in animation
        requestAnimationFrame(() => {
            requestAnimationFrame(() => setIsVisible(true));
        });
        // Shake on wrong answer
        if (!isCorrect) {
            setShouldShake(true);
            setTimeout(() => setShouldShake(false), 500);
        }
    }, [isCorrect]);

    const color = isCorrect ? '#58CC02' : '#EF4444';
    const bgColor = isCorrect
        ? 'rgba(88, 204, 2, 0.12)'
        : 'rgba(239, 68, 68, 0.12)';
    const shadowColor = isCorrect ? '#46A302' : '#B91C1C';

    const handleContinue = () => {
        playTap();
        onContinue();
    };

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
                opacity: isVisible ? 1 : 0,
                transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.2s ease',
                animation: shouldShake ? 'shake 0.5s ease-in-out' : 'none',
            }}
        >
            {/* Shake animation keyframes */}
            <style>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-6px); }
                    20%, 40%, 60%, 80% { transform: translateX(6px); }
                }
            `}</style>

            {/* Status banner */}
            <div style={{
                padding: '14px 18px',
                borderRadius: 14,
                backgroundColor: bgColor,
                border: `2px solid ${color}30`,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
            }}>
                <div style={{
                    width: 32, height: 32,
                    borderRadius: '50%',
                    backgroundColor: color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                }}>
                    {isCorrect ? (
                        <Check size={18} color="#fff" strokeWidth={3} />
                    ) : (
                        <X size={18} color="#fff" strokeWidth={3} />
                    )}
                </div>
                <div style={{ flex: 1 }}>
                    <span style={{
                        fontWeight: 800, fontSize: 17, color,
                        display: 'block',
                    }}>
                        {isCorrect
                            ? fuzzyHint
                                ? 'Good!'
                                : 'Correct!'
                            : 'Incorrect'}
                    </span>
                    {/* Show fuzzy hint or correct answer */}
                    {isCorrect && fuzzyHint && (
                        <div style={{
                            fontSize: 14, color: 'var(--text-muted)',
                            marginTop: 4,
                        }}>
                            Perfect spelling: <strong style={{ color: 'var(--text-main)' }}>{fuzzyHint}</strong>
                        </div>
                    )}
                    {/* Show alternative translations when correct */}
                    {isCorrect && !fuzzyHint && alternatives && alternatives.length > 1 && (
                        <div style={{
                            fontSize: 13, color: 'var(--text-muted)',
                            marginTop: 4,
                        }}>
                            Also: {alternatives.slice(1, 3).join(', ')}
                        </div>
                    )}
                    {!isCorrect && correctAnswer && (
                        <div style={{
                            fontSize: 14, color: 'var(--text-muted)',
                            marginTop: 4,
                        }}>
                            Correct answer: <strong style={{ color: 'var(--text-main)' }}>{correctAnswer}</strong>
                        </div>
                    )}
                </div>
            </div>

            {/* Continue button */}
            <button
                onPointerDown={() => setIsPressed(true)}
                onPointerUp={() => setIsPressed(false)}
                onPointerLeave={() => setIsPressed(false)}
                onClick={handleContinue}
                style={{
                    width: '100%',
                    padding: '16px 24px',
                    borderRadius: 14,
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: color,
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: 17,
                    letterSpacing: 0.5,
                    boxShadow: isPressed ? 'none' : `0 4px 0 ${shadowColor}`,
                    transform: isPressed ? 'translateY(4px)' : 'translateY(0)',
                    transition: 'transform 0.1s ease, box-shadow 0.1s ease',
                    WebkitTapHighlightColor: 'transparent',
                }}
            >
                CONTINUE
            </button>
        </div>
    );
}
