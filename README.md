# ସିଂହାସନ · Singhasan

Pravakar Satapathy’s first Odia poetry collection, presented as an online book.

Live site: https://singhasan.poemwithoutborders.org/

The home page introduces the poet and five illustrated passages. Each poem has a permanent page in the Kabita Live reading style, with selectable verse, artwork, an English image narrative and reader tools. The illustrated book and quiet reader use the same source text. Quiet mode uses the same full-page book with illustrations hidden, local bookmarks, text sizing and underlining.

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

Quiet reading uses Kabita Live’s shared `reader-pagination.mjs` three-line opening rule. Run `node --test site/tests/reader-pagination.test.mjs` when changing pagination. Quiet reading retains the same framed front and back covers, with real title text and the same back-cover copy; illustrations are hidden. its section chooser searches the introduction and all poems without changing the current place until Read section is chosen. Read the whole book starts at the title page regardless of the search.


## Listen and follow

`read-along.html` keeps one audio player alive while displaying the unified book in a same-origin frame. The headphones link in a poem or introduction opens its recording at the visible passage; the listening page also hands over the current playback time. Play, pause, replay ten seconds, speed, manual browsing and resume following are available. Continuous listening runs from the English welcome and cover through the introduction, poems and English closing/back cover.

Audio-driven page turns use acoustic word timings tied to the exact recording hash and original source offsets. Changing text size or viewport therefore preserves the spoken passage. Timings and generation provenance are in `site/dist/assets/audio-sync/` and `site/alignment/`. These are machine alignments, awaiting fluent listening review. The existing introduction and Poem 50 recordings appear to omit terminal source text; their automatic following is disabled and the player explains why. The other 67 poems have complete acoustic cue coverage. The original words and audio are preserved.

Rebuild and validate after replacing any recording. Timings must be regenerated for a new take; never derive them from the recording duration. See `site/alignment/README.md` for the reproducible alignment and completeness audit.

## Reader contact and responses · 3 October 2026

`contact.html` accepts private notes addressed to Ahimanikya at ahimanikya@gmail.com on the poet’s behalf. Its current delivery is an email draft that the reader reviews and sends. Poem-specific links include the source poem. It does not claim that opening a draft delivers the message.

All 68 standalone poems include a Like button, a collapsed Comments section with explicit publication consent, and a private-note link. These are excluded from illustrated and quiet reading. The interaction code and visual patterns are adapted from Kabita Live. No Kabita Live cloud configuration, reader records or analytics IDs have been imported.

The separate Singhasan Firebase service is prepared under `site/services/`. On 3 October the dedicated `singhasan` project and web app were created on the Spark plan through the authenticated console; their public configuration is saved locally. `site/dist/runtime-config.json` deliberately leaves Firebase, likes, public comments and private database feedback disabled. The local UI says that public responses are unavailable; no placeholder counts or pretend submission successes are used. Firebase CLI access on 3 October reported expired credentials; console access works. Automatic approval review blocked enabling anonymous authentication pending explicit user consent for that provider. Firestore, rules deployment, live verification and activation remain outstanding.

After installing the pinned dependencies in `site/services`, `npm run build` bundles the reader services into the static site. `npm test` checks private email delivery preparation. `npm run test:rules` uses a local Firestore emulator (Java 21+) to test private-message access, atomic likes, rate limits and moderation. The build continues to use Python and GitHub Pages; adding these components does not require migrating the book to Astro.

Continue setup in the existing `singhasan` project and registered web app (do not create duplicates): after the pending provider approval, enable anonymous Auth and Firestore, authorize only `singhasan.poemwithoutborders.org`, deploy the provided rules and indexes, then fill in its public web-app configuration. Verify temporary live records and clean up only those records before enabling likes and public comments. Leave `privateFeedback` false to keep messages delivered through the reader’s email app to the requested email address. Turning that flag on would instead save private notes in Firestore; it does not send email notifications.

Public comments default to review before publication. In the dedicated project’s console, review `commentSubmissions`; publish only the exact `poemId`, `name`, `message`, and current `publishedAt` to `publicComments` using the same record ID, then mark the source `published`. Never copy UID or private contact fields into public comments. Reject by keeping a submission out of the public collection. The tested editor-client rules require source status and public record changes in one atomic batch; Console administrative writes bypass those client rules. Anonymous likes are per browser identity, not verified-person votes.

The wider Kabita Live technology comparison: shared design tokens, icons, accessibility patterns, reader settings, bookmarks and underlining are already present; moderated responses and private correspondence are now adapted. Pagefind site-wide search and Astro build migration remain optional. Analytics and reader accounts are not added by this change.

## One reader, illustration option · 3 October 2026

Quiet reading uses the same cover templates, dimensions, page frame, navigation, typography and selected paper surface as illustrated reading. It hides cover art, portrait/landscape artwork and poem illustration leaves. The front title and poet’s name are rendered as text when its lettered artwork is hidden; the back-cover prose is unchanged. There is no separate quiet cover/end-page route.

The standalone ସିଂହଦ୍ଵାର page has no English Introduction eyebrow. Its prose pages extend to align their controls with the bottom of the right-hand companion on desktop; phones use a taller viewport-based page. Text reflows without changing source words or saved anchors.
