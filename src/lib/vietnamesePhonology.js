// Vietnamese phonological similarity — used to choose distractors that are hard
// for the *right* reason.
//
// A generic distractor ("chào" vs "cảm ơn") is eliminated on meaning alone. A
// phonological neighbour ("bàn" vs "bán" vs "bạn") can only be eliminated by
// hearing the tone, which is the actual skill a listening exercise should test.

const TONE_MARKS = /[̣̀́̃̉]/g;

/** Same syllable, tone stripped: bạn/bán/bàn → ban. */
export function stripTone(text) {
    return String(text || '').normalize('NFD').replace(TONE_MARKS, '').normalize('NFC').toLowerCase();
}

/** Tone marks alone, in order — '' for the level (ngang) tone. */
export function toneSignature(text) {
    return (String(text || '').normalize('NFD').match(TONE_MARKS) || []).join('');
}

/**
 * True when two words are a tone minimal pair: identical letters, different tone.
 * These are the hardest and most useful listening distractors in Vietnamese.
 */
export function isToneMinimalPair(a, b) {
    if (!a || !b) return false;
    const sa = String(a).toLowerCase();
    const sb = String(b).toLowerCase();
    if (sa === sb) return false;
    return stripTone(sa) === stripTone(sb);
}

/** Distance-1 check on the tone-stripped forms (one insert, delete or substitute). */
function isOneEditApart(a, b) {
    if (Math.abs(a.length - b.length) > 1) return false;
    let i = 0;
    let j = 0;
    let edits = 0;
    while (i < a.length && j < b.length) {
        if (a[i] === b[j]) { i++; j++; continue; }
        edits++;
        if (edits > 1) return false;
        if (a.length > b.length) i++;
        else if (a.length < b.length) j++;
        else { i++; j++; }
    }
    return edits + (a.length - i) + (b.length - j) <= 1;
}

/**
 * How confusable `candidate` is with `target` when heard. Higher is more
 * confusable, 0 means not a phonological neighbour at all.
 *
 *   3 — tone minimal pair (bàn / bán)
 *   2 — one letter apart ignoring tone (covers the -n/-ng, -t/-c, e/ê contrasts
 *       that English speakers routinely miss)
 *   1 — same syllable count and same first syllable, for multi-syllable words
 *   0 — unrelated
 */
export function confusabilityScore(target, candidate) {
    if (!target || !candidate) return 0;
    const a = String(target).toLowerCase().trim();
    const b = String(candidate).toLowerCase().trim();
    if (!a || !b || a === b) return 0;

    if (isToneMinimalPair(a, b)) return 3;

    const bareA = stripTone(a);
    const bareB = stripTone(b);
    if (isOneEditApart(bareA, bareB)) return 2;

    const partsA = a.split(/\s+/);
    const partsB = b.split(/\s+/);
    if (partsA.length > 1 && partsA.length === partsB.length && stripTone(partsA[0]) === stripTone(partsB[0])) return 1;

    return 0;
}

/**
 * Order candidates so phonological neighbours come first, preserving the caller's
 * order within each tier (so an already-shuffled list stays random inside a tier).
 */
export function rankByConfusability(target, candidates, textOf = (c) => c) {
    return candidates
        .map((candidate, index) => ({ candidate, index, score: confusabilityScore(target, textOf(candidate)) }))
        .sort((x, y) => (y.score - x.score) || (x.index - y.index))
        .map((entry) => entry.candidate);
}
