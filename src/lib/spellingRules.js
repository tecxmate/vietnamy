// The legality engine for the Spelling Playground.
//
// This is the lexicon-aware half: the orthography rules live in
// ./spellingSyntax.js (which knows nothing about which syllables exist), and
// this module adds "…and is that a real Vietnamese word?" on top. Together they
// decide what a block is allowed to do:
//
//   rules  → what the writing system permits (and WHY it doesn't)
//   lexicon → what Vietnamese actually attests
//
// The whole syntax API is re-exported here so callers only need one import.

import { TONE_IDS, applyTone } from '../data/vnTones.js';
import { VALID_SYLLABLES, canReachRealBase } from './spellingLexicon.js';
import { applyPick, compose, validate } from './spellingSyntax.js';

export { TONE_IDS, applyTone };
export {
    applyPick,
    compose,
    correctGlide,
    correctInitial,
    correctNucleus,
    correctToneForFinal,
    glideNote,
    isNormalForm,
    nucleusNote,
    slotHasViolation,
    spellingNote,
    toneStopNote,
    validate,
} from './spellingSyntax.js';

/** The written syllable is a real, attested Vietnamese syllable. */
export function isReal(state) {
    return Boolean(state.nucleus) && VALID_SYLLABLES.has(compose(state));
}

/**
 * Which tones yield a real Vietnamese word for the current structural state.
 * Returns a Set of tone ids, or null when the base isn't a real word yet (so
 * the caller leaves every tone open rather than greying them all).
 */
export function attestedTonesFor(state) {
    if (!state.nucleus) return null;
    const real = TONE_IDS.filter((t) => VALID_SYLLABLES.has(compose({ ...state, tone: t })));
    return real.length ? new Set(real) : null;
}

/**
 * Would placing `blockId` in `slot` be blocked — by a spelling rule, or because
 * no real Vietnamese word could result? Returns the reason string, or null if
 * the placement is fine. This is what greys out illegal / nonexistent blocks.
 *
 * Judged on the state the tap actually produces (applyPick), so a block is
 * never offered on terms different from the ones it lands on.
 */
export function placementBlock(state, slot, blockId) {
    const { state: candidate } = applyPick(state, slot, blockId);

    // 1) orthographic rules first — they teach WHY a spelling is wrong. Any
    // conflict the tap would ADD counts, whichever slot it lands on: dropping a
    // stopping final onto a huyền breaks the tone, not the final.
    const before = new Set(validate(state).map((v) => v.reason));
    const fresh = validate(candidate).find((v) => !before.has(v.reason));
    if (fresh) return fresh.reason;

    // 2) existence — never offer a piece that can't reach a real Vietnamese word.
    if (slot === 'tone') {
        const tones = attestedTonesFor(state);
        if (tones && !tones.has(blockId)) {
            return 'No real Vietnamese word has this syllable with this tone.';
        }
        return null;
    }
    // Reachability uses the auto-corrected spelling (applyPick already
    // normalised it), so a family choice is never greyed just for being the
    // "wrong" spelling — ng+e reaches a real word as ngh+e.
    if (candidate.nucleus && !canReachRealBase(candidate)) {
        return 'No real Vietnamese word uses this combination.';
    }
    return null;
}

/** Speakable once it's a complete, rule-legal, and REAL Vietnamese syllable. */
export function isSpeakable(state) {
    return isReal(state) && validate(state).length === 0;
}
