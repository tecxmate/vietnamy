import { useCallback } from 'react';

export function useTTS() {
    const speak = useCallback((text, rate = 1.0) => {
        if (!('speechSynthesis' in window)) {
            console.warn('Browser does not support text-to-speech');
            return;
        }

        // Cancel any current speaking
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'vi-VN';
        utterance.rate = rate;

        // Try to find a specific Vietnamese voice
        const voices = window.speechSynthesis.getVoices();
        const viVoice = voices.find(voice => voice.lang.includes('vi'));
        if (viVoice) {
            utterance.voice = viVoice;
        }

        window.speechSynthesis.speak(utterance);
    }, []);

    return { speak };
}
