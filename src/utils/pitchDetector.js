/**
 * pitchDetector.js — Lightweight YIN-based pitch detection for Web Audio API.
 *
 * Extracts Fundamental Frequency (F0) from raw PCM audio buffers using the
 * autocorrelation method described in the YIN paper (de Cheveigné & Kawahara, 2002).
 * No external dependencies — runs entirely in the browser.
 */

// ─── YIN Pitch Detector ────────────────────────────────────────────

/**
 * Detect the fundamental frequency of a Float32Array audio buffer.
 * @param {Float32Array} buffer  — Raw PCM samples (mono)
 * @param {number} sampleRate    — e.g. 44100 or 48000
 * @param {number} threshold     — YIN confidence threshold (lower = stricter), default 0.15
 * @returns {number}             — Detected pitch in Hz, or -1 if unvoiced / too quiet
 */
export function detectPitch(buffer, sampleRate, threshold = 0.15) {
    const bufferSize = buffer.length;
    const halfSize = Math.floor(bufferSize / 2);

    // 1) Check if the signal is loud enough (RMS gate)
    let rms = 0;
    for (let i = 0; i < bufferSize; i++) rms += buffer[i] * buffer[i];
    rms = Math.sqrt(rms / bufferSize);
    if (rms < 0.01) return -1; // silence gate

    // 2) YIN difference function
    const yinBuffer = new Float32Array(halfSize);
    for (let tau = 0; tau < halfSize; tau++) {
        let sum = 0;
        for (let i = 0; i < halfSize; i++) {
            const delta = buffer[i] - buffer[i + tau];
            sum += delta * delta;
        }
        yinBuffer[tau] = sum;
    }

    // 3) Cumulative mean normalized difference
    yinBuffer[0] = 1;
    let runningSum = 0;
    for (let tau = 1; tau < halfSize; tau++) {
        runningSum += yinBuffer[tau];
        yinBuffer[tau] *= tau / runningSum;
    }

    // 4) Absolute threshold — find the first tau below threshold
    let tauEstimate = -1;
    for (let tau = 2; tau < halfSize; tau++) {
        if (yinBuffer[tau] < threshold) {
            // Walk forward to find the local minimum
            while (tau + 1 < halfSize && yinBuffer[tau + 1] < yinBuffer[tau]) {
                tau++;
            }
            tauEstimate = tau;
            break;
        }
    }

    if (tauEstimate === -1) return -1; // no pitch found

    // 5) Parabolic interpolation for sub-sample accuracy
    let betterTau;
    const x0 = tauEstimate < 1 ? tauEstimate : tauEstimate - 1;
    const x2 = tauEstimate + 1 < halfSize ? tauEstimate + 1 : tauEstimate;

    if (x0 === tauEstimate) {
        betterTau = yinBuffer[tauEstimate] <= yinBuffer[x2] ? tauEstimate : x2;
    } else if (x2 === tauEstimate) {
        betterTau = yinBuffer[tauEstimate] <= yinBuffer[x0] ? tauEstimate : x0;
    } else {
        const s0 = yinBuffer[x0];
        const s1 = yinBuffer[tauEstimate];
        const s2 = yinBuffer[x2];
        betterTau = tauEstimate + (s2 - s0) / (2 * (2 * s1 - s2 - s0));
    }

    const pitch = sampleRate / betterTau;

    // Sanity-check: human voice range ~60–600 Hz
    if (pitch < 60 || pitch > 600) return -1;

    return pitch;
}


// ─── Helpers ────────────────────────────────────────────────────────

/**
 * Convert Hz to semitones relative to a baseline frequency.
 * @param {number} hz       — The frequency to convert
 * @param {number} baseHz   — The user's calibrated baseline pitch
 * @returns {number}        — Semitones above/below baseline
 */
export function hzToSemitones(hz, baseHz) {
    if (hz <= 0 || baseHz <= 0) return 0;
    return 12 * Math.log2(hz / baseHz);
}


// ─── Calibration ────────────────────────────────────────────────────

/**
 * Calibrate the user's baseline pitch by recording ~5 seconds of "aaa".
 * Returns the median pitch as the baseline.
 *
 * @param {AudioContext} audioContext
 * @param {MediaStream} stream
 * @param {function} onProgress  — Called with 0-1 progress
 * @param {number} durationMs    — Calibration duration (default 5000ms)
 * @returns {Promise<number>}    — Median pitch in Hz
 */
export function calibrateBaseline(audioContext, stream, onProgress, durationMs = 5000) {
    return new Promise((resolve, reject) => {
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        source.connect(analyser);

        const buffer = new Float32Array(analyser.fftSize);
        const pitches = [];
        const startTime = Date.now();

        const interval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            if (onProgress) onProgress(Math.min(elapsed / durationMs, 1));

            analyser.getFloatTimeDomainData(buffer);
            const pitch = detectPitch(buffer, audioContext.sampleRate);
            if (pitch > 0) pitches.push(pitch);

            if (elapsed >= durationMs) {
                clearInterval(interval);
                source.disconnect();

                if (pitches.length < 5) {
                    reject(new Error('Could not detect enough voiced frames. Please speak louder.'));
                    return;
                }

                // Median
                pitches.sort((a, b) => a - b);
                const median = pitches[Math.floor(pitches.length / 2)];
                resolve(median);
            }
        }, 33); // ~30fps
    });
}


// ─── Real-time Pitch Tracking ───────────────────────────────────────

/**
 * Start tracking pitch in real-time.
 * Returns a stop function.
 *
 * @param {AudioContext} audioContext
 * @param {MediaStream} stream
 * @param {number} baselineHz        — User's calibrated baseline
 * @param {function} onPitch         — Called with { hz, semitone, time }
 * @returns {{ stop: function }}
 */
export function startPitchTracking(audioContext, stream, baselineHz, onPitch) {
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    source.connect(analyser);

    const buffer = new Float32Array(analyser.fftSize);
    const startTime = Date.now();
    let animId = null;
    let stopped = false;

    function tick() {
        if (stopped) return;

        analyser.getFloatTimeDomainData(buffer);
        const hz = detectPitch(buffer, audioContext.sampleRate);
        const time = (Date.now() - startTime) / 1000; // seconds

        if (hz > 0) {
            const semitone = hzToSemitones(hz, baselineHz);
            onPitch({ hz, semitone, time });
        }

        animId = requestAnimationFrame(tick);
    }

    tick();

    return {
        stop() {
            stopped = true;
            if (animId) cancelAnimationFrame(animId);
            source.disconnect();
        }
    };
}
