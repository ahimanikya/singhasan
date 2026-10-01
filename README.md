# ସିଂହାସନ · Singhasan

Pravakar Satapathy’s first Odia poetry collection, presented as an online book.

Live site: https://singhasan.poemwithoutborders.org/

The home page introduces the poet and five illustrated passages. The illustrated book pairs each poem with artwork and an English image narrative. Quiet mode provides a continuous, text-only, paginated reader with local bookmarks, text sizing and underlining.

## Build and preview

Requires Python 3.12 or later; no third-party packages are required.

```sh
python3 site/build_pages.py
python3 site/validate_site.py
python3 -m http.server 8768 --directory site/dist
```

`site/dist/book.js` contains the original Odia text. Edit templates and the page builder in `site/`, and styles, reader scripts and artwork in `site/dist/assets/`. Future translations belong in `site/translations/`; only entries marked `ready` are published.

## Publishing

Push to `main` to build, validate and deploy `site/dist` to GitHub Pages. The custom domain is `singhasan.poemwithoutborders.org`; its DNS CNAME points to `ahimanikya.github.io`. The main poemwithoutborders.org website is hosted separately.

The poems and illustrations are not offered under an open-source license. Font license files accompany the bundled fonts.
