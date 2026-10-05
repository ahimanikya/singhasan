# Singhasan — current design system

Updated 4 October 2026. This is the book-specific application of the imported [Kabita Live design system](KABITA-LIVE-DESIGN-SYSTEM.md). The decisions here take precedence for Singhasan. Imported tokens, font licences and source snapshots remain intact; do not overwrite Kabita Live’s own rules with single-book exceptions.

## Identity and type

- Active masthead: **A, Throne & earth**. Preserve both `site/templates/masthead-a.html` and `masthead-b.html` for future use. The A/B masthead choice is separate from the earlier type study, whose option B selected Anek Odia.
- Masthead and cover title: Anek Odia, weight 600; cover poet name: weight 400. Align the throne mark to the title’s visible letterforms. Keep the throne favicon.
- Original poems: **Noto Serif Oriya** in standalone pages and both reader settings. Do not substitute Anek for verse. English prose uses Source Serif 4; English display headings use Cormorant Garamond. Use the existing script-specific fonts for translations.
- Keep the shared paper, ink, laterite and sea-blue palette. Woven cloth, earth wash and monsoon wash are reader options. Night mode removes paper textures and retains readable contrast.
- The public edition presents the poems without PDF references, image-generation credits or unsolicited attribution labels. Preserve internal provenance and required font licences.

## Page roles and navigation

- **Home** narrates the book and poet’s world, with artwork, exact poem extracts and English commentary. Keep one primary reading action in the opening. The home cover links to **Poems** (`contents.html`); the separate “Read the book” action enters the reader.
- The closing home invitation offers Read the book, Listen to the audiobook and Browse all poems. Retain Listen in top navigation.
- Use **Poems**, replacing the visible label Contents. Preserve `contents.html` so existing links continue to work. This single-book catalogue keeps its existing opening-line list and limited search; no journal-wide filters are required.
- Standalone poem pages remain permanent, shareable destinations. Their “In the book” panel includes illustrated and quiet entry links. Reader tools keep language, size, surface and saved passages; optional search and saved-item controls stay folded.
- The poet profile is a substantial biography without a contribution list. Family-supplied age and visiting invitation require periodic review; never infer a birth date. Contact uses the private Firebase form. Do not publish the family’s personal email address.

## One book reader

- Illustrated is the default. Quiet is a setting of the same reader: same covers, frame, source text, typography, language, saved place and exit behaviour.
- Each interior illustration and its English image narrative occupy **one leaf**. The poem starts on the **next leaf**: facing right on desktop, after one turn on a phone. There is no separate image-story page. Translations use the same sequence.
- Give the English illustration narrative a narrow, left-aligned measure with balanced side margins, including its heading. Use up to 40ch on desktop and at least 16px inset on each side on phones. Preserve its wording and natural wrapping; do not invent verse line breaks in the narrative. Apply this to the standalone companion and the illustrated leaf.
- Preserve the illustration’s composition with `object-fit: contain`. The combined leaf may scroll internally on an unusually short screen so its narrative is never clipped. Do not shrink the verse to make artwork fit.
- Quiet omits interior illustration leaves but keeps the front and back covers. Page numbers reflect the actual leaves in the selected mode; bookmarks use source line/character anchors, not page numbers.
- Two leaves on desktop, one on phones, with folios on their own pages and the approved shaded centre separator. Page turns animate the whole paper area, including headings and margins.
- Illustrated turns default on; Quiet turns default off. Save each mode’s explicit preference independently. Respect reduced motion; page sound is opt-in.
- Exit reader returns to the entry page, its language and reading/scroll position. Browsing links belong outside the reader tools. Keep source text selectable and complete.

## Audio and responses

- Audio is available for **Odia only**. Entering Listen & follow switches interior illustrations off; the reader may explicitly turn them back on. Changing to a translated language pauses and disables Odia playback.
- Keep the player compact. Use progressive spoken-word colouring from verified recording-specific timings. Never invent timing from poem length; preserve notices where existing recordings omit source text.
- The existing English, Hindi, Bengali and Tamil translations are available alongside Odia. Publication and editorial review status are separate; do not imply that every draft has completed human review.
- Offer Like once below the poem, never in the poem header. Like and collapsed Comments share a compact row. Opening Comments exposes one text box and a submission action; publication remains moderated. Service notices stay inside the disclosure.
- Standalone poem footers have no previous/next page navigation. Page controls belong in the reader.

## Ornament and footer

- Use the **same grass-and-stone earth artwork** at the far left and right of every normal site footer, with consistent scale: 56px landscape height, 110px side elements, 12px top margin. The full-page reader hides the site footer.
- Do not restore the central throne or boat to the footer. Throne imagery remains appropriate for the favicon, masthead and the Poems page.
- Three botanical closing fleurons rotate predictably by poem; a poem keeps the same motif in standalone and reader views. Place it after the final line or on the footer rule when necessary.
- Use the small throne, reeds and palm line drawings only in genuine spare space. A blank facing leaf may carry one drawing. A finished text leaf may carry a smaller drawing below its ending when at least 170px remains after a 56px separation. Never overlay verse or insert a decorative extra page.
- The home visual-story opening uses a restrained palm line drawing. Ornaments are decorative, hidden from assistive technology and outside source text. White space remains part of the design; do not fill every gap.

## Image loading

- Keep approved masters unchanged. Generate responsive WebP sizes and a tiny inline preview; reserve the correct aspect ratio to avoid layout jumps.
- Prioritise the visible cover, lazy-load other artwork, and reveal loaded images gently while respecting reduced motion. Quiet mode should not eagerly fetch hidden interior artwork.
- Use content-derived filenames that remain stable across text-only builds. `site/tools/prepare_images.py` produces the committed responsive manifest and files; normal builds do not require Pillow.

## Link previews

Render canonical, Open Graph and large-image Twitter metadata into the initial HTML of **every public page**. Crawlers must not need JavaScript, a signed-in session or a reader interaction to discover the image.

| Page | Sharing image |
| --- | --- |
| Home, front cover, listening collection and Listen & follow | Complete lettered front cover |
| Poet profile and Contact the poet | Approved poet portrait |
| Each poem | That poem’s selected illustration |
| Opening prose | Its threshold/flute illustration |
| Poems catalogue | Its stone-throne artwork |
| Back cover | Its closing landscape artwork |

Use absolute HTTPS image addresses, matching MIME type and actual dimensions, descriptive image alt text, and a page-specific title and description. Generate lightweight JPEG sharing copies of artwork without cropping; reuse the complete lettered cover export in its actual file format. Keep source hashes and stable image URLs in `site/social-images.json`.

`site/tools/prepare_social_images.py` prepares the files when artwork changes. Ordinary page builds read the committed manifest. The validator checks all 77 pages and the source/output hashes. Updating the website cannot force a social service to discard a previously cached preview; actual card cropping and refresh timing belong to the sharing service.

## Verification and release

Build and validate the edition before release. Check desktop and phone page entry, final leaves, Quiet switching, translations and saved source anchors when pagination changes. Check response and audio behaviour with the relevant existing tests. Verify footer scale and navigation labels on home, poem, catalogue and contact pages.

A local build is not a deployment. Record publishing separately. Keep private editorial reviews and family notes out of the public site and commits unless explicitly authorised.
