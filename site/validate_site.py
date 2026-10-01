"""Check publication routes, assets and original book completeness before deployment."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit,unquote
import hashlib,json,re,xml.etree.ElementTree as ET
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
assert len(pages)==74, 'Expected home, contents, two covers, poet, introduction and 68 poems'
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
    assert f'assets/poems/unique/poem-{n:02}.png' in html and 'class="illustration-reading"' in html
assert len({hashlib.sha256((root/f'assets/poems/unique/poem-{n:02}.png').read_bytes()).hexdigest() for n in range(1,69)})==68
assert (root/'CNAME').read_text().strip()=='singhasan.poemwithoutborders.org'
assert len(ET.parse(root/'sitemap.xml').getroot())==74
assert (root/'.nojekyll').exists()
assert not errors,'\n'.join(errors)
print('Validated 74 pages, 69 book sections, 68 distinct poem illustrations, links, assets, sitemap and production metadata.')

# Every permanent poem URL renders the same source text and exposes the book view.
for chapter in book['chapters']:
    name='intro.html' if not chapter['number'] else f"poem-{chapter['number']}.html"
    html=(root/name).read_text()
    assert 'reading-page standalone-page' in html, name
    assert f'href="{name}?view=book"' in html, name
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
