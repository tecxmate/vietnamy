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

export const TEACHER = { name: 'Bé Khế', emoji: '⭐' };

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
        // Authoritative facts injected into the AI tutor so it never invents tone
        // descriptions — grounded in content/tones.json.
        facts: TONE_LIST.map(t => `${t.name} (mark "${t.mark}", ${t.label}): ${t.description}`).join(' | '),
        objectives: [
            { id: 'recognize', text: 'recognize the 6 tone marks', threshold: 0.6 },
            { id: 'identify', text: 'identify a tone by ear', threshold: 0.6 },
        ],
        // Suggested follow-up questions shown on the score screen (controlled prompts).
        helps: [
            { mode: 'compare', label: 'à vs ã?', prompt: 'What is the difference between the à (huyền) and ã (ngã) tones?' },
            { mode: 'similar', label: 'Which tones sound alike?', prompt: 'Which of the six Vietnamese tones sound the most similar, and how do I tell them apart?' },
            { mode: 'why', label: 'Why do tones matter?', prompt: 'Why do tones matter so much in Vietnamese — what happens if I get one wrong?' },
            { mode: 'practice', label: 'How do I practise?', prompt: 'What is a good way to practise hearing and producing the six tones?' },
        ],
        // The next lesson to flow into for a seamless path.
        next: { id: 'greetings', label: 'Say Hello' },
        beats: [
            { type: 'say', text: 'Xin chào! I\'m Bé Khế — a little starfruit, learning Vietnamese same as you.' },
            { type: 'say', text: 'Let\'s figure out the six tones together. They\'re the thing that makes Vietnamese, well, Vietnamese.' },
            { type: 'say', text: 'A tone is just the *melody* of a syllable — change it and the whole word changes.' },
            {
                type: 'tone_explore',
                text: 'Here are all six. Tap each to hear it 👇',
                tones,
            },
            { type: 'say', text: 'Hear how the pitch moved? Some stay flat, some climb, some fall, some bend.' },
            {
                type: 'mcq',
                objective: 'recognize',
                helps: [
                    { mode: 'compare', label: 'à vs ã? 🔍', prompt: 'What is the difference between the à (huyền) and ã (ngã) tones?' },
                ],
                text: `Quick one — which mark gives the **falling** tone (${huyen.name})?`,
                options: [
                    { label: `${sac.mark}  ·  ${sac.name}`, correct: false },
                    { label: `${huyen.mark}  ·  ${huyen.name}`, correct: true },
                    { label: `${hoi.mark}  ·  ${hoi.name}`, correct: false },
                ],
                correctNote: `Đúng rồi! (that's "right") — “${huyen.mark}” is ${huyen.name}, it slides gently down.`,
                wrongNote: `Không sao! (no worries) — the falling one is ${huyen.name}, “${huyen.mark}”. Give it another listen and you'll catch the drop.`,
            },
            { type: 'say', text: 'Now let\'s train our ears.' },
            {
                type: 'tone_listen',
                objective: 'identify',
                text: 'I\'ll say a word — tap the tone you hear.',
                tones,
                targetToneId: 'sac',
            },
            { type: 'say', text: 'Six tones met, and you can start telling them apart — that\'s the hard part, honestly. 🌟' },
            { type: 'done', text: 'Tuyệt! (awesome!) That\'s the whole set — we\'ll keep practising. Hẹn gặp lại!' },
        ],
    };
}
