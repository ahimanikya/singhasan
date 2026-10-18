"""Publish the reviewed literary record without private research dependencies."""
from pathlib import Path
import json
import shutil

ROOT = Path(__file__).resolve().parent
SOURCE = ROOT / 'articles/pravakar-satapathy'
ROUTE = 'pravakar-satapathy-writings.html'
TITLE = 'Pravakar Satapathy · Writings & conversations'
DESCRIPTION = 'Explore Pravakar Satapathy’s books, poems, interviews and literary life, with a source-linked catalogue and notes on work still to be traced.'

def render_literary_record():
    assets = ROOT / 'dist/assets'
    for extension in ('css', 'js'):
        shutil.copyfile(SOURCE / f'article.{extension}', assets / f'pravakar-satapathy.{extension}')
    for cover in json.loads((SOURCE / 'covers.json').read_text()):
        for item in (cover, cover.get('back_cover')):
            if item:
                relative = Path(item['asset']).relative_to('assets')
                target = assets / 'pravakar-satapathy' / relative
                target.parent.mkdir(parents=True, exist_ok=True)
                shutil.copyfile(SOURCE / item['asset'], target)
    return (SOURCE / 'body.html').read_text()
