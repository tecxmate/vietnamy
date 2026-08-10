#!/usr/bin/env python3
"""Batch-render the Spelling Playground audio with VieNeu-TTS (run on the M5).

    pip install vieneu
    python3 scripts/m5-generate.py --voice "Minh Đức" --out ./spell_audio_out --mp3

Reads content/spell_gen_list.json ({items:[{slug,text,kind}]}), renders each
clip once (resumable — skips existing files), writes <out>/<slug>.wav or .mp3.
Pick a Northern preset from --list-voices first.
"""
import argparse, json, shutil, subprocess, sys, time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LIST = ROOT / "content" / "spell_gen_list.json"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--voice", default=None, help="preset voice ID/name; default uses VieNeu's default voice")
    ap.add_argument("--style", default="tu_nhien", help="tu_nhien | tin_tuc | doc_truyen")
    ap.add_argument("--out", default=str(ROOT / "spell_audio_out"))
    ap.add_argument("--items-file", default=str(LIST), help="JSON file with {items:[{slug,text,kind}]}")
    ap.add_argument("--list-voices", action="store_true")
    ap.add_argument("--mp3", action="store_true", help="transcode wav to mp3 via ffmpeg (48k mono)")
    ap.add_argument("--limit", type=int, default=0, help="render only the first N pending clips")
    ap.add_argument("--delay", type=float, default=0.0, help="seconds to sleep after each clip to reduce heat")
    ap.add_argument("--temperature", type=float, default=0.8, help="sampling temperature; lower is more deterministic")
    ap.add_argument("--top-k", type=int, default=25, help="sample from the top K audio-token candidates")
    ap.add_argument("--top-p", type=float, default=0.95, help="nucleus sampling cutoff inside the top-K set")
    ap.add_argument("--max-new-frames", type=int, default=300, help="maximum generated audio frames before forced stop")
    ap.add_argument("--repetition-penalty", type=float, default=1.2, help="penalize repeated audio codes")
    ap.add_argument("--no-denoise", action="store_true", help="disable reference denoise path")
    ap.add_argument("--no-ref-codes", action="store_true", help="use speaker embedding without reference audio codes")
    ap.add_argument("--no-watermark", action="store_true", help="disable audio watermark post-processing")
    args = ap.parse_args()

    from vieneu import Vieneu
    v = Vieneu()  # auto-detects; on Apple Silicon this uses the ONNX/CPU path

    if args.list_voices:
        for item in v.list_preset_voices():
            if isinstance(item, (list, tuple)) and len(item) >= 2:
                print(f"{item[1]}\t{item[0]}")
            else:
                print(item)
        return

    out = Path(args.out); out.mkdir(parents=True, exist_ok=True)
    items = json.loads(Path(args.items_file).read_text())["items"]
    ext = "mp3" if args.mp3 else "wav"
    todo = [it for it in items if not (out / f"{it['slug']}.{ext}").exists()]
    if args.limit > 0:
        todo = todo[:args.limit]
    voice = v.get_preset_voice(args.voice) if args.voice else None
    print(f"{len(items)} clips · {len(todo)} to render · voice={args.voice or 'default'} · out={out}")

    t0 = time.time()
    for i, it in enumerate(todo, 1):
        wav = out / f"{it['slug']}.wav"
        kwargs = {"text": it["text"]}
        if voice is not None:
            kwargs["voice"] = voice
        else:
            kwargs["voice"] = args.voice
        try:
            audio = v.infer(
                **kwargs,
                style=args.style,
                temperature=args.temperature,
                top_k=args.top_k,
                top_p=args.top_p,
                max_new_frames=args.max_new_frames,
                repetition_penalty=args.repetition_penalty,
                denoise=not args.no_denoise,
                use_ref_codes=not args.no_ref_codes,
                apply_watermark=not args.no_watermark,
            )
        except TypeError:
            audio = v.infer(**kwargs)
        v.save(audio, str(wav))
        if args.mp3:
            mp3 = out / f"{it['slug']}.mp3"
            ffmpeg = shutil.which("ffmpeg")
            if not ffmpeg:
                try:
                    import imageio_ffmpeg
                    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
                except Exception as exc:
                    raise RuntimeError("ffmpeg not found; install ffmpeg or imageio-ffmpeg") from exc
            subprocess.run([ffmpeg, "-y", "-loglevel", "error", "-i", str(wav),
                            "-ac", "1", "-ar", "48000", "-b:a", "64k", str(mp3)], check=True)
            wav.unlink()
        if i % 50 == 0 or i == len(todo):
            rate = i / (time.time() - t0)
            print(f"  {i}/{len(todo)}  {rate:.1f}/s  eta {int((len(todo)-i)/max(rate,1e-6))}s", flush=True)
        if args.delay > 0:
            time.sleep(args.delay)
    print("done.")


if __name__ == "__main__":
    sys.exit(main())
