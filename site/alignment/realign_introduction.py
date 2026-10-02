"""Realign recorded introduction prefixes inside their known assembly boundaries.

The independent MMS greedy decode shows that all four existing Suno takes end
before their submitted text ends. Do not force unheard paragraphs into the audio.
This script uses cached acoustic emissions and preserves the original site text
and audio. The result remains a machine alignment, pending fluent listening.
"""
import argparse
import hashlib
import json
import re
from pathlib import Path

import numpy as np
import torch
import torchaudio
import uroman


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--cache", required=True, type=Path)
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1]
    target = root / "dist/assets/audio-sync/introduction.json"
    old = json.loads(target.read_text())
    book = json.loads((root / "dist/assets/reading-book.json").read_text())
    section = next(p for p in book["poems"] if p["id"] == 0)
    track = next(t for t in json.loads((root / "audio-edition.json").read_text())["tracks"] if t["id"] == "introduction")
    assert hashlib.sha256((root / "dist" / track["src"]).read_bytes()).hexdigest() == old["audioSha256"]
    stanzas = section["variants"]["or"]["stanzas"]
    assert hashlib.sha256(json.dumps(stanzas, ensure_ascii=False, separators=(",", ":")).encode()).hexdigest() == old["textSha256"]
    run = json.loads((root / "production/prose-introduction-take-2-run.json").read_text())
    emission = torch.from_numpy(np.load(args.cache / (track["sha256"] + ".npy")))
    bundle = torchaudio.pipelines.MMS_FA
    tokenizer, aligner = bundle.get_tokenizer(), bundle.get_aligner()
    romanizer = uroman.Uroman()
    all_words = []
    line = 0
    for stanza_id, stanza in enumerate(stanzas):
        for text in stanza:
            for match in re.finditer(r"\S+", text):
                normal = re.sub("[^a-z']", "", romanizer.romanize_string(match.group(), lcode="ori").lower().replace("’", "'"))
                if normal:
                    all_words.append({"line": line, "offset": match.start(), "endOffset": match.end(), "stanza": stanza_id, "text": match.group(), "romanized": normal})
            line += 1
    # These are source ranges, not timestamps. Prefix endings and the repeat are
    # grounded in independent acoustic decoding. They require listening review.
    by_line = {i: [w for w in all_words if w["line"] == i] for i in range(line)}
    part_words = [
        [w for w in all_words if 0 <= w["line"] <= 3],
        [w for w in all_words if 6 <= w["line"] <= 8],
        [w for w in all_words if 11 <= w["line"] <= 13],
        [w for w in all_words if 17 <= w["line"] <= 18],
    ]
    p19 = by_line[19]
    text19 = stanzas[19][0]
    repeat_start = text19.index("ଦୁଃଖ ବା ସୁଖର କାହାଣୀ")
    repeat_end = text19.index("ଉଡ଼ିଯିବାର")
    recorded_end = text19.index("ଗୋଟିଏ ମୁଦ୍ରାରୁ")
    first = [w for w in p19 if w["offset"] < repeat_end]
    repeated = [{**w, "repeat": True} for w in p19 if repeat_start <= w["offset"] < repeat_end]
    remainder = [w for w in p19 if repeat_end <= w["offset"] < recorded_end]
    part_words[3].extend(first + repeated + remainder)
    cues, part_records = [], []
    for boundary, words in zip(run["part_boundaries"], part_words):
        frame_start = round(boundary["start_seconds"] / .02)
        frame_end = min(len(emission), round((boundary["start_seconds"] + boundary["duration_seconds"]) / .02))
        spans = aligner(emission[frame_start:frame_end], tokenizer(["*"] + [w["romanized"] for w in words] + ["*"]))[1:-1]
        part_cues = []
        for word, span in zip(words, spans):
            score = sum(s.score * len(s) for s in span) / sum(len(s) for s in span)
            part_cues.append({**word, "start": round((frame_start + span[0].start) * .02, 3), "end": round((frame_start + span[-1].end) * .02, 3), "score": round(score, 3), "part": boundary["part"]})
        cues.extend(part_cues)
        part_records.append({"part": boundary["part"], "sourceUrl": boundary["source_url"], "start": boundary["start_seconds"], "end": round(boundary["start_seconds"] + boundary["duration_seconds"], 3), "meanScore": round(sum(c["score"] for c in part_cues) / len(part_cues), 3), "words": len(part_cues), "firstCue": part_cues[0]["start"], "lastCue": part_cues[-1]["end"]})
    emitted = {(c["line"], c["offset"]) for c in cues}
    omitted = [w for w in all_words if (w["line"], w["offset"]) not in emitted]
    omission_lines = sorted({w["line"] for w in omitted})
    result = {**old, "version": 2, "method": "MMS_FA acoustic forced alignment, uroman ori; exact known production part boundaries; only independently decoded recorded source prefixes; explicit source repeat in part 4", "review": "machine-aligned partial introduction; fluent listening review pending; the existing recordings appear to omit submitted terminal text", "partialCoverage": True, "syncSafe": False, "coverageNote": "Audio playback is preserved. Automatic following should remain off for this introduction pending completeness review; unsupported source words receive no invented cue.", "parts": part_records, "omittedWordCount": len(omitted), "omittedLines": omission_lines, "omittedWords": [{"line": w["line"], "offset": w["offset"], "endOffset": w["endOffset"], "text": w["text"]} for w in omitted], "wordCount": len(cues), "meanScore": round(sum(c["score"] for c in cues) / len(cues), 3), "lowScoreWords": sum(c["score"] < .1 for c in cues), "cues": cues}
    archive = root / "alignment/archive/introduction-global-v1.json"
    archive.parent.mkdir(exist_ok=True)
    if not archive.exists():
        archive.write_text(json.dumps(old, ensure_ascii=False, separators=(",", ":")) + "\n")
    target.write_text(json.dumps(result, ensure_ascii=False, separators=(",", ":")) + "\n")
    print(json.dumps({k: result[k] for k in ("wordCount", "meanScore", "lowScoreWords", "omittedWordCount", "omittedLines", "parts")}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
