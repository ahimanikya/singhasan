"""The two public language editions of the Singhasan literary review."""
from html import escape
from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parent
SOURCE = ROOT / 'articles/free-life-review'
ROUTES = {'or': 'review-free-life-odia.html', 'en': 'review-free-life-english.html'}
DESCRIPTIONS = {
    'or': 'ପ୍ରଭାକର ଶତପଥୀଙ୍କ ସିଂହାସନ: ମୁକ୍ତ ଜୀବନର ଇସ୍ତାହାର — କ୍ଷମତା, କବିତା ଓ ମାନବୀୟ ମର୍ଯ୍ୟାଦାର ସମୀକ୍ଷା।',
    'en': 'A Manifesto for a Free Life: a literary review of Pravakar Satapathy’s Singhasan, exploring power, poetry and human dignity.',
}


def source_blocks(language):
    filename = 'odia.txt' if language == 'or' else 'english.txt'
    return re.split(r'\n\s*\n', (SOURCE / filename).read_text(encoding='utf-8').strip())


def language_links(language=None):
    links = []
    for code, label in [('or', 'ଓଡ଼ିଆ'), ('en', 'English')]:
        current = ' aria-current="page"' if code == language else ''
        links.append(f'<a href="{ROUTES[code]}" lang="{code}" hreflang="{code}"{current}>{label}</a>')
    return '<nav class="review-languages" aria-label="Article language" lang="en">' + ''.join(links) + '</nav>'


def render_review(language):
    blocks = source_blocks(language)
    title = ' '.join(blocks[0].splitlines())
    metadata = json.loads((SOURCE / 'metadata.json').read_text(encoding='utf-8'))
    author = metadata.get('author', {}).get(language)
    author_url = metadata.get('author_url')
    author_name = escape(author) if author else ''
    if author_name and author_url:
        author_name = f'<a href="{escape(author_url, quote=True)}" rel="author">{author_name}</a>'
    author_language = escape(metadata.get('author_language', language), quote=True)
    byline = f'<p class="review-byline" lang="{author_language}">{author_name}</p>' if author else ''
    body = []
    for block in blocks[1:]:
        if block in ('Translation note', 'Translation notes', 'ଟୀକା'):
            body.append(f'<h2 class="review-notes-title">{escape(block)}</h2>')
        elif re.match(r'^\[\d+\]', block):
            number = re.match(r'^\[(\d+)\]', block)[1]
            body.append(f'<p class="review-note" id="note-{number}">{escape(block)}</p>')
        elif '\n' in block:
            body.append('<blockquote class="review-verse"><p>' + '<br>'.join(escape(line) for line in block.splitlines()) + '</p></blockquote>')
        else:
            text = escape(block)
            text = re.sub(r'\[(\d+)\]', r'<sup><a href="#note-\1" aria-label="Note \1">[\1]</a></sup>', text)
            body.append('<p>' + text + '</p>')
    category = 'ସମୀକ୍ଷା' if language == 'or' else 'Review'
    home = 'ମୂଳପୃଷ୍ଠା' if language == 'or' else 'Back to the book'
    html = f'''<article class="literary-review" lang="{language}" aria-labelledby="review-title">
<header class="review-opening"><p class="review-category">{category}</p><h1 id="review-title">{escape(title)}</h1>{byline}{language_links(language)}</header>
<div class="review-body">{''.join(body)}</div>
<footer class="review-ending">{language_links(language)}<a class="review-home" href="index.html">{home}</a></footer>
</article>'''
    return title, html


def render_review_feature():
    return f'''<section class="home-review" aria-labelledby="home-review-title" lang="en"><p class="review-category">Review</p><h2 id="home-review-title">A Manifesto for a Free Life</h2><p>A reading of <i>Singhasan</i> through power, poetry and human dignity.</p>{language_links()}</section>'''
