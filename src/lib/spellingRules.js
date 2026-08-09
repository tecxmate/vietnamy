// The legality engine for the Spelling Playground.
//
// Two jobs:
//   1) compose()  — turn a slot state into the written syllable (with the tone
//      mark placed on the nucleus).
//   2) validate() — apply the real orthography rules and report any conflict,
//      so illegal blocks can refuse to snap and explain WHY.
//
// The rules encoded here are the ones that actually trip learners up. They are
// intentionally the "famous" spelling rules, not an exhaustive phonotactics.

import { findBlock } from '../data/spellingBlocks';
import { TONE_IDS, applyTone } from '../data/vnTones';
import { VALID_SYLLABLES, canReachRealBase } from './spellingLexicon';

export { TONE_IDS, applyTone };

// Initials whose /k/ and /g/ and /ng/ sounds change SPELLING by the next vowel.

// ── glide (âm đệm) — which nuclei accept a /w/ glide, and its o/u spelling ──
const GLIDE_OK_NUCLEI = new Set(['a', 'ă', 'e', 'â', 'ê', 'ơ', 'i', 'y']); // no glide before rounded o,ô,u,ư
const GLIDE_O_NUCLEI = new Set(['a', 'ă', 'e']); // hoa, hoặc, khoe → written "o"

// ── final consonants ────────────────────────────────────────────────────────
const FRONT_ONLY_FINALS = new Set(['ch', 'nh']); // only after a, ê, i
const CH_NH_NUCLEI = new Set(['a', 'ê', 'i']);
const SEMIVOWEL_FINALS = new Set(['i', 'y', 'o', 'u']);
// Open centering diphthongs are the final-less form; a final means the closed form.
const OPEN_DIPHTHONGS = new Set(['ia', 'ua', 'ưa']);

// Which nuclei each semivowel off-glide may follow (this is what makes a
// gliding diphthong / triphthong legal: a+i→ai, ô+i→ôi, iê+u→iêu, ươ+i→ươi…).
const SEMIVOWEL_AFTER = {
    i: new Set(['a', 'o', 'ô', 'ơ', 'u', 'ư', 'uô', 'ươ']),        // ai, oi, ôi, ơi, ui, ưi, uôi, ươi
    y: new Set(['a', 'â']),                                        // ay, ây
    o: new Set(['a', 'e']),                                        // ao, eo
    u: new Set(['a', 'â', 'ê', 'i', 'ư', 'iê', 'ươ']),            // au, âu, êu, iu, ưu, iêu, ươu
};

// A nucleus is "front" per its block flag (drives the k/c spelling split).
const isFront = (nucleusId) => findBlock('nucleus', nucleusId)?.front === true;

// The c/k · g/gh · ng/ngh family: one sound, two spellings chosen by the sound
// right after it. [back-form, front-form]. We AUTO-CORRECT these rather than
// block them — the mistake becomes a teaching moment (ng é → ngh é).
const KG_PAIR = {
    c: ['c', 'k'], k: ['c', 'k'],
    g: ['g', 'gh'], gh: ['g', 'gh'],
    ng: ['ng', 'ngh'], ngh: ['ng', 'ngh'],
};

/** The correctly-spelled initial for the context (unchanged if not in the family). */
export function correctInitial(initial, glide, nucleus) {
    const pair = KG_PAIR[initial];
    if (!pair || !nucleus) return initial;
    const nextIsFront = glide ? false : isFront(nucleus); // o/u glide is never front
    return nextIsFront ? pair[1] : pair[0];
}

/** A plain-language note when the spelling was auto-corrected, else null. */
export function spellingNote(original, corrected, glide, nucleus) {
    if (!corrected || corrected === original) return null;
    const nextIsFront = glide ? false : isFront(nucleus);
    const where = nextIsFront ? 'before e, ê, i, y' : 'before a, ă, â, o, ô, ơ, u, ư';
    return `“${original}” is written “${corrected}” ${where}.`;
}

/** Place the tone mark on the correct vowel of a (possibly multi-char) nucleus. */
function toneNucleus(nucleusId, toneId) {
    const at = findBlock('nucleus', nucleusId)?.tone_at ?? 0;
    const chars = [...nucleusId];
    if (at < chars.length) chars[at] = applyTone(chars[at], toneId);
    return chars.join('');
}

/**
 * Compose the written syllable from a slot state.
 * state = { initial, glide, nucleus, final, tone } — each an id or null.
 * The tone mark lands on the nucleus's tone-bearing vowel.
 */
export function compose(state) {
    const { initial, glide, nucleus, final, tone } = state;
    if (!nucleus) return '';
    const toned = toneNucleus(nucleus, tone || 'ngang');
    return `${initial || ''}${glide || ''}${toned}${final || ''}`;
}

/**
 * Validate the current state. Returns an array of violations:
 *   { slots: string[], reason: string }
 * Empty array = a legal (or not-yet-decidable) syllable.
 */
export function validate(state) {
    const { initial, glide, nucleus, final, tone } = state;
    const out = [];

    // ── R0: a glide attaches to a vowel — pick the vowel first ───────────────
    if (glide && !nucleus) {
        out.push({ slots: ['glide'], reason: 'Pick the vowel (âm chính) first — a glide attaches to it.' });
    }

    // ── R1: q always needs the u glide ──────────────────────────────────────
    if (initial === 'q' && glide !== 'u') {
        out.push({ slots: ['initial', 'glide'], reason: '“q” never stands alone — it always writes q + u (qu-).' });
    }

    // R2 (k/c · g/gh · ng/ngh) is intentionally NOT a blocking rule — it's
    // auto-corrected at pick time via correctInitial(), so the learner can try
    // "ng é" and watch it become "ngh é" with an explanation.

    // ── R3: the glide only fits certain vowels, and its o/u spelling ─────────
    if (glide && nucleus) {
        if (!GLIDE_OK_NUCLEI.has(nucleus)) {
            out.push({ slots: ['glide'], reason: `There’s no w-glide before ${nucleus} — drop the glide.` });
        } else if (glide === 'o' && !GLIDE_O_NUCLEI.has(nucleus)) {
            out.push({ slots: ['glide'], reason: `Before ${nucleus} the glide is written “u”, not “o”.` });
        } else if (glide === 'u' && GLIDE_O_NUCLEI.has(nucleus) && initial !== 'q') {
            out.push({ slots: ['glide'], reason: `Before ${nucleus} the glide is written “o”, not “u” (unless after q).` });
        }
    }

    // ── R4: open diphthongs ia/ua/ưa take no final ───────────────────────────
    if (final && OPEN_DIPHTHONGS.has(nucleus)) {
        const closed = { ia: 'iê', ua: 'uô', ưa: 'ươ' }[nucleus];
        out.push({ slots: ['final'], reason: `“${nucleus}” is the open form — before a final use “${closed}” (e.g. ${closed}${final}).` });
    }

    // ── R5: -ch / -nh only after a, ê, i ─────────────────────────────────────
    if (final && nucleus && FRONT_ONLY_FINALS.has(final) && !CH_NH_NUCLEI.has(nucleus)) {
        out.push({ slots: ['final'], reason: `“-${final}” only closes after a, ê, i — not after ${nucleus}.` });
    }

    // ── R6: a semivowel off-glide (-i/-y/-o/-u) only follows certain vowels ──
    if (final && nucleus && SEMIVOWEL_FINALS.has(final)) {
        const allowed = SEMIVOWEL_AFTER[final];
        if (allowed && !allowed.has(nucleus)) {
            out.push({ slots: ['final'], reason: `“${nucleus}${final}” isn’t a Vietnamese vowel cluster — try another ending.` });
        }
    }

    // ── R7: stopped syllables take only sắc or nặng ──────────────────────────
    if (final && tone) {
        const finalBlock = findBlock('final', final);
        const toneStopOk = tone === 'sac' || tone === 'nang' || tone === 'ngang';
        if (finalBlock?.stops && !toneStopOk) {
            out.push({ slots: ['tone'], reason: 'A syllable ending in c, ch, p, t can only take sắc (´) or nặng (.).' });
        }
    }

    return out;
}

/** True if any violation touches `slot`. */
export function slotHasViolation(violations, slot) {
    return violations.some((v) => v.slots.includes(slot));
}

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
 */
export function placementBlock(state, slot, blockId) {
    const candidate = { ...state, [slot]: blockId };

    // 1) orthographic rules first — they teach WHY a spelling is wrong.
    const fresh = validate(candidate).find((v) => v.slots.includes(slot) && !slotHasViolation(validate(state), slot));
    if (fresh) return fresh.reason;

    // 2) existence — never offer a piece that can't reach a real Vietnamese word.
    if (slot === 'tone') {
        const tones = attestedTonesFor(state);
        if (tones && !tones.has(blockId)) {
            return 'No real Vietnamese word has this syllable with this tone.';
        }
        return null;
    }
    // Reachability uses the auto-corrected spelling, so a family choice (or its
    // vowel) is never greyed just for being the "wrong" spelling — ng+e reaches
    // a real word as ngh+e; picking it will auto-correct.
    const norm = { ...candidate, initial: correctInitial(candidate.initial, candidate.glide, candidate.nucleus) };
    if (norm.nucleus && !canReachRealBase(norm)) {
        return 'No real Vietnamese word uses this combination.';
    }
    return null;
}

/** Speakable once it's a complete, rule-legal, and REAL Vietnamese syllable. */
export function isSpeakable(state) {
    return isReal(state) && validate(state).length === 0;
}
