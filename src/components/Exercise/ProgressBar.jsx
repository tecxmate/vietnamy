import React from 'react';

/**
 * ProgressBar — Duolingo-style horizontal progress bar.
 *
 * Features:
 * - Smooth animated fill
 * - Gradient shine effect
 * - Bouncy transition on progress change
 */
export default function ProgressBar({
    progress = 0,
    height = 10,
    color = '#58CC02',
}) {
    const pct = Math.max(0, Math.min(1, progress)) * 100;

    return (
        <div style={{
            width: '100%',
            height,
            borderRadius: height,
            backgroundColor: 'var(--surface-color-light)',
            overflow: 'hidden',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)',
        }}>
            <div style={{
                width: `${pct}%`,
                height: '100%',
                background: `linear-gradient(180deg, ${color} 0%, color-mix(in srgb, ${color} 85%, black) 100%)`,
                borderRadius: height,
                transition: 'width 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                position: 'relative',
                overflow: 'hidden',
            }}>
                {/* Shine effect */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '50%',
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 100%)',
                    borderRadius: `${height}px ${height}px 0 0`,
                }} />
            </div>
        </div>
    );
}
