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
        objectives: [
            { id: 'vocab', text: 'recognize core greetings', threshold: 0.6 },
            { id: 'listen', text: 'identify a greeting by ear', threshold: 0.6 },
        ],
        beats: [
            { type: 'say', text: 'Xin chào! 👋 Last time we met the tones — today let’s actually *greet* people.' },
            { type: 'say', text: 'A handful of words will carry you through almost any first meeting in Vietnam.' },
            {
                type: 'cards',
                text: 'Tap each one to hear it 👇',
                items: cards,
            },
            { type: 'say', text: '“Xin chào” is your safe, polite hello — any time of day, to anyone. 😊' },
            {
                type: 'mcq',
                objective: 'vocab',
                text: 'Someone just helped you. What do you say?',
                options: [
                    { label: `${V.tambiet.vi}  ·  ${V.tambiet.en}`, correct: false },
                    { label: `${V.camon.vi}  ·  ${V.camon.en}`, correct: true },
                    { label: `${V.khong.vi}  ·  ${V.khong.en}`, correct: false },
                ],
                correctNote: 'Đúng rồi! ✅ “Cảm ơn” = thank you. Add “nhiều” (a lot) to say thank you very much.',
                wrongNote: 'Almost — “thank you” is “cảm ơn” 🙏. The others mean goodbye and no.',
            },
            { type: 'say', text: 'To be polite, Vietnamese often add “dạ” before answering — it shows respect to the listener.' },
            {
                type: 'listen_pick',
                objective: 'listen',
                text: 'My turn — I’ll say one. Tap the word you hear 🔊',
                items: cards,
                targetIndex: 2, // tạm biệt
            },
            { type: 'say', text: 'That’s greetings, thanks, and a polite goodbye — enough to start a real conversation. 🌟' },
            { type: 'done', text: 'Tuyệt vời! 🎉 Hẹn gặp lại — see you next lesson!' },
        ],
    };
}
