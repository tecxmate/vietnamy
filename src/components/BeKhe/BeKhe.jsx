import React, { useMemo } from 'react';
import { getMascotAsset } from '../../lib/mascot';
import './BeKhe.css';

/**
 * Bé Khế — the starfruit-star mascot, drawn as inline SVG so a single component
 * covers all eight emotional states with no asset pipeline. Pass an `expression`
 * (idle · cheer · celebrate · oops · thinking · wow · sleepy · reading) to swap
 * the face; motion comes from CSS keyframes keyed off the expression.
 *
 * The shapes are lifted from docs/mascot/be_khe_emotional_states_and_reactions.svg.
 */

const INK = '#3A2A12';
const STAR = '#FBD24A';
const STAR_LINE = '#E3A92E';
const LEAF = '#5BBF72';
const CHEEK = '#FF9E9E';
const BOOK = '#7CC3D6';

// Star body + leaf sprouts + (default) rosy cheeks, shared by every face.
function StarBody({ cheeks = true, cheekY = 6 }) {
    return (
        <>
            <path
                d="M0,-46 L13,-15 L46,-14 L20,7 L29,40 L0,21 L-29,40 L-20,7 L-46,-14 L-13,-15 Z"
                fill={STAR}
                stroke={STAR_LINE}
                strokeWidth="3"
                strokeLinejoin="round"
            />
            <path d="M-7,-44 q7,-8 14,0" fill="none" stroke={LEAF} strokeWidth="5" strokeLinecap="round" />
            <ellipse cx="6" cy="-50" rx="8" ry="5" fill={LEAF} transform="rotate(25 6 -50)" />
            <ellipse cx="-4" cy="-52" rx="7" ry="4" fill={LEAF} transform="rotate(-20 -4 -52)" />
            {cheeks && (
                <>
                    <circle cx="-20" cy={cheekY} r="5" fill={CHEEK} opacity="0.8" />
                    <circle cx="20" cy={cheekY} r="5" fill={CHEEK} opacity="0.8" />
                </>
            )}
        </>
    );
}

// A small 4-point sparkle used by cheer/wow.
function Sparkle({ x, y, s = 6 }) {
    return (
        <path
            d={`M${x},${y - s} Q${x + s * 0.25},${y - s * 0.25} ${x + s},${y} Q${x + s * 0.25},${y + s * 0.25} ${x},${y + s} Q${x - s * 0.25},${y + s * 0.25} ${x - s},${y} Q${x - s * 0.25},${y - s * 0.25} ${x},${y - s} Z`}
            fill={STAR_LINE}
        />
    );
}

function DotEyes() {
    return (
        <>
            <circle cx="-13" cy="-6" r="5.5" fill={INK} />
            <circle cx="13" cy="-6" r="5.5" fill={INK} />
            <circle cx="-11.5" cy="-8" r="1.7" fill="#fff" />
            <circle cx="14.5" cy="-8" r="1.7" fill="#fff" />
        </>
    );
}

function FACE(expression) {
    switch (expression) {
        case 'cheer':
            return (
                <>
                    <StarBody />
                    <path d="M-17,-7 q4,-6 9,0" fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" />
                    <path d="M8,-7 q4,-6 9,0" fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" />
                    <path d="M-10,6 q10,12 20,0" fill="none" stroke={INK} strokeWidth="3.4" strokeLinecap="round" />
                    <Sparkle x="34" y="-32" s="7" />
                </>
            );
        case 'celebrate':
            return (
                <>
                    <StarBody cheekY={7} />
                    <DotEyes />
                    <path d="M-12,5 q12,14 24,0" fill="none" stroke={INK} strokeWidth="3.4" strokeLinecap="round" />
                    <rect x="-44" y="-44" width="6" height="6" rx="1.5" fill="#58CC02" />
                    <rect x="40" y="-30" width="6" height="6" rx="1.5" fill="#EF6B6B" />
                    <rect x="30" y="-48" width="6" height="6" rx="1.5" fill={STAR_LINE} />
                    <rect x="-40" y="-20" width="6" height="6" rx="1.5" fill={LEAF} />
                </>
            );
        case 'oops':
            return (
                <>
                    <StarBody />
                    <ellipse cx="-13" cy="-5" rx="5" ry="6" fill={INK} />
                    <ellipse cx="13" cy="-5" rx="5" ry="6" fill={INK} />
                    <circle cx="-11.5" cy="-8" r="1.7" fill="#fff" />
                    <circle cx="14.5" cy="-8" r="1.7" fill="#fff" />
                    <path d="M-9,12 q9,-6 18,0" fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" />
                    <path d="M-20,-16 q6,-3 11,1" fill="none" stroke={INK} strokeWidth="2.4" strokeLinecap="round" />
                </>
            );
        case 'thinking':
            return (
                <>
                    <StarBody />
                    <DotEyes />
                    <path d="M-8,9 q8,3 16,-3" fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" />
                    <text x="26" y="-22" fontSize="20" fontWeight="700" fill={INK}>?</text>
                </>
            );
        case 'wow':
            return (
                <>
                    <StarBody cheeks={false} />
                    <circle cx="-13" cy="-5" r="7.5" fill="#fff" stroke={INK} strokeWidth="2.5" />
                    <circle cx="13" cy="-5" r="7.5" fill="#fff" stroke={INK} strokeWidth="2.5" />
                    <circle cx="-13" cy="-5" r="3.4" fill={INK} />
                    <circle cx="13" cy="-5" r="3.4" fill={INK} />
                    <ellipse cx="0" cy="12" rx="5" ry="7" fill={INK} />
                    <Sparkle x="-38" y="-30" s="6" />
                    <Sparkle x="36" y="-30" s="6" />
                </>
            );
        case 'sleepy':
            return (
                <>
                    <StarBody />
                    <path d="M-19,-5 q6,4 12,0" fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" />
                    <path d="M7,-5 q6,4 12,0" fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" />
                    <path d="M-7,10 q7,4 14,0" fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" />
                    <text x="26" y="-24" fontSize="15" fill="#7A6A52">z</text>
                    <text x="36" y="-34" fontSize="20" fill="#7A6A52">Z</text>
                </>
            );
        case 'reading':
            return (
                <>
                    <StarBody />
                    <DotEyes />
                    <path d="M-9,7 q9,8 18,0" fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" />
                    <g transform="translate(0,34)">
                        <path
                            d="M-22,0 L0,-5 L22,0 L22,16 L0,11 L-22,16 Z"
                            fill={BOOK}
                            stroke={INK}
                            strokeWidth="2.4"
                            strokeLinejoin="round"
                        />
                        <path d="M0,-5 L0,11" stroke={INK} strokeWidth="2.4" />
                    </g>
                </>
            );
        case 'idle':
        default:
            return (
                <>
                    <StarBody />
                    <DotEyes />
                    <path d="M-9,7 q9,9 18,0" fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" />
                </>
            );
    }
}

export default function BeKhe({
    expression = 'idle',
    size = 56,
    animate = true,
    className = '',
    title,
    asset: assetProp,            // optional override (used by the editor's live preview)
    ...rest
}) {
    const label = title || `Bé Khế (${expression})`;
    // Admin-uploaded art for this state, if any. Read once per expression.
    const asset = useMemo(
        () => (assetProp !== undefined ? assetProp : getMascotAsset(expression)),
        [expression, assetProp],
    );
    const motionClass = animate ? `bekhe--${expression}` : '';

    // Custom uploaded artwork (SVG/GIF) wins over the built-in face. GIFs animate
    // themselves; static SVGs get the same CSS motion as the built-in states.
    if (asset?.dataUrl) {
        return (
            <img
                className={`bekhe ${motionClass} ${className}`.trim()}
                src={asset.dataUrl}
                width={size}
                height={size}
                alt={label}
                style={{ objectFit: 'contain' }}
                {...rest}
            />
        );
    }

    return (
        <svg
            className={`bekhe ${motionClass} ${className}`.trim()}
            width={size}
            height={size}
            viewBox="-58 -68 116 124"
            role="img"
            aria-label={label}
            {...rest}
        >
            {FACE(expression)}
        </svg>
    );
}
