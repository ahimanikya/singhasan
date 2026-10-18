"""Publish the reviewed literary record without private research dependencies."""
from pathlib import Path
from html import escape
from urllib.parse import urlsplit
import json
import re
import shutil

ROOT = Path(__file__).resolve().parent
SOURCE = ROOT / 'articles/pravakar-satapathy'
ROUTE = 'pravakar-satapathy-writings.html'
TITLE = 'Pravakar Satapathy · Writings & conversations'
DESCRIPTION = 'Explore Pravakar Satapathy’s books, poems, interviews and literary life, with a source-linked catalogue and notes on work still to be traced.'


def source_card(item):
    """A factual link preview; never embed arbitrary external pages or their HTML."""
    url = item['url']
    assert urlsplit(url).scheme == 'https'
    if item.get('image'):
        visual = (f'<img src="{escape(item["image"], quote=True)}" width="{item["width"]}" '
                  f'height="{item["height"]}" alt="{escape(item["image_alt"], quote=True)}" loading="lazy" decoding="async">')
    else:
        visual = '<svg viewBox="0 0 40 48" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M7 2h18l8 9v35H7zM25 2v10h8M13 21h14M13 28h14M13 35h9"/></svg>'
    credit = f'<span class="lit-source-provider">{escape(item["image_credit"])}</span>' if item.get('image_credit') else ''
    return (f'<a class="lit-source-card" href="{escape(url, quote=True)}" target="_blank" rel="noopener noreferrer">'
            f'<span class="lit-source-visual">{visual}</span><span class="lit-source-copy">'
            f'<span class="lit-source-provider">{escape(item["provider"])} · {escape(item["kind"])}</span>'
            f'<strong>{escape(item["title"])}</strong><span>{escape(item["description"])}</span>'
            f'{credit}<span class="lit-source-action">Open source <span aria-hidden="true">↗</span><span class="sr-only"> (opens a new tab)</span></span></span></a>')


def video_preview(item):
    video_id = item['video_id']
    assert re.fullmatch(r'[A-Za-z0-9_-]{11}', video_id)
    return (f'<div class="lit-video" data-video="{video_id}" data-title="{escape(item["title"], quote=True)}">'
            f'<a class="lit-video-poster" href="{escape(item["url"], quote=True)}" aria-label="Play {escape(item["title"], quote=True)}">'
            f'<img src="{escape(item["image"], quote=True)}" width="{item["width"]}" height="{item["height"]}" alt="{escape(item["image_alt"], quote=True)}" loading="lazy" decoding="async">'
            '<span class="lit-video-play" aria-hidden="true">▶</span>'
            '<span class="lit-video-label">Watch video · YouTube</span></a></div>')


def add_previews(body, previews):
    def reference(match):
        number, original = match.groups()
        item = previews.get(number)
        if not item:
            return match[0]
        return (f'<li id="reference-{number}">{original}<details class="lit-link-preview">'
                f'<summary aria-label="Preview source {number}">Preview source</summary>{source_card(item)}</details></li>')
    body = re.sub(r'<li id="reference-(\d+)">(.*?)</li>', reference, body, flags=re.S)
    def recording(match):
        block = match[0]
        for number in ('49', '50', '51'):
            item = previews[number]
            if escape(item['url'], quote=True) in block:
                return block.replace('</h3>', '</h3>' + video_preview(item), 1)
        return block
    body = re.sub(r'<article class="lit-recording">.*?</article>', recording, body, flags=re.S)
    # The anthology is the one external reading link in the main narrative.
    body = re.sub(r'<a class="lit-text-link" href="https://www.oocities.org/varnamala/prabhakar.html">.*?</a>', source_card(previews['43']), body)
    return body


def render_literary_record():
    assets = ROOT / 'dist/assets'
    for extension in ('css', 'js'):
        shutil.copyfile(SOURCE / f'article.{extension}', assets / f'pravakar-satapathy.{extension}')
    for cover in json.loads((SOURCE / 'covers.json').read_text()):
        for item in (cover, cover.get('back_cover')):
            if item:
                relative = Path(item['asset']).relative_to('assets')
                target = assets / 'pravakar-satapathy' / relative
                target.parent.mkdir(parents=True, exist_ok=True)
                shutil.copyfile(SOURCE / item['asset'], target)
    previews = json.loads((SOURCE / 'link-previews.json').read_text())
    for item in previews.values():
        if item.get('image'):
            relative = Path(item['image']).relative_to('assets/pravakar-satapathy')
            target = assets / 'pravakar-satapathy' / relative
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(SOURCE / 'assets' / relative, target)
    return add_previews((SOURCE / 'body.html').read_text(), previews)
