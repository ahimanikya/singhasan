"""Encode selected artwork for sharing; do not crop or alter the artwork.
Run after an artwork change. Ordinary builds use the committed manifest/assets.
"""
from pathlib import Path
import hashlib,json,sys
from PIL import Image,ImageOps
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT))
from social_metadata import page_image,COVER
from translation_article import ROUTE as ARTICLE_ROUTE
DIST=ROOT/'dist';OUT=DIST/'assets/social';OUT.mkdir(exist_ok=True)
manifest={}
routes=[ARTICLE_ROUTE,'index.html','book.html','author.html','contact.html','contents.html','intro.html','back-cover.html','listen.html','read-along.html']+[f'poem-{n}.html' for n in range(1,69)]
for source in sorted({page_image(route) for route in routes}):
    path=DIST/source;digest=hashlib.sha256(path.read_bytes()).hexdigest()
    with Image.open(path) as original:
        if source==COVER:
            width,height=original.size
            suffix,mime=('.png','image/png') if original.format=='PNG' else ('.jpg','image/jpeg')
            target=OUT/f'{path.stem}-{digest[:12]}{suffix}'
            if not target.exists():target.write_bytes(path.read_bytes())
        else:
            target=OUT/f'{path.stem}-{digest[:12]}-v1.jpg';mime='image/jpeg'
            im=ImageOps.exif_transpose(original).convert('RGBA')
            im.thumbnail((1200,1200),Image.Resampling.LANCZOS)
            canvas=Image.new('RGB',im.size,'#F5EFDF');canvas.paste(im,mask=im.getchannel('A'))
            width,height=canvas.size
            if not target.exists():canvas.save(target,'JPEG',quality=88,optimize=True,progressive=True)
    manifest[source]={'source_sha256':digest,'src':str(target.relative_to(DIST)),'width':width,'height':height,'type':mime,'bytes':target.stat().st_size,'sha256':hashlib.sha256(target.read_bytes()).hexdigest()}
(ROOT/'social-images.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
print(f'Prepared {len(manifest)} sharing images for {len(routes)} pages; no artwork cropped.')
