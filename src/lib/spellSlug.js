import { splitTone } from '../data/vnTones.js';

// Lowercase ASCII + digits only. Digits never occur in Vietnamese spelling, so
// they disambiguate shaped letters and tone position on case-insensitive APFS.
const SHAPE = { 'ă': 'a6', 'â': 'a7', 'ê': 'e6', 'ô': 'o6', 'ơ': 'o7', 'ư': 'u6', 'đ': 'd6' };
const TONE_DIGIT = { ngang: '', huyen: '2', sac: '1', hoi: '3', nga: '4', nang: '5' };

export const spellAsciiId = (id) => [...id].map((ch) => SHAPE[ch] || ch).join('');

export function spellSlug(text) {
    return [...text].map((ch) => {
        const { base, toneId } = splitTone(ch);
        return (SHAPE[base] || base) + TONE_DIGIT[toneId];
    }).join('');
}

export const spellInitialKey = (id) => `ini-${spellAsciiId(id)}`;
export const spellToneKey = (id) => `tone-${id}`;
