import React, { useState } from 'react';
import { playTap } from '../../utils/sound';

/**
 * MCQOptions — Vertical list of multiple-choice option buttons.
 *
 * Duolingo-style interactions:
 * - Scale down on press (active state)
 * - Sound on tap
 * - Smooth color transitions
 * - Spring-like selection feedback
 */
export default function MCQOptions({
    options = [],
    selectedAnswer,
    correctAnswer,
    onSelect,
    isChecking = false,
    isCorrect = null,
    disabled = false,
}) {
    const [pressedIndex, setPressedIndex] = useState(null);

    const handlePress = (opt, index) => {
        if (isChecking || disabled) return;
        playTap();
        onSelect(opt);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {options.map((opt, i) => {
                const isSelected = selectedAnswer === opt;
                const isCorrectOption = opt === correctAnswer;
                const isPressed = pressedIndex === i;

                let bg = 'var(--surface-color)';
                let borderColor = 'var(--border-color)';
                let textColor = 'var(--text-main)';
                let shadowColor = 'var(--border-color)';
                let shadowSize = 4;

                if (isChecking) {
                    if (isCorrectOption) {
                        bg = 'rgba(88, 204, 2, 0.15)';
                        borderColor = '#58CC02';
                        textColor = '#58CC02';
                        shadowColor = '#46A302';
                    } else if (isSelected && !isCorrect) {
                        bg = 'rgba(239, 68, 68, 0.15)';
                        borderColor = '#EF4444';
                        textColor = '#EF4444';
                        shadowColor = '#B91C1C';
                    }
                } else if (isSelected) {
                    bg = 'var(--lesson-selected-fill)';
                    borderColor = 'var(--lesson-selected-border)';
                    textColor = 'var(--lesson-selected-border)';
                    shadowColor = 'color-mix(in srgb, var(--lesson-selected-border) 70%, black)';
                }

                // Pressed state removes shadow
                if (isPressed) {
                    shadowSize = 0;
                }

                return (
                    <button
                        key={i}
                        onPointerDown={() => !isChecking && !disabled && setPressedIndex(i)}
                        onPointerUp={() => setPressedIndex(null)}
                        onPointerLeave={() => setPressedIndex(null)}
                        onClick={() => handlePress(opt, i)}
                        disabled={isChecking || disabled}
                        style={{
                            padding: '16px 18px',
                            borderRadius: 14,
                            border: `2px solid ${borderColor}`,
                            backgroundColor: bg,
                            cursor: isChecking || disabled ? 'default' : 'pointer',
                            textAlign: 'left',
                            fontSize: 16,
                            fontWeight: 600,
                            color: textColor,
                            boxShadow: `0 ${shadowSize}px 0 ${shadowColor}`,
                            transform: isPressed ? 'translateY(4px)' : 'translateY(0)',
                            transition: 'transform 0.1s ease, box-shadow 0.1s ease, background-color 0.15s ease, border-color 0.15s ease',
                            WebkitTapHighlightColor: 'transparent',
                            userSelect: 'none',
                        }}
                    >
                        {opt}
                    </button>
                );
            })}
        </div>
    );
}
