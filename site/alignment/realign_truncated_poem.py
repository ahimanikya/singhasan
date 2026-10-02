"""Realign an acoustically verified recorded prefix without forcing missing text.

Only use --through-line after independent decoding/listening has established
that the existing recording ends near that source line. No duration estimation.
"""
import argparse
import hashlib
import json
from pathlib import Path

import numpy as np
import torch
import torchaudio


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--id", required=True, type=int)
    parser.add_argument("--through-line", required=True, type=int)
    parser.add_argument("--cache", required=True, type=Path)
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1]
    target = root / f"dist/assets/audio-sync/poem-{args.id}.json"
    old = json.loads(target.read_text())
    source = root / "dist/assets/reading-book.json"
    section = next(p for p in json.loads(source.read_text())["poems"] if p["id"] == args.id)
    text_hash = hashlib.sha256(json.dumps(section["variants"]["or"]["stanzas"], ensure_ascii=False, separators=(",", ":")).encode()).hexdigest()
    track = next(t for t in json.loads((root / "audio-edition.json").read_text())["tracks"] if t["id"] == old["id"])
    assert text_hash == old["textSha256"]
    assert hashlib.sha256((root / "dist" / track["src"]).read_bytes()).hexdigest() == old["audioSha256"]
    words = [{k: v for k, v in c.items() if k not in ("start", "end", "score")} for c in old["cues"] if c["line"] <= args.through_line]
    omitted = [{"line": c["line"], "offset": c["offset"], "endOffset": c["endOffset"], "text": c["text"]} for c in old["cues"] if c["line"] > args.through_line]
    emission = torch.from_numpy(np.load(args.cache / (old["audioSha256"] + ".npy")))
    bundle = torchaudio.pipelines.MMS_FA
    spans = bundle.get_aligner()(emission, bundle.get_tokenizer()(["*"] + [w["romanized"] for w in words] + ["*"]))[1:-1]
    cues = []
    for word, span in zip(words, spans):
        score = sum(s.score * len(s) for s in span) / sum(len(s) for s in span)
        cues.append({**word, "start": round(span[0].start * .02, 3), "end": round(span[-1].end * .02, 3), "score": round(score, 3)})
    result = {**old, "version": 2, "method": "MMS_FA acoustic forced alignment, uroman ori; only independently decoded recorded source prefix", "review": "machine-aligned partial recording; fluent listening review pending; existing audio appears to end before terminal source lines", "partialCoverage": True, "syncSafe": False, "coverageNote": "Audio playback is preserved. Automatic following should remain off pending completeness review; unsupported source words receive no invented cue.", "omittedWordCount": len(omitted), "omittedLines": sorted({w["line"] for w in omitted}), "omittedWords": omitted, "wordCount": len(cues), "meanScore": round(sum(c["score"] for c in cues) / len(cues), 3), "lowScoreWords": sum(c["score"] < .1 for c in cues), "cues": cues}
    archive = root / f"alignment/archive/poem-{args.id}-global-v1.json"
    archive.parent.mkdir(exist_ok=True)
    if not archive.exists():
        archive.write_text(json.dumps(old, ensure_ascii=False, separators=(",", ":")) + "\n")
    target.write_text(json.dumps(result, ensure_ascii=False, separators=(",", ":")) + "\n")
    print(json.dumps({k: result[k] for k in ("wordCount", "meanScore", "lowScoreWords", "omittedWordCount", "omittedLines")}, indent=2))


if __name__ == "__main__":
    main()
