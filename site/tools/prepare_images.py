"""Prepare responsive copies once; regular builds use the committed manifest.
Run after changing artwork with Python + Pillow. Original artwork stays intact.
"""
from pathlib import Path
from PIL import Image, ImageOps
from io import BytesIO
import base64, hashlib, json, re

ROOT=Path(__file__).resolve().parents[1]
DIST=ROOT/'dist'
OUT=DIST/'assets/responsive'
OUT.mkdir(exist_ok=True)
manifest_path=ROOT/'responsive-images.json'
old=json.loads(manifest_path.read_text()) if manifest_path.exists() else {}
sources={item['asset'] for item in json.loads((ROOT/'artwork.json').read_text())['items']}
# Include the small companion ornaments that do not belong to the art manifest.
for page in DIST.glob('*.html'):
    sources.update(re.findall(r'<img\b[^>]*\b(?:src|data-artwork-source)="(assets/[^"?]+\.(?:png|webp|jpg))"',page.read_text()))
sources={s for s in sources if not s.startswith('assets/responsive/')}
result={}
for source in sorted(sources):
    path=DIST/source
    digest=hashlib.sha256(path.read_bytes()).hexdigest()
    previous=old.get(source,{})
    if previous.get('source_sha256')==digest and previous.get('recipe')==1 and all((DIST/v['src']).exists() for v in previous.get('variants',[])) and previous.get('variants'):
        result[source]=previous
        continue
    im=ImageOps.exif_transpose(Image.open(path)).convert('RGBA' if 'A' in Image.open(path).getbands() else 'RGB')
    width,height=im.size
    prefix=f'{path.stem}-{digest[:12]}-v1'
    variants=[]
    for size in sorted({min(width,s) for s in (96,480,960,1440)}):
        copy=im.resize((size,round(height*size/width)),Image.Resampling.LANCZOS)
        target=OUT/f'{prefix}-{size}.webp'
        copy.save(target,'WEBP',quality=82,method=6)
        variants.append({'src':str(target.relative_to(DIST)),'width':size,'bytes':target.stat().st_size})
    preview=im.copy();preview.thumbnail((32,32),Image.Resampling.LANCZOS)
    data=BytesIO();preview.save(data,'WEBP',quality=35,method=6)
    result[source]={'recipe':1,'source_sha256':digest,'width':width,'height':height,'preview':'data:image/webp;base64,'+base64.b64encode(data.getvalue()).decode(),'variants':variants}
manifest_path.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(f'Prepared {len(result)} artwork families. Unchanged artwork keeps the same URLs.')
