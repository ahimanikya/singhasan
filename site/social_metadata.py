"""Page-specific sharing metadata, rendered into HTML for link-preview crawlers."""
from pathlib import Path
from html import escape
import json
from artwork import image_asset
from translation_article import ROUTE as ARTICLE_ROUTE, HERO as ARTICLE_HERO, DESCRIPTION as ARTICLE_DESCRIPTION, ALT as ARTICLE_ALT

ROOT=Path(__file__).resolve().parent
PUBLIC_URL='https://singhasan.poemwithoutborders.org'
COVER='assets/covers/singhasan-anek-2026-10-04.png'
PORTRAIT=image_asset('assets/writers/41-earth-voice-v1.png')

def page_image(route):
    if route==ARTICLE_ROUTE:return ARTICLE_HERO
    if route.startswith('poem-'):
        number=int(route.removeprefix('poem-').removesuffix('.html'))
        return image_asset(f'assets/poems/unique/poem-{number:02}.png')
    return {
        'intro.html':image_asset('assets/poems/flute-question.png'),
        'author.html':PORTRAIT,
        'contact.html':PORTRAIT,
        'back-cover.html':image_asset('assets/covers/singhasan-back-cover-v1.png'),
        'contents.html':'assets/footer-earth/throne-v1.webp',
    }.get(route,COVER)

def page_details(route,chapters,illustrations):
    if route==ARTICLE_ROUTE:return ARTICLE_DESCRIPTION,ARTICLE_ALT
    if route.startswith('poem-'):
        n=int(route.removeprefix('poem-').removesuffix('.html'))
        chapter=next(c for c in chapters if c['number']==n)
        opening=next(line.strip() for p in chapter['pages'] for line in p['text'].splitlines() if line.strip())
        return f'{opening} — Poem {n} from Singhasan by Pravakar Satapathy.',illustrations[n]['alt']
    return {
        'author.html':('Meet Pravakar Satapathy, the Odia poet behind Singhasan, and explore his life and writing.','Portrait of Pravakar Satapathy'),
        'contact.html':('Write privately to Pravakar Satapathy’s family about his poetry or to arrange a visit.','Portrait of Pravakar Satapathy'),
        'intro.html':('ସିଂହଦ୍ଵାର — Pravakar Satapathy reflects on poetry, power and the human world in the opening prose of Singhasan.','A flute beside still water, at the threshold of the book'),
        'contents.html':('Browse all sixty-eight poems and the opening prose of Singhasan by Pravakar Satapathy.','A stone throne, the recurring image of Singhasan'),
        'back-cover.html':('Power passes. The earth remembers. The closing cover of Singhasan by Pravakar Satapathy.','The closing landscape of Singhasan'),
        'listen.html':('Listen to the Odia poems of Singhasan by Pravakar Satapathy.','ସିଂହାସନ — ପ୍ରଭାକର ଶତପଥୀ · Singhasan book cover'),
        'read-along.html':('Listen to Singhasan in Odia and follow the words through the book.','ସିଂହାସନ — ପ୍ରଭାକର ଶତପଥୀ · Singhasan book cover'),
    }.get(route,('Singhasan, the first Odia poetry collection by Pravakar Satapathy. Read the illustrated book or switch to Quiet mode.','ସିଂହାସନ — ପ୍ରଭାକର ଶତପଥୀ · Singhasan book cover'))

def sharing_metadata(route,title,chapters,illustrations):
    manifest=json.loads((ROOT/'social-images.json').read_text())
    image=manifest[page_image(route)]
    canonical=PUBLIC_URL+('/' if route=='index.html' else '/'+route)
    description,alt=page_details(route,chapters,illustrations)
    preview=PUBLIC_URL+'/'+image['src']
    tags={'og:type':'article' if route==ARTICLE_ROUTE else 'website','og:site_name':'Singhasan','og:title':title,
          'og:description':description,'og:url':canonical,'og:image':preview,
          'og:image:secure_url':preview,'og:image:type':image['type'],
          'og:image:width':image['width'],'og:image:height':image['height'],'og:image:alt':alt}
    twitter={'twitter:card':'summary_large_image','twitter:title':title,
             'twitter:description':description,'twitter:image':preview,'twitter:image:alt':alt}
    metadata=f'<link rel="canonical" href="{canonical}">'
    for attribute,values in [('property',tags),('name',twitter)]:
        metadata+=''.join(f'<meta {attribute}="{key}" content="{escape(str(value),quote=True)}">' for key,value in values.items())
    return metadata,description
