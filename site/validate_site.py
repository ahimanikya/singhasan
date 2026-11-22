"""Check publication routes, assets and original book completeness before deployment."""
from pathlib import Path
from html.parser import HTMLParser
from html import escape, unescape
from urllib.parse import urlsplit,unquote
import hashlib,json,re,xml.etree.ElementTree as ET
from artwork import image_asset, MANIFEST
from social_metadata import page_image, PUBLIC_URL
root=Path(__file__).resolve().parent/'dist'
class Page(HTMLParser):
    def __init__(self):
        super().__init__();self.links=[];self.ids=[];self.canonical=[];self.metadata={}
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        for k in ('href','src'):
            if a.get(k):self.links.append(a[k])
        if tag=='img' and a.get('srcset'):
            self.links.extend(candidate.strip().split()[0] for candidate in a['srcset'].split(','))
        if tag=='meta':self.metadata.setdefault(a.get('property') or a.get('name'),[]).append(a.get('content',''))
        if a.get('id'):self.ids.append(a['id'])
        if tag=='link' and a.get('rel')=='canonical':self.canonical.append(a['href'])
errors=[]
verification=root/'googleeb3b0703307157d1.html'
assert verification.read_text().strip()=='google-site-verification: '+verification.name, 'Google ownership verification file changed'
pages=sorted(page for page in root.glob('*.html') if page!=verification)
social=json.loads((root.parent/'social-images.json').read_text())
assert len(pages)==81, 'Expected home, contents, two covers, poet, listening edition, read-along, introduction and 68 poems plus Our Story, the literary record, posts archive and poetry archive'
for f in pages:
    p=Page();html=f.read_text();p.feed(html)
    if len(p.ids)!=len(set(p.ids)):errors.append(f'{f.name}: duplicate IDs')
    if len(p.canonical)!=1 or not p.canonical[0].startswith('https://singhasan.kabitawithoutborders.org/'):errors.append(f'{f.name}: canonical address')
    if 'content="noindex"' in html:errors.append(f'{f.name}: search indexing disabled')
    share=social[page_image(f.name)]
    expected_image=PUBLIC_URL+'/'+share['src']
    for key,value in {'og:image':expected_image,'og:image:secure_url':expected_image,
                      'twitter:image':expected_image,'og:image:width':str(share['width']),
                      'og:image:height':str(share['height']),'og:image:type':share['type'],
                      'twitter:card':'summary_large_image',
                      'og:url':PUBLIC_URL+('/' if f.name=='index.html' else '/'+f.name)}.items():
        if p.metadata.get(key)!=[value]:errors.append(f'{f.name}: incorrect {key}')
    for key in ('og:title','og:description','og:image:alt','twitter:title','twitter:description','twitter:image:alt','description'):
        if len(p.metadata.get(key,[]))!=1 or not p.metadata[key][0].strip():errors.append(f'{f.name}: missing or duplicate {key}')
    if p.metadata.get('description')!=p.metadata.get('og:description'):errors.append(f'{f.name}: inconsistent descriptions')
    for link in p.links:
        u=urlsplit(link)
        if u.scheme or u.netloc or not u.path:continue
        if not (f.parent/unquote(u.path)).is_file():errors.append(f'{f.name}: missing {link}')
    if re.search(r'/Users/|127\.0\.0\.1|localhost',html):errors.append(f'{f.name}: local address')
book=json.loads((root/'book.js').read_text().removeprefix('window.BOOK = ').strip().removesuffix(';'))
assert len(book['chapters'])==69
for n in range(1,69):
    html=(root/f'poem-{n}.html').read_text()
    assert image_asset(f'assets/poems/unique/poem-{n:02}.png') in html and 'class="illustration-reading"' in html
assert len({hashlib.sha256((root/image_asset(f'assets/poems/unique/poem-{n:02}.png')).read_bytes()).hexdigest() for n in range(1,69)})==68
assert len(MANIFEST['items']) == 76
published = '\n'.join(p.read_text() for p in pages) + '\n' + '\n'.join(p.read_text() for p in root.rglob('*.css'))
for item in MANIFEST['items']:
    assert hashlib.sha256((root/item['asset']).read_bytes()).hexdigest() == item['sha256'], item['id']
    assert Path(item['asset']).name in published, f"Unconnected artwork: {item['id']}"
assert (root/'CNAME').read_text().strip()=='singhasan.kabitawithoutborders.org'
canonical_urls={PUBLIC_URL+('/' if page.name=='index.html' else '/'+page.name) for page in pages}
ns={'s':'http://www.sitemaps.org/schemas/sitemap/0.9'}
sitemap_urls=[loc.text for loc in ET.parse(root/'sitemap.xml').findall('s:url/s:loc',ns)]
assert len(sitemap_urls)==len(canonical_urls) and set(sitemap_urls)==canonical_urls, 'Sitemap must list each canonical book-site page once'
assert 'Sitemap: '+PUBLIC_URL+'/sitemap.xml' in (root/'robots.txt').read_text().splitlines()
assert (root/'.nojekyll').exists()
assert not errors,'\n'.join(errors)
print('Validated 81 pages, 69 book sections, 68 distinct poem illustrations, links, assets, sitemap and production metadata.')

# Every permanent poem URL renders the same source text and exposes the book view.
for chapter in book['chapters']:
    name='intro.html' if not chapter['number'] else f"poem-{chapter['number']}.html"
    html=(root/name).read_text()
    assert 'reading-page standalone-page' in html, name
    for quiet in (0,1):
        assert f'href="{name}?view=book&amp;quiet={quiet}"' in html, name
    data=json.loads(re.search(r'<script type="application/json" id="reading-data">(.*?)</script>',html,re.S).group(1))
    assert data['id']==chapter['number']
    expected=[]
    for page in chapter['pages']:
        for block in re.split(r'\n\s*\n',page['text']):
            expected.append([block.replace('\n',' ')] if chapter['kind']=='prose' else block.split('\n'))
    assert data['variants']['or']['stanzas']==expected, name
assert 'href="intro.html?view=book"' in (root/'book.html').read_text()
assert 'poem-68.html?view=book&amp;leaf=last' in (root/'back-cover.html').read_text()
print('All 69 standalone sections preserve their source text and link to the same section in book view.')

audio=json.loads((root.parent/'audio-edition.json').read_text())['tracks']
assert len({t['id'] for t in audio})==len(audio), 'Duplicate recording ID'
sources=[source for t in audio for source in t.get('source_urls',[t.get('source_url') or t.get('source_provenance')])]
assert all(sources) and len(set(sources))==len(sources), 'Missing or duplicate selected take'
source_stanza_hashes={}
for track in audio:
    file=root/track['src']
    assert file.is_file() and file.stat().st_size>1000, track['id']
    assert not file.read_bytes().startswith(b'version https://git-lfs'), 'Fetch LFS audio before building'
    assert hashlib.sha256(file.read_bytes()).hexdigest()==track['sha256'], track['id']
    if track.get('poem'):
        assert f'read-along.html?track=poem-{track["poem"]}' in (root/f'poem-{track["poem"]}.html').read_text()
    if track['id']=='introduction':
        assert 'read-along.html?track=introduction' in (root/'intro.html').read_text()
        assert [t['id'] for t in audio[:3]]==['welcome','introduction','poem-1']
        assert track==json.loads((root.parent/'introduction-audio.json').read_text())
    if track.get('source_provenance'):
        manifest=json.loads((root.parent/track['source_provenance']).read_text())
        assert isinstance(manifest['source_provider'],str) and manifest['source_provider'].strip()
        assert manifest['source_provider']==track['source_provider']
        assert manifest['audio_sha256']==track['sha256'] and manifest['byte_length']==file.stat().st_size
        assert type(manifest['samples']) is int and manifest['samples']>0
        assert type(manifest['sample_rate']) is int and manifest['sample_rate']>0
        assert abs(manifest['samples']/manifest['sample_rate']-track['duration_seconds'])<0.001
        if track['id'] in ('welcome','closing'):
            assert manifest['track_id']==track['id']
            text=manifest['script']
            assert isinstance(text,str) and text.strip(), f"Missing English script: {track['id']}"
        else:
            section=next(c for c in book['chapters'] if c['number']==(track['poem'] or 0))
            text='\n\n'.join(p['text'] for p in section['pages'])
            assert manifest['source_title']==section['title']
            if track['id']=='introduction':
                assert track['label']==section['title']
            source_stanza_hashes[track['id']]=manifest['source_stanzas_sha256']
        assert manifest['source_text_sha256']==hashlib.sha256(text.encode()).hexdigest()
print(f'Validated {len(audio)} available recordings, file hashes and poem listening links.')

# Listen-along cues reference this exact recording and current editorial text.
# Text revisions preserve prior acoustic timing and record their offset remapping.
reading_book=json.loads((root/'assets/reading-book.json').read_text())
for track in audio:
    if track['id'] in ('welcome','closing'):
        continue
    cues_file=root/'assets/audio-sync'/f"{track['id']}.json"
    assert cues_file.is_file(), f"Missing follow timings: {track['id']}"
    timing=json.loads(cues_file.read_text())
    section=next(p for p in reading_book['poems'] if p['id']==timing['section'])
    stanzas=section['variants']['or']['stanzas']; lines=sum(stanzas,[])
    source=json.dumps(stanzas,ensure_ascii=False,separators=(',',':')).encode()
    assert timing['audioSha256']==track['sha256'], f"Stale recording timings: {track['id']}"
    assert timing['textSha256']==hashlib.sha256(source).hexdigest(), f"Stale source timings: {track['id']}"
    if track['id'] in source_stanza_hashes:
        assert timing['textSha256']==source_stanza_hashes[track['id']]
    assert timing['language']=='or' and timing['cues'], track['id']
    assert not timing.get('partialCoverage') or timing.get('syncSafe') is False, track['id']
    previous=0
    for cue in timing['cues']:
        assert 0<=previous<=cue['start']<=cue['end']<=track['duration_seconds']+.1, track['id']
        assert lines[cue['line']][cue['offset']:cue['endOffset']]==cue['text'], track['id']
        previous=cue['end']
assert 'id="follow-book"' in (root/'read-along.html').read_text()
assert 'id="audio-follow"' in (root/'listen.html').read_text()
catalog=json.loads(re.search(r'<script type="application/json" id="audio-catalog">(.*?)</script>',(root/'listen.html').read_text(),re.S).group(1))
def discovery_graph(route):
    blocks=re.findall(r'<script type="application/ld\+json">(.*?)</script>',(root/route).read_text(),re.S)
    assert len(blocks)==1, route
    graph=json.loads(blocks[0])
    assert graph['@context']=='https://schema.org', route
    return graph['@graph']

guide=(root/'llms.txt').read_text()
edition=json.loads((root/'assets/reading-book.json').read_text())['poems']
published_codes={code for section in edition for code in section['variants'] if code!='or'}
assert {f.stem for f in (root/'readings').glob('*.md')}==published_codes
for code in published_codes:
    assert f'({PUBLIC_URL}/readings/{code}.md)' in guide, code
    copy=(root/'readings'/f'{code}.md').read_text()
    sections=[section for section in edition if code in section['variants']]
    blocks=re.split(r'^## ',copy,flags=re.M)[1:]
    assert len(blocks)==len(sections), code
    for block,section in zip(blocks,sections):
        translated=section['variants'][code]
        heading,link,stanzas=block.rstrip('\n').split('\n\n',2)
        assert heading==translated['title'] and f'({PUBLIC_URL}/{section["route"]}?lang={code})' in link
        assert [stanza.split('\\'+'\n') for stanza in stanzas.split('\n\n')]==translated['stanzas'], (code,section['id'])
for section in book['chapters']:
    number=section['number']
    route=f'poem-{number}.html' if number else 'intro.html'
    assert f'({PUBLIC_URL}/{route})' in guide, route
    chapter,=[node for node in discovery_graph(route) if node['@type']=='Chapter']
    assert (chapter['name'],chapter['url'],chapter['inLanguage'])==(section['title'],f'{PUBLIC_URL}/{route}','or'), route
graph=discovery_graph('listen.html')
listing,=[node for node in graph if node['@type']=='ItemList']
recordings={node['@id']:node for node in graph if node['@type']=='AudioObject'}
assert len(recordings)==listing['numberOfItems']==len(listing['itemListElement'])==len(catalog)
for position,(entry,track) in enumerate(zip(listing['itemListElement'],catalog),1):
    obj=recordings[entry['item']['@id']]
    assert entry['position']==position and obj['contentUrl']==PUBLIC_URL+'/'+track['src'], track['id']
    assert obj['inLanguage']==('en' if track['id'] in ('welcome','closing') else 'or'), track['id']
for track in catalog:
    if track['id']=='closing':
        assert track['reading_route']=='back-cover.html', 'Closing should return to the back cover'
    if track['id'] not in ('welcome','closing'):
        timing=json.loads((root/'assets/audio-sync'/f"{track['id']}.json").read_text())
        assert bool(track['review_note']) == (timing.get('syncSafe') is False), f"Missing or stale completeness notice: {track['id']}"
print('Validated recording hashes and current-text cue offsets for the introduction and all 68 poems.')

# Responsive copies must match the selected artwork and remain available to browsers.
responsive=json.loads((root.parent/'responsive-images.json').read_text())
for source,entry in responsive.items():
    assert hashlib.sha256((root/source).read_bytes()).hexdigest()==entry['source_sha256'], f'Rebuild responsive images: {source}'
    assert entry['preview'].startswith('data:image/webp;base64,')
    assert entry['variants'] and [v['width'] for v in entry['variants']]==sorted({v['width'] for v in entry['variants']})
    for variant in entry['variants']:
        assert (root/variant['src']).stat().st_size==variant['bytes'], variant['src']
print(f'Validated {len(responsive)} responsive image families and their source hashes.')

# Social copies must track the current artwork and point to complete public files.
for source,entry in social.items():
    assert hashlib.sha256((root/source).read_bytes()).hexdigest()==entry['source_sha256'], f'Rebuild sharing image: {source}'
    output=root/entry['src'];payload=output.read_bytes()
    assert len(payload)==entry['bytes'] and hashlib.sha256(payload).hexdigest()==entry['sha256'], entry['src']
    assert entry['type'] in ('image/png','image/jpeg') and entry['width']>0 and entry['height']>0
    assert payload.startswith(b'\x89PNG') if entry['type']=='image/png' else payload.startswith(b'\xff\xd8'), entry['src']
assert len({social[page_image(f'poem-{n}.html')]['src'] for n in range(1,69)})==68
print('Validated page-specific sharing images, metadata and source/output hashes for all 81 pages.')

# The main-site essay is absent from this edition.
ARTICLE_ROUTE='thirty-languages-and-the-journey-of-a-poem.html'
assert not (root/ARTICLE_ROUTE).exists()
assert ARTICLE_ROUTE not in (root/'sitemap.xml').read_text()
for f in pages:
    assert ARTICLE_ROUTE not in f.read_text(), f.name
    assert 'href="our-story.html" aria-label="Our Story"' in f.read_text(), f.name
    assert '<span>Our Story</span>' in f.read_text(), f.name

home=(root/'index.html').read_text()
assert 'home-translation-feature' not in home
assert home.index('home-visual-story')<home.index('home-reading-choice')
print('Validated essay removal and shared footer links.')

# Optional path is part of Poems, never a second illustrated homepage.
from reading_path import STOPS, PATH_ID, ROUTE as PATH_ROUTE
guide=(root/'contents.html').read_text()
assert [stop[0] for stop in STOPS]==[1,24,6,38,62]
assert 'id="reading-path"' in guide
for number,*_ in STOPS:
    assert f'id="path-stop-{number}"' in guide
    assert f'poem-{number}.html?path={PATH_ID}' in guide
    assert f'data-reading-path="{PATH_ID}"' in (root/f'poem-{number}.html').read_text()
assert 'data-reading-path=' not in (root/'poem-2.html').read_text()
assert f'href="{PATH_ROUTE}"' in (root/'index.html').read_text()
assert not (root/'reading-path.html').exists()
assert 'reading-path.html' not in (root/'sitemap.xml').read_text()
print('Validated compact five-stop path on Poems, Home invitation and scoped poem panels.')

story=(root/'our-story.html').read_text()
for target in ('https://kabitawithoutborders.org/','https://kabitawithoutborders.org/#story'):
    assert f'href="{target}"' in story
assert 'Ahimanikya Satapathy' in story and 'poet’s son' in story
print('Validated Our Story, consolidated links and edition credit.')

# The poetry collection is separate from the biography and keeps exact released verse.
from poetry_archive import ROUTE as POETRY_ROUTE, DESCRIPTION as POETRY_DESCRIPTION
archive_html=(root/POETRY_ROUTE).read_text()
author_html=(root/'author.html').read_text()
archive_data=json.loads((root.parent/'poetry-archive/published.json').read_text())
assert len(archive_data['poems'])==3 and len(archive_data['sources'])==20 and len(archive_data['articles'])==1
assert archive_html.count('<h1>')==1 and '<h1>Poetry archive</h1>' in archive_html
assert '<html lang="en">' in archive_html and 'href="author.html"' in archive_html
assert 'poetry-archive-disclosure' not in archive_html, 'Do not nest the whole archive in a disclosure'
assert author_html.count(f'href="{POETRY_ROUTE}"')==1
assert '<section class="poetry-archive"' not in author_html
assert all(token not in archive_html and token not in author_html for token in ('recitation-001','recitation-002','photographs-and-memories'))
assert '<video' not in archive_html
expected_anchors=['archive-'+poem['id'] for poem in archive_data['poems']]
assert f'data-poetry-archive-ids="{" ".join(expected_anchors)}"' in author_html
assert f'<loc>{PUBLIC_URL}/{POETRY_ROUTE}</loc>' in (root/'sitemap.xml').read_text()
archive_page=Page();archive_page.feed(archive_html)
assert archive_page.canonical==[f'{PUBLIC_URL}/{POETRY_ROUTE}']
assert archive_page.metadata['description']==[POETRY_DESCRIPTION]
assert page_image(POETRY_ROUTE)==page_image('author.html')
class ArchiveStanzas(HTMLParser):
    def __init__(self):
        super().__init__();self.stanzas=[];self.current=None
    def handle_starttag(self,tag,attrs):
        if tag=='p':self.current=''
        elif tag=='br' and self.current is not None:self.current+='\n'
    def handle_data(self,data):
        if self.current is not None:self.current+=data
    def handle_endtag(self,tag):
        if tag=='p' and self.current is not None:
            self.stanzas.append(self.current);self.current=None
for poem in archive_data['poems']:
    anchor='archive-'+poem['id']
    article=re.search(r'<article id="'+re.escape(anchor)+r'">(.*?)</article>',archive_html,re.S)
    assert article, anchor
    heading=re.search(r'<h2 lang="or">(.*?)</h2>',article[1],re.S)
    assert heading and unescape(heading[1])==poem['title'], anchor
    verse=re.search(r'<div class="archive-verse" lang="or">(.*?)</div>',article[1],re.S)
    assert verse, anchor
    parsed=ArchiveStanzas();parsed.feed(verse[1])
    assert parsed.stanzas==poem['text'].split('\n',1)[1].strip().split('\n\n'), f'{anchor}: altered verse'
    assert (root/'assets/poetry-archive'/f"{poem['id']}.txt").read_text()==poem['text']
    assert f'id="{anchor}"' not in author_html
for item in archive_data['sources']+archive_data['articles']:
    assert f'href="{escape(item["url"])}"' in archive_html
    assert escape(item['title']) in archive_html and escape(item['label']) in archive_html
print('Validated separate poetry archive, exact original stanzas, publication sources, profile link and legacy anchor mapping.')
