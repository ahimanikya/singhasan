"""Import approved Kabita Live foundations; retain book-specific layout separately."""
from pathlib import Path
import json,hashlib,shutil,argparse
ROOT=Path(__file__).resolve().parent
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--source',type=Path,default=Path('/Users/ahimanikya/Projects/Kabita Live'),help='Kabita Live working copy')
SOURCE=parser.parse_args().source
GUIDE=SOURCE/'kb/artifacts/design/brand-guide'
ASSETS=SOURCE/'projects/site/assets'
DEST=ROOT/'dist/assets'
ARCHIVE=ROOT.parent/'design-system'
ARCHIVE.mkdir(exist_ok=True)
manifest=[]
def copy(src,dest):
    dest.parent.mkdir(parents=True,exist_ok=True)
    shutil.copyfile(src,dest)
    manifest.append({'source':str(src),'local':str(dest.relative_to(ROOT.parent)),'sha256':hashlib.sha256(dest.read_bytes()).hexdigest()})
copy(GUIDE/'DESIGN-SYSTEM.md',ARCHIVE/'KABITA-LIVE-DESIGN-SYSTEM.md')
copy(GUIDE/'assets/brand-tokens.json',ARCHIVE/'brand-tokens.json')
for font in ['CormorantGaramond-Variable.ttf','CormorantGaramond-Italic-Variable.ttf','SourceSerif4-Variable.ttf','SourceSerif4-Italic-Variable.ttf','NotoSerifOriya-Variable.ttf','TiroDevanagariHindi-Regular.ttf','CormorantGaramond-OFL.txt','SourceSerif4-OFL.txt','NotoSerifOriya-OFL.txt','TiroDevanagariHindi-OFL.txt']:
    copy(ASSETS/'fonts'/font,DEST/'fonts'/font)
for icon in ['read','share','bookmark','next-poetic','paddy','talapatra','jhoti','menu','close','boita','footer-story','kendu','write','listen']:
    copy(ASSETS/f'icons/earth-voice-v1/ink/{icon}.svg',DEST/f'icons/{icon}.svg')
for asset in ['cotton-paper.webp','backgrounds/earth-wash.webp','backgrounds/monsoon-wash.webp']:
    copy(ASSETS/('backgrounds/cotton-paper.webp' if asset=='cotton-paper.webp' else asset),DEST/asset)
for asset in ['poetic-waterline.svg','reader-pagination.mjs']:
    copy(ASSETS/asset,DEST/asset)
tokens=json.loads((ARCHIVE/'brand-tokens.json').read_text())
roles={'Paper':'paper','Ink':'ink','Sea blue':'sea','Laterite':'rust','Hearth':'hearth','Muted ink':'muted','Pale paper':'panel','Rule':'line'}
css='/* Imported approved foundations. Book composition lives in book-pages.css. */\n'
for name,file,weight,style in [('Noto Serif Oriya','NotoSerifOriya-Variable.ttf','100 900','normal'),('Cormorant Garamond','CormorantGaramond-Variable.ttf','300 700','normal'),('Cormorant Garamond','CormorantGaramond-Italic-Variable.ttf','300 700','italic'),('Source Serif 4','SourceSerif4-Variable.ttf','200 900','normal'),('Source Serif 4','SourceSerif4-Italic-Variable.ttf','200 900','italic'),('Tiro Devanagari Hindi','TiroDevanagariHindi-Regular.ttf','400','normal')]:
    css+=f"@font-face{{font-family:'{name}';src:url('fonts/{file}') format('truetype');font-weight:{weight};font-style:{style};font-display:swap}}\n"
css+=':root{'+''.join(f'--{roles[k]}:{v};' for k,v in tokens['colours'].items())+"--display:'Cormorant Garamond',Georgia,serif;--serif:'Source Serif 4',Georgia,serif;--odia:'Noto Serif Oriya',serif;--ui:Arial,'Noto Serif Oriya',sans-serif;--reading-leading:1.95;--book-binding:#735035;--book-desk:#e5dfce;}\n"
css+='body.night{--paper:#1c292b;--panel:#293a3b;--ink:#f3eadb;--muted:#c0bcae;--rust:#eeaa8b;--sea:#a9c9c8;--hearth:#cbb58c;--line:#4a5653;--book-binding:#101c1e;--book-desk:#142022;color-scheme:dark}\n'
css+="[lang=or]{font-synthesis:none;letter-spacing:normal}.reading-page #experience-verse:is([lang=hi],[lang=mr]),.poem-heading h1:is(:lang(hi),:lang(mr)){font-family:'Tiro Devanagari Hindi',serif;font-weight:400;font-synthesis:none}a:focus-visible,button:focus-visible,summary:focus-visible,select:focus-visible{outline:2px solid var(--sea);outline-offset:4px}.poem-actions button{min-height:48px}.poem-actions button:disabled{opacity:.45;cursor:default}\n"
(DEST/'kabita-foundations.css').write_text(css)
(ARCHIVE/'IMPORT-MANIFEST.json').write_text(json.dumps({'imported':'2026-10-02','assets':manifest,'adaptation':'Book identity, biography, covers and attribution preferences remain specific to Singhasan.'},ensure_ascii=False,indent=2))
print(f'Imported {len(manifest)} design-system sources and assets.')
