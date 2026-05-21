// Speak text through the server TTS proxy with the configured voice provider.
let currentAudio = null;
let lastSpeakTime = 0;
const SPEAK_COOLDOWN = 50; // ms — ignore only true double-fires

const TTS_VOICES = new Set([
    'google',
    'azure-north',
    'azure-south',
]);

const loadTtsVoice = () => {
    try {
        const raw = localStorage.getItem('vnme_settings');
        const settings = raw ? JSON.parse(raw) : {};
        const profileRaw = localStorage.getItem('vnme_user_profile');
        const profile = profileRaw ? JSON.parse(profileRaw) : {};
        if (TTS_VOICES.has(settings.ttsVoice)) return settings.ttsVoice;
        if (profile.dialect === 'south') return 'azure-south';
        if (profile.dialect === 'north') return 'azure-north';
        if (settings.ttsAccent === 'south') return 'azure-south';
        if (settings.ttsAccent === 'north') return 'azure-north';
        return 'azure-north';
    } catch {
        return 'azure-north';
    }
};

const buildTtsUrl = (text, lang) => {
    const voice = loadTtsVoice();
    const cacheKey = `tts-v2-${voice}`;
    return `/api/tts?text=${encodeURIComponent(text)}&lang=${encodeURIComponent(lang)}&voice=${encodeURIComponent(voice)}&ck=${encodeURIComponent(cacheKey)}`;
};

// Warm the HTTP cache so subsequent speak() calls play instantly.
const preloadedUrls = new Set();
export const preloadSpeak = (texts, lang = 'vi') => {
    if (!Array.isArray(texts)) texts = [texts];
    for (const text of texts) {
        if (!text || text.length > 200) continue;
        const url = buildTtsUrl(text, lang);
        if (preloadedUrls.has(url)) continue;
        preloadedUrls.add(url);
        // Fetch into the browser HTTP cache. Audio element would also work but
        // some browsers refuse to load() without user gesture; fetch is reliable.
        fetch(url, { method: 'GET', cache: 'force-cache' }).catch(() => {
            preloadedUrls.delete(url);
        });
    }
};

const speak = (text, rate = 1, lang = 'vi') => {
    const now = Date.now();
    if (now - lastSpeakTime < SPEAK_COOLDOWN) return;
    lastSpeakTime = now;

    // Stop any currently playing audio
    if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
    }

    if (!text || text.length > 200) return;

    const ttsLang = typeof rate === 'string' ? rate : lang;
    const playRate = typeof rate === 'number' ? rate : 1;

    const url = buildTtsUrl(text, ttsLang);
    const audio = new Audio(url);
    audio.playbackRate = playRate;
    currentAudio = audio;

    audio.play().catch(() => {
        currentAudio = null;
    });

    audio.addEventListener('ended', () => { currentAudio = null; });
    audio.addEventListener('error', () => { currentAudio = null; });
};

export default speak;
