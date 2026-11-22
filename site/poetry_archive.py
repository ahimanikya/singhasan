"""Public poetry archive. Private drafts and originals are never build inputs."""
from pathlib import Path
from html import escape
import json

ROOT = Path(__file__).resolve().parent
ROUTE = 'poetry-archive.html'
TITLE = 'Poetry archive'
PORTRAITS_ROUTE = 'portraits.html'
PORTRAITS_TITLE = 'Portraits'
PORTRAITS_DESCRIPTION = 'Sixteen portraits of Pravakar Satapathy, preserved in their full composition.'
DESCRIPTION = 'Original Odia poems by Pravakar Satapathy, with magazine sources, articles and conversations.'

def poetry_archive_anchors():
    data = json.loads((ROOT / 'poetry-archive/published.json').read_text())
    return ' '.join('archive-' + poem['id'] for poem in data['poems'])


def render_portraits():
    portraits = json.loads((ROOT / 'poetry-archive/portraits.json').read_text())
    figures = ''.join(f'<figure class="portrait-slide"><img src="{escape(p["asset"])}" alt="{escape(p["alt"])}" width="{p["width"]}" height="{p["height"]}" loading="lazy" decoding="async"><figcaption>{escape(p["caption"])}</figcaption></figure>' for p in portraits)
    return '<section class="portrait-gallery" id="portraits" lang="en" aria-labelledby="portraits-heading" aria-roledescription="carousel"><header class="portraits-opening"><p class="portraits-eyebrow">Pravakar Satapathy</p><h1 id="portraits-heading">Portraits</h1><a class="portraits-profile-link" href="author.html">← The poet’s profile</a></header><div class="portrait-controls" hidden><button type="button" data-portrait-prev aria-label="Previous portrait">← Previous</button><button type="button" data-portrait-play>Play slideshow</button><button type="button" data-portrait-next aria-label="Next portrait">Next →</button><span class="portrait-count" aria-live="polite" aria-atomic="true"></span></div><div class="portrait-slides">' + figures + '</div></section>'

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
        poems.append(f'<article id="archive-{escape(poem["id"])}"><h2 lang="or">{escape(poem["title"])}</h2>{source}<details><summary>Read the poem</summary><div class="archive-verse" lang="or">{stanzas}</div></details></article>')
    sources = ''.join(f'<li><span lang="{escape(item.get("lang", "or"))}">{escape(item["title"])}</span> — <a href="{escape(item["url"])}">{escape(item["label"])}</a></li>' for item in data['sources'])
    articles = ''.join(f'<li><span lang="{escape(item.get("lang", "or"))}">{escape(item["title"])}</span> — <a href="{escape(item["url"])}">{escape(item["label"])}</a></li>' for item in data.get('articles', []))
    return '<section class="poetry-archive" id="poetry-archive" lang="en"><header class="poetry-archive-opening"><p class="archive-eyebrow">Pravakar Satapathy</p><h1>Poetry archive</h1><p>Poems by Pravakar Satapathy, preserved in their original Odia. Read the poems and explore the published sources.</p><a class="archive-profile-link" href="author.html">← The poet’s profile</a></header>' + ''.join(poems) + '<h2>From the magazines</h2><p>These poems are preserved in the source issues below. Text editions are being checked against the printed pages.</p><ul>' + sources + '</ul><h2>Articles and conversations</h2><ul>' + articles + '</ul><p>The magazine scans are available through Odia Bibhaba / Srujanika. Some source links may require sign-in.</p></section>'


def render_photo_memories():
    data = json.loads((ROOT / 'poetry-archive/published.json').read_text())
    figures = ''.join(f'<figure><img src="{escape(photo["asset"])}" alt="{escape(photo["alt"])}" width="{int(photo["width"])}" height="{int(photo["height"])}" loading="lazy"><figcaption>{escape(photo["caption"])}</figcaption></figure>' for photo in data.get('photographs', []))
    return '<section class="photo-memories" id="photographs-and-memories" lang="en"><h2>Photographs and memories</h2>' + figures + '</section>' if figures else ''


def render_featured_interview():
    from literary_record import video_preview
    interview = json.loads((ROOT / 'articles/pravakar-satapathy/link-previews.json').read_text())['49']
    return ('<section id="featured-interview" lang="en" aria-labelledby="interview-heading">'
            '<h2 id="interview-heading">The poet in conversation</h2>'
            '<p>Alongside the poems and printed record, this conversation preserves another way of meeting Pravakar Satapathy: through his own voice, expressions and presence. Set aside half an hour to watch him in conversation on <i>Breakfast Odisha</i>.</p>'
            '<h3>Breakfast Odisha · Prameya News7</h3>'
            '<p>Odia interview · 33 minutes 10 seconds · Uploaded 20 November 2017</p>'
            + video_preview(interview) +
            '<p><a href="https://www.youtube.com/watch?v=BIVOoqagq6A">Watch the full interview on YouTube</a></p>'
            '<p><a href="pravakar-satapathy-writings.html#conversations">Explore more interviews and conversations</a></p></section>')
