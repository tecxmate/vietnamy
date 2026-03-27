import React from 'react';

/**
 * MCQOptions — Vertical list of multiple-choice option buttons.
 *
 * Shows green/red feedback when isChecking is true.
 * Uses var(--accent-color) for selection highlighting.
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
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {options.map((opt, i) => {
                const isSelected = selectedAnswer === opt;
                const isCorrectOption = opt === correctAnswer;

                let bg = 'var(--surface-color)';
                let borderColor = 'var(--border-color)';
                let textColor = 'var(--text-main)';

                if (isChecking) {
                    if (isCorrectOption) {
                        bg = 'rgba(88, 204, 2, 0.12)';
                        borderColor = '#58CC02';
                        textColor = '#58CC02';
                    } else if (isSelected && !isCorrect) {
                        bg = 'rgba(239, 68, 68, 0.12)';
                        borderColor = '#EF4444';
                        textColor = '#EF4444';
                    }
                } else if (isSelected) {
                    bg = 'color-mix(in srgb, var(--accent-color) 8%, transparent)';
                    borderColor = 'var(--accent-color)';
                }

                return (
                    <button
                        key={i}
                        onClick={() => !isChecking && !disabled && onSelect(opt)}
                        disabled={isChecking || disabled}
                        style={{
                            padding: '14px 16px',
                            borderRadius: 12,
                            border: `2px solid ${borderColor}`,
                            backgroundColor: bg,
                            cursor: isChecking || disabled ? 'default' : 'pointer',
                            textAlign: 'left',
                            fontSize: 15,
                            fontWeight: 600,
                            color: textColor,
                            transition: 'all 0.15s ease',
                            boxShadow: '0 2px 0 var(--border-color)',
                        }}
                    >
                        {opt}
                    </button>
                );
            })}
        </div>
    );
}
