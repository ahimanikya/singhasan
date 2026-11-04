"""Public poetry archive. Private drafts and originals are never build inputs."""
from pathlib import Path
from html import escape
import json

ROOT = Path(__file__).resolve().parent

def render_poetry_archive():
    data = json.loads((ROOT / 'poetry-archive/published.json').read_text())
    output = ROOT / 'dist/assets/poetry-archive'
    output.mkdir(parents=True, exist_ok=True)
    poems = []
    for poem in data['poems']:
        name = poem['id'] + '.txt'
        (output / name).write_text(poem['text'], encoding='utf-8')
        # The source title is retained in the download; the visible heading replaces it.
        verse = poem['text'].split('\n', 1)[1].strip()
        stanzas = ''.join('<p>' + '<br>'.join(escape(line) for line in stanza.splitlines()) + '</p>' for stanza in verse.split('\n\n'))
        poems.append(f'<article id="archive-{escape(poem["id"])}"><h3 lang="or">{escape(poem["title"])}</h3><p class="archive-source"><a href="{escape(poem["source_url"])}">{escape(poem["source_label"])}</a></p><details open><summary>Read the poem</summary><div class="archive-verse" lang="or">{stanzas}</div></details><p><a href="assets/poetry-archive/{name}" download>Download Odia text · <span lang="or">{escape(poem["title"])}</span></a></p></article>')
    sources = ''.join(f'<li><span lang="{escape(item.get("lang", "or"))}">{escape(item["title"])}</span> — <a href="{escape(item["url"])}">{escape(item["label"])}</a></li>' for item in data['sources'])
    articles = ''.join(f'<li><span lang="{escape(item.get("lang", "or"))}">{escape(item["title"])}</span> — <a href="{escape(item["url"])}">{escape(item["label"])}</a></li>' for item in data.get('articles', []))
    return '<section class="poetry-archive" id="poetry-archive" lang="en"><h2>Poetry archive</h2><p>Poems by Pravakar Satapathy, preserved in their original Odia. Read the poems, download their text, and explore the published sources.</p>' + ''.join(poems) + '<h3>From the magazines</h3><p>These poems are preserved in the source issues below. Text editions are being checked against the printed pages.</p><ul>' + sources + '</ul><h3>Articles and conversations</h3><ul>' + articles + '</ul><p>The magazine scans are available through Odia Bibhaba / Srujanika. Some source links may require sign-in.</p></section>'
