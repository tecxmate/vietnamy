/**
 * dtw.js — Minimal Dynamic Time Warping for 1D pitch contour comparison.
 *
 * Compares two temporal sequences (user pitch contour vs reference tone contour)
 * that may differ in length/speed. Returns a distance, a 0–100 score, and
 * diagnostic feedback for Vietnamese tone practice.
 */

/**
 * Compute the DTW distance between two 1D numeric arrays.
 * @param {number[]} a — First series (e.g. user contour in semitones)
 * @param {number[]} b — Second series (e.g. reference contour)
 * @returns {number}   — DTW distance (lower = more similar)
 */
export function dtwDistance(a, b) {
    const n = a.length;
    const m = b.length;

    if (n === 0 || m === 0) return Infinity;

    // Use two rows instead of full matrix to save memory
    let prev = new Float32Array(m + 1).fill(Infinity);
    let curr = new Float32Array(m + 1).fill(Infinity);
    prev[0] = 0;

    for (let i = 1; i <= n; i++) {
        curr[0] = Infinity;
        for (let j = 1; j <= m; j++) {
            const cost = Math.abs(a[i - 1] - b[j - 1]);
            curr[j] = cost + Math.min(prev[j], curr[j - 1], prev[j - 1]);
        }
        [prev, curr] = [curr, prev];
        curr.fill(Infinity);
    }

    return prev[m];
}


/**
 * Normalize a contour to have a consistent number of points.
 * Uses linear interpolation to resample to `targetLen` points.
 * @param {number[]} contour
 * @param {number} targetLen
 * @returns {number[]}
 */
export function resampleContour(contour, targetLen = 20) {
    if (contour.length === 0) return new Array(targetLen).fill(0);
    if (contour.length === 1) return new Array(targetLen).fill(contour[0]);

    const result = [];
    for (let i = 0; i < targetLen; i++) {
        const pos = (i / (targetLen - 1)) * (contour.length - 1);
        const lo = Math.floor(pos);
        const hi = Math.min(lo + 1, contour.length - 1);
        const frac = pos - lo;
        result.push(contour[lo] * (1 - frac) + contour[hi] * frac);
    }
    return result;
}


/**
 * Calculate accuracy score (0–100) from DTW distance.
 * @param {number[]} userContour   — User's semitone contour
 * @param {number[]} refContour    — Reference semitone contour
 * @returns {number}               — 0 to 100
 */
export function dtwScore(userContour, refContour) {
    const resampled = resampleContour(userContour, refContour.length);
    const dist = dtwDistance(resampled, refContour);

    // Normalize: avg distance per point. A distance of 0 = 100%, ≥6 semitones/point = 0%
    // Wider tolerance needed for tones with dramatic pitch swings (e.g. Ngã glottal break)
    const avgDist = dist / refContour.length;
    const maxReasonable = 6;
    const score = Math.max(0, Math.min(100, Math.round((1 - avgDist / maxReasonable) * 100)));
    return score;
}


/**
 * Generate diagnostic feedback based on comparing user vs reference contour.
 * @param {number[]} userContour
 * @param {number[]} refContour
 * @returns {{ message: string, detail: string }}
 */
export function diagnose(userContour, refContour) {
    if (userContour.length < 3) {
        return { message: 'Too short', detail: 'Hold the sound a bit longer so we can analyze your pitch.' };
    }

    const resampled = resampleContour(userContour, refContour.length);
    const n = resampled.length;

    // Slope analysis: compare overall direction
    const userSlope = resampled[n - 1] - resampled[0];
    const refSlope = refContour[n - 1] - refContour[0];

    // Average level offset
    const userMean = resampled.reduce((s, v) => s + v, 0) / n;
    const refMean = refContour.reduce((s, v) => s + v, 0) / n;
    const levelDiff = userMean - refMean;

    // Check mid-point dip (for Hỏi tone)
    const midIdx = Math.floor(n / 2);
    const userMidDip = resampled[midIdx] - (resampled[0] + resampled[n - 1]) / 2;
    const refMidDip = refContour[midIdx] - (refContour[0] + refContour[n - 1]) / 2;

    const score = dtwScore(userContour, refContour);

    if (score >= 85) {
        return { message: 'Excellent! 🎯', detail: 'Your tone contour matches the target very closely.' };
    }

    if (score >= 70) {
        if (Math.abs(levelDiff) > 1.5) {
            return {
                message: 'Almost there! 💪',
                detail: levelDiff > 0
                    ? 'Your pitch is a bit too high overall. Try relaxing your voice.'
                    : 'Your pitch is a bit too low overall. Try speaking a touch higher.'
            };
        }
        return { message: 'Good shape! 💪', detail: 'The contour is right — just refine the details.' };
    }

    // Direction mismatch
    if (refSlope > 1 && userSlope < -0.5) {
        return { message: 'Wrong direction ↗️', detail: 'This tone should rise, but your pitch fell. Try going up at the end.' };
    }
    if (refSlope < -1 && userSlope > 0.5) {
        return { message: 'Wrong direction ↘️', detail: 'This tone should fall, but your pitch rose. Try letting your voice drop.' };
    }

    // Flat when should curve
    if (Math.abs(refSlope) > 2 && Math.abs(userSlope) < 0.8) {
        return { message: 'Too flat 〰️', detail: 'Your pitch stayed too level. Try exaggerating the rise or fall.' };
    }

    // Missing dip (Hỏi / Ngã)
    if (refMidDip < -1 && userMidDip > -0.3) {
        return { message: 'Missing the dip ⤵️', detail: 'This tone dips in the middle. Try dropping your voice, then rising.' };
    }

    return { message: 'Keep practicing 🔄', detail: 'Try listening to the reference and matching the shape more closely.' };
}
