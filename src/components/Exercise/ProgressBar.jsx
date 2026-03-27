import React from 'react';

/**
 * ProgressBar — Simple horizontal progress bar.
 *
 * Uses var(--accent-color) for the fill color.
 */
export default function ProgressBar({
    progress = 0,
    height = 8,
}) {
    const pct = Math.max(0, Math.min(1, progress)) * 100;

    return (
        <div style={{
            width: '100%',
            height,
            borderRadius: height / 2,
            backgroundColor: 'var(--border-color)',
            overflow: 'hidden',
        }}>
            <div style={{
                width: `${pct}%`,
                height: '100%',
                backgroundColor: 'var(--accent-color)',
                borderRadius: height / 2,
                transition: 'width 0.3s ease',
            }} />
        </div>
    );
}
