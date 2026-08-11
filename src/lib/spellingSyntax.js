// The orthography half of the Spelling Playground: what the writing system
// allows, with no knowledge of which syllables actually exist.
//
// Kept lexicon-free on purpose so the build script (scripts/gen-vn-syllables.mjs)
// can apply exactly the same rules the app applies — otherwise the generated
// lexicon and the runtime rules drift apart and the playground offers blocks it
// then refuses to place. The lexicon-aware half lives in ./spellingRules.js.
//
// Three jobs:
//   1) compose()   — turn a slot state into the written syllable (tone mark on
//      the nucleus).
//   2) validate()  — apply the real orthography rules and report any conflict,
//      so illegal blocks can refuse to snap and explain WHY.
//   3) applyPick() — the auto-corrections a tap performs (c→k, o→u, q+u, tone
//      reset), returned with the teaching note that explains them.
//
// The rules encoded here are the ones that actually trip learners up. They are
// intentionally the "famous" spelling rules, not an exhaustive phonotactics.

import { findBlock } from '../data/spellingBlocks.js';
import { applyTone } from '../data/vnTones.js';

// ── glide (âm đệm) — which nuclei accept a /w/ glide, and its o/u spelling ──
// After q the glide is part of the qu- initial, so it escapes this list: quốc,
// quở. Everywhere else there is no glide before a rounded vowel.
const GLIDE_OK_NUCLEI = new Set(['a', 'ă', 'e', 'â', 'ê', 'ơ', 'i', 'y', 'yê']);
const GLIDE_O_NUCLEI = new Set(['a', 'ă', 'e']); // hoa, hoặc, khoe → written "o"

// ── final consonants ────────────────────────────────────────────────────────
const FRONT_ONLY_FINALS = new Set(['ch', 'nh']); // only after a, ê, i, y
const CH_NH_NUCLEI = new Set(['a', 'ê', 'i', 'y']); // y: huynh, khuynh, quých
const SEMIVOWEL_FINALS = new Set(['i', 'y', 'o', 'u']);
// Open centering diphthongs are the final-less form; a final means the closed form.
const OPEN_DIPHTHONGS = new Set(['ia', 'ua', 'ưa']);

// Which nuclei each semivowel off-glide may follow (this is what makes a
// gliding diphthong / triphthong legal: a+i→ai, ô+i→ôi, iê+u→iêu, ươ+i→ươi…).
const SEMIVOWEL_AFTER = {
    i: new Set(['a', 'o', 'ô', 'ơ', 'u', 'ư', 'uô', 'ươ']),        // ai, oi, ôi, ơi, ui, ưi, uôi, ươi
    y: new Set(['a', 'â']),                                        // ay, ây
    o: new Set(['a', 'e']),                                        // ao, eo
    u: new Set(['a', 'â', 'ê', 'i', 'y', 'ư', 'iê', 'yê', 'ươ']), // au, âu, êu, iu, khuỷu, ưu, iêu, yêu, ươu
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

// The /w/ glide is one sound with two spellings, chosen by context: "o" before
// a/ă/e, "u" otherwise (and always "u" after q). Auto-corrected like the c/k
// family. (Glide-before-rounded is impossible — that stays a hard block in R3.)
export function correctGlide(glide, nucleus, initial) {
    if ((glide !== 'o' && glide !== 'u') || !nucleus) return glide;
    if (initial === 'q') return 'u';
    if (!GLIDE_OK_NUCLEI.has(nucleus)) return glide; // impossible — leave for R3
    return GLIDE_O_NUCLEI.has(nucleus) ? 'o' : 'u';
}

// iê / yê are one nucleus with two spellings, like the c/k family: "yê" when the
// syllable opens with a glide (chuyện, quyển) or with nothing at all (yêu, yên),
// "iê" behind a plain initial (tiền, biển). Auto-corrected, never blocked.
export function correctNucleus(nucleus, glide, initial) {
    if (nucleus !== 'iê' && nucleus !== 'yê') return nucleus;
    return glide || !initial ? 'yê' : 'iê';
}

/** A plain-language note when the nucleus spelling was auto-corrected, else null. */
export function nucleusNote(original, corrected) {
    if (!corrected || corrected === original) return null;
    const where = corrected === 'yê'
        ? 'after a glide, or with no initial consonant'
        : 'straight after an initial consonant';
    return `“${original}” is written “${corrected}” ${where}.`;
}

/** A plain-language note when the glide spelling was auto-corrected, else null. */
export function glideNote(original, corrected, nucleus) {
    if (!corrected || corrected === original) return null;
    const where = corrected === 'o' ? 'before a, ă, e' : `before ${nucleus}`;
    return `The w-glide is written “${corrected}” ${where}.`;
}

/** True if this final closes the syllable (c, ch, p, t). */
const stopsSyllable = (final) => findBlock('final', final)?.stops === true;

/** True if this tone may sit on a stopped syllable. */
const toneFitsStop = (tone) => tone === 'ngang' || findBlock('tone', tone)?.stopOk === true;

/**
 * The tone a syllable keeps once `final` closes it. Adding c/ch/p/t under a
 * huyền/hỏi/ngã clears the mark rather than stranding the learner in an illegal
 * word they were never warned about.
 */
export function correctToneForFinal(tone, final) {
    if (!final || !stopsSyllable(final)) return tone;
    return toneFitsStop(tone) ? tone : 'ngang';
}

/** A plain-language note when a stopping final cleared the tone, else null. */
export function toneStopNote(final) {
    return `“-${final}” stops the syllable — only sắc (´) or nặng (.) can sit on it, so the tone came off.`;
}

/** Place the tone mark on the correct vowel of a (possibly multi-char) nucleus. */
function toneNucleus(nucleusId, toneId) {
    const at = findBlock('nucleus', nucleusId)?.tone_at ?? 0;
    const chars = [...nucleusId];
    if (at < chars.length) chars[at] = applyTone(chars[at], toneId);
    return chars.join('');
}

/**
 * The initial as WRITTEN before this nucleus. One special case: "gi" shares
 * its i with a following i-nucleus — gì is g + ì on paper, never "giì". The
 * tone stays on the nucleus, so the shared letter carries the mark.
 */
export function writtenInitial(initial, nucleus) {
    if (initial === 'gi' && nucleus === 'i') return 'g';
    return initial || '';
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
    return `${writtenInitial(initial, nucleus)}${glide || ''}${toned}${final || ''}`;
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
    // (q's u is part of the qu- initial, so it may stand before a vowel exists.)
    if (glide && !nucleus && initial !== 'q') {
        out.push({ slots: ['glide'], reason: 'Pick the vowel (âm chính) first — a glide attaches to it.' });
    }

    // ── R1: q always needs the u glide ──────────────────────────────────────
    // Tapping "q" satisfies this by itself — applyPick() brings the u with it.
    if (initial === 'q' && glide !== 'u') {
        out.push({ slots: ['initial', 'glide'], reason: '“q” never stands alone — it always writes q + u (qu-).' });
    }

    // R2 (k/c · g/gh · ng/ngh) is intentionally NOT a blocking rule — it's
    // auto-corrected at pick time via correctInitial(), so the learner can try
    // "ng é" and watch it become "ngh é" with an explanation.

    // ── R3: a glide can't attach to a rounded vowel. (The o/u spelling itself
    // is auto-corrected at pick time via correctGlide — not blocked.) After q
    // the u belongs to the qu- initial, so quốc / quở are exempt.
    if (glide && nucleus && initial !== 'q' && !GLIDE_OK_NUCLEI.has(nucleus)) {
        out.push({ slots: ['glide'], reason: `There’s no w-glide before ${nucleus} — drop the glide.` });
    }

    // ── R4: open diphthongs ia/ua/ưa take no final ───────────────────────────
    if (final && OPEN_DIPHTHONGS.has(nucleus)) {
        const closed = { ia: 'iê', ua: 'uô', ưa: 'ươ' }[nucleus];
        out.push({ slots: ['final'], reason: `“${nucleus}” is the open form — before a final use “${closed}” (e.g. ${closed}${final}).` });
    }

    // ── R5: -ch / -nh only after a, ê, i, y ──────────────────────────────────
    if (final && nucleus && FRONT_ONLY_FINALS.has(final) && !CH_NH_NUCLEI.has(nucleus)) {
        out.push({ slots: ['final'], reason: `“-${final}” only closes after a, ê, i, y — not after ${nucleus}.` });
    }

    // ── R6: a semivowel off-glide (-i/-y/-o/-u) only follows certain vowels ──
    if (final && nucleus && SEMIVOWEL_FINALS.has(final)) {
        const allowed = SEMIVOWEL_AFTER[final];
        if (allowed && !allowed.has(nucleus)) {
            out.push({ slots: ['final'], reason: `“${nucleus}${final}” isn’t a Vietnamese vowel cluster — try another ending.` });
        }
    }

    // ── R7: stopped syllables take only sắc or nặng ──────────────────────────
    // ngang is tolerated: it's the state every syllable passes through while
    // being built, and the lexicon check is what decides "ac" isn't a word.
    if (final && tone && stopsSyllable(final) && !toneFitsStop(tone)) {
        out.push({ slots: ['tone'], reason: 'A syllable ending in c, ch, p, t can only take sắc (´) or nặng (.).' });
    }

    return out;
}

/** True if any violation touches `slot`. */
export function slotHasViolation(violations, slot) {
    return violations.some((v) => v.slots.includes(slot));
}

/**
 * True if the slots are already spelled the way the auto-corrections spell them.
 * validate() passes "gen" and "chua" — nothing about them is *illegal* — but the
 * context rules rewrite g→gh before e and the glide u→o before a, so no tap
 * sequence can ever produce those spellings. The lexicon builder uses this to
 * keep only the splits the playground can actually reach.
 */
export function isNormalForm({ initial = null, glide = null, nucleus = null }) {
    return correctInitial(initial, glide, nucleus) === initial
        && correctGlide(glide, nucleus, initial) === glide
        && correctNucleus(nucleus, glide, initial) === nucleus;
}

/**
 * The state a tap actually produces, plus the note that explains any silent
 * fix-up. Placement gating and the UI both go through this, so what gets
 * offered is exactly what gets built.
 */
export function applyPick(state, slot, blockId) {
    const next = { ...state, [slot]: blockId };
    let note = null;

    // q never stands alone — it arrives with its u.
    if (slot === 'initial' && blockId === 'q' && next.glide !== 'u') {
        next.glide = 'u';
        note = '“q” never stands alone — it always writes q + u (qu-).';
    }

    const fixedInitial = correctInitial(next.initial, next.glide, next.nucleus);
    if (fixedInitial !== next.initial) {
        if (!note) note = spellingNote(next.initial, fixedInitial, next.glide, next.nucleus);
        next.initial = fixedInitial;
    }

    const fixedGlide = correctGlide(next.glide, next.nucleus, next.initial);
    if (fixedGlide !== next.glide) {
        if (!note) note = glideNote(next.glide, fixedGlide, next.nucleus);
        next.glide = fixedGlide;
    }

    const fixedNucleus = correctNucleus(next.nucleus, next.glide, next.initial);
    if (fixedNucleus !== next.nucleus) {
        if (!note) note = nucleusNote(next.nucleus, fixedNucleus);
        next.nucleus = fixedNucleus;
    }

    // Closing the syllable can strip a tone it can no longer carry — but only
    // when the FINAL is what moved. Aiming straight at an illegal tone stays a
    // blocked, explained mistake.
    if (slot === 'final') {
        const fixedTone = correctToneForFinal(next.tone, next.final);
        if (fixedTone !== next.tone) {
            if (!note) note = toneStopNote(next.final);
            next.tone = fixedTone;
        }
    }

    return { state: next, note };
}
