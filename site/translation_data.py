"""Validate author-supplied translations before adding them to the reader."""
import json

def load_translations(directory, languages):
    result = {}
    for code in languages:
        if code == "or":
            continue
        path = directory / f"{code}.json"
        if not path.exists():
            continue
        data = json.loads(path.read_text())
        if data.get("language") != code or not isinstance(data.get("sections"), dict):
            raise ValueError(f"Invalid translation file: {path}")
        for section, entry in data["sections"].items():
            if not section.isdigit() or str(int(section)) != section or not 0 <= int(section) <= 68:
                raise ValueError(f"Invalid section in {path}: {section}")
            if not isinstance(entry, dict) or entry.get("status") not in ("draft", "ready"):
                raise ValueError(f"Missing draft/ready status: {path}, section {section}")
            if entry["status"] != "ready":
                continue
            title, stanzas = entry.get("title"), entry.get("stanzas")
            if (not isinstance(title, str) or not title.strip() or not isinstance(stanzas, list) or not stanzas
                or any(not isinstance(stanza, list) or not stanza or any(not isinstance(line, str) or not line.strip() for line in stanza) for stanza in stanzas)):
                raise ValueError(f"Ready translation requires title and stanza lines: {path}, section {section}")
            result.setdefault(int(section), {})[code] = {"label": languages[code]["native"], "title": title, "kind": "Translation", "stanzas": stanzas}
    return result
