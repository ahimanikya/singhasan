# ସିଂହାସନ · Singhasan

Pravakar Satapathy’s first Odia poetry collection, presented as an online book.

Live site: https://singhasan.poemwithoutborders.org/

The home page introduces the poet and five illustrated passages. Each poem has a permanent page in the Kabita Live reading style, with selectable verse, artwork, an English image narrative and reader tools. The illustrated book and quiet reader use the same source text. Quiet mode uses the same full-page book with poem illustrations hidden, the same illustrated covers, local bookmarks, text sizing and underlining.

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

## Design-system sync · 4 October 2026

The current Kabita Live guide, import hashes and book-specific application record are kept in `design-system/`. Refresh shared foundations with `python3 site/import_design_system.py --source "/path/to/Kabita Live"`, then review the page-specific adaptations in `site/dist/assets/kabita-sync.css` before rebuilding. The import does not overwrite Singhasan’s covers, illustration narratives, audio, source poems or device-local saved passages.

Quiet reading uses Kabita Live’s shared `reader-pagination.mjs` three-line opening rule. Run `node --test site/tests/reader-pagination.test.mjs` when changing pagination. Quiet reading retains the identical illustrated front and back covers; only interior poem illustration leaves are hidden. Its section chooser searches the introduction and all poems without changing the current place until Read section is chosen. Read the whole book starts at the title page regardless of the search.


## Listen and follow

`read-along.html` keeps one audio player alive while displaying the unified book in a same-origin frame. The headphones link in a poem or introduction opens its recording at the visible passage; the listening page also hands over the current playback time. Play, pause, replay ten seconds, speed, manual browsing and resume following are available. Continuous listening runs from the English welcome and cover through the introduction, poems and English closing/back cover.

Audio-driven page turns use acoustic word timings tied to the exact recording hash and original source offsets. Changing text size or viewport therefore preserves the spoken passage. Timings and generation provenance are in `site/dist/assets/audio-sync/` and `site/alignment/`. These are machine alignments, awaiting fluent listening review. The existing introduction and Poem 50 recordings appear to omit terminal source text; their automatic following is disabled and the player explains why. The other 67 poems have complete acoustic cue coverage. The original words and audio are preserved.

Rebuild and validate after replacing any recording. Timings must be regenerated for a new take; never derive them from the recording duration. See `site/alignment/README.md` for the reproducible alignment and completeness audit.

## Reader contact and responses · 3 October 2026

`contact.html` accepts private notes for the poet’s family. The Send message form writes directly to the dedicated Firebase feedback collection, with the poem context preserved. Receipt is confirmed only after the atomic message/throttle write succeeds; failures retain the entered text. Messages are private and require editor access; automatic email notifications are not configured.

All 68 standalone poems include a Like button, a collapsed Comments section with explicit publication consent, and a private-contact link within the comments form. These are excluded from illustrated and quiet reading. The interaction code and visual patterns are adapted from Kabita Live. No Kabita Live cloud configuration, reader records or analytics IDs have been imported.

The separate Singhasan Firebase service runs in the dedicated `singhasan` project and web app on the Spark plan. Anonymous authentication is enabled with the user's explicit approval. The default Firestore database is in `nam5` (Standard edition); the reviewed rules and the `publicComments` index are deployed. Live checks verified anonymous sign-in, atomic like/unlike, rejection of forged counts, private pending comments, and rejection of reader self-publication. `site/dist/runtime-config.json` enables likes and public comments and enables private database feedback. The public site uses anonymous browser identities; it does not require named registration.

The site's `allowedHosts` check scopes its own interface to `singhasan.poemwithoutborders.org`. Firebase's authorized-domain list applies to OAuth redirects, not anonymous authentication, and was left unchanged. Security is enforced by the Firestore rules; the public web-app API key is not a secret.

After installing the pinned dependencies in `site/services`, `npm run build` bundles the reader services into the static site. `npm test` checks private form submission, retained text on failure, duplicate-submit prevention and unavailable-service handling. `npm run test:rules` uses a local Firestore emulator (Java 21+) to test private-message access, atomic likes, rate limits and moderation. The build continues to use Python and GitHub Pages; adding these components does not require migrating the book to Astro.

Keep using the existing project and database; do not create replacements during maintenance. Deploy changes to `site/services/firestore.rules` and `firestore.indexes.json` deliberately, then verify the affected reader operations before publishing. The user enabled `privateFeedback` on 4 October 2026. Private notes are stored in Firestore without email notifications; review the `feedback` collection through the Firebase console or an authenticated editor client.

Public comments default to review before publication. In the dedicated project’s console, review `commentSubmissions`; publish only the exact `poemId`, `name`, `message`, and current `publishedAt` to `publicComments` using the same record ID, then mark the source `published`. Never copy UID or private contact fields into public comments. Reject by keeping a submission out of the public collection. The tested editor-client rules require source status and public record changes in one atomic batch; Console administrative writes bypass those client rules. Anonymous likes are per browser identity, not verified-person votes.

The wider Kabita Live technology comparison: shared design tokens, icons, accessibility patterns, reader settings, bookmarks and underlining are already present; moderated responses and private correspondence are now adapted. Pagefind site-wide search and Astro build migration remain optional. Analytics and named reader accounts are not added by this change.

## One reader, illustration option · 3 October 2026

Quiet reading uses the same cover templates, dimensions, page frame, navigation, typography and selected paper surface as illustrated reading. It hides interior poem illustration leaves while retaining the same front-cover artwork and back-cover portrait/landscape as Illustrated. There is no separate quiet cover/end-page route.

The standalone ସିଂହଦ୍ଵାର page has no English Introduction eyebrow. Its prose pages extend to align their controls with the bottom of the right-hand companion on desktop; phones use a taller viewport-based page. Text reflows without changing source words or saved anchors.

## Current editorial phase · 4 October 2026

Audio generation, replacements and listening review are deferred. Human Natural Translation is installed and versioned under `site/editorial/skills/human-natural-translation/`. English, Tamil and Hindi are first, with a proposed complete-poem pilot using 1, 21 and 24; other languages remain planned. No translations have been published. See `site/editorial/translation-review/PLAN.json`.

The updated Kabita Live comparison is `design-system/AUDIT-2026-10-04.json`. Search remains in the existing reader tools, as requested for a single book; Contents keeps its current design. Illustrated is the default book mode and starts with paper-turn animation on. Quiet starts with animation off; each mode retains its own explicit choice. Sound stays opt-in and reduced-motion preferences override animation. Translation links retain the chosen language when turning pages, leaving the reader and sharing. An unavailable language falls back visibly to Odia. Source poems and saved-reading data formats are unchanged.

The reader walkthrough is prepared under `review/reader-walkthrough-2026-10-04.html`, outside the published site. Its choices are for the user to review; automated verification does not count as user approval.

## Selected book typography · 4 October 2026

The user selected option B, Anek Odia, for the masthead and front-cover title (weight 600), with the cover poet name at weight 400. The font and its OFL license are self-hosted. Shared HTML covers carry selectable text over the preserved artwork. The matching 1280×1920 social cover is `assets/covers/singhasan-anek-2026-10-04.png`; its source composition and selection record are in `design-system/type-study-2026-10-04/`. On 4 October 2026, the user confirmed Noto Serif Oriya as the approved poem-reading font across standalone, Illustrated and Quiet reading; the Anek reading comparison is closed. It remains alongside Source Serif 4 for English prose and Cormorant Garamond for English display headings.

The poet profile includes the family-supplied age of 85 and an invitation to arrange a visit in Bhubaneswar through Contact. Review the age when updating the biography; no birth date is inferred.

Privacy preference: never display the family’s personal email address in public pages, mailto links, client scripts or runtime configuration. Reader contact uses the private Firebase form only.

Poem endings use three small botanical SVG fleurons in a stable cycle (leaf, paired leaves, seed). A poem retains its ornament across its standalone page and both reader modes. In the reader it appears below the final text column only; it follows the last line where space permits, or rests on the footer rule without changing pagination. The ornaments are decorative, outside the source-text container and hidden from assistive technology. After reviewing both full-page previews, the user selected masthead A (Throne & earth): a restrained throne icon beside the Anek Odia 600 title. Both complete logo templates are preserved in `site/templates/masthead-a.html` and `masthead-b.html`, with variant styles and SVG marks retained for future use. A is active; B (Literary wordmark with leaf underline) remains available. The throne favicon and cover artwork are unchanged.

Standalone poem closing layout: navigation and reader responses align with the poem column; the Like and collapsed Comments controls share a compact row. Opening Comments expands the existing form below. Reduced end spacing and footer art apply only to standalone pages, preserving reader pagination and other page footers.

The poem header contains reading controls only. Like is offered once, in the reader-response section below the poem; no top heart shortcut is rendered.
