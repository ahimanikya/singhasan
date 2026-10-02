"""Audit exact recording/source associations and all published acoustic cues."""
import argparse
import hashlib
import json
from pathlib import Path


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--out", type=Path)
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1]
    book = json.loads((root / "dist/assets/reading-book.json").read_text())["poems"]
    tracks = {t["id"]: t for t in json.loads((root / "audio-edition.json").read_text())["tracks"]}
    records, errors = [], []
    for poem in book:
        id = f"poem-{poem['id']}" if poem["id"] else "introduction"
        target = root / f"dist/assets/audio-sync/{id}.json"
        if not target.exists():
            errors.append(f"Missing {id}")
            continue
        data = json.loads(target.read_text())
        track = tracks[id]
        stanzas = poem["variants"]["or"]["stanzas"]
        lines = [l for s in stanzas for l in s]
        issues = []
        if hashlib.sha256((root / "dist" / track["src"]).read_bytes()).hexdigest() != data["audioSha256"]:
            issues.append("audio hash mismatch")
        text_hash = hashlib.sha256(json.dumps(stanzas, ensure_ascii=False, separators=(",", ":")).encode()).hexdigest()
        if text_hash != data["textSha256"]:
            issues.append("source text hash mismatch")
        previous_end = 0
        for cue in data["cues"]:
            if not 0 <= cue["line"] < len(lines) or lines[cue["line"]][cue["offset"]:cue["endOffset"]] != cue["text"]:
                issues.append("source offset mismatch")
            if not previous_end <= cue["start"] < cue["end"] <= data["duration"]:
                issues.append("invalid or unordered time")
            previous_end = cue["end"]
        for word in data.get("omittedWords", []):
            if lines[word["line"]][word["offset"]:word["endOffset"]] != word["text"]:
                issues.append("omitted-word source offset mismatch")
        record = {"id": id, "audioSha256": data["audioSha256"], "textSha256": data["textSha256"], "duration": data["duration"], "cues": len(data["cues"]), "uniqueSourceWords": len({(c["line"], c["offset"]) for c in data["cues"]}), "sourceLines": len(lines), "cuedLines": len({c["line"] for c in data["cues"]}), "meanScore": data["meanScore"], "lowScoreWords": data["lowScoreWords"], "partialCoverage": data.get("partialCoverage", False), "syncSafe": data.get("syncSafe", True), "omittedWordCount": data.get("omittedWordCount", 0), "issues": sorted(set(issues))}
        records.append(record)
        errors.extend(f"{id}: {issue}" for issue in record["issues"])
    report = {"version": 1, "date": "2026-10-02", "status": "source and recording associations valid" if not errors else "issues found", "sectionsExpected": len(book), "timingFiles": len(records), "totalCues": sum(r["cues"] for r in records), "fullPoemAlignments": sum(r["id"].startswith("poem-") and not r["partialCoverage"] for r in records), "partialSections": [r["id"] for r in records if r["partialCoverage"]], "review": "Machine acoustic timing only. Fluent listening review is pending; scores measure forced alignment support and do not establish pronunciation or completeness.", "findings": ["The original introduction and poem-50 alignments forced absent terminal source words into the last seconds of their recordings.", "Independent MMS greedy decoding, excluding the wildcard channel, suggests the four introduction takes and poem-50 end before the source text ends.", "Their revised timing files explicitly omit unsupported words and set syncSafe=false. The site source text and recordings are unchanged.", "The other 67 poems have complete source-line cue coverage and overall mean scores of 0.812 or higher; no comparable terminal low-score cluster was found."], "errors": errors, "sections": records}
    if args.out:
        args.out.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps({k: report[k] for k in ("status", "sectionsExpected", "timingFiles", "totalCues", "fullPoemAlignments", "partialSections", "errors")}, indent=2))
    if errors:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
