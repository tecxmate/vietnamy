// Google TTS audio for the Spelling Playground.
//
// VieNeu-TTS generation support is kept in scripts/ for future experiments, but
// spelling playback currently uses Google's TTS path for pronunciation accuracy.
//
// Two speaking modes:
//   • phonics   → one utterance: the whole blended syllable.
//   • danhvan   → the traditional spell-out chain (cờ → a → ca → huyền → cà).

import { buildTtsUrl } from '../utils/speak';
import { spellSlug } from './spellSlug';

const SPELL_TTS_VOICE = 'google';

// One playback owner at a time. A newer play() bumps the token; any older audio
// that resolves late pauses itself — mirrors the guard in utils/speak.js.
let token = 0;
let current = null;

const isAudioEnabled = () => {
    try {
        const raw = localStorage.getItem('vnme_settings');
        return raw ? JSON.parse(raw).systemAudioEnabled !== false : true;
    } catch {
        return true;
    }
};

/** Resolve one segment to Google TTS. */
const segmentUrl = ({ text }) => {
    return buildTtsUrl(text, 'vi', SPELL_TTS_VOICE);
};

const stopCurrent = () => {
    if (current) {
        try { current.pause(); } catch { /* ignore */ }
        current = null;
    }
};

/**
 * Play a sequence of segments back to back. Each segment = { key, text }.
 * The `key` picks a local asset; `text` is the TTS fallback. Returns nothing.
 */
export function playSequence(segments, { accent = 'north', gap = 90, onSegment, onEnd } = {}) {
    if (!isAudioEnabled() || !segments?.length) { onEnd?.(); return; }
    const mine = ++token;
    stopCurrent();

    let i = 0;
    const playNext = () => {
        if (mine !== token) return;
        if (i >= segments.length) { onEnd?.(); return; }
        const seg = segments[i++];
        onSegment?.(seg); // tells the caller which part is now being spoken
        const audio = new Audio(segmentUrl(seg, accent));
        current = audio;
        const advance = () => {
            if (mine !== token) return;
            setTimeout(() => { if (mine === token) playNext(); }, gap);
        };
        audio.addEventListener('ended', advance, { once: true });
        audio.addEventListener('error', advance, { once: true });
        audio.play().then(() => {
            // superseded while starting — stop so clips can't overlap
            if (mine !== token) { try { audio.pause(); } catch { /* ignore */ } }
        }).catch(advance);
    };
    playNext();
}

/** Speak the whole blended syllable (phonics mode). */
export function speakSyllable(syllable, { accent = 'north' } = {}) {
    if (!syllable) return;
    playSequence([{ key: spellSlug(syllable), text: syllable }], { accent });
}

/**
 * Speak the traditional đánh-vần chain for a composed syllable.
 * segments come from the caller (it knows the block names); this just plays them.
 */
export function speakDanhVan(segments, { accent = 'north' } = {}) {
    playSequence(segments, { accent, gap: 140 });
}

/** Stop everything the playground is saying. */
export function stopSpell() {
    token++;
    stopCurrent();
}
