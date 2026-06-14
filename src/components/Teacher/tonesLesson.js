// Authored teaching script for the "6 tones" lesson — the chat-style teacher
// walks the student through it beat by beat. NO LLM: the curriculum and the
// pass/fail checks are fully deterministic. (An LLM layer can later wrap this
// for warmth + ambiguity handling; the beats stay the source of truth.)

import { TONE_LIST, PRACTICE_WORDS } from '../../data/toneContours';

// One representative word per tone, grounded in the content bundle.
const wordForTone = (toneId) => {
    const w = PRACTICE_WORDS.find(p => p.tone === toneId);
    return w ? { vi: w.word, en: w.meaning } : null;
};

export const TEACHER = { name: 'Cô Mai', emoji: '👩‍🏫' };

// Beat kinds the director understands:
//   say          — a teacher message bubble (auto-advances)
//   tone_explore — message + 6 tappable tone chips (tap to hear), Continue to go on
//   mcq          — message + multiple choice; deterministic correct answer
//   tone_listen  — message + plays a tone word; student taps the tone they heard
//   done         — closing message + Finish button
export function buildTonesLesson() {
    const tones = TONE_LIST.map(t => ({
        id: t.id,
        name: t.name,
        label: t.label,
        mark: t.mark,
        color: t.color,
        word: wordForTone(t.id),
    }));

    const huyen = tones.find(t => t.id === 'huyen');
    const sac = tones.find(t => t.id === 'sac');
    const hoi = tones.find(t => t.id === 'hoi');

    return {
        id: 'tones',
        title: 'The 6 Tones',
        teacher: TEACHER,
        beats: [
            { type: 'say', text: 'Xin chào! 👋 I\'m Cô Mai, your Vietnamese teacher.' },
            { type: 'say', text: 'Today we\'ll meet something that makes Vietnamese special: its 6 tones.' },
            { type: 'say', text: 'A tone is the *melody* of a syllable. Change the tone and you change the word completely.' },
            {
                type: 'tone_explore',
                text: 'Here are all six. Tap each one to hear it 👇',
                tones,
            },
            { type: 'say', text: 'Did you hear how the pitch moved? Some stay flat, some rise, some fall, some bend.' },
            {
                type: 'mcq',
                text: `Quick check — which mark gives the **falling** tone (${huyen.name})?`,
                options: [
                    { label: `${sac.mark}  ·  ${sac.name}`, correct: false },
                    { label: `${huyen.mark}  ·  ${huyen.name}`, correct: true },
                    { label: `${hoi.mark}  ·  ${hoi.name}`, correct: false },
                ],
                correctNote: `Đúng rồi! ✅ The grave mark “${huyen.mark}” is ${huyen.name} — it falls gently from mid to low.`,
                wrongNote: `Not quite — the falling tone is ${huyen.name}, written “${huyen.mark}”. Listen again and you’ll hear it drop. 💪`,
            },
            { type: 'say', text: 'Great. Now let\'s train your ear.' },
            {
                type: 'tone_listen',
                text: 'I\'ll say a word. Tap the tone you hear 🔊',
                tones,
                targetToneId: 'sac',
            },
            { type: 'say', text: 'You\'ve now met all six tones and started hearing them apart. That\'s the hardest first step. 🌟' },
            { type: 'done', text: 'Tuyệt vời! 🎉 Lesson complete. We\'ll keep practising these in your next sessions.' },
        ],
    };
}
