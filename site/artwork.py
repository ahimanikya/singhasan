"""Resolve stable artwork names to the selected, versioned book images."""
from pathlib import Path
import json

MANIFEST = json.loads((Path(__file__).parent / 'artwork.json').read_text())
ASSETS = {item['original']: item['asset'] for item in MANIFEST['items']}

def image_asset(path):
    return ASSETS.get(path, path)

def resolve_artwork(html):
    for original, asset in ASSETS.items():
        html = html.replace(original, asset)
    return html
