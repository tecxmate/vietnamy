/**
 * toneContours.js — adapter over the canonical content bundle.
 *
 * The tone data now lives in content/tones.json (the single source of truth,
 * see docs/CONTENT_SCHEMA.md). This module re-exports it in the shapes the
 * existing consumers (SoundsTab, ToneLesson) expect, so nothing downstream
 * changed. Reference pitch contours are normalized ~20-step semitone arrays
 * from the speaker baseline (Brunelle 2009, Michaud 2004, Pham 2003).
 */

import tonesData from '../../content/tones.json';

// Ordered array for iteration: [ngang, sac, huyen, hoi, nga, nang].
// Each item: { id, name, label, mark, color, description, contour }.
export const TONE_LIST = tonesData.tones;

// Keyed lookup by tone id.
export const TONE_CONTOURS = Object.fromEntries(TONE_LIST.map(t => [t.id, t]));

// Practice words, mapped back to the legacy { word, tone, meaning } shape.
export const PRACTICE_WORDS = tonesData.practiceWords.map(w => ({
    word: w.vi,
    tone: w.toneId,
    meaning: w.en,
}));
