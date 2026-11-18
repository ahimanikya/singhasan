"""Public, confirmed profile posts; private evidence stays outside build inputs."""
from datetime import date
from html import escape as e
from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parent
ROUTE = 'posts-archive.html'
TITLE = 'Posts archive'
DESCRIPTION = 'Poems, portraits, recordings and literary memories shared by Pravakar Satapathy, preserved with their original captions.'
PROFILE_URL = 'https://www.facebook.com/pravakar72/'


def asset(value):
    """Only deliberately maintained local media can enter this public archive."""
    value = str(value)
    if not value.startswith('assets/') or '..' in value.split('/') or '\\' in value:
        raise ValueError(f'Archive media must be a maintained local asset: {value}')
    if not (ROOT / 'dist' / value).is_file():
        raise ValueError(f'Archive media missing: {value}')
    return e(value, quote=True)


def render_media(item, first=False):
    src = asset(item['src'])
    width, height = int(item['width']), int(item['height'])
    if width <= 0 or height <= 0:
        raise ValueError('Archive media dimensions must be positive')
    label = e(item['alt'], quote=True)
    dimensions = f'width="{width}" height="{height}"'
    if item['type'] == 'image':
        loading = 'loading="eager" fetchpriority="high"' if first else 'loading="lazy"'
        body = f'<a class="post-image-link" href="{src}" aria-label="View full image: {label}"><img src="{src}" {dimensions} alt="{label}" {loading} decoding="async"></a>'
    elif item['type'] == 'video':
        poster = f' poster="{asset(item["poster"])}"' if item.get('poster') else ''
        track = f'<track kind="captions" src="{asset(item["captions_src"])}" srclang="or" label="Odia">' if item.get('captions_src') else ''
        body = f'<video controls playsinline preload="none" {dimensions}{poster} aria-label="{label}"><source src="{src}" type="video/mp4">{track}<a href="{src}">Open video</a></video>'
        body += f'<a class="post-media-link" href="{src}">Open video file</a>'
    else:
        raise ValueError('Unknown archive media type')
    caption = f'<figcaption>{e(item["caption"])}</figcaption>' if item.get('caption') else ''
    transcript = ''
    if item.get('transcript'):
        transcript = f'<details class="post-transcript"><summary>Read the spoken words</summary><p lang="or">{e(item["transcript"])}</p></details>'
    return f'<figure class="post-media">{body}{caption}{transcript}</figure>'


def render_posts_archive():
    data = json.loads((ROOT / 'data/profile-posts.json').read_text())
    posts = [p for p in data['posts'] if p.get('status') == 'published_verified']
    posts.sort(key=lambda p: p['date'], reverse=True)
    seen = set()
    cards = []
    for number, post in enumerate(posts):
        key = post['id']
        if not re.fullmatch(r'[a-z0-9][a-z0-9-]*', key) or key in seen:
            raise ValueError(f'Invalid or duplicate archive ID: {key}')
        seen.add(key)
        published = date.fromisoformat(post['date'])
        date_label = f'{published.day} {published.strftime("%B %Y")}'
        title = e(post['title'])
        media = ''.join(render_media(m, first=number == 0 and i == 0) for i, m in enumerate(post.get('media', [])))
        summary = f'<p class="post-summary">{e(post["summary"])}</p>' if post.get('summary') else ''
        caption = ''
        if post.get('caption'):
            language = e(post.get('caption_lang', 'or'), quote=True)
            caption = f'<div class="post-caption" lang="{language}">{e(post["caption"])}</div>'
        link = ''
        if post.get('post_url'):
            url = post['post_url']
            if not url.startswith(('https://www.facebook.com/', 'https://facebook.com/')):
                raise ValueError('Archive original-post links must use Facebook HTTPS URLs')
            link = f'<a class="post-original" href="{e(url, quote=True)}">View original post on Facebook</a>'
        cards.append(f'<li><article class="profile-post" id="{key}" aria-labelledby="{key}-title"><header><p class="post-date"><time datetime="{published.isoformat()}">{date_label}</time></p><h2 id="{key}-title" lang="{e(post.get("title_lang", "or"), quote=True)}">{title}</h2></header>{summary}<div class="post-media-grid">{media}</div>{caption}{link}</article></li>')
    content = '<ol class="posts-list">'+''.join(cards)+'</ol>' if cards else '<p class="posts-empty">The first posts are being gathered for this archive.</p>'
    return f'''<section class="posts-archive" aria-labelledby="posts-title"><header class="posts-opening"><p class="posts-eyebrow">Pravakar Satapathy</p><h1 id="posts-title">Posts archive</h1><p>Poems, portraits, recordings and literary memories shared along the way.</p><nav class="posts-links" aria-label="Poet and profile"><a href="author.html">← The poet’s profile</a><a href="{PROFILE_URL}">His Facebook profile</a></nav><p class="posts-intro-note">Dates here mark when posts were shared, rather than when a poem was written or first published. Some original posts may require a Facebook login.</p></header>{content}</section>'''
