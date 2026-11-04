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
        source = f'<p class="archive-source"><a href="{escape(poem["source_url"])}">{escape(poem["source_label"])}</a></p>' if poem.get('source_url') else ''
        poems.append(f'<article id="archive-{escape(poem["id"])}"><h3 lang="or">{escape(poem["title"])}</h3>{source}<details open><summary>Read the poem</summary><div class="archive-verse" lang="or">{stanzas}</div></details></article>')
    recordings = []
    for recording in data.get('recordings', []):
        rid = escape(recording['id'])
        media = f'assets/poetry-archive/{rid}'
        source = f' · <a href="{escape(recording["source_url"])}">Source</a>' if recording.get('source_url') else ''
        recordings.append(f'<article id="{rid}"><h4 id="{rid}-title" lang="{escape(recording["lang"])}">{escape(recording["title"])}</h4><p>{escape(recording["description"])} · {escape(recording["duration_label"])}</p><video class="archive-video" controls playsinline loading="lazy" preload="none" width="{int(recording["width"])}" height="{int(recording["height"])}" poster="{media}.jpg" aria-labelledby="{rid}-title"><source src="{media}.mp4" type="video/mp4"><a href="{media}.mp4">Watch the recording</a></video><p><a href="{media}.mp4" download>Download video</a>{source}</p></article>')
    recordings_section = '<section id="poetry-recordings"><h3>In the poet’s voice</h3>' + ''.join(recordings) + '</section>' if recordings else ''
    sources = ''.join(f'<li><span lang="{escape(item.get("lang", "or"))}">{escape(item["title"])}</span> — <a href="{escape(item["url"])}">{escape(item["label"])}</a></li>' for item in data['sources'])
    articles = ''.join(f'<li><span lang="{escape(item.get("lang", "or"))}">{escape(item["title"])}</span> — <a href="{escape(item["url"])}">{escape(item["label"])}</a></li>' for item in data.get('articles', []))
    return '<section class="poetry-archive" id="poetry-archive" lang="en"><h2>Poetry archive</h2><p>Poems by Pravakar Satapathy, preserved in their original Odia. Read the poems and explore the published sources.</p>' + recordings_section + ''.join(poems) + '<h3>From the magazines</h3><p>These poems are preserved in the source issues below. Text editions are being checked against the printed pages.</p><ul>' + sources + '</ul><h3>Articles and conversations</h3><ul>' + articles + '</ul><p>The magazine scans are available through Odia Bibhaba / Srujanika. Some source links may require sign-in.</p></section>'


def render_photo_memories():
    data = json.loads((ROOT / 'poetry-archive/published.json').read_text())
    figures = ''.join(f'<figure><img src="{escape(photo["asset"])}" alt="{escape(photo["alt"])}" width="{int(photo["width"])}" height="{int(photo["height"])}" loading="lazy"><figcaption>{escape(photo["caption"])}</figcaption></figure>' for photo in data.get('photographs', []))
    return '<section class="photo-memories" id="photographs-and-memories" lang="en"><h2>Photographs and memories</h2>' + figures + '</section>' if figures else ''
