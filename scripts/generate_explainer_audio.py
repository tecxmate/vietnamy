#!/usr/bin/env python3
"""
Offline generator for the Narrated Reader's word-timed audio (Phase 4) — Azure-free.

Pipeline, per sentence × voice:
  1. VieNeu-TTS (open, Apache-2.0, on-device) synthesizes a 24 kHz WAV.
  2. CTC forced alignment (ctc-forced-aligner / wav2vec2-MMS) aligns that WAV to
     the known Vietnamese transcript → per-word timestamps.
  3. Write  <key>.wav  and  <key>.json  into the server's tts-timed cache dir,
     where  key = sha1("timed|{voice}|{lang}|{text}")  — matching server.js's
     ttsTimedKey() so /api/tts-timed serves them directly.

Synthesis is offline and the output is cached forever, so speed doesn't matter:
runs real-time on an M1 Pro (VieNeu GGUF via llama.cpp + Accelerate/Metal) and
also works (slower) on a CPU-only box like a Ryzen 2500G.

Setup:  see scripts/README-tts-timed.md
Run:    python scripts/generate_explainer_audio.py --voices azure-north
"""
import argparse
import hashlib
import json
import subprocess
import sys
from pathlib import Path

LANG = "vi"
ALIGN_LANG = "vie"  # ISO-639-3 for the forced aligner

REPO_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_OUT = REPO_ROOT / "server" / "tts-timed-cache"

# Voice id (what the web client requests via ?voice=) → how VieNeu should speak it.
# These ids are just cache identifiers now (decoupled from Azure). For each voice
# give EITHER a "preset" (a VieNeu built-in voice id) OR a "ref_audio"+"ref_text"
# (3-5 s reference clip + its transcript) to clone a specific speaker.
# Generate whichever voice(s) the app is actually set to (default: azure-north).
VOICES = {
    "azure-north": {
        # northern speaker — clone from a reference, or set "preset": "Bình"
        "ref_audio": str(REPO_ROOT / "scripts" / "voices" / "north.wav"),
        "ref_text": "Xin chào, đây là giọng đọc miền Bắc.",
    },
    "azure-south": {
        "ref_audio": str(REPO_ROOT / "scripts" / "voices" / "south.wav"),
        "ref_text": "Xin chào, đây là giọng đọc miền Nam.",
    },
}


def timed_key(voice: str, text: str, lang: str = LANG) -> str:
    """sha1("timed|voice|lang|text") — must match server.js ttsTimedKey()."""
    return hashlib.sha1(f"timed|{voice}|{lang}|{text}".encode("utf-8")).hexdigest()


def load_sentences(explainers_json: Path | None) -> list[dict]:
    if explainers_json:
        return json.loads(Path(explainers_json).read_text(encoding="utf-8"))
    # Single source of truth: ask the JS exporter.
    exporter = REPO_ROOT / "scripts" / "export-explainers.mjs"
    out = subprocess.run(
        ["node", str(exporter)], capture_output=True, text=True, cwd=REPO_ROOT, check=True
    )
    return json.loads(out.stdout)


def build_tts(model_args: dict):
    from vieneu import Vieneu  # noqa: WPS433 (lazy import; heavy)
    print(f"Loading VieNeu-TTS ({model_args or 'default 0.3B-Q4 GGUF'}) ...", flush=True)
    return Vieneu(**model_args)


def synth(tts, text: str, voice_cfg: dict, wav_path: Path):
    """Synthesize `text` in the configured voice and save a 24 kHz WAV."""
    if voice_cfg.get("preset"):
        # Built-in voice path.
        audio = tts.infer(text=text, ref_audio=tts.get_preset_voice(voice_cfg["preset"]))
    else:
        audio = tts.infer(
            text=text,
            ref_audio=voice_cfg["ref_audio"],
            ref_text=voice_cfg["ref_text"],
        )
    tts.save(audio, str(wav_path))


def build_aligner(device: str):
    import torch  # noqa: WPS433
    from ctc_forced_aligner import load_alignment_model  # noqa: WPS433
    dtype = torch.float16 if device == "cuda" else torch.float32
    print(f"Loading forced-alignment model on {device} ...", flush=True)
    return load_alignment_model(device, dtype=dtype)


def align(model, tokenizer, wav_path: Path, text: str, batch_size: int) -> list[dict]:
    """Return [{text, offsetMs, durMs}] for each spoken word, in order."""
    from ctc_forced_aligner import (  # noqa: WPS433
        load_audio, generate_emissions, preprocess_text, get_alignments,
        get_spans, postprocess_results,
    )
    waveform = load_audio(str(wav_path), model.dtype, model.device)
    emissions, stride = generate_emissions(model, waveform, batch_size=batch_size)
    tokens_starred, text_starred = preprocess_text(text, romanize=True, language=ALIGN_LANG)
    segments, scores, blank_token = get_alignments(emissions, tokens_starred, tokenizer)
    spans = get_spans(tokens_starred, segments, blank_token)
    words = postprocess_results(text_starred, spans, stride, scores)

    marks = []
    for w in words:
        token = (w.get("text") or "").strip()
        if not token:
            continue
        start = float(w["start"])
        end = float(w["end"])
        marks.append({
            "text": token,
            "offsetMs": round(start * 1000),
            "durMs": round(max(0.0, end - start) * 1000),
        })
    return marks


def main():
    ap = argparse.ArgumentParser(description="Generate word-timed TTS for the Narrated Reader.")
    ap.add_argument("--voices", default="azure-north",
                    help="comma-separated voice ids to generate (default: azure-north)")
    ap.add_argument("--out", default=str(DEFAULT_OUT), help="server tts-timed cache dir")
    ap.add_argument("--explainers", default=None, help="path to a JSON list (else uses the JS exporter)")
    ap.add_argument("--device", default="auto", help="auto|cpu|cuda|mps (forced aligner)")
    ap.add_argument("--batch-size", type=int, default=8)
    ap.add_argument("--model-arg", action="append", default=[],
                    help="extra VieNeu(**kwargs), e.g. --model-arg model=pnnbao-ump/VieNeu-TTS-v2")
    ap.add_argument("--skip-existing", action="store_true", help="skip sentences already generated")
    args = ap.parse_args()

    if args.device == "auto":
        import torch
        device = "cuda" if torch.cuda.is_available() else "cpu"
    else:
        device = args.device

    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)
    voices = [v.strip() for v in args.voices.split(",") if v.strip()]
    for v in voices:
        if v not in VOICES:
            sys.exit(f"Unknown voice '{v}'. Configure it in VOICES at the top of this script.")

    model_args = dict(kv.split("=", 1) for kv in args.model_arg)
    sentences = load_sentences(args.explainers)
    print(f"{len(sentences)} sentences × {len(voices)} voice(s) → {out_dir}", flush=True)

    tts = build_tts(model_args)
    model, tokenizer = build_aligner(device)

    made = skipped = failed = 0
    for voice in voices:
        cfg = VOICES[voice]
        for s in sentences:
            text = s["vi"]
            key = timed_key(voice, text)
            wav_path = out_dir / f"{key}.wav"
            marks_path = out_dir / f"{key}.json"
            if args.skip_existing and wav_path.exists() and marks_path.exists():
                skipped += 1
                continue
            try:
                synth(tts, text, cfg, wav_path)
                marks = align(model, tokenizer, wav_path, text, args.batch_size)
                marks_path.write_text(json.dumps(marks, ensure_ascii=False), encoding="utf-8")
                made += 1
                print(f"  ✓ [{voice}] {text[:48]}…  ({len(marks)} words)", flush=True)
            except Exception as err:  # noqa: BLE001 — keep going on per-sentence failure
                failed += 1
                print(f"  ✗ [{voice}] {text[:48]}…  {type(err).__name__}: {err}", flush=True)

    print(f"\nDone. generated={made} skipped={skipped} failed={failed}", flush=True)
    print(f"Cache dir: {out_dir}  →  served by GET /api/tts-timed", flush=True)


if __name__ == "__main__":
    main()
