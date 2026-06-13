import React, { useState, useEffect } from 'react';
import { Check, X } from 'lucide-react';
import { playTap } from '../../utils/sound';
import { useT } from '../../lib/i18n';
import { useUser } from '../../context/UserContext';
import { getLine } from '../../lib/mascot';
import BeKhe from '../BeKhe/BeKhe';

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
    showHint = false, // First wrong attempt: show a hint instead of the full answer
    hint = '', // The hint text shown when showHint is true
    onTryAgain = null, // Re-enter the answer without advancing
    onShowAnswer = null, // Reveal the full answer immediately
}) {
    const t = useT();
    const { userProfile } = useUser();
    const lang = userProfile?.nativeLang;
    const [isVisible, setIsVisible] = useState(false);
    const [isPressed, setIsPressed] = useState(false);
    // Bé Khế's line for this answer, rolled once on mount (null = stay silent)
    const [mascot] = useState(() => getLine(isCorrect ? 'correct' : 'wrong', { lang }));
    // Shake on a wrong answer; starts on (banner mounts fresh per question) and clears after the animation
    const [shouldShake, setShouldShake] = useState(() => !isCorrect);
    // Pick one varied praise phrase per question (Duolingo-style), locked on mount
    const [praise] = useState(() => {
        const pool = t('feedback_praise');
        return Array.isArray(pool) && pool.length > 0
            ? pool[Math.floor(Math.random() * pool.length)]
            : t('feedback_correct');
    });

    useEffect(() => {
        // Trigger slide-in animation
        requestAnimationFrame(() => {
            requestAnimationFrame(() => setIsVisible(true));
        });
        // Clear the shake once its animation has played
        if (!isCorrect) {
            const id = setTimeout(() => setShouldShake(false), 500);
            return () => clearTimeout(id);
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

    const handleTryAgain = () => {
        playTap();
        onTryAgain?.();
    };

    const handleShowAnswer = () => {
        playTap();
        onShowAnswer?.();
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
                maxHeight: '100%',
                overflowY: 'auto',
                /* Room for the CTA's 3D bottom shadow (0 4px 0) so overflow:auto
                   doesn't clip it. */
                paddingBottom: 6,
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
                {mascot ? (
                    <div style={{ flexShrink: 0, display: 'flex' }}>
                        <BeKhe expression={mascot.expression} size={48} />
                    </div>
                ) : (
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
                )}
                <div style={{ flex: 1 }}>
                    <span style={{
                        fontWeight: 800, fontSize: 17, color,
                        display: 'block',
                    }}>
                        {mascot
                            ? mascot.text
                            : isCorrect
                                ? fuzzyHint
                                    ? t('feedback_good')
                                    : praise
                                : t('feedback_incorrect')}
                    </span>
                    {/* Show fuzzy hint or correct answer */}
                    {isCorrect && fuzzyHint && (
                        <div style={{
                            fontSize: 14, color: 'var(--text-muted)',
                            marginTop: 4,
                        }}>
                            {t('feedback_perfect_spelling')}: <strong style={{ color: 'var(--text-main)' }}>{fuzzyHint}</strong>
                        </div>
                    )}
                    {/* Show alternative translations when correct */}
                    {isCorrect && !fuzzyHint && alternatives && alternatives.length > 1 && (
                        <div style={{
                            fontSize: 13, color: 'var(--text-muted)',
                            marginTop: 4,
                        }}>
                            {t('feedback_also')}: {alternatives.slice(1, 3).join(', ')}
                        </div>
                    )}
                    {!isCorrect && showHint && hint && (
                        <div style={{
                            fontSize: 14, color: 'var(--text-muted)',
                            marginTop: 4,
                        }}>
                            {t('feedback_hint')}: <strong style={{ color: 'var(--text-main)' }}>{hint}</strong>
                        </div>
                    )}
                    {!isCorrect && !showHint && correctAnswer && (
                        <div style={{
                            fontSize: 14, color: 'var(--text-muted)',
                            marginTop: 4,
                        }}>
                            {t('feedback_correct_answer')}: <strong style={{ color: 'var(--text-main)' }}>{correctAnswer}</strong>
                        </div>
                    )}
                </div>
            </div>

            {/* Hint-first actions on the first wrong attempt; otherwise Continue */}
            {showHint ? (
                <div style={{ display: 'flex', gap: 10 }}>
                    <button
                        onPointerDown={() => setIsPressed(true)}
                        onPointerUp={() => setIsPressed(false)}
                        onPointerLeave={() => setIsPressed(false)}
                        onClick={handleTryAgain}
                        style={{
                            flex: 1,
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
                        {t('feedback_try_again')}
                    </button>
                    <button
                        onClick={handleShowAnswer}
                        style={{
                            padding: '16px 18px',
                            borderRadius: 14,
                            border: `2px solid ${color}`,
                            cursor: 'pointer',
                            backgroundColor: 'transparent',
                            color,
                            fontWeight: 800,
                            fontSize: 15,
                            letterSpacing: 0.3,
                            WebkitTapHighlightColor: 'transparent',
                        }}
                    >
                        {t('feedback_show_answer')}
                    </button>
                </div>
            ) : (
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
                    {t('continue_upper')}
                </button>
            )}
        </div>
    );
}
