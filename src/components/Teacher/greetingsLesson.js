// Second authored lesson — greetings vocabulary — proving the beat/widget
// format generalizes beyond the tone-specific lesson. It uses the GENERIC
// widgets (cards / mcq / listen_pick), not the tone widgets. Vocab is grounded
// in the content bundle (content/curriculum.json words).

import { TEACHER } from './tonesLesson';

const V = {
    xinchao: { vi: 'xin chào', en: 'hello (polite)', emoji: '👋' },
    camon: { vi: 'cảm ơn', en: 'thank you', emoji: '🙏' },
    tambiet: { vi: 'tạm biệt', en: 'goodbye', emoji: '👋' },
    da: { vi: 'dạ', en: 'yes (polite)', emoji: '✅' },
    khong: { vi: 'không', en: 'no / not', emoji: '❌' },
};

export function buildGreetingsLesson() {
    const cards = [V.xinchao, V.camon, V.tambiet, V.da, V.khong];

    return {
        id: 'greetings',
        title: 'Say Hello',
        teacher: TEACHER,
        // Authoritative vocab facts for the AI tutor (no invented words/meanings).
        facts: cards.map(c => `${c.vi} = ${c.en}`).join(' | '),
        objectives: [
            { id: 'vocab', text: 'recognize core greetings', threshold: 0.6 },
            { id: 'listen', text: 'identify a greeting by ear', threshold: 0.6 },
            { id: 'speak', text: 'say a greeting aloud', threshold: 0.6 },
        ],
        beats: [
            { type: 'say', text: 'Xin chào! Last time we tackled tones — today we actually *greet* people.' },
            { type: 'say', text: 'A handful of words will carry us through almost any first meeting in Vietnam.' },
            {
                type: 'cards',
                text: 'Tap each one to hear it 👇',
                items: cards,
                helps: [
                    { mode: 'usage', label: 'dạ vs vâng? 🔍', prompt: 'When do I use dạ versus vâng for “yes”?' },
                ],
            },
            { type: 'say', text: '“Xin chào” is the safe, polite hello — any time of day, to anyone.' },
            {
                type: 'mcq',
                objective: 'vocab',
                text: 'Someone just helped you. What do you say?',
                options: [
                    { label: `${V.tambiet.vi}  ·  ${V.tambiet.en}`, correct: false },
                    { label: `${V.camon.vi}  ·  ${V.camon.en}`, correct: true },
                    { label: `${V.khong.vi}  ·  ${V.khong.en}`, correct: false },
                ],
                correctNote: 'Đúng rồi! (that\'s "right") — “cảm ơn” is thank you.',
                wrongNote: 'Không sao! (no worries) — “thank you” is “cảm ơn”. The others mean goodbye and no.',
            },
            { type: 'say', text: 'Little tip I picked up: Vietnamese often add “dạ” before answering — it sounds respectful.' },
            {
                type: 'listen_pick',
                objective: 'listen',
                text: 'My turn — I\'ll say one, you tap the word you hear.',
                items: cards,
                targetIndex: 2, // tạm biệt
            },
            { type: 'say', text: 'Last thing — let\'s hear you say it.' },
            {
                type: 'pronounce',
                objective: 'speak',
                text: 'Say “xin chào” into the mic — let\'s hear how it sounds! 🎤',
                target: 'xin chào',
                en: 'hello (polite)',
            },
            { type: 'say', text: 'Greetings, thanks, a polite goodbye — and your own voice saying hello. 🌟' },
            { type: 'done', text: 'Tuyệt! (awesome!) Hẹn gặp lại — see you next lesson.' },
        ],
    };
}
