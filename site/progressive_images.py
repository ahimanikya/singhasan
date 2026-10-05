"""Native responsive images with an inline preview and no JavaScript dependency."""
from pathlib import Path
from html import escape
from html.parser import HTMLParser
import json,re

MANIFEST=json.loads((Path(__file__).parent/'responsive-images.json').read_text())
class ImageTag(HTMLParser):
    def handle_starttag(self,tag,attrs):
        self.attrs=dict(attrs)

def enhance_images(html):
    def image(match):
        parser=ImageTag();parser.feed(match[0]);a=parser.attrs
        source=a.get('src','');data=MANIFEST.get(source)
        if not data:return match[0]
        variants=data['variants'];classes=a.get('class','').split()
        portrait='portrait' in source
        avatar=portrait and int(a.get('width') or data['width'])<=96
        cover='front-cover-art' in classes
        ornament='section-ornament' in classes
        a['data-artwork-source']=source
        a['class']=' '.join(classes+['progressive-art'])
        a['src']=next((v['src'] for v in variants if v['width']>=960),variants[-1]['src'])
        a['srcset']=', '.join(f"{v['src']} {v['width']}w" for v in variants)
        if avatar:a['sizes']='52px'
        elif ornament:a['sizes']='(max-width: 760px) 130px, 190px'
        elif cover:a['sizes']='(max-width: 760px) min(86vw, 400px), 480px'
        elif portrait:a['sizes']='(max-width: 760px) 80vw, 320px'
        else:a['sizes']='(max-width: 760px) calc(100vw - 48px), (max-width: 1280px) 46vw, 580px'
        a['loading']='eager' if cover else 'lazy'
        a['fetchpriority']='high' if cover else ('low' if avatar or ornament else 'auto')
        a['decoding']='async'
        a['style']=a.get('style','').rstrip(';')+f';aspect-ratio:{a.get("width",data["width"])} / {a.get("height",data["height"])};background-image:url({data["preview"]})'
        return '<img '+ ' '.join(f'{k}="{escape(v or "",quote=True)}"' for k,v in a.items())+'>'
    return re.sub(r'<img\b[^>]*>',image,html)
