// Records microphone audio as 16 kHz mono 16-bit PCM and returns a WAV Blob.
// Used by the pronunciation-assessment flow because Azure expects WAV/PCM at
// 16 kHz mono. AudioWorklet would be cleaner but ScriptProcessor still works
// in every browser including Safari, with no extra files to load.

const TARGET_RATE = 16000;

function downsampleTo16k(float32, inputRate) {
    if (inputRate === TARGET_RATE) return float32;
    const ratio = inputRate / TARGET_RATE;
    const newLen = Math.round(float32.length / ratio);
    const out = new Float32Array(newLen);
    let pos = 0;
    let i = 0;
    while (pos < newLen) {
        const next = Math.round((pos + 1) * ratio);
        let sum = 0;
        let count = 0;
        for (; i < next && i < float32.length; i++) {
            sum += float32[i];
            count++;
        }
        out[pos] = count > 0 ? sum / count : 0;
        pos++;
    }
    return out;
}

function floatToInt16(float32) {
    const out = new Int16Array(float32.length);
    for (let i = 0; i < float32.length; i++) {
        const v = Math.max(-1, Math.min(1, float32[i]));
        out[i] = v < 0 ? v * 0x8000 : v * 0x7FFF;
    }
    return out;
}

function pcm16ToWavBlob(pcm16, sampleRate) {
    const bytesPerSample = 2;
    const numChannels = 1;
    const dataLen = pcm16.length * bytesPerSample;
    const buffer = new ArrayBuffer(44 + dataLen);
    const view = new DataView(buffer);
    const writeString = (offset, s) => {
        for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i));
    };
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + dataLen, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);                          // PCM chunk size
    view.setUint16(20, 1, true);                           // PCM format
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * bytesPerSample, true);
    view.setUint16(32, numChannels * bytesPerSample, true);
    view.setUint16(34, 16, true);                          // bits per sample
    writeString(36, 'data');
    view.setUint32(40, dataLen, true);
    new Int16Array(buffer, 44).set(pcm16);
    return new Blob([buffer], { type: 'audio/wav' });
}

// options:
//   onAutoStop(blob)  — called once when the take ends itself (silence/maxMs)
//   silenceMs         — end the take after this much silence once speech began (0 = off)
//   maxMs             — hard cap on take length (0 = off)
//   silenceThreshold  — RMS below this counts as silence
export async function startPCMRecording(options = {}) {
    const { onAutoStop, silenceMs = 0, maxMs = 0, silenceThreshold = 0.015 } = options;
    const stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, sampleRate: 16000, echoCancellation: true, noiseSuppression: true } });
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioCtx();
    // A fresh AudioContext can start 'suspended'; without resuming it,
    // onaudioprocess never fires and the recording is silent.
    if (ctx.state === 'suspended') { try { await ctx.resume(); } catch { /* ignore */ } }
    const source = ctx.createMediaStreamSource(stream);
    // 4096-sample buffer = ~85ms at 48kHz; small enough for snappy stop but
    // large enough to keep CPU low.
    const processor = ctx.createScriptProcessor(4096, 1, 1);
    const chunks = [];
    const inputRate = ctx.sampleRate;

    let stopped = false;
    // `samples` (16 kHz mono Float32) is exposed after stop() so callers can run
    // lightweight client-side analysis (e.g. pitch tracking) on the same audio.
    const api = { sampleRate: TARGET_RATE, samples: null };
    api.stop = async () => {
        if (stopped) return null;
        stopped = true;
        processor.disconnect();
        source.disconnect();
        stream.getTracks().forEach(t => t.stop());
        try { await ctx.close(); } catch { /* already closed */ }

        // Concatenate chunks, downsample to 16k, pack as WAV.
        const total = chunks.reduce((n, c) => n + c.length, 0);
        const merged = new Float32Array(total);
        let offset = 0;
        for (const c of chunks) { merged.set(c, offset); offset += c.length; }
        const downsampled = downsampleTo16k(merged, inputRate);
        api.samples = downsampled;
        const pcm16 = floatToInt16(downsampled);
        return pcm16ToWavBlob(pcm16, TARGET_RATE);
    };

    // Voice-activity auto-stop: end the take after `silenceMs` of silence (once
    // the learner has spoken) or once `maxMs` is reached.
    let hasSpoken = false;
    let silentSamples = 0;
    let totalSamples = 0;
    let autoStopping = false;
    const triggerAutoStop = () => {
        if (autoStopping || stopped) return;
        autoStopping = true;
        api.stop().then(blob => { if (onAutoStop) onAutoStop(blob); }).catch(() => {});
    };
    processor.onaudioprocess = (e) => {
        const input = e.inputBuffer.getChannelData(0);
        chunks.push(new Float32Array(input));
        if (silenceMs <= 0 && maxMs <= 0) return;
        totalSamples += input.length;
        let sum = 0;
        for (let i = 0; i < input.length; i++) sum += input[i] * input[i];
        const rms = Math.sqrt(sum / input.length);
        if (rms > silenceThreshold) { hasSpoken = true; silentSamples = 0; }
        else if (hasSpoken) { silentSamples += input.length; }
        const silentMs = (silentSamples / inputRate) * 1000;
        const totalMs = (totalSamples / inputRate) * 1000;
        if ((silenceMs > 0 && hasSpoken && silentMs >= silenceMs) || (maxMs > 0 && totalMs >= maxMs)) {
            triggerAutoStop();
        }
    };
    source.connect(processor);
    processor.connect(ctx.destination);

    return api;
}
