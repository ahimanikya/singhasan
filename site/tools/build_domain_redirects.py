"""Build the old-domain forwarding site; publish separately from the book."""
from pathlib import Path
from html import escape
import argparse
import json

OLD_HOST = 'singhasan.poemwithoutborders.org'
NEW_ORIGIN = 'https://singhasan.kabitawithoutborders.org'


def build(source, output):
    output.mkdir(parents=True, exist_ok=True)
    routes = sorted({p.name for p in source.glob('*.html')} | {'404.html'})
    for route in routes:
        destination = NEW_ORIGIN + ('/' if route == '404.html' else '/' + route)
        # Concatenate onto a fixed origin: even a // path cannot change the host.
        script = r"""(() => {
  const origin = %s;
  let path = window.location.pathname;
  if (window.location.hostname === 'ahimanikya.github.io') {
    path = path.replace(/^\/singhasan-redirect(?=\/|$)/, '') || '/';
  }
  const target = origin + path + window.location.search + window.location.hash;
  document.getElementById('continue').href = target;
  window.location.replace(target);
})();""" % json.dumps(NEW_ORIGIN)
        (output / route).write_text(f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Singhasan has moved</title><link rel="canonical" href="{escape(destination)}">
<noscript><meta http-equiv="refresh" content="0;url={escape(destination)}"></noscript>
<style>body{{max-width:36rem;margin:12vh auto;padding:1.5rem;background:#f5efdf;color:#263c3d;font:1.15rem/1.6 Georgia,serif}}a{{color:inherit}}</style>
</head><body><h1>Singhasan has a new home.</h1><p>Taking you to the same page at Kabita Without Borders.</p>
<p><a id="continue" href="{escape(destination)}">Continue reading Singhasan</a></p>
<script>{script}</script></body></html>''')
    (output / 'CNAME').write_text(OLD_HOST + '\n')
    (output / '.nojekyll').write_text('')
    (output / 'robots.txt').write_text('User-agent: *\nAllow: /\n')
    (output / 'README.md').write_text(f'''# Singhasan old-domain forwarding

This repository serves only redirects from https://{OLD_HOST} to {NEW_ORIGIN}.
JavaScript preserves paths, query parameters and fragments. Known pages also have a no-JavaScript redirect and canonical URL. GitHub Pages serves these as static pages, not HTTP 301 responses.

The book itself remains in https://github.com/ahimanikya/singhasan. Generate updates using its `site/tools/build_domain_redirects.py`; do not copy book content or private records here.
''')
    print(f'Built {len(routes)} redirect routes in {output}')


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--source', type=Path, default=Path(__file__).resolve().parents[1] / 'dist')
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    build(args.source, args.output)
