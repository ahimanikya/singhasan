import sys,unittest
from pathlib import Path
from html.parser import HTMLParser
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from progressive_images import enhance_images
class Tag(HTMLParser):
    def handle_starttag(self,tag,attrs):self.attrs=dict(attrs)
def image(html):
    p=Tag();p.feed(enhance_images(html));return p.attrs
class ProgressiveImagesTests(unittest.TestCase):
    def test_cover_is_prioritised_with_embedded_preview_and_reserved_space(self):
        a=image('<img class="front-cover-art" src="assets/artwork-2026-10-03/front-cover.png" width="1024" height="1536" alt="Throne &amp; roots">')
        self.assertEqual(a['loading'],'eager');self.assertEqual(a['fetchpriority'],'high')
        self.assertIn('data:image/webp;base64,',a['style']);self.assertIn('aspect-ratio:1024 / 1536',a['style'])
        self.assertEqual(a['alt'],'Throne & roots');self.assertIn('960w',a['srcset'])
    def test_poem_is_lazy_and_url_is_stable_across_builds(self):
        html='<img src="assets/artwork-2026-10-03/poem-01.webp" width="1536" height="1024" loading="eager" alt="Poem">'
        a=image(html);self.assertEqual(a['loading'],'lazy');self.assertEqual(enhance_images(html),enhance_images(html))
        self.assertIn('calc(100vw - 48px)',a['sizes']);self.assertNotIn('data-src',a)
    def test_native_images_keep_working_without_any_javascript(self):
        a=image('<img src="assets/artwork-2026-10-03/poet-portrait.webp" width="52" height="52" alt="Poet">')
        self.assertEqual(a['sizes'],'52px');self.assertTrue(a['src'].endswith('.webp'))
        self.assertIn('aspect-ratio:52 / 52',a['style'])
        self.assertEqual(enhance_images('<img src="assets/icons/paddy.svg" alt="">'),'<img src="assets/icons/paddy.svg" alt="">')
if __name__=='__main__':unittest.main()
