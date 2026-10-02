# ସିଂହାସନ · Singhasan

Pravakar Satapathy’s first Odia poetry collection, presented as an online book.

Live site: https://singhasan.poemwithoutborders.org/

The home page introduces the poet and five illustrated passages. Each poem has a permanent page in the Kabita Live reading style, with selectable verse, artwork, an English image narrative and reader tools. The illustrated book and quiet reader use the same source text. Quiet mode provides a continuous, text-only, paginated reader with local bookmarks, text sizing and underlining.

Permanent addresses such as `poem-1.html` open the regular poem page. “Read in the book” adds `?view=book` for the framed, illustrated book; “Read quietly” opens the spread containing the current poem. The main Quiet reading link starts at the title page. Sharing always returns the permanent poem address, and canonical metadata uses that same address.

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

## Design-system sync · 2 October 2026

The current Kabita Live guide, import hashes and book-specific application record are kept in `design-system/`. Refresh shared foundations with `python3 site/import_design_system.py --source "/path/to/Kabita Live"`, then review the page-specific adaptations in `site/dist/assets/kabita-sync.css` before rebuilding. The import does not overwrite Singhasan’s covers, illustration narratives, audio, source poems or device-local saved passages.

Quiet reading uses Kabita Live’s shared `reader-pagination.mjs` three-line opening rule. Run `node --test site/tests/reader-pagination.test.mjs` when changing pagination. The book retains image-free title/end leaves; its section chooser searches the introduction and all poems without changing the current place until Read section is chosen. Read the whole book starts at the title page regardless of the search.
