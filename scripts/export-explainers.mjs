// Dumps every explainer sentence to JSON on stdout, so the offline TTS pipeline
// (scripts/generate_explainer_audio.py) has a single source of truth without
// parsing JS. Usage:  node scripts/export-explainers.mjs > scripts/explainers.json
import EXPLAINERS from '../src/data/explainerData.js';

const out = [];
for (const exp of EXPLAINERS) {
    for (const s of (exp.sentences || [])) {
        if (s.vi) out.push({ explainer: exp.id, vi: s.vi });
    }
}
process.stdout.write(JSON.stringify(out, null, 2) + '\n');
