// Minimal, dependency-free TTS synthesis for the serverless deployment.
//
// server/server.js has the full pipeline: an R2/derived cache, raw-PCM sourcing,
// silence trimming, loudness post-processing and per-letter IPA phonemes. None
// of that survives a serverless function with no warm disk and a cold start per
// request, and /api/tts was simply missing from api/[...path].js — so every
// deployment behind vercel.json served 404s for audio and the player went
// silent. This module is the small always-available path: synthesize, return
// MP3, let the CDN cache it by URL.
//
// Deliberate divergence from server.js, kept here so it's findable:
//   · MP3 straight from the provider — no PCM trimming or WAV derivation.
//   · No IPA phoneme overrides for single alphabet letters.
//   · No object-storage cache; Cache-Control does the work instead.

export const TTS_VOICES = new Set(['google', 'azure-north', 'azure-south']);

const AZURE_VI_VOICES = {
    'azure-north': process.env.AZURE_TTS_VOICE_NORTH || 'vi-VN-NamMinhNeural',
    'azure-south': process.env.AZURE_TTS_VOICE_SOUTH || 'vi-VN-HoaiMyNeural',
};

const azureKey = () => process.env.AZURE_SPEECH_KEY || '';
const azureRegion = () => process.env.AZURE_SPEECH_REGION || '';

/** True when Azure credentials are configured for this deployment. */
export const azureTtsEnabled = () => Boolean(azureKey() && azureRegion());

export function escapeSsml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

/** Google Translate TTS → MP3 buffer. No credentials needed. */
export async function synthesizeGoogle(text, lang = 'vi') {
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${encodeURIComponent(lang)}&client=tw-ob&q=${encodeURIComponent(text)}`;
    const response = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': 'https://translate.google.com/',
            'Accept': '*/*',
            'Accept-Language': 'en-US,en;q=0.9',
        },
    });
    if (!response.ok) throw new Error(`Google Translate TTS ${response.status}: ${response.statusText}`);
    return Buffer.from(await response.arrayBuffer());
}

/**
 * Azure Neural TTS → MP3 buffer, or null when credentials are absent.
 * Asks Azure for MP3 directly, which is what lets this skip server.js's
 * PCM → trim → WAV chain.
 */
export async function synthesizeAzure(text, lang = 'vi', voice = 'azure-north') {
    if (!azureTtsEnabled() || lang !== 'vi') return null;

    const voiceName = AZURE_VI_VOICES[voice] || AZURE_VI_VOICES['azure-north'];
    const prosodyAttrs = voice === 'azure-south'
        ? 'volume="x-loud" pitch="+5%" rate="+4%"'
        : 'volume="default"';
    const ssml = `
<speak version="1.0" xml:lang="vi-VN">
  <voice xml:lang="vi-VN" name="${voiceName}">
    <prosody ${prosodyAttrs}>${escapeSsml(text)}</prosody>
  </voice>
</speak>`.trim();

    const response = await fetch(`https://${azureRegion()}.tts.speech.microsoft.com/cognitiveservices/v1`, {
        method: 'POST',
        headers: {
            'Ocp-Apim-Subscription-Key': azureKey(),
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

/**
 * Azure pronunciation assessment: score raw WAV audio against a reference
 * text. Same shape as server.js's /api/pronunciation response body. Returns
 * { status: <http-ish code>, body: <json> } so the route can pass it through —
 * unlike TTS there is no Google fallback for this, so a keyless deployment
 * gets a clean 503 (the client treats Azure as a hint and scores locally).
 */
export async function assessPronunciationAzure(referenceText, audioBuffer) {
    if (!azureTtsEnabled()) {
        return { status: 503, body: { error: 'Azure Speech not configured' } };
    }

    const paConfig = {
        ReferenceText: referenceText,
        GradingSystem: 'HundredMark',
        Granularity: 'Phoneme',
        Dimension: 'Comprehensive',
        EnableMiscue: 'True',
    };
    const paHeader = Buffer.from(JSON.stringify(paConfig)).toString('base64');
    const endpoint = `https://${azureRegion()}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=vi-VN&format=detailed`;

    const azureRes = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Ocp-Apim-Subscription-Key': azureKey(),
            'Content-Type': 'audio/wav; codecs=audio/pcm; samplerate=16000',
            'Pronunciation-Assessment': paHeader,
            'Accept': 'application/json',
        },
        body: audioBuffer,
    });
    const text = await azureRes.text();
    if (!azureRes.ok) {
        console.warn('[pronunciation] Azure error:', azureRes.status, text.slice(0, 200));
        return { status: 502, body: { error: 'Azure pronunciation failed', detail: text.slice(0, 500) } };
    }
    let payload;
    try {
        payload = JSON.parse(text);
    } catch {
        return { status: 502, body: { error: 'Azure pronunciation returned invalid JSON', detail: text.slice(0, 500) } };
    }

    const best = payload.NBest?.[0] || null;
    const assessment = best?.PronunciationAssessment || payload.PronunciationAssessment || null;
    const status = payload.RecognitionStatus || best?.RecognitionStatus || 'NoMatch';

    if (!best || (status !== 'Success' && !assessment)) {
        return { status: 200, body: { recognized: payload.DisplayText || '', status, scores: null, words: [] } };
    }

    const pa = assessment || {};
    return {
        status: 200,
        body: {
            recognized: best.Display || best.Lexical || payload.DisplayText || '',
            status,
            scores: {
                accuracy: pa.AccuracyScore ?? null,
                fluency: pa.FluencyScore ?? null,
                completeness: pa.CompletenessScore ?? null,
                pronunciation: pa.PronScore ?? null,
            },
            words: (best.Words || []).map((w) => ({
                word: w.Word,
                accuracy: w.PronunciationAssessment?.AccuracyScore ?? null,
                errorType: w.PronunciationAssessment?.ErrorType || 'None',
                phonemes: (w.Phonemes || []).map((p) => ({
                    phoneme: p.Phoneme,
                    accuracy: p.PronunciationAssessment?.AccuracyScore ?? null,
                })),
            })),
        },
    };
}

/**
 * Synthesize with the requested voice, degrading to Google rather than to
 * silence: the app's default voice is azure-north, so a deployment without
 * Azure keys would otherwise have no audio at all.
 * Returns { buffer, provider, requestedVoice, fellBack }.
 */
export async function synthesizeSpeech(text, lang = 'vi', requestedVoice = 'google') {
    const voice = TTS_VOICES.has(requestedVoice) ? requestedVoice : 'google';

    if (voice !== 'google') {
        try {
            const buffer = await synthesizeAzure(text, lang, voice);
            if (buffer?.length) return { buffer, provider: voice, requestedVoice: voice, fellBack: false };
        } catch (err) {
            console.warn(`[tts] ${voice} failed, falling back to Google:`, err.message);
        }
    }

    const buffer = await synthesizeGoogle(text, lang);
    return { buffer, provider: 'google', requestedVoice: voice, fellBack: voice !== 'google' };
}
