import { useEffect, useRef, useState } from 'react';

// Fixed semitone domain shared by all 6 contours so their shapes are
// directly comparable (deepest dip ≈ -4.5, highest peak ≈ +3.2).
const DOMAIN_MIN = -5;
const DOMAIN_MAX = 4;
const W = 100;
const H = 56;
const PAD_Y = 6;

const valueToY = (v) => {
    const t = (v - DOMAIN_MIN) / (DOMAIN_MAX - DOMAIN_MIN); // 0..1, low→high
    return H - PAD_Y - t * (H - PAD_Y * 2);
};

// Build a smoothed path through the contour points using midpoint quadratics.
function buildPath(points) {
    if (points.length < 2) return '';
    let d = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
    for (let i = 1; i < points.length - 1; i++) {
        const mx = (points[i].x + points[i + 1].x) / 2;
        const my = (points[i].y + points[i + 1].y) / 2;
        d += ` Q ${points[i].x.toFixed(2)} ${points[i].y.toFixed(2)} ${mx.toFixed(2)} ${my.toFixed(2)}`;
    }
    const last = points[points.length - 1];
    d += ` L ${last.x.toFixed(2)} ${last.y.toFixed(2)}`;
    return d;
}

/**
 * Animated pitch-contour graph for one Vietnamese tone.
 * `playToken` — increment to (re)trigger the left-to-right tracing animation,
 * ideally timed to coincide with the spoken syllable.
 *
 * The SVG stretches to fill its box (preserveAspectRatio="none"), so strokes
 * use non-scaling-stroke to stay uniform width, and the moving dot + axis
 * labels are HTML overlays (an SVG circle would distort into an ellipse).
 */
export default function PitchGraph({ contour, color, playToken = 0, height = 120, userContour = null, userColor = '#334155' }) {
    const points = contour.map((v, i) => ({
        x: (i / (contour.length - 1)) * W,
        y: valueToY(v),
    }));
    const fullPath = buildPath(points);

    const userPath = userContour && userContour.length > 1
        ? buildPath(userContour.map((v, i) => ({ x: (i / (userContour.length - 1)) * W, y: valueToY(v) })))
        : null;

    const [progress, setProgress] = useState(1); // 0..1 reveal
    const rafRef = useRef(null);

    useEffect(() => {
        if (!playToken) return; // don't animate on first mount
        cancelAnimationFrame(rafRef.current);
        const duration = 1000;
        let start = null;
        const tick = (ts) => {
            if (start == null) start = ts;
            const p = Math.min(1, (ts - start) / duration);
            setProgress(p); // first tick sets progress to 0, restarting the trace
            if (p < 1) rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(rafRef.current);
    }, [playToken]);

    // Dot position: interpolate along sampled points by progress.
    const fpos = progress * (points.length - 1);
    const lo = Math.floor(fpos);
    const hi = Math.min(points.length - 1, lo + 1);
    const frac = fpos - lo;
    const dotX = points[lo].x + (points[hi].x - points[lo].x) * frac;
    const dotY = points[lo].y + (points[hi].y - points[lo].y) * frac;

    // Bright "drawn-so-far" path = points up to the dot, plus the dot itself.
    const drawnPoints = points.slice(0, lo + 1);
    if (frac > 0 && hi !== lo) drawnPoints.push({ x: dotX, y: dotY });
    const drawnPath = buildPath(drawnPoints);

    const baselineY = valueToY(0);

    return (
        <div style={{ position: 'relative', width: '100%', height }}>
            <svg
                viewBox={`0 0 ${W} ${H}`}
                width="100%"
                height="100%"
                preserveAspectRatio="none"
                style={{ display: 'block', overflow: 'visible' }}
            >
                {/* baseline (speaker's mid pitch) */}
                <line x1="0" y1={baselineY} x2={W} y2={baselineY}
                    stroke="var(--border-color)" strokeWidth="1" strokeDasharray="4 4"
                    vectorEffect="non-scaling-stroke" />
                {/* faint full contour */}
                <path d={fullPath} fill="none" stroke={color} strokeWidth="2.5"
                    strokeOpacity="0.22" strokeLinecap="round" strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke" />
                {/* drawn-so-far contour */}
                {drawnPath && (
                    <path d={drawnPath} fill="none" stroke={color} strokeWidth="3.5"
                        strokeLinecap="round" strokeLinejoin="round"
                        vectorEffect="non-scaling-stroke" />
                )}
                {/* the learner's own pitch trace */}
                {userPath && (
                    <path d={userPath} fill="none" stroke={userColor} strokeWidth="3"
                        strokeLinecap="round" strokeLinejoin="round" strokeDasharray="5 4"
                        vectorEffect="non-scaling-stroke" />
                )}
            </svg>

            {/* axis labels (HTML so they don't shear with the SVG) */}
            <span style={{ position: 'absolute', top: 4, left: 6, fontSize: 10, color: 'var(--text-muted)', opacity: 0.7 }}>high</span>
            <span style={{ position: 'absolute', bottom: 4, left: 6, fontSize: 10, color: 'var(--text-muted)', opacity: 0.7 }}>low</span>

            {/* traveling pitch dot — only during the Learn-step trace animation */}
            {playToken > 0 && (
                <span style={{
                    position: 'absolute',
                    left: `${dotX}%`,
                    top: `${(dotY / H) * 100}%`,
                    width: 12, height: 12, borderRadius: '50%',
                    backgroundColor: color,
                    transform: 'translate(-50%, -50%)',
                    boxShadow: `0 0 0 5px ${color}33`,
                    pointerEvents: 'none',
                }} />
            )}
        </div>
    );
}
