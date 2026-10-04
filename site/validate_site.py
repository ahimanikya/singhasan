"""Check publication routes, assets and original book completeness before deployment."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit,unquote
import hashlib,json,re,xml.etree.ElementTree as ET
from artwork import image_asset, MANIFEST
root=Path(__file__).resolve().parent/'dist'
class Page(HTMLParser):
    def __init__(self):
        super().__init__();self.links=[];self.ids=[];self.canonical=[]
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        for k in ('href','src'):
            if a.get(k):self.links.append(a[k])
        if a.get('id'):self.ids.append(a['id'])
        if tag=='link' and a.get('rel')=='canonical':self.canonical.append(a['href'])
errors=[]
pages=sorted(root.glob('*.html'))
assert len(pages)==77, 'Expected home, contents, two covers, poet, listening edition, read-along, introduction and 68 poems'
for f in pages:
    p=Page();html=f.read_text();p.feed(html)
    if len(p.ids)!=len(set(p.ids)):errors.append(f'{f.name}: duplicate IDs')
    if len(p.canonical)!=1 or not p.canonical[0].startswith('https://singhasan.poemwithoutborders.org/'):errors.append(f'{f.name}: canonical address')
    if 'content="noindex"' in html:errors.append(f'{f.name}: search indexing disabled')
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
assert (root/'CNAME').read_text().strip()=='singhasan.poemwithoutborders.org'
assert len(ET.parse(root/'sitemap.xml').getroot())==77
assert (root/'.nojekyll').exists()
assert not errors,'\n'.join(errors)
print('Validated 77 pages, 69 book sections, 68 distinct poem illustrations, links, assets, sitemap and production metadata.')

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
        assert f'listen.html#poem-{track["poem"]}' in (root/f'poem-{track["poem"]}.html').read_text()
    if track['id']=='introduction':
        assert 'listen.html#introduction' in (root/'intro.html').read_text()
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
