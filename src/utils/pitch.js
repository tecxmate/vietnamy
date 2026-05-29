// Lightweight client-side pitch (F0) tracking for the tone trainer.
//
// Goal: show the learner the *shape* of their pitch (rising / falling / dipping)
// against the reference tone contour — accurate enough to be honest, but
// normalized and smoothed so it reads as an idea, not a spectrogram.
//
// Method: short-time autocorrelation per frame → median-filter out octave
// glitches → convert to semitones relative to the speaker's own median pitch
// (so it's comparable to anyone's voice) → resample to a handful of points.

// Resample an array to exactly `n` points by linear interpolation.
function resampleTo(arr, n) {
    const out = [];
    for (let k = 0; k < n; k++) {
        const t = (k / (n - 1)) * (arr.length - 1);
        const lo = Math.floor(t);
        const hi = Math.min(arr.length - 1, lo + 1);
        out.push(arr[lo] + (arr[hi] - arr[lo]) * (t - lo));
    }
    return out;
}

function zeroMean(arr) {
    const m = arr.reduce((a, b) => a + b, 0) / arr.length;
    return arr.map(v => v - m);
}

/**
 * Compare a learner's pitch contour against reference tone templates by SHAPE.
 * Both sides are zero-meaned (so absolute pitch height is ignored — only the
 * rise/fall/dip pattern matters) and compared by RMS distance in semitones.
 *
 * @param {number[]} userContour  the learner's normalized pitch contour
 * @param {{id:string, contour:number[]}[]} templates  reference tone contours
 * @returns {{id:string, dist:number, score:number}[]} sorted best-match first
 */
export function classifyContour(userContour, templates, n = 24) {
    if (!userContour || userContour.length < 2) return null;
    const u = zeroMean(resampleTo(userContour, n));
    const scored = templates.map(t => {
        const r = zeroMean(resampleTo(t.contour, n));
        let se = 0;
        for (let i = 0; i < n; i++) { const d = u[i] - r[i]; se += d * d; }
        const dist = Math.sqrt(se / n); // RMS difference in semitones
        // Map distance to a friendly 0-100 match score (≈0 st → 100, ≥2.5 st → 0).
        const score = Math.max(0, Math.min(100, Math.round(100 * (1 - dist / 2.5))));
        return { id: t.id, dist, score };
    });
    return scored.sort((a, b) => a.dist - b.dist);
}

// Estimate F0 (Hz) for one frame via normalized autocorrelation, or null if the
// frame is silent / not periodic enough to trust.
function frameF0(buf, start, size, minLag, maxLag, sampleRate) {
    let energy = 0;
    for (let i = 0; i < size; i++) { const s = buf[start + i]; energy += s * s; }
    const rms = Math.sqrt(energy / size);
    if (rms < 0.008) return null; // effectively silence

    const acf = (lag) => {
        let s = 0;
        for (let i = 0; i < size - lag; i++) s += buf[start + i] * buf[start + i + lag];
        return s;
    };

    let bestLag = -1;
    let bestVal = 0;
    for (let lag = minLag; lag <= maxLag; lag++) {
        const v = acf(lag);
        if (v > bestVal) { bestVal = v; bestLag = lag; }
    }
    if (bestLag < 0) return null;
    if (bestVal / energy < 0.3) return null; // weak periodicity → unvoiced

    // Parabolic interpolation for sub-sample lag accuracy.
    const y0 = acf(bestLag - 1);
    const y1 = bestVal;
    const y2 = acf(bestLag + 1);
    const denom = y0 - 2 * y1 + y2;
    const shift = denom !== 0 ? (0.5 * (y0 - y2)) / denom : 0;
    return sampleRate / (bestLag + shift);
}

// 3-point median filter to kill single-frame octave jumps.
function medianFilter3(arr) {
    const out = arr.slice();
    for (let i = 1; i < arr.length - 1; i++) {
        if (arr[i - 1] == null || arr[i] == null || arr[i + 1] == null) continue;
        const t = [arr[i - 1], arr[i], arr[i + 1]].sort((a, b) => a - b);
        out[i] = t[1];
    }
    return out;
}

/**
 * Build a normalized pitch contour from mono PCM samples.
 * @returns {number[]|null} `points` semitone values (relative to the speaker's
 *   median, centered near 0), or null if there isn't enough voiced signal.
 */
export function pitchContourFromSamples(samples, sampleRate, points = 24) {
    if (!samples || samples.length < sampleRate * 0.1) return null;

    const frameSize = Math.round(0.04 * sampleRate); // 40 ms
    const hop = Math.round(0.01 * sampleRate);        // 10 ms
    const minLag = Math.floor(sampleRate / 400);      // up to 400 Hz
    const maxLag = Math.ceil(sampleRate / 70);        // down to 70 Hz

    const f0 = [];
    for (let s = 0; s + frameSize <= samples.length; s += hop) {
        f0.push(frameF0(samples, s, frameSize, minLag, maxLag, sampleRate));
    }
    const filtered = medianFilter3(f0);

    const voiced = filtered.filter(v => v != null);
    if (voiced.length < 5) return null;
    const sorted = voiced.slice().sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];

    // Convert to semitones relative to the median pitch.
    const semis = filtered.map(v => (v == null ? null : 12 * Math.log2(v / median)));

    // Trim to the voiced span and linearly fill interior gaps.
    let first = semis.findIndex(v => v != null);
    let last = semis.length - 1;
    while (last > 0 && semis[last] == null) last--;
    if (first < 0 || last <= first) return null;

    const seg = semis.slice(first, last + 1);
    for (let i = 0; i < seg.length; i++) {
        if (seg[i] != null) continue;
        let a = i - 1;
        let b = i + 1;
        while (a >= 0 && seg[a] == null) a--;
        while (b < seg.length && seg[b] == null) b++;
        if (a >= 0 && b < seg.length) seg[i] = seg[a] + (seg[b] - seg[a]) * ((i - a) / (b - a));
        else seg[i] = seg[a >= 0 ? a : b];
    }

    // Light smoothing (moving average, window 3).
    const smooth = seg.map((v, i) => {
        const lo = Math.max(0, i - 1);
        const hi = Math.min(seg.length - 1, i + 1);
        let sum = 0;
        for (let j = lo; j <= hi; j++) sum += seg[j];
        return sum / (hi - lo + 1);
    });

    // Re-center on the segment's own median so it sits around the baseline.
    const segSorted = smooth.slice().sort((a, b) => a - b);
    const segMedian = segSorted[Math.floor(segSorted.length / 2)];
    const centered = smooth.map(v => v - segMedian);

    // Resample to `points` evenly spaced samples across the voiced span.
    const out = [];
    for (let k = 0; k < points; k++) {
        const t = (k / (points - 1)) * (centered.length - 1);
        const lo = Math.floor(t);
        const hi = Math.min(centered.length - 1, lo + 1);
        const frac = t - lo;
        const val = centered[lo] + (centered[hi] - centered[lo]) * frac;
        out.push(Math.max(-5, Math.min(4, val)));
    }
    return out;
}
