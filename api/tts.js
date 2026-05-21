// Vercel Serverless Function: /api/tts
//
// Proxies text-to-speech requests to Azure Speech (preferred) with Google
// Translate TTS as fallback. Mirrors the behavior of server/server.js so the
// client (`src/utils/speak.js`) works identically on Vercel and on the local
// Express dev server.
//
// Env vars (set in Vercel → Project Settings → Environment Variables):
//   AZURE_SPEECH_KEY         (required for Azure)
//   AZURE_SPEECH_REGION      (required for Azure, e.g. "southeastasia")
//   AZURE_TTS_VOICE_NORTH    (optional, defaults to vi-VN-NamMinhNeural)
//   AZURE_TTS_VOICE_SOUTH    (optional, defaults to vi-VN-HoaiMyNeural)
//   DEFAULT_TTS_VOICE        (optional, defaults to azure-south)

const AZURE_VI_VOICES = {
    'azure-north': process.env.AZURE_TTS_VOICE_NORTH || 'vi-VN-NamMinhNeural',
    'azure-south': process.env.AZURE_TTS_VOICE_SOUTH || 'vi-VN-HoaiMyNeural',
};
const TTS_VOICES = new Set(['google', ...Object.keys(AZURE_VI_VOICES)]);
const DEFAULT_TTS_VOICE = process.env.DEFAULT_TTS_VOICE || 'azure-south';

function escapeSsml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

async function synthesizeWithAzure(text, lang, voice) {
    const key = process.env.AZURE_SPEECH_KEY;
    const region = process.env.AZURE_SPEECH_REGION;
    if (!key || !region || lang !== 'vi') return null;

    const voiceName = AZURE_VI_VOICES[voice] || AZURE_VI_VOICES['azure-north'];
    const endpoint = `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`;
    const ssml = `<speak version="1.0" xml:lang="vi-VN"><voice xml:lang="vi-VN" name="${voiceName}">${escapeSsml(text)}</voice></speak>`;

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Ocp-Apim-Subscription-Key': key,
            'Content-Type': 'application/ssml+xml',
            'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3',
            'User-Agent': 'vietnamy-tts',
        },
        body: ssml,
    });

    if (!response.ok) {
        const detail = await response.text().catch(() => '');
        throw new Error(`Azure TTS ${response.status}: ${detail || response.statusText}`);
    }

    return Buffer.from(await response.arrayBuffer());
}

async function synthesizeWithGoogleTranslate(text, lang) {
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${encodeURIComponent(lang)}&client=tw-ob&q=${encodeURIComponent(text)}`;
    const response = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': 'https://translate.google.com/',
            'Accept': '*/*',
            'Accept-Language': 'en-US,en;q=0.9',
        },
    });

    if (!response.ok) {
        throw new Error(`Google Translate TTS ${response.status}: ${response.statusText}`);
    }
    return Buffer.from(await response.arrayBuffer());
}

export default async function handler(req, res) {
    const text = (req.query.text || '').trim();
    const lang = req.query.lang || 'vi';
    const legacyAccent = req.query.accent === 'south' ? 'azure-south' : 'azure-north';
    const hasVoice = TTS_VOICES.has(req.query.voice);
    const voice = hasVoice
        ? req.query.voice
        : (req.query.accent ? legacyAccent : DEFAULT_TTS_VOICE);

    if (!text || text.length > 200) {
        return res.status(400).json({ error: 'text required (max 200 chars)' });
    }

    try {
        let buffer = null;
        let provider = 'google-translate';
        if (voice !== 'google') {
            try {
                buffer = await synthesizeWithAzure(text, lang, voice);
                if (buffer) provider = 'azure';
            } catch (err) {
                console.warn('Azure TTS fallback:', err.message);
            }
        }
        if (!buffer) buffer = await synthesizeWithGoogleTranslate(text, lang);

        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Cache-Control', 'public, max-age=86400');
        res.setHeader('X-TTS-Provider', provider);
        res.setHeader('X-TTS-Voice', voice);
        res.status(200).send(buffer);
    } catch (err) {
        console.error('TTS error:', err.message);
        res.status(502).json({ error: 'TTS fetch failed' });
    }
}
