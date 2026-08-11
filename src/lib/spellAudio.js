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
    try { window.speechSynthesis?.cancel(); } catch { /* ignore */ }
};

// A speechSynthesis that exists but never speaks (headless, no installed
// voices, iOS before a gesture) also never fires onend — so the chain would
// hang forever. Give every utterance a deadline.
const SYNTH_TIMEOUT_MS = 3500;

/**
 * Last resort when /api/tts can't be reached: say it with the device voice.
 * Without this a failed request is indistinguishable from a finished clip, and
 * the playground just goes quiet with nothing to explain why.
 * Returns false if the platform can't speak at all; calls onSilent when it
 * accepted the utterance but never actually started it.
 */
const speakWithDeviceVoice = (text, onDone, onSilent) => {
    const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    if (!synth || typeof SpeechSynthesisUtterance === 'undefined' || !text) return false;
    try {
        synth.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'vi-VN';
        // Prefer a real Vietnamese voice; without one the default still reads it.
        const vi = synth.getVoices().find((v) => v.lang?.toLowerCase().startsWith('vi'));
        if (vi) utterance.voice = vi;

        let started = false;
        let done = false;
        const finish = () => {
            if (done) return;
            done = true;
            clearTimeout(timer);
            if (!started) onSilent?.();
            onDone();
        };
        const timer = setTimeout(finish, SYNTH_TIMEOUT_MS);
        utterance.onstart = () => { started = true; };
        utterance.onend = finish;
        utterance.onerror = finish;

        synth.speak(utterance);
        return true;
    } catch {
        return false;
    }
};

/**
 * Play a sequence of segments back to back. Each segment = { key, text }.
 * The `key` picks a local asset; `text` is the TTS fallback. Returns nothing.
 */
export function playSequence(segments, { accent = 'north', gap = 90, onSegment, onEnd, onFail } = {}) {
    if (!isAudioEnabled() || !segments?.length) { onEnd?.(); return; }
    const mine = ++token;
    stopCurrent();

    let i = 0;
    // Once the device voice has proved mute, stop waiting on it for the rest of
    // the chain — otherwise a dead endpoint makes a five-segment đánh vần sit
    // through five silent timeouts.
    let voiceIsMute = false;
    const playNext = () => {
        if (mine !== token) return;
        if (i >= segments.length) { onEnd?.(); return; }
        const seg = segments[i++];
        onSegment?.(seg); // tells the caller which part is now being spoken

        // `settled` keeps one segment from advancing twice; `failing` keeps a
        // download error and a rejected play() from both starting the fallback.
        let settled = false;
        let failing = false;
        const advance = () => {
            if (settled || mine !== token) return;
            settled = true;
            setTimeout(() => { if (mine === token) playNext(); }, gap);
        };
        const failOver = () => {
            if (settled || failing || mine !== token) return;
            failing = true;
            const giveUp = () => { voiceIsMute = true; onFail?.(); };
            if (voiceIsMute) { advance(); return; } // already known mute — don't stall again
            if (!speakWithDeviceVoice(seg.text, advance, giveUp)) {
                giveUp(); // couldn't be voiced at all — the caller can say so
                advance();
            }
        };

        const audio = new Audio(segmentUrl(seg, accent));
        current = audio;
        audio.addEventListener('ended', advance, { once: true });
        audio.addEventListener('error', failOver, { once: true });
        audio.play().then(() => {
            // superseded while starting — stop so clips can't overlap
            if (mine !== token) { try { audio.pause(); } catch { /* ignore */ } }
        }).catch(failOver);
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
