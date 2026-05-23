// Speak text through the server TTS proxy with the configured voice provider.
let currentAudio = null;
let lastSpeakTime = 0;
const SPEAK_COOLDOWN = 50; // ms — ignore only true double-fires
const MAX_QUEUED_CLIPS = 60;
let queuedClips = [];
let currentQueuedAudio = null;
let queueWakeAudio = null;
const MEDIA_ARTWORK = [
    { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
];

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

export const buildTtsUrl = (text, lang = 'vi', voiceOverride = null) => {
    const voice = voiceOverride || loadTtsVoice();
    const cacheKey = `tts-v4-trim-loudness-${voice}`;
    return `/api/tts?text=${encodeURIComponent(text)}&lang=${encodeURIComponent(lang)}&voice=${encodeURIComponent(voice)}&ck=${encodeURIComponent(cacheKey)}`;
};

const getPlaybackOptions = (rate, lang) => ({
    ttsLang: typeof rate === 'string' ? rate : lang,
    playRate: typeof rate === 'number' ? rate : 1,
});

const setMediaSessionMetadata = (text) => {
    if (typeof navigator === 'undefined') return;
    if (!('mediaSession' in navigator) || typeof MediaMetadata === 'undefined') return;

    navigator.mediaSession.metadata = new MediaMetadata({
        title: text,
        artist: 'Vietnamy',
        album: 'Vietnamese audio',
        artwork: MEDIA_ARTWORK,
    });
    navigator.mediaSession.playbackState = 'playing';
};

const clearMediaSessionPlayback = () => {
    if (typeof navigator === 'undefined') return;
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.playbackState = 'none';
};

export const clearSpeakQueue = ({ stopCurrent = false } = {}) => {
    queuedClips = [];
    queueWakeAudio = null;

    if (stopCurrent && currentAudio) {
        currentAudio.pause();
        currentAudio = null;
    }

    if (stopCurrent && currentQueuedAudio) {
        currentQueuedAudio.pause();
    }

    currentQueuedAudio = null;
    if (stopCurrent) clearMediaSessionPlayback();
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

    clearSpeakQueue();

    // Stop any currently playing audio
    if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
    }

    if (!text || text.length > 200) return;

    const { ttsLang, playRate } = getPlaybackOptions(rate, lang);

    const url = buildTtsUrl(text, ttsLang);
    const audio = new Audio(url);
    audio.playbackRate = playRate;
    currentAudio = audio;
    setMediaSessionMetadata(text);

    audio.play().catch(() => {
        currentAudio = null;
        clearMediaSessionPlayback();
    });

    audio.addEventListener('ended', () => { currentAudio = null; clearMediaSessionPlayback(); });
    audio.addEventListener('error', () => { currentAudio = null; clearMediaSessionPlayback(); });
};

const playNextQueued = () => {
    if (currentAudio || queuedClips.length === 0) return;

    const next = queuedClips.shift();
    const url = buildTtsUrl(next.text, next.lang);
    const audio = new Audio(url);
    audio.playbackRate = next.rate;
    currentAudio = audio;
    currentQueuedAudio = audio;
    setMediaSessionMetadata(next.text);

    const finish = () => {
        if (currentAudio === audio) currentAudio = null;
        if (currentQueuedAudio === audio) currentQueuedAudio = null;
        if (!currentAudio && queuedClips.length === 0) clearMediaSessionPlayback();
        playNextQueued();
    };

    audio.play().catch(finish);
    audio.addEventListener('ended', finish, { once: true });
    audio.addEventListener('error', finish, { once: true });
};

const scheduleQueuedPlayback = () => {
    if (!currentAudio) {
        playNextQueued();
        return;
    }

    if (currentQueuedAudio === currentAudio || queueWakeAudio === currentAudio) return;

    queueWakeAudio = currentAudio;
    const wakeAudio = currentAudio;
    const wake = () => {
        if (queueWakeAudio === wakeAudio) queueWakeAudio = null;
        setTimeout(playNextQueued, 0);
    };

    wakeAudio.addEventListener('ended', wake, { once: true });
    wakeAudio.addEventListener('error', wake, { once: true });
};

export const speakQueued = (text, rate = 1, lang = 'vi') => {
    if (!text || text.length > 200) return;

    const { ttsLang, playRate } = getPlaybackOptions(rate, lang);
    queuedClips.push({ text, lang: ttsLang, rate: playRate });

    if (queuedClips.length > MAX_QUEUED_CLIPS) {
        queuedClips = queuedClips.slice(-MAX_QUEUED_CLIPS);
    }

    scheduleQueuedPlayback();
};

export default speak;
