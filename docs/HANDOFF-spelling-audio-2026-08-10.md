# Spelling Audio Handoff - 2026-08-10

## Current Decision

The Spelling Playground now uses Google TTS for all spelling playback.

VieNeu-TTS was tested for pre-generated Vietnamese syllable/component audio, but it is not suitable yet for short, high-accuracy pronunciation clips. Even after lowering randomness and capping output length, samples still showed hallucinations, tails, and inconsistent short-form pronunciation.

## App Changes

- `src/lib/spellAudio.js` now forces spelling playback through `/api/tts` with `voice=google`.
- `src/pages/Spell/SpellPlayground.jsx` now passes stable spelling keys for segments.
- `src/lib/spellSlug.js` provides lowercase ASCII + digit slugs for Vietnamese text and component keys.
- `content/spell_audio_manifest.json` is intentionally empty while Google TTS is active.

## Generation Pipeline Kept For Future Experiments

- `scripts/gen-audio-list.mjs`
  - Generates `content/spell_gen_list.json`.
  - Covers all attested syllables plus spelling component clips.
  - Uses ASCII-safe slugs to avoid macOS Unicode filename normalization problems.

- `scripts/m5-generate.py`
  - Runs VieNeu-TTS batch generation on the M5.
  - Supports resumable output, MP3 conversion, voice/style choice, sampling controls, frame caps, delay, and watermark toggles.

- `scripts/upload-spell-audio-r2.mjs`
  - Uploads generated MP3s to Cloudflare R2.
  - Can update the spelling manifest, but use `--manifest=false` for auditions.

## Generated Assets

Full VieNeu run:

- Voice: `Phạm Tuyên`
- Count: 5,005 MP3s
- R2 prefix: `spell/north/`
- Example: `https://tts.tecxmate.com/spell/north/nghe1.mp3`

Short deterministic audition run:

- Count: 365 MP3s, 73 clips x 5 voices
- Voices:
  - `pham-tuyen`
  - `truc-ly`
  - `doan-trang`
  - `thanh-binh`
  - `minh-duc`
- R2 pattern: `https://tts.tecxmate.com/spell-audition/shortdet/<voice>/<slug>.mp3`
- Verified example: `https://tts.tecxmate.com/spell-audition/shortdet/pham-tuyen/nghe1.mp3`
- Duration scan: median `0.64s`, max `1.44s`

## M5 Notes

The M5 was used over Tailscale/SSH for generation. To reduce heat during future runs:

```bash
env OMP_NUM_THREADS=1 OPENBLAS_NUM_THREADS=1 VECLIB_MAXIMUM_THREADS=1 \
  nice -n 20 .venv/bin/python scripts/m5-generate.py \
  --items-file content/spell_audition_list.json \
  --voice "Phạm Tuyên" \
  --style tu_nhien \
  --out audition_out_shortdet/pham-tuyen \
  --mp3 \
  --temperature 0.25 \
  --top-k 5 \
  --top-p 0.8 \
  --max-new-frames 18 \
  --repetition-penalty 1.05 \
  --no-watermark \
  --delay 0.2
```

Put the M5 to sleep after remote work:

```bash
/usr/bin/pmset sleepnow
```

## Verification

- `npm run build` passed after switching spelling playback back to Google TTS.
- Local spelling route used for testing: `http://127.0.0.1:5173/spell`
