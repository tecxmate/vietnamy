// Local collection of labeled tone-pronunciation samples.
//
// F0-template scoring is unreliable for Vietnamese tones (glottalization,
// dialect, timing). The long-term fix is a small learned model — which needs
// data. This stores each attempt the learner self-labels ("did I say it right?")
// so a labeled dataset accumulates locally, exportable as JSON for training.

const KEY = 'vnme_tone_samples';
const CLIENT_KEY = 'vnme_client_id';
const MAX_SAMPLES = 3000; // keep localStorage bounded (~a few hundred KB)
const SCHEMA_VERSION = 1;

// Stable anonymous id so pooled samples can be grouped per device (no PII).
function getClientId() {
    try {
        let id = localStorage.getItem(CLIENT_KEY);
        if (!id) {
            id = (crypto.randomUUID && crypto.randomUUID()) || `c_${Date.now()}_${Math.random().toString(36).slice(2)}`;
            localStorage.setItem(CLIENT_KEY, id);
        }
        return id;
    } catch {
        return null;
    }
}

// Fire-and-forget POST to the shared pool. Never blocks the UI or throws.
function postToneSample(sample) {
    try {
        fetch('/api/tone-samples', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...sample, clientId: getClientId() }),
            keepalive: true,
        }).catch(() => { /* offline / server down — local copy is kept */ });
    } catch {
        /* ignore */
    }
}

export function getToneSamples() {
    try {
        const raw = localStorage.getItem(KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

export function getToneSampleCount() {
    return getToneSamples().length;
}

/**
 * Append one labeled sample.
 * @param {object} s
 * @param {string} s.tone     target tone id (e.g. 'nga')
 * @param {string} s.word     prompt word (e.g. 'mã')
 * @param {number[]|null} s.contour  learner's normalized pitch contour (the feature)
 * @param {string} s.dialect  learner's dialect ('', 'north', 'south', …)
 * @param {string} s.label    ground truth: 'correct' | 'wrong'
 * @param {string} [s.recognized]  what Azure transcribed (hint)
 * @param {string} [s.predicted]   shape-classifier's guess (hint)
 * @param {number} [s.matchScore]  heuristic score (hint)
 * @param {number} s.ts       timestamp (ms)
 */
export function saveToneSample(s) {
    // Pool to the shared backend (for training) — non-blocking, best-effort.
    postToneSample(s);
    // Keep a local copy too, so the learner can export their own data offline.
    try {
        const samples = getToneSamples();
        samples.push({ v: SCHEMA_VERSION, ...s });
        if (samples.length > MAX_SAMPLES) samples.splice(0, samples.length - MAX_SAMPLES);
        localStorage.setItem(KEY, JSON.stringify(samples));
        return samples.length;
    } catch {
        return getToneSampleCount();
    }
}

export function clearToneSamples() {
    try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}

// Download all samples as a JSON file for offline training.
export function exportToneSamples(timestamp = Date.now()) {
    const samples = getToneSamples();
    const blob = new Blob([JSON.stringify({ version: SCHEMA_VERSION, exportedAt: timestamp, count: samples.length, samples }, null, 2)], {
        type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vnme-tone-samples-${samples.length}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return samples.length;
}
