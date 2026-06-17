// Karaoke timing for the Narrated Reader — pure functions, no React.
//
// Two sources of word windows, both producing the SAME shape: an array of
// cumulative end-times (seconds) aligned to the rendered segment indices, so
// the player's rAF loop can do `windows.findIndex(end => t < end)` either way.
//   • buildEstimateWindows — v1 client-side syllable estimate (no backend).
//   • buildExactWindows    — Phase 4, from Azure WordBoundary marks.

export const BASE_MS = 240;     // pause padding per word
export const PER_SYLL = 165;    // ms per syllable
export const PUNCT_MS = 90;     // punctuation gets a thin slice

export const isWordText = (t) => /[A-Za-zÀ-ỹ]/.test(t);
export const syllables = (t) => Math.max(1, (t || '').trim().split(/\s+/).length);
export const tokWeight = (t) => (isWordText(t) ? BASE_MS + PER_SYLL * syllables(t) : PUNCT_MS);

// Rough per-sentence duration (seconds) from raw text — seeds the seek bar /
// time labels before a clip's real duration is known.
export const estSentSec = (vi) =>
    (vi || '').split(/\s+/).reduce((a, tok) => a + tokWeight(tok.replace(/[.,!?;:"“”'’()…«»]/g, '')), 0) / 1000;

// Distribute the real clip duration across tokens by syllable weight.
export function buildEstimateWindows(segs, dur) {
    const weights = segs.map((seg) => (seg.punct ? PUNCT_MS : tokWeight(seg.text)));
    const total = weights.reduce((a, b) => a + b, 0) || 1;
    let cum = 0;
    return weights.map((w) => { cum += w; return (cum / total) * dur; });
}

// Exact windows from Azure WordBoundary marks (spoken words, in order, each with
// a real `offsetMs`). Our segments keep compounds intact, so a segment of N
// syllables consumes N marks; its window end = the next mark's offset.
export function buildExactWindows(segs, marks, dur) {
    const windows = new Array(segs.length);
    let mi = 0;
    let lastEnd = 0;
    for (let i = 0; i < segs.length; i++) {
        if (segs[i].punct) { windows[i] = lastEnd; continue; }
        mi += Math.max(1, syllables(segs[i].text));   // consume this segment's marks
        const next = marks[mi];                        // start of the following word
        const endMs = next ? next.offsetMs : dur * 1000;
        lastEnd = Math.min(dur, endMs / 1000);
        windows[i] = lastEnd;
    }
    return windows;
}
