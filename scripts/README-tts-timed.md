# Word-timed TTS pipeline (Narrated Reader, Phase 4) — Azure-free

Generates the **audio + exact word timings** the Narrated Reader uses for
karaoke highlighting, fully offline with open models. No Azure.

```
explainer sentences ──▶ VieNeu-TTS ──▶ 24kHz WAV ──▶ CTC forced alignment ──▶ marks.json
                                                                    │
                                          server/tts-timed-cache/<key>.{wav,json}
                                                                    │
                                                  GET /api/tts-timed  (serves cached)
```

Synthesis is **offline and cached forever**, so it doesn't need to be fast.
Runs real-time on an **M1 Pro** (VieNeu GGUF via llama.cpp + Apple Accelerate/Metal)
and also works, slower, on a **CPU-only box** (e.g. Ryzen 2500G).

## 1. Install (one-time)

```bash
python3 -m venv .venv-tts && source .venv-tts/bin/activate
pip install -r scripts/requirements-tts.txt
```

### Apple Silicon (M1 Pro) — recommended build of the TTS backend
VieNeu/NeuTTS suggests Apple's Accelerate framework for best CPU performance:
```bash
CMAKE_ARGS="-DGGML_METAL=OFF -DGGML_BLAS=ON -DGGML_BLAS_VENDOR=Apple" \
  pip install "vieneu" --force-reinstall --no-cache-dir
```
(Or leave Metal on — both work. The forced aligner runs on CPU or `--device mps`.)

### Ryzen 2500G (CPU only)
Plain `pip install -r scripts/requirements-tts.txt` works; generation is slower
but fine for a one-time batch. Use `--device cpu`.

## 2. Pick the voice(s)

Edit the `VOICES` map at the top of `scripts/generate_explainer_audio.py`.
Each voice id must match what the app requests (`?voice=`), default **`azure-north`**
(these ids are just cache keys now — decoupled from Azure). For each, either:
- **clone a speaker:** point `ref_audio` at a 3–5 s clean clip + its `ref_text`
  (use a northern speaker for `azure-north`, southern for `azure-south`); or
- **use a built-in voice:** set `"preset": "Bình"` (see `tts.list_preset_voices()`).

Put reference clips in `scripts/voices/` (gitignored).

## 3. Generate

```bash
# default voice (azure-north), all explainer sentences
python scripts/generate_explainer_audio.py --voices azure-north

# both dialects, skip ones already made, force CPU
python scripts/generate_explainer_audio.py --voices azure-north,azure-south --skip-existing --device cpu

# use the larger v2 model
python scripts/generate_explainer_audio.py --model-arg model=pnnbao-ump/VieNeu-TTS-v2
```

Output lands in `server/tts-timed-cache/<key>.wav` + `<key>.json`
(`key = sha1("timed|{voice}|vi|{text}")`, matching `server.js`).

## 4. Serve

Nothing else to wire — `GET /api/tts-timed` reads that dir. Start the app
(`npm run dev:all`), open the **Reader** tab, play a topic: highlighting now
follows the **exact** Azure-free timings and the player shows an **"Exact"** badge.
Sentences you haven't generated still work — they fall back to the client-side
syllable estimate automatically.

## Notes
- Regenerate after editing `src/data/explainerData.js` (the script pulls sentences
  from it via `scripts/export-explainers.mjs`).
- `server/tts-timed-cache/` is gitignored (audio is large). For production, push
  these to the same R2/Supabase bucket `/api/tts` uses and have the endpoint
  redirect to the CDN instead of inlining base64.
- The whole app's *other* audio (`/api/tts`) still uses its existing providers;
  this pipeline only replaces timing/audio for the narrated Reader.
