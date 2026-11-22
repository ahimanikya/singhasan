"""Small, source-generated public discovery records; never export editorial data.

Vocabulary: https://schema.org/Book, /Chapter, /AudioObject, /ItemList.
The optional navigation guide follows the proposal at https://llmstxt.org/.
Neither structured data nor llms.txt promises search indexing or ranking.
"""
import json
import math
import re
from pathlib import PurePosixPath
from urllib.parse import quote

from our_story import ROUTE as STORY_ROUTE
from literary_record import ROUTE as LITERARY_ROUTE
from posts_archive import ROUTE as POSTS_ROUTE
from poetry_archive import ROUTE as POETRY_ROUTE

PUBLIC_URL = 'https://singhasan.kabitawithoutborders.org'
AUTHOR_EN = 'Pravakar Satapathy'
BOOK_ID = PUBLIC_URL + '/#book'
AUTHOR_ID = PUBLIC_URL + '/author.html#author'
CATALOG_ID = PUBLIC_URL + '/listen.html#recordings'


def canonical_url(route):
    return PUBLIC_URL + ('/' if route == 'index.html' else '/' + route)


def chapter_route(chapter):
    number = chapter['number']
    if type(number) is not int or not 0 <= number <= 68:
        raise ValueError('Unexpected book section number')
    return 'intro.html' if number == 0 else f'poem-{number}.html'


def public_routes(chapters):
    """Intentional pages, not a directory scan (ownership files are not pages)."""
    routes = {
        'index.html', 'book.html', 'contents.html', 'author.html',
        'back-cover.html', 'listen.html', 'read-along.html', 'contact.html',
        STORY_ROUTE, LITERARY_ROUTE, POSTS_ROUTE, POETRY_ROUTE,
    }
    routes.update(chapter_route(chapter) for chapter in chapters)
    return tuple(sorted(routes))


def section_id(chapter):
    return canonical_url(chapter_route(chapter)) + '#work'


def recording_id(track):
    return PUBLIC_URL + '/read-along.html?track=' + quote(track['id'], safe='') + '#recording'


def _track_section(track, chapters):
    if track['id'] == 'introduction':
        return next(c for c in chapters if c['number'] == 0)
    if track.get('poem') is not None:
        return next(c for c in chapters if c['number'] == track['poem'])
    if track['id'] not in ('welcome', 'closing'):
        raise ValueError('Unexpected non-poem recording')
    return None


def _track_language(track, chapters):
    return 'or' if _track_section(track, chapters) is not None else 'en'


def _duration(seconds):
    seconds = float(seconds)
    if not math.isfinite(seconds) or seconds <= 0:
        raise ValueError('Recording duration must be positive and finite')
    return 'PT' + f'{seconds:.6f}'.rstrip('0').rstrip('.') + 'S'


def audio_record(track, book):
    """Whitelist descriptive fields; do not serialize private provenance wholesale."""
    section = _track_section(track, book['chapters'])
    asset = PurePosixPath(track['src'])
    if str(asset) != track['src'] or asset.parts[:2] != ('assets', 'audio') or '..' in asset.parts or asset.suffix != '.mp3':
        raise ValueError('Recording must point to a maintained public MP3')
    title = (section['title'] + (' — Poem ' + str(section['number']) if section['number'] else ' — Preface')) if section else track['label']
    record = {
        '@type': 'AudioObject', '@id': recording_id(track),
        'name': book['romanTitle'] + ' · ' + title,
        'url': PUBLIC_URL + '/read-along.html?track=' + quote(track['id'], safe=''),
        'contentUrl': PUBLIC_URL + '/' + str(asset),
        'encodingFormat': 'audio/mpeg', 'duration': _duration(track['duration_seconds']),
        'inLanguage': _track_language(track, book['chapters']),
        'isPartOf': {'@id': canonical_url('listen.html') + '#webpage'},
    }
    if section:
        record['encodesCreativeWork'] = {'@id': section_id(section)}
    else:
        # English bookends introduce/close the edition, not readings of Odia source.
        record['about'] = {'@id': BOOK_ID}
    return record


def chapter_record(chapter, tracks):
    number = chapter['number']
    record = {
        '@type': 'Chapter', '@id': section_id(chapter),
        'name': chapter['title'],
        'alternateName': f'Singhasan — Poem {number}' if number else 'Preface to Singhasan',
        'url': canonical_url(chapter_route(chapter)), 'inLanguage': 'or',
        'position': number + 1, 'genre': 'Poetry' if number else 'Prose',
        'author': {'@id': AUTHOR_ID}, 'isPartOf': {'@id': BOOK_ID},
    }
    selected = next((t for t in tracks if t['id'] == (f'poem-{number}' if number else 'introduction')), None)
    if selected:
        record['encoding'] = {'@id': recording_id(selected)}
    return record


def structured_data(route, title, book, tracks):
    """Page-local graph with stable identities shared across canonical pages."""
    chapters = book['chapters']
    section = next((c for c in chapters if chapter_route(c) == route), None)
    if section is None and route not in {'index.html', 'book.html', 'contents.html', 'author.html', 'back-cover.html', 'listen.html', 'read-along.html'}:
        return None
    person = {
        '@type': 'Person', '@id': AUTHOR_ID, 'name': book['author'],
        'alternateName': AUTHOR_EN, 'url': canonical_url('author.html'),
    }
    work = {
        '@type': 'Book', '@id': BOOK_ID, 'name': book['title'],
        'alternateName': book['romanTitle'], 'url': canonical_url('index.html'),
        'inLanguage': 'or', 'genre': 'Poetry', 'author': {'@id': AUTHOR_ID},
        'description': f'An Odia poetry collection by {AUTHOR_EN}, with opening prose and {sum(c["number"] > 0 for c in chapters)} numbered poems.',
        'subjectOf': {'@id': canonical_url('listen.html') + '#webpage'},
    }
    if route in ('index.html', 'book.html', 'contents.html', 'listen.html'):
        work['hasPart'] = [{'@id': section_id(c)} for c in chapters]
    page = {
        '@type': 'CollectionPage' if route in ('listen.html', 'contents.html') else 'WebPage',
        '@id': canonical_url(route) + '#webpage', 'url': canonical_url(route), 'name': title,
        'mainEntity': {'@id': section_id(section) if section else (AUTHOR_ID if route == 'author.html' else BOOK_ID)},
    }
    graph = [person, work, page]
    if section:
        graph.append(chapter_record(section, tracks))
        selected = next((t for t in tracks if t['id'] == (f'poem-{section["number"]}' if section['number'] else 'introduction')), None)
        if selected:
            graph.append(audio_record(selected, book))
    elif route in ('contents.html', 'listen.html'):
        graph.extend(chapter_record(c, tracks) for c in chapters)
    if route == 'listen.html':
        page['mainEntity'] = {'@id': CATALOG_ID}
        graph.append({
            '@type': 'ItemList', '@id': CATALOG_ID, 'name': book['romanTitle'] + ' recordings',
            'numberOfItems': len(tracks), 'itemListOrder': 'https://schema.org/ItemListOrderAscending',
            'itemListElement': [{'@type': 'ListItem', 'position': i, 'item': {'@id': recording_id(t)}} for i, t in enumerate(tracks, 1)],
        })
        graph.extend(audio_record(t, book) for t in tracks)
    return {'@context': 'https://schema.org', '@graph': graph}


def structured_markup(route, title, book, tracks):
    data = structured_data(route, title, book, tracks)
    if data is None:
        return ''
    # Escape script terminators without HTML-escaping JSON string content.
    payload = json.dumps(data, ensure_ascii=False, separators=(',', ':')).replace('<', '\\u003c').replace('>', '\\u003e').replace('&', '\\u0026')
    return '<script type="application/ld+json">' + payload + '</script>'


def llms_text(book, tracks, reading_copies=None, languages=None):
    """Navigation, names and inventory counts, never a second full-book export."""
    chapters = book['chapters']
    poems = [c for c in chapters if c['number'] > 0]
    introduction = next(c for c in chapters if c['number'] == 0)
    odia = sum(_track_language(t, chapters) == 'or' for t in tracks)
    english = len(tracks) - odia
    rows = [
        f'# {book["title"]} — {book["romanTitle"]}', '',
        f'> {book["title"]} ({book["romanTitle"]}), an Odia poetry collection by {book["author"]} ({AUTHOR_EN}).', '',
        f'The original book has opening prose and {len(poems)} numbered poems. The listening edition has {len(tracks)} recordings: {odia} in Odia (the preface and poems) and {english} English bookends (welcome and closing).',
        'The canonical section pages below contain the original Odia text in their initial HTML. The listening page contains direct MP3 links and structured recording metadata. English navigation labels are not poem translations.', '',
        '## Book and poet', '',
        f'- [{book["title"]} — {book["romanTitle"]}]({canonical_url("index.html")}): Book home.',
        f'- [{introduction["title"]} — Preface]({canonical_url("intro.html")}): Opening prose.',
        f'- [Poems]({canonical_url("contents.html")}): The complete numbered collection.',
        f'- [{book["author"]} — {AUTHOR_EN}]({canonical_url("author.html")}): The poet.',
        f'- [Poetry archive]({canonical_url(POETRY_ROUTE)}): Other original Odia poems and publication sources, separate from the numbered Singhasan collection.',
        f'- [Listen]({canonical_url("listen.html")}): All {len(tracks)} recordings, including the Odia preface and {len(poems)} poems, with English welcome and closing.',
        f'- [Listen and follow]({canonical_url("read-along.html")}): The enhanced listening reader.', '',
        '## Poems', '',
    ]
    rows.extend(f'- [{c["title"]} — Poem {c["number"]}]({canonical_url(chapter_route(c))})' for c in poems)
    if reading_copies:
        rows.extend(['', '## Published translations', ''])
        for code in reading_copies:
            label=languages[code]['name']
            native=languages[code]['native']
            rows.append(f'- [{native} — {label}]({PUBLIC_URL}/readings/{code}.md): Published translation sections, in source order, with links to the reading pages.')
    return '\n'.join(rows) + '\n'


READING_MARKER = '<!-- singhasan-published-reading: {code} -->'


def translation_readings(book, languages, translations):
    """Export only variants already selected by load_translations for the reader."""
    copies = {}
    for code, language in languages.items():
        if code == 'or':
            continue
        if not re.fullmatch(r'[a-z]{2,3}(?:-[A-Za-z0-9]+)*', code):
            raise ValueError('Invalid reading language code')
        selected = [(c, translations.get(c['number'], {}).get(code)) for c in book['chapters']]
        selected = [(c, entry) for c, entry in selected if entry is not None]
        if not selected:
            continue
        rows = [READING_MARKER.format(code=code),
                f'# {book["romanTitle"]} — {language["native"]} ({language["name"]})', '',
                f'By {AUTHOR_EN} · {book["author"]}', '',
                'Published translation reading copy. Original Odia and the interactive language selection are available on each linked page.', '']
        for chapter, entry in selected:
            rows.extend([f'## {entry["title"]}', '',
                         f'[Read on site]({canonical_url(chapter_route(chapter))}?lang={quote(code, safe="")})', ''])
            for stanza in entry['stanzas']:
                # Markdown hard breaks retain verse lines; blank lines retain stanzas.
                rows.append('\\\n'.join(stanza))
                rows.append('')
        copies[code] = '\n'.join(rows)
    return copies


def write_translation_readings(destination, copies):
    """Own only marked generated files; remove withdrawn exports, never neighbours."""
    destination.mkdir(parents=True, exist_ok=True)
    for file in destination.glob('*.md'):
        first_line = file.read_text(encoding='utf-8').split('\n', 1)[0]
        marker = READING_MARKER.format(code=file.stem)
        if first_line == marker and file.stem not in copies:
            file.unlink()
    for code, text in copies.items():
        target = destination / (code + '.md')
        if target.exists() and target.read_text(encoding='utf-8').split('\n', 1)[0] != READING_MARKER.format(code=code):
            raise ValueError(f'Refusing to replace an unrelated reading file: {target.name}')
        target.write_text(text, encoding='utf-8')
