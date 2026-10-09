"""Check publication routes, assets and original book completeness before deployment."""
from pathlib import Path
from html.parser import HTMLParser
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
pages=sorted(root.glob('*.html'))
social=json.loads((root.parent/'social-images.json').read_text())
assert len(pages)==79, 'Expected home, contents, two covers, poet, listening edition, read-along, introduction and 68 poems plus the translation essay and Our Story'
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
assert len(ET.parse(root/'sitemap.xml').getroot())==79
assert (root/'.nojekyll').exists()
assert not errors,'\n'.join(errors)
print('Validated 79 pages, 69 book sections, 68 distinct poem illustrations, links, assets, sitemap and production metadata.')

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
sources=[url for t in audio for url in t.get('source_urls',[t.get('source_url')])]
assert all(sources) and len(set(sources))==len(sources), 'Missing or duplicate selected take'
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
        production=json.loads((root.parent/'production/prose-introduction-run.json').read_text())
        introduction='\n\n'.join(p['text'] for p in book['chapters'][0]['pages'])
        recorded_source=production['source_text']
        assert recorded_source=='\n\n'.join(p['text'] for p in production['parts'])
        # Recording provenance stays intact when the family approves text edits.
        revised_source=recorded_source
        for ledger in sorted((root.parent/'editorial').glob('corrections-*.json')):
            for edit in json.loads(ledger.read_text())['applied']:
                if edit['section']==0:
                    assert revised_source.count(edit['before'])==1, edit
                    revised_source=revised_source.replace(edit['before'],edit['after'])
        assert introduction==revised_source
        assert track['source_urls']==[p['selected'] for p in production['parts']]
        assert abs(track['duration_seconds']-sum(p['duration_seconds'] for p in production['parts']))<0.2
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
print('Validated page-specific sharing images, metadata and source/output hashes for all 79 pages.')

# The essay is a standalone editorial page, outside the book's section sequence.
from translation_article import ROUTE as ARTICLE_ROUTE
essay=(root/ARTICLE_ROUTE).read_text()
assert '<html lang="en">' in essay and essay.count('<table>')==2
assert 'og:type" content="article"' in essay
assert 'source-package' not in essay and '/site/dist/' not in essay
for f in pages:
    assert 'href="our-story.html" aria-label="Our Story"' in f.read_text(), f.name
    assert '<span>Our Story</span>' in f.read_text(), f.name

home=(root/'index.html').read_text()
assert home.index('home-visual-story')<home.index('home-translation-feature')<home.index('home-reading-choice')
print('Validated translation essay, home feature and shared footer links.')

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
for target in (ARTICLE_ROUTE,'https://kabitawithoutborders.org/','https://kabitawithoutborders.org/#story'):
    assert f'href="{target}"' in story
assert 'Ahimanikya Satapathy' in story and 'poet’s son' in story
print('Validated Our Story, consolidated links and edition credit.')
