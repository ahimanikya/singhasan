"""Singhasan: standalone reading pages using Kabita Live's approved edition style."""
from pathlib import Path
from html import escape as e
import json,re,hashlib
from translation_data import load_translations
from reader_responses import responses, contact_page
from homepage import render_home
from audio_edition import render_audio
from artwork import image_asset, resolve_artwork
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
def poem_ending(c):
    if not c['number']:return ''
    motif=('leaf','paired','seed')[(c['number']-1)%3]
    return f'<div class="poem-ending" data-ending="{motif}" aria-hidden="true">{icon("poem-fleuron-"+motif)}</div>'
def masthead_logo():
    # A is current; keep both reviewed lockups as reusable templates.
    return (ROOT/'templates/masthead-a.html').read_text().strip()
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
    entry_actions=f'<div class="book-entry-actions"><a class="read-in-book" href="{path(c)}?view=book&amp;quiet=0">{icon("read")}<span>Read in the book</span></a><a class="read-in-book" href="{path(c)}?view=book&amp;quiet=1">{icon("read")}<span>Read quietly</span></a></div>'
    return '<section class="book-glance"><nav aria-labelledby="book-glance-heading" lang="en"><h2 id="book-glance-heading">In the book</h2>'+entry_actions+'<ol>'+''.join(rows)+'</ol><a class="toc-all" href="contents.html">All poems in the book</a></nav><div class="book-related" lang="en"><a href="author.html"><span>About the poet</span><small>Explore Pravakar Satapathy’s life and writing.</small></a><a href="listen.html" data-odia-audio><span>Listen to the book</span><small>Hear the introduction and all sixty-eight poems.</small></a></div></section>'

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
    language_options=''.join(f'<option value="{code}">{e(languages[code]["name"])}</option>' for code in reading_data(c)['variants'])
    choices=''.join(f'<button type="button" data-size="{size}" aria-pressed="{str(size==24).lower()}" aria-label="{label} text size">{label}</button>' for size,label in [(24,'Standard'),(28,'Large'),(32,'Extra large')])
    return f'''<div class="poem-actions" role="group" aria-label="Reading actions"><a class="reader-listen" href="read-along.html?track={"poem-"+str(c["number"]) if c["number"] else "introduction"}" aria-label="Listen &amp; follow" title="Listen &amp; follow">{icon("listen")}<span>Listen &amp; follow</span></a><button id="quick-bookmark" class="book-only-control" type="button" aria-label="Bookmark this page" aria-pressed="false">{icon("bookmark")}</button><button id="page-bookmarks-button" type="button" aria-label="Reader tools" aria-expanded="false" aria-controls="page-bookmarks"><span class="reader-aa" aria-hidden="true">Aa</span><span class="sr-only">Reader tools</span></button><button id="open-share" type="button">{icon("share")}<span>Share</span></button><button id="open-focus" class="book-only-control" type="button" data-quiet-toggle>{icon('read')}<span>Read quietly</span></button></div>
<section id="page-bookmarks" aria-label="Reader tools" hidden lang="en">
 <div class="page-tools-head"><strong>Reader tools</strong><button id="page-bookmarks-close" type="button" aria-label="Close reader tools">×</button></div>
 <label class="reader-select reader-language-setting">Language<select id="book-language">{language_options}</select></label>
 <label class="reader-select">Text size<select id="book-size"><option value="24">Standard</option><option value="28">Large</option><option value="32">Extra large</option></select></label>
 <label class="surface-control">Background<select data-reading-surface><option value="cloth">Woven cloth</option><option value="earth">Earth wash</option><option value="monsoon">Monsoon wash</option></select></label>
 <div class="reader-compat-controls" hidden><div class="reading-tabs" role="tablist" aria-label="Reading language">{tabs}</div><div class="reader-tools"><div class="size-group" role="group" aria-label="Text size">{choices}</div></div></div>
 <details class="reader-effects book-reader-only"><summary>Page effects</summary><label class="focus-switch"><span>Paper turn</span><input type="checkbox" id="book-motion"></label><label class="focus-switch"><span>Soft page sound</span><input type="checkbox" id="book-sound"></label><button id="book-sound-test" type="button" hidden>Try the sound</button><p id="book-effects-note" class="page-tools-tip" role="status"></p></details>
 <details id="page-saved-details"><summary>Bookmarks &amp; underlines</summary><button id="page-save-place" type="button">Bookmark this page</button><div id="page-saved-list"></div><div class="mark-tools"><button type="button" id="clear-marks" class="clear-marks" hidden>Clear underlines</button></div><p class="page-tools-tip">Select text to underline it. Saved on this device.</p></details>
 <details class="book-library"><summary>Find a poem</summary><label>Search the book<input id="book-search" type="search" placeholder="Words or opening line" autocomplete="off"></label><label>Section<select id="book-section"></select></label><p id="book-search-status" role="status"></p><div class="book-library-actions"><button id="book-read-section" type="button">Go to poem</button></div></details>
 <span id="page-saved-status" class="sr-only" role="status"></span>
</section>'''
def enhanced_body(c):
    data=reading_data(c);stanzas=[]
    for stanza in data['variants']['or']['stanzas']:
        stanzas.append('<p class="stanza">'+'<br>'.join(e(line) for line in stanza)+'</p>')
    return '<div id="chapter-body" class="'+c['kind']+'"><div id="reading-panel" role="region" aria-label="Book text" tabindex="0"><div id="experience-verse" class="verse or '+c['kind']+'" lang="or">'+''.join(stanzas)+'</div></div></div><div id="selection-tools" class="selection-tools" role="toolbar" aria-label="Selected text" hidden lang="en"><button id="underline-selection" type="button">Underline selection</button><button id="erase-selection" type="button">Erase</button><button id="dismiss-selection" type="button" aria-label="Dismiss selection">×</button></div>'

def share_dialog(c=None):
    c=c or {'title':'ସିଂହାସନ'}
    return f'''<dialog id="book-share" aria-labelledby="share-heading" lang="en"><form method="dialog"><h2 id="share-heading">Share this poem</h2><button class="share-close" aria-label="Close sharing">×</button></form><div class="share-card"><p class="share-book" lang="or">ସିଂହାସନ</p><p class="share-title" lang="or">{e(c['title'])}</p><p class="share-verse" lang="or"></p><p class="share-author" lang="or">ପ୍ରଭାକର ଶତପଥୀ</p><span class="share-ornament" aria-hidden="true">{icon('paddy')}</span></div><label for="share-url">Page link</label><input id="share-url" readonly><div class="share-options"><button id="native-book-share" type="button" hidden>Share…</button><button id="copy-book-link" type="button">Copy link</button><button id="copy-book-caption" type="button">Copy text &amp; link</button><a id="share-whatsapp" target="_blank" rel="noopener noreferrer">WhatsApp<span class="sr-only"> (opens a new tab)</span></a><a id="share-facebook" target="_blank" rel="noopener noreferrer">Facebook<span class="sr-only"> (opens a new tab)</span></a></div><p id="share-status" role="status"></p></dialog>'''

def shell(title,body,kind='edition'):
    extras='<link rel="stylesheet" href="assets/poem-reader.css"><link rel="stylesheet" href="assets/poem-experience.css?v=2"><link rel="stylesheet" href="assets/book-reader.css"><script src="assets/book-share.js" defer></script><script type="module" src="assets/poem-reader.js?v=2"></script><script type="module" src="assets/poem-experience.js?v=2"></script><script type="module" src="assets/book-pagination.js?v=9"></script><script type="module" src="assets/intro-pagination.js"></script>' if kind.startswith('reading-page') or kind=='contents-page' else ''
    if 'data-poem-engagement' in body:
        extras+='<link rel="stylesheet" href="assets/engagement.css?v=2"><script type="module" src="assets/services/engagement.js?v=2"></script>'
    if kind=='contact-page':
        extras+='<link rel="stylesheet" href="assets/engagement.css?v=2"><script type="module" src="assets/services/private-feedback.js"></script>'
    html=f'''<!doctype html>
<html lang="or"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="index,follow"><meta name="description" content="ସିଂହାସନ · ପ୍ରଭାକର ଶତପଥୀ · An Odia reading edition."><title>{e(title)} · ସିଂହାସନ</title><link rel="icon" href="assets/icons/singhasan-favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="style.css"><link rel="stylesheet" href="assets/book-layout.css"><script src="reader.js" defer></script>{extras}<link rel="stylesheet" href="assets/script-fonts.css"><link rel="stylesheet" href="assets/book-polish.css"><link rel="stylesheet" href="assets/book-volume.css"><link rel="stylesheet" href="assets/book-covers.css?v=2"><link rel="stylesheet" href="assets/kabita-foundations.css"><link rel="stylesheet" href="assets/book-pages.css"><link rel="stylesheet" href="assets/book-pagination.css"><link rel="stylesheet" href="assets/rich-edition.css"><link rel="stylesheet" href="assets/standalone-poem.css"><link rel="stylesheet" href="assets/audio-edition.css"><link rel="stylesheet" href="assets/kabita-sync.css"><link rel="stylesheet" href="assets/illustrated-book.css?v=5"><link rel="stylesheet" href="assets/read-along.css"><link rel="stylesheet" href="assets/visual-refinements.css?v=3"><script src="assets/book-ui.js" defer></script></head>
<body class="journal-paper {kind}"><script src="assets/appearance.js"></script><script src="assets/reading-surface.js"></script><script src="assets/reader-journey.js?v=1"></script><script src="assets/reading-mode.js?v=6"></script><a class="skip" href="#reading">Skip to reading</a>
<header class="wrap masthead">{masthead_logo()}<div class="header-controls"><button type="button" class="theme-toggle" data-theme-toggle hidden><span class="appearance-label sr-only">Theme: System</span><svg class="theme-system" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8m-4-4v4"/></svg><svg class="theme-light" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 1v3m0 16v3M1 12h3m16 0h3M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2"/></svg><span class="theme-dark" aria-hidden="true">{icon('night')}</span></button><button id="menu-toggle" type="button" aria-label="Open navigation" aria-expanded="false" aria-controls="book-menu-drawer" aria-haspopup="dialog"><span class="menu-open-icon">{icon('menu')}</span><span class="menu-close-icon">{icon('close')}</span></button></div><nav id="book-navigation" class="nav" aria-label="Book navigation" lang="en"><a href="index.html">Home</a><a href="book.html">Read the book</a><a href="listen.html">Listen</a><a href="author.html">The poet</a><a href="contents.html">Contents</a></nav><dialog id="book-menu-drawer" class="book-menu-drawer" aria-labelledby="book-menu-heading"><div class="book-menu-heading"><p id="book-menu-heading" lang="en">Within the book</p><button id="book-menu-close" type="button" aria-label="Close navigation">{icon("close")}</button></div><div id="book-menu-slot"></div><a class="drawer-back-cover" href="back-cover.html" lang="en">Back cover</a></dialog></header>
<div class="wrap header-rule" aria-hidden="true">{icon('header-separator')}</div>
<main id="reading" class="wrap" tabindex="-1">{body}</main>
<div class="wrap footer-landscape"><span class="footer-grass" aria-hidden="true"></span><span class="footer-stone" aria-hidden="true"></span></div><footer class="wrap footer"><p lang="or">ସିଂହାସନ · ପ୍ରଭାକର ଶତପଥୀ</p><nav aria-label="Footer" lang="en"><a href="author.html" aria-label="The poet">{icon('footer-story')}<span>The poet</span></a><a href="contents.html" aria-label="Contents">{icon('read')}<span>Contents</span></a><a href="contact.html" aria-label="Contact the poet">{icon("footer-contact")}<span>Contact the poet</span></a></nav></footer></body></html>'''
    def version_asset(match):
        digest=hashlib.sha256((DIST/match[2]).read_bytes()).hexdigest()[:10]
        return match[1]+match[2]+'?v='+digest+match[3]
    return resolve_artwork(re.sub(r'((?:src|href)=")((?:assets/)?[^"?#]+\.(?:css|js))(")',version_asset,html))
audio_body, audio_poems = render_audio(ROOT,chapters,icon,cover_face)
follow_tracks=json.loads((ROOT/'audio-edition.json').read_text())['tracks']
for track in follow_tracks:
    sync_file=DIST/'assets/audio-sync'/f'{track["id"]}.json'
    timing=json.loads(sync_file.read_text()) if sync_file.exists() else {}
    track['sync']='assets/audio-sync/'+sync_file.name if sync_file.exists() else None
    track['syncSafe']=timing.get('syncSafe',True)
    if not track['syncSafe']:
        track['syncNote']='Some passages in this recording still need a completeness review. Turn its pages manually; automatic following resumes with the poems.' if track['id']=='introduction' else 'The final passage in this recording still needs a completeness review. Turn its pages manually; automatic following resumes with the next poem.'
    track['label']='Poem '+str(track['poem']) if track.get('poem') else {'welcome':'Welcome','introduction':'Introduction','closing':'Closing'}[track['id']]
follow_data=json.dumps(follow_tracks,ensure_ascii=False).replace('<','\\u003c')
follow_body='''<iframe id="follow-book" title="Singhasan book reader" src="book.html?quiet=1"></iframe><section class="follow-player" lang="en" aria-label="Listen and follow"><audio id="follow-audio" preload="metadata"></audio>
 <div class="follow-main"><span id="follow-label"></span><div class="follow-transport"><button id="follow-previous" type="button" aria-label="Previous recording">‹</button><button id="follow-play" type="button" aria-label="Play reading">▶</button><button id="follow-next" type="button" aria-label="Next recording">›</button></div><div class="follow-timeline"><input id="follow-seek" type="range" min="0" max="1" value="0" step="0.1" aria-label="Recording position"><span id="follow-time"></span></div>
 <details class="follow-settings"><summary aria-label="Playback settings">Settings</summary><div class="follow-options"><label>Speed <select id="follow-speed"><option value="0.85">0.85×</option><option value="1" selected>1×</option><option value="1.15">1.15×</option><option value="1.25">1.25×</option></select></label><label><span>Follow pages</span><input id="follow-auto" type="checkbox" checked></label><label><span>Play next poem</span><input id="follow-continuous" type="checkbox" checked></label><button id="follow-back" type="button">Replay 10 seconds</button></div></details></div>
 <button id="follow-resume" type="button" hidden>Resume following</button><p id="follow-status" role="status" aria-live="polite"></p></section>'''+f'<script type="application/json" id="read-along-catalog">{follow_data}</script><script type="module" src="assets/read-along.js?v=5"></script>'
(DIST/'read-along.html').write_text(shell('Listen & follow',follow_body,'read-along-page'))
(DIST/'listen.html').write_text(shell('Listen to Singhasan',audio_body,'listening-page'))
for i,c in enumerate(chapters):
    count=f'Poem {c["number"]:02} of 68' if c['number'] else ''
    prev=path(chapters[i-1]) if i else 'index.html'
    next_page=path(chapters[i+1]) if i<len(chapters)-1 else 'back-cover.html'
    prev_label='Introduction' if i==1 else ('The book' if i==0 else 'Previous poem')
    next_label='First poem' if i==0 else ('All poems' if i==len(chapters)-1 else 'Next poem')
    previous_link=f'<a href="{prev}" aria-label="Previous: {e(chapters[i-1]["title"])}"><span class="previous-arrow">{icon('next-poetic')}</span><span class="nav-label">Previous page</span></a>' if i else f'<a href="book.html" aria-label="Front cover"><span class="previous-arrow">{icon("next-poetic")}</span><span class="nav-label">Front cover</span></a>'
    next_link=f'<a href="{next_page}" aria-label="Next: {e(chapters[i+1]["title"])}"><span class="nav-label">Next page</span>{icon('next-poetic')}</a>' if i<len(chapters)-1 else f'<a href="back-cover.html" aria-label="Back cover"><span class="nav-label">Back cover</span>{icon("next-poetic")}</a>'
    body=f'''<article class="book-poem printed-spread">
<div class="book-running-head"><a href="{path(c)}" lang="en">← {"Poem page" if c["number"] else "ସିଂହଦ୍ଵାର"}</a><a href="author.html" lang="or">ପ୍ରଭାକର ଶତପଥୀ</a></div>
<header class="chapter-header poem-heading">{f'<p class="reader-meta" lang="en">{count}</p>' if count else ''}<h1 id="chapter-title">{e(c['title'])}</h1><p class="byline" lang="or"><a href="author.html"><img src="assets/writers/41-earth-voice-v1.png" width="52" height="52" alt=""><span lang="en">Pravakar Satapathy</span></a></p>{reader_toolkit(c)}<p id="reader-language-note" class="reader-language-note" lang="en" role="status" hidden></p></header>
<div class="reader">{enhanced_body(c)}{poem_ending(c)}<div class="blank-leaf-art" hidden aria-hidden="true">{icon(("blank-leaf-throne","blank-leaf-reeds","blank-leaf-palm")[c["number"]%3])}</div></div>{nearby(c)}
<div class="book-reading-end"><p class="book-folio" lang="en"><span class="sr-only">Page </span>{book_page(c):02}</p>
<nav class="page-nav" aria-label="Reading navigation" lang="en">{previous_link}{poem_ending(c).replace("poem-ending", "nav-ending")}<a class="back-contents" href="contents.html">Contents</a>{next_link}</nav><div class="leaf-folios" aria-hidden="true"><span id="leaf-folio-left"></span><span id="leaf-folio-right"></span></div><nav class="leaf-nav" aria-label="Page navigation" lang="en" hidden><button id="leaf-prev" type="button" aria-label="Previous page"><span class="previous-arrow">{icon('next-poetic')}</span><span class="leaf-button-label">Back</span></button><div><span id="leaf-progress" role="status" aria-live="polite"></span><button id="leaf-switch" type="button">Read poem</button></div><button id="leaf-next" type="button" aria-label="Next page"><span class="leaf-button-label">Next</span>{icon('next-poetic')}</button></nav></div></article>
{responses(c,icon)}{share_dialog(c)}'''
    body+='<script type="application/json" id="reading-data">'+encoded(reading_data(c))+'</script>'
    (DIST/path(c)).write_text(shell(c['title'],body,'reading-page standalone-page '+('earth-wash' if c['number']%2 else 'monsoon-wash')))
rows=[]
for c in chapters:
    detail=''
    rows.append(f'''<li><a href="{path(c)}" aria-label="{e(c['title'])}, page {book_page(c)}"><span class="contents-title" lang="or">{e(first_line(c))}{detail}</span><span class="contents-leader" aria-hidden="true"></span><span class="contents-page" lang="en">{book_page(c):02}</span></a></li>''')
contents_body=f'<section class="book-contents" aria-labelledby="edition-poems"><div class="contents-heading"><div><p class="eyebrow artistic-label" lang="en">{icon("talapatra")}The complete book</p><h1 id="edition-poems" tabindex="-1" lang="en">Contents</h1><p class="contents-invitation" lang="en">Find a poem. Stay a little longer.</p></div><img class="section-ornament contents-throne" src="assets/footer-earth/throne-v1.webp" alt="" width="1254" height="1254"></div>{reader_toolkit(chapters[0])}<div class="opening-waterline" aria-hidden="true"></div><ol class="book-index" id="reading-panel">{"".join(rows)}</ol></section>'
contents_body+=share_dialog()+'<script type="application/json" id="reading-data">'+encoded(reading_data(chapters[0]))+'</script>'
(DIST/'contents.html').write_text(shell('Contents',contents_body,'contents-page'))
(DIST/'index.html').write_text(shell('Singhasan',render_home(chapters,unique_art,icon,excerpt,cover_face),'home-page'))
front_body=f'<section class="book-cover-route"><figure class="bound-cover bound-front"><a class="cover-entry" href="intro.html?view=book" aria-label="Open the book" lang="en">{cover_face("front")}</a></figure><nav aria-label="Book covers" lang="en"><button type="button" data-quiet-toggle><span>Read quietly</span></button><a href="index.html">← Home</a><a class="reader-listen" href="read-along.html?track=welcome">Listen &amp; follow</a><a class="open-volume" href="intro.html?view=book">Open the book →</a></nav></section>'
(DIST/'book.html').write_text(shell('The book',front_body,'cover-edition'))
print('Built book contents, introduction, and 68 poem pages.')

# Book-specific biography; research provenance is kept with the editorial files.
author_body=f'''<article class="author-profile"><div class="author-opening"><div><h1 lang="or">ପ୍ରଭାକର ଶତପଥୀ</h1><p class="author-roman" lang="en">Pravakar Satapathy</p><div class="opening-waterline" aria-hidden="true"></div><h2 class="biography-label artistic-label" lang="en">{icon("write")}The poet’s life</h2><div class="author-biography" lang="en"><p>Pravakar Satapathy is an Odia poet and editor associated with Jajpur. <i>Singhasan</i> is his first book, written during a period when he was active in politics. Its poems draw connections between political life, myth, history and the experience of ordinary people. His literary work spans poetry, magazine editing, and writing about the place of little magazines in literary culture. He previously edited <i>Anisha</i>, participating in the world of small literary publications in which poems, ideas, and new voices find their readers.</p><p>His poetry has appeared in <i>Viswamukti</i>, including issues published in 1996 and 1999. His books include the collections <i>Singhasan</i> and <i>Sabuthi Kabita</i>, alongside <i>Sahityare Biplaba O Little Magazine</i>, published in 2014. Together, these works reflect a sustained engagement with both the making of poetry and the spaces that allow literature to circulate.</p></div></div><figure class="author-portrait"><img src="assets/writers/41-earth-voice-v1.png" width="1086" height="1448" alt="Portrait of ପ୍ରଭାକର ଶତପଥୀ"><span class="portrait-ornament" aria-hidden="true">{icon('jhoti')}</span></figure></div><div class="author-longform" lang="en"><div class="author-divider" aria-hidden="true">{icon('talapatra')}</div><p>His involvement with readers extends beyond the printed page. In November 2013, he took part in a National Book Trust discussion in Bitana, Jajpur, on promoting reading in rural areas. That occasion belongs to the same literary life as his poems and editorial work: the meeting of books with the communities that read them.</p><p>In <i>Singhasan</i>, the throne becomes a way of looking at power across time. Myth and remembered history enter the same field of vision as political ceremony, public spectacle, and ordinary daily life. Crowns, manuscripts, courts, roads, and villages recur in changing relationships; the people who witness authority are as significant as those who claim it.</p><p>The collection’s sixty-eight poems form a connected journey. Its opening and closing return to the earth beneath the throne, giving the book a circular movement: what has been buried can be found again, and the old questions can begin anew. Read together, the poems invite attention to the distance between grandeur and lived experience, and to the persistence of everyday life around the symbols of rule.</p><p>At 85, Pravakar Satapathy still lives and breathes poetry. It lights up his face, finds expression in his gestures, and flows into conversation.</p><p>He loves meeting people and talking about poems, memories and life. If you’re in Bhubaneswar, he would be happy to welcome you for a conversation. <a href="contact.html">Get in touch with his family</a> to arrange a visit—you don’t have to be a poet to share a love of poetry.</p><div class="author-closing"><img class="section-ornament" src="assets/book-ornaments/poets-notebook-v1.webp" alt="" width="1254" height="1254" loading="lazy"><a class="author-book-link" href="book.html">{icon('read')}Read the book</a><a class="author-book-link" href="contact.html">{icon("footer-contact")}Contact the poet</a></div></div></article>'''
(DIST/'author.html').write_text(shell('ପ୍ରଭାକର ଶତପଥୀ',author_body,'author-page earth-wash'))
back_body=f'''<section class="book-cover-route"><figure class="bound-cover bound-back">{cover_face("back")}</figure><nav aria-label="Book covers" lang="en"><button type="button" data-quiet-toggle><span>Read quietly</span></button><a href="poem-68.html?view=book&amp;leaf=last">← Last poem</a><a href="book.html">Front cover →</a></nav></section>'''
(DIST/'back-cover.html').write_text(shell('Back cover',back_body,'cover-edition'))

(DIST/'contact.html').write_text(shell('Contact the poet',contact_page(icon),'contact-page'))

# Public address and preview metadata are generated alongside every page.
PUBLIC_URL='https://singhasan.poemwithoutborders.org'
public_pages=sorted(DIST.glob('*.html'))
for page in public_pages:
    content=page.read_text()
    page_title=re.search(r'<title>(.*?)</title>',content).group(1)
    canonical=PUBLIC_URL+('/' if page.name=='index.html' else '/'+page.name)
    description='Singhasan, the first Odia poetry collection by Pravakar Satapathy. Read the illustrated book or its quiet, text-only edition.'
    preview=PUBLIC_URL+'/assets/covers/singhasan-anek-2026-10-04.png'
    metadata=f'<link rel="canonical" href="{canonical}"><meta property="og:type" content="website"><meta property="og:site_name" content="Singhasan"><meta property="og:title" content="{page_title}"><meta property="og:description" content="{description}"><meta property="og:url" content="{canonical}"><meta property="og:image" content="{preview}"><meta property="og:image:secure_url" content="{preview}"><meta property="og:image:type" content="image/png"><meta property="og:image:width" content="1280"><meta property="og:image:height" content="1920"><meta property="og:image:alt" content="ସିଂହାସନ — ପ୍ରଭାକର ଶତପଥୀ · Singhasan — Pravakar Satapathy"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="{page_title}"><meta name="twitter:description" content="{description}"><meta name="twitter:image" content="{preview}"><meta name="twitter:image:alt" content="ସିଂହାସନ — ପ୍ରଭାକର ଶତପଥୀ · Singhasan — Pravakar Satapathy">'
    page.write_text(content.replace('</head>',metadata+'</head>'))
(DIST/'CNAME').write_text('singhasan.poemwithoutborders.org\n')
(DIST/'.nojekyll').touch()
(DIST/'robots.txt').write_text('User-agent: *\nAllow: /\nSitemap: '+PUBLIC_URL+'/sitemap.xml\n')
urls=''.join('<url><loc>'+PUBLIC_URL+('/' if p.name=='index.html' else '/'+p.name)+'</loc></url>' for p in public_pages)
(DIST/'sitemap.xml').write_text('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+urls+'</urlset>\n')
