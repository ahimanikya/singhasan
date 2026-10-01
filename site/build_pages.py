"""Singhasan: standalone reading pages using Kabita Live's approved edition style."""
from pathlib import Path
from html import escape as e
import json,re,hashlib
from translation_data import load_translations
from homepage import render_home
ROOT=Path(__file__).resolve().parent
DIST=ROOT/'dist'
book=json.loads((DIST/'book.js').read_text().removeprefix('window.BOOK = ').strip().removesuffix(';'))
chapters=book['chapters']
languages=json.loads((ROOT/'languages.json').read_text())
translations=load_translations(ROOT/'translations',languages)
art=json.loads((ROOT/'poem-art.json').read_text())
unique_art={s['number']:s for s in json.loads((ROOT/'illustrations.json').read_text())}
def path(c):return 'intro.html' if not c['number'] else f"poem-{c['number']}.html"
def icon(name):
    svg=(DIST/f'assets/icons/{name}.svg').read_text()
    svg=re.sub(r' role="img"| aria-label="[^"]*"','',svg)
    return svg.replace('<svg ','<svg aria-hidden="true" focusable="false" ',1)
def cover_face(side):
    return (ROOT/f'templates/cover-{side}.html').read_text()
def cover_templates():
    return ''.join(f'<template id="book-cover-{side}">{cover_face(side)}</template>' for side in ('front','back'))
def reading_data(c):
    stanzas=[]
    for page in c['pages']:
        for block in re.split(r'\n\s*\n',page['text']):
            stanzas.append([block.replace('\n',' ')] if c['kind']=='prose' else block.split('\n'))
    variants={'or':{'label':'ଓଡ଼ିଆ','title':c['title'],'kind':'Odia','stanzas':stanzas},**translations.get(c['number'],{})}
    return {'languages':languages,'id':c['number'],'kind':c['kind'],'author':book['author'],'route':path(c),'source_language':'or','variants':variants}
def encoded(data):return json.dumps(data,ensure_ascii=False).replace('<','\\u003c')
readers=[reading_data(c) for c in chapters]
(DIST/'assets/reading-book.json').write_text(encoded({'label':'ସିଂହାସନ','poems':readers}))
def first_line(c):
    if not c['number']:return c['title']
    return next(line.strip() for page in c['pages'] for line in page['text'].splitlines() if line.strip())
def book_page(c):return c['number']+1
def excerpt(c,limit=3):
    lines=[line for stanza in reading_data(c)['variants']['or']['stanzas'] for line in stanza if line.strip() and line.strip()!='∎']
    if not c['number']:
        text=lines[0];end=text.find('।',text.find('।')+1)+1
        return e(text[:end])
    return '<br>'.join(e(line) for line in lines[:limit])
def book_panel(c):
    position=chapters.index(c)
    start=max(0,min(position-2,len(chapters)-5))
    rows=[]
    for item in chapters[start:start+5]:
        current=' aria-current="page"' if item['number']==c['number'] else ''
        rows.append(f'<li><a href="{path(item)}"{current}><span class="toc-number"><span class="sr-only">Page </span>{book_page(item):02}</span><span class="toc-title" lang="or">{e(first_line(item))}</span></a></li>')
    return '<section class="book-glance"><nav aria-labelledby="book-glance-heading" lang="en"><h2 id="book-glance-heading">In the book</h2><ol>'+''.join(rows)+'</ol><a class="toc-all" href="contents.html">All poems in the book</a></nav></section>'

def nearby(c):
    current=c['number']
    if current:
        illustration=unique_art[current];image_src=f'assets/poems/unique/poem-{current:02}.png'
        title=illustration['title'];narrative=illustration['narrative'];alt=illustration['alt']
    else:
        illustration=art['0'];image_src='assets/poems/'+illustration['id']+'.png';alt=illustration['alt']
        title='At the threshold';narrative='The introduction opens a conversation about poetry itself: its freedom, its inward life, and its capacity to hold the human world. A flute beside still water offers a quiet threshold before the journey through power and history begins.'
    return f'<aside class="book-companion"><figure class="poem-art"><img src="{image_src}" width="1536" height="1024" alt="{e(alt)}" loading="eager"><figcaption lang="en">{e(title)}</figcaption></figure><div class="illustration-reading"><p class="eyebrow" lang="en">Image story</p><h2 lang="en">{e(title)}</h2><p class="image-narrative" lang="en">{e(narrative)}</p><blockquote lang="or">{excerpt(c)}</blockquote><span class="image-page-ornament" aria-hidden="true">{icon("talapatra")}</span></div>{book_panel(c)}</aside>'

def reader_toolkit(c):
    tabs=''
    for code in reading_data(c)['variants']:
        choice='original' if code=='or' else code
        tabs+=f'<button type="button" role="tab" id="tab-{choice}" data-reading-language="{choice}" aria-selected="{str(code=="or").lower()}" tabindex="{0 if code=="or" else -1}" aria-controls="reading-panel">{e(languages[code]["name"])}</button>' 
    choices=''.join(f'<button type="button" data-size="{size}" aria-pressed="{str(size==24).lower()}" aria-label="{label} text size">{label}</button>' for size,label in [(24,'Standard'),(28,'Large'),(32,'Extra large')])
    return f'''<div class="poem-actions" role="group" aria-label="Reading actions"><button id="page-bookmarks-button" type="button" aria-label="Reader tools" aria-expanded="false" aria-controls="page-bookmarks"><span class="reader-aa" aria-hidden="true">Aa</span><span class="sr-only">Reader tools</span></button><button id="open-share" type="button">{icon("share")}<span>Share</span></button><button id="open-focus" type="button">{icon('read')}<span>Read quietly</span></button></div>
<section id="page-bookmarks" aria-label="Reader tools" hidden lang="en"><div class="page-tools-head"><strong>Reader tools</strong><button id="page-bookmarks-close" type="button" aria-label="Close reader tools">×</button></div><div class="reading-tabs" role="tablist" aria-label="Reading language">{tabs}</div><div class="reader-tools"><div class="size-group" role="group" aria-label="Text size">{choices}</div></div><button id="page-save-place" type="button">Bookmark this section</button><details id="page-saved-details"><summary>Saved places &amp; passages</summary><div id="page-saved-list"></div><div class="mark-tools"><button type="button" id="clear-marks" class="clear-marks" hidden>Clear underlines</button></div></details><a class="toolkit-contents" href="contents.html">Contents</a><p class="page-tools-tip">Select words to underline them. Saved on this device.</p><span id="page-saved-status" class="sr-only" role="status"></span></section>'''
def enhanced_body(c):
    data=reading_data(c);stanzas=[]
    for stanza in data['variants']['or']['stanzas']:
        stanzas.append('<p class="stanza">'+'<br>'.join(e(line) for line in stanza)+'</p>')
    return '<div id="chapter-body" class="'+c['kind']+'"><div id="reading-panel" role="region" aria-label="Book text" tabindex="0"><div id="experience-verse" class="verse or '+c['kind']+'" lang="or">'+''.join(stanzas)+'</div></div></div><div id="selection-tools" class="selection-tools" role="toolbar" aria-label="Selected text" hidden lang="en"><button id="underline-selection" type="button">Underline selection</button><button id="erase-selection" type="button">Erase</button><button id="dismiss-selection" type="button" aria-label="Dismiss selection">×</button></div>'

def shell(title,body,kind='edition'):
    extras='<link rel="stylesheet" href="assets/poem-reader.css"><link rel="stylesheet" href="assets/poem-experience.css"><link rel="stylesheet" href="assets/book-reader.css"><script src="assets/book-share.js" defer></script><script type="module" src="assets/poem-reader.js"></script><script type="module" src="assets/poem-experience.js"></script><script type="module" src="assets/book-pagination.js"></script>' if kind.startswith('reading-page') else ''
    html=f'''<!doctype html>
<html lang="or"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="index,follow"><meta name="description" content="ସିଂହାସନ · ପ୍ରଭାକର ଶତପଥୀ · An Odia reading edition."><title>{e(title)} · ସିଂହାସନ</title><link rel="icon" href="assets/icons/read.svg" type="image/svg+xml"><link rel="stylesheet" href="style.css"><link rel="stylesheet" href="assets/book-layout.css"><script src="reader.js" defer></script>{extras}<link rel="stylesheet" href="assets/script-fonts.css"><link rel="stylesheet" href="assets/book-polish.css"><link rel="stylesheet" href="assets/book-volume.css"><link rel="stylesheet" href="assets/book-covers.css"><link rel="stylesheet" href="assets/kabita-foundations.css"><link rel="stylesheet" href="assets/book-pages.css"><link rel="stylesheet" href="assets/book-pagination.css"><link rel="stylesheet" href="assets/rich-edition.css"><link rel="stylesheet" href="assets/standalone-poem.css"><script src="assets/book-ui.js" defer></script></head>
<body class="journal-paper {kind}"><script src="assets/appearance.js"></script><script src="assets/reading-mode.js"></script><a class="skip" href="#reading">Skip to reading</a>
<header class="wrap masthead"><a class="brand" href="index.html" lang="en">Singhasan<span lang="or">ସିଂହାସନ</span></a><div class="header-controls"><button type="button" class="theme-toggle" data-theme-toggle hidden><span class="appearance-label sr-only">Theme: System</span><svg class="theme-system" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8m-4-4v4"/></svg><svg class="theme-light" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 1v3m0 16v3M1 12h3m16 0h3M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2"/></svg><span class="theme-dark" aria-hidden="true">{icon('night')}</span></button><button id="menu-toggle" type="button" aria-label="Open navigation" aria-expanded="false" aria-controls="book-menu-drawer" aria-haspopup="dialog"><span class="menu-open-icon">{icon('menu')}</span><span class="menu-close-icon">{icon('close')}</span></button></div><nav id="book-navigation" class="nav" aria-label="Book navigation" lang="en"><a href="index.html">Home</a><a href="book.html">The book</a><a href="intro.html?focus=1">Quiet reading</a><a href="author.html">The poet</a><a href="contents.html">Contents</a></nav><dialog id="book-menu-drawer" class="book-menu-drawer" aria-labelledby="book-menu-heading"><div class="book-menu-heading"><p id="book-menu-heading" lang="en">Within the book</p><button id="book-menu-close" type="button" aria-label="Close navigation">{icon("close")}</button></div><div id="book-menu-slot"></div><a class="drawer-back-cover" href="back-cover.html" lang="en">Back cover</a></dialog></header>
<div class="wrap header-rule" aria-hidden="true">{icon('header-separator')}</div>
<main id="reading" class="wrap" tabindex="-1">{body}</main>
<div class="wrap footer-landscape" aria-hidden="true">{icon('boita')}</div><footer class="wrap footer"><p lang="or">ସିଂହାସନ · ପ୍ରଭାକର ଶତପଥୀ</p><nav aria-label="Footer" lang="en"><a href="author.html" aria-label="The poet">{icon('footer-story')}<span>The poet</span></a><a href="contents.html" aria-label="Contents">{icon('read')}<span>Contents</span></a></nav></footer></body></html>'''
    def version_asset(match):
        digest=hashlib.sha256((DIST/match[2]).read_bytes()).hexdigest()[:10]
        return match[1]+match[2]+'?v='+digest+match[3]
    return re.sub(r'((?:src|href)=")((?:assets/)?[^"?#]+\.(?:css|js))(")',version_asset,html)
for i,c in enumerate(chapters):
    count=f'Poem {c["number"]:02} of 68' if c['number'] else 'Introduction'
    prev=path(chapters[i-1]) if i else 'index.html'
    next_page=path(chapters[i+1]) if i<len(chapters)-1 else 'back-cover.html'
    prev_label='Introduction' if i==1 else ('The book' if i==0 else 'Previous poem')
    next_label='First poem' if i==0 else ('All poems' if i==len(chapters)-1 else 'Next poem')
    previous_link=f'<a href="{prev}" aria-label="Previous: {e(chapters[i-1]["title"])}"><span class="previous-arrow">{icon('next-poetic')}</span><span>Previous page</span></a>' if i else f'<a href="book.html" aria-label="Front cover"><span class="previous-arrow">{icon("next-poetic")}</span><span>Front cover</span></a>'
    next_link=f'<a href="{next_page}" aria-label="Next: {e(chapters[i+1]["title"])}"><span>Next page</span>{icon('next-poetic')}</a>' if i<len(chapters)-1 else f'<a href="back-cover.html" aria-label="Back cover"><span>Back cover</span>{icon("next-poetic")}</a>'
    body=f'''<article class="book-poem printed-spread">
<div class="book-running-head"><a href="{path(c)}" lang="en">← {"Poem page" if c["number"] else "Introduction"}</a><a href="author.html" lang="or">ପ୍ରଭାକର ଶତପଥୀ</a></div>
<header class="chapter-header poem-heading"><p class="reader-meta" lang="en">{count}</p><h1 id="chapter-title">{e(c['title'])}</h1><p class="byline" lang="or"><a href="author.html"><img src="assets/writers/41-earth-voice-v1.png" width="52" height="52" alt=""><span>ପ୍ରଭାକର ଶତପଥୀ</span></a></p>{reader_toolkit(c)}<nav class="poem-reading-options" aria-label="Reading edition" lang="en"><a class="read-in-book" href="{path(c)}?view=book">{icon("read")}Read in the book</a></nav></header>
<div class="reader">{enhanced_body(c)}</div>{nearby(c)}
<div class="book-reading-end"><p class="book-folio" lang="en"><span class="sr-only">Page </span>{book_page(c):02}</p><div class="poem-ending" aria-hidden="true">{icon('paddy')}</div>
<nav class="page-nav" aria-label="Reading navigation" lang="en">{previous_link}<a class="back-contents" href="contents.html">Contents</a>{next_link}</nav><nav class="leaf-nav" aria-label="Page navigation" lang="en" hidden><button id="leaf-prev" type="button" aria-label="Previous page"><span class="previous-arrow">{icon('next-poetic')}</span></button><div><span id="leaf-progress" role="status" aria-live="polite"></span><a href="contents.html">Contents</a></div><button id="leaf-next" type="button" aria-label="Next page">{icon('next-poetic')}</button></nav></div></article>
<dialog id="book-share" aria-labelledby="share-heading" lang="en"><form method="dialog"><h2 id="share-heading">Share this poem</h2><button class="share-close" aria-label="Close sharing">×</button></form><div class="share-card"><p class="share-book" lang="or">ସିଂହାସନ</p><p class="share-title" lang="or">{e(c['title'])}</p><p class="share-verse" lang="or"></p><p class="share-author" lang="or">ପ୍ରଭାକର ଶତପଥୀ</p><span class="share-ornament" aria-hidden="true">{icon('paddy')}</span></div><label for="share-url">Page link</label><input id="share-url" readonly><div class="share-options"><button id="native-book-share" type="button" hidden>Share…</button><button id="copy-book-link" type="button">Copy link</button><button id="copy-book-caption" type="button">Copy text &amp; link</button><a id="share-whatsapp" target="_blank" rel="noopener noreferrer">WhatsApp<span class="sr-only"> (opens a new tab)</span></a><a id="share-facebook" target="_blank" rel="noopener noreferrer">Facebook<span class="sr-only"> (opens a new tab)</span></a></div><p id="share-status" role="status"></p></dialog>'''
    body+='<script type="application/json" id="reading-data">'+encoded(reading_data(c))+'</script><script type="application/json" id="focus-edition-data">'+encoded({'url':'assets/reading-book.json'})+'</script>'+(ROOT/'templates/quiet-reader.html').read_text()+cover_templates()
    (DIST/path(c)).write_text(shell(c['title'],body,'reading-page standalone-page '+('earth-wash' if c['number']%2 else 'monsoon-wash')))
rows=[]
for c in chapters:
    detail='<span class="contents-kind" lang="en">Introduction</span>' if not c['number'] else ''
    rows.append(f'''<li><a href="{path(c)}" aria-label="{e(c['title'])}, page {book_page(c)}"><span class="contents-title" lang="or">{e(first_line(c))}{detail}</span><span class="contents-leader" aria-hidden="true"></span><span class="contents-page" lang="en">{book_page(c):02}</span></a></li>''')
contents_body=f'<section class="book-contents" aria-labelledby="edition-poems"><div class="contents-heading"><div><p class="eyebrow" lang="en">The complete book</p><h1 id="edition-poems" tabindex="-1" lang="en">Contents</h1></div></div><ol class="book-index">{"".join(rows)}</ol></section>'
(DIST/'contents.html').write_text(shell('Contents',contents_body,'contents-page'))
(DIST/'index.html').write_text(shell('Singhasan',render_home(chapters,unique_art,icon,excerpt,cover_face),'home-page'))
front_body=f'<section class="book-cover-route"><figure class="bound-cover bound-front">{cover_face("front")}</figure><nav aria-label="Book covers" lang="en"><a href="index.html">← Home</a><a class="open-volume" href="intro.html?view=book">Open the book →</a></nav></section>'
(DIST/'book.html').write_text(shell('The illustrated book',front_body,'cover-edition'))
print('Built book contents, introduction, and 68 poem pages.')

# Book-specific biography; research provenance is kept with the editorial files.
author_body=f'''<article class="author-profile"><div class="author-opening"><div><h1 lang="or">ପ୍ରଭାକର ଶତପଥୀ</h1><p class="author-roman" lang="en">Pravakar Satapathy</p><div class="author-biography" lang="en"><p>Pravakar Satapathy is an Odia poet and editor associated with Jajpur. <i>Singhasan</i> is his first book, written during a period when he was active in politics. Its poems draw connections between political life, myth, history and the experience of ordinary people. His literary work spans poetry, magazine editing, and writing about the place of little magazines in literary culture. He previously edited <i>Anisha</i>, participating in the world of small literary publications in which poems, ideas, and new voices find their readers.</p><p>His poetry has appeared in <i>Viswamukti</i>, including issues published in 1996 and 1999. His books include the collections <i>Singhasan</i> and <i>Sabuthi Kabita</i>, alongside <i>Sahityare Biplaba O Little Magazine</i>, published in 2014. Together, these works reflect a sustained engagement with both the making of poetry and the spaces that allow literature to circulate.</p></div></div><figure class="author-portrait"><img src="assets/writers/41-earth-voice-v1.png" width="1086" height="1448" alt="Portrait of ପ୍ରଭାକର ଶତପଥୀ"><span class="portrait-ornament" aria-hidden="true">{icon('jhoti')}</span></figure></div><div class="author-longform" lang="en"><div class="author-divider" aria-hidden="true">{icon('talapatra')}</div><p>His involvement with readers extends beyond the printed page. In November 2013, he took part in a National Book Trust discussion in Bitana, Jajpur, on promoting reading in rural areas. That occasion belongs to the same literary life as his poems and editorial work: the meeting of books with the communities that read them.</p><p>In <i>Singhasan</i>, the throne becomes a way of looking at power across time. Myth and remembered history enter the same field of vision as political ceremony, public spectacle, and ordinary daily life. Crowns, manuscripts, courts, roads, and villages recur in changing relationships; the people who witness authority are as significant as those who claim it.</p><p>The collection’s sixty-eight poems form a connected journey. Its opening and closing return to the earth beneath the throne, giving the book a circular movement: what has been buried can be found again, and the old questions can begin anew. Read together, the poems invite attention to the distance between grandeur and lived experience, and to the persistence of everyday life around the symbols of rule.</p><a class="author-book-link" href="book.html">{icon('read')}Read the book</a></div></article>'''
(DIST/'author.html').write_text(shell('ପ୍ରଭାକର ଶତପଥୀ',author_body,'author-page earth-wash'))
back_body=f'''<section class="book-cover-route"><figure class="bound-cover bound-back">{cover_face("back")}</figure><nav aria-label="Book covers" lang="en"><a href="poem-68.html?view=book&amp;leaf=last">← Last poem</a><a href="book.html">Front cover →</a></nav></section>'''
(DIST/'back-cover.html').write_text(shell('Back cover',back_body,'cover-edition'))

# Public address and preview metadata are generated alongside every page.
PUBLIC_URL='https://singhasan.poemwithoutborders.org'
public_pages=sorted(DIST.glob('*.html'))
for page in public_pages:
    content=page.read_text()
    page_title=re.search(r'<title>(.*?)</title>',content).group(1)
    canonical=PUBLIC_URL+('/' if page.name=='index.html' else '/'+page.name)
    description='Singhasan, the first Odia poetry collection by Pravakar Satapathy. Read the illustrated book or its quiet, text-only edition.'
    preview=PUBLIC_URL+'/assets/covers/singhasan-earth-beneath-throne-v2-lettered.png'
    metadata=f'<link rel="canonical" href="{canonical}"><meta property="og:type" content="website"><meta property="og:site_name" content="Singhasan"><meta property="og:title" content="{page_title}"><meta property="og:description" content="{description}"><meta property="og:url" content="{canonical}"><meta property="og:image" content="{preview}"><meta property="og:image:alt" content="Singhasan — Pravakar Satapathy"><meta name="twitter:card" content="summary_large_image">'
    page.write_text(content.replace('</head>',metadata+'</head>'))
(DIST/'CNAME').write_text('singhasan.poemwithoutborders.org\n')
(DIST/'.nojekyll').touch()
(DIST/'robots.txt').write_text('User-agent: *\nAllow: /\nSitemap: '+PUBLIC_URL+'/sitemap.xml\n')
urls=''.join('<url><loc>'+PUBLIC_URL+('/' if p.name=='index.html' else '/'+p.name)+'</loc></url>' for p in public_pages)
(DIST/'sitemap.xml').write_text('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+urls+'</urlset>\n')
