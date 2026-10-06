# Singhasan — current design system

Updated 5 October 2026. This is the book-specific application of the imported [Kabita Live design system](KABITA-LIVE-DESIGN-SYSTEM.md). The decisions here take precedence for Singhasan. Imported tokens, font licences and source snapshots remain intact; do not overwrite Kabita Live’s own rules with single-book exceptions.

Use alongside the [book-site rulebook](BOOK-SITE-RULEBOOK.md) for editorial/product constraints and the [change checklist](CHANGE-CHECKLIST.md) for verification. The latest explicit user decision controls when updating these documents.

## Identity and type

- Active masthead: **A, Throne & earth**. Preserve both `site/templates/masthead-a.html` and `masthead-b.html` for future use. The A/B masthead choice is separate from the earlier type study, whose option B selected Anek Odia.
- Masthead and cover title: Anek Odia, weight 600; cover poet name: weight 400. Align the throne mark to the title’s visible letterforms. Keep the throne favicon.
- Original poems: **Noto Serif Oriya** in standalone pages and both reader settings. Do not substitute Anek for verse. English prose uses Source Serif 4; English display headings use Cormorant Garamond. Use the existing script-specific fonts for translations.
- Keep the shared paper, ink, laterite and sea-blue palette. Woven cloth, earth wash and monsoon wash are reader options. Night mode removes paper textures and retains readable contrast.
- The public edition presents the poems without PDF references, image-generation credits or unsolicited attribution labels. Preserve internal provenance and required font licences.

## Page roles and navigation

- **Home** narrates the book and poet’s world, with artwork, exact poem extracts and English commentary. Keep one primary reading action in the opening. The home cover links to **Poems** (`contents.html`); the separate “Read the book” action enters the reader.
- The translation essay has a small illustrated home feature after the five visual-story scenes and before the reading invitation. Its permanent route is `thirty-languages-and-the-journey-of-a-poem.html`. The translation essay is linked from **Our Story**; the shared footer links to Our Story with a matching icon. The main menu stays focused on the book. The essay is not an additional book chapter or a claim that thirty translated editions are available.
- The closing home invitation offers Read the book, Listen to the audiobook and Browse all poems. Retain Listen in top navigation.
- Use **Poems**, replacing the visible label Contents. Preserve `contents.html` so existing links continue to work. This single-book catalogue keeps its opening-line list, without a search field, search prompt or section count; no journal-wide filters are required.
- **Suggested reading path:** Home has a small “Not sure where to begin?” invitation linking to `contents.html#reading-path`. Poems contains the compact five-stop sequence “Power and the people” (1 → 24 → 6 → 38 → 62), short editorial labels and Start reading. Use a two-column introduction/list layout on wide screens and a single column on phones; each stop has its poem number above its title, never three cramped inline text columns. No separate illustrated guide, duplicate image narrative, extra main-menu item or change to the homepage’s storytelling. The contextual panel on those five standalone poems appears only when `path=power-and-people` is present; it preserves language and links to the next stop/Poems overview. Keep it outside the bound reader; no chapter reordering or footer previous/next navigation.
- Standalone poem pages remain permanent, shareable destinations. Their “In the book” panel includes illustrated and quiet entry links. The page toolbar keeps a visible language selector alongside Listen (Odia only), Bookmarks, Share and Read quietly. These form one line of 44px controls with accessible names and hover/keyboard tooltips. There is no page text-size control. Bookmarks opens saved places and passages, with a save/remove action on the current poem; normal pages have no reading-settings panel. The full-screen book retains its existing text-size and reading settings.
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
- The eleven complete translations—English, Hindi, Bengali, Tamil, Telugu, Malayalam, Kannada, Marathi, Gujarati, Assamese and Urdu—are available alongside Odia. Publication and editorial review status are separate; do not imply that every draft has completed human review.
- Offer Like once below the poem, never in the poem header. Like and collapsed Comments share a compact row. Opening Comments exposes one text box and a submission action; publication remains moderated. Service notices stay inside the disclosure.
- Standalone poem footers have no previous/next page navigation. Page controls belong in the reader.

## Ornament and footer

- Use the **same grass-and-stone earth artwork** at the far left and right of every normal site footer, with consistent scale: 56px landscape height, 110px side elements, 12px top margin. The full-page reader hides the site footer.
- Footer navigation uses The poet, Poems, Our Story and Contact: matching icon-and-label links on desktop and four 44px icon-only targets on phones with accessible names. Our Story (`our-story.html`) gathers the translation essay, Poem Without Borders homepage/story links and the user-requested credit to Ahimanikya Satapathy for reimagining and designing this online edition. Do not repeat the credit or external project links in every footer.
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
| Translation essay | Its two-readers lead illustration |
| Our Story | Complete lettered front cover |

Use absolute HTTPS image addresses, matching MIME type and actual dimensions, descriptive image alt text, and a page-specific title and description. Generate lightweight JPEG sharing copies of artwork without cropping; reuse the complete lettered cover export in its actual file format. Keep source hashes and stable image URLs in `site/social-images.json`.

`site/tools/prepare_social_images.py` prepares the files when artwork changes. Ordinary page builds read the committed manifest. The validator checks all 79 pages and the source/output hashes. Updating the website cannot force a social service to discard a previously cached preview; actual card cropping and refresh timing belong to the sharing service.

## Urdu typography

- Urdu is the final planned translation language. Use self-hosted Noto Nastaliq Urdu with its OFL license, including the poem title. The complete Urdu edition is selected for the 6 October release; fluent review remains separate.
- Set Urdu stanza direction to RTL and align right. Keep the shared Odia book’s page sequence; do not reverse the column container. Mirror hanging indents and leave a small inset for Nastaliq overhang.
- Use 2.65 line height for verse and 2.2 for headings to protect the script’s ascenders and descenders. Saved anchors follow logical character order rather than assuming Latin left-to-right character positions. Audio remains Odia-only.

## Verification and release

Build and validate the edition before release. Check desktop and phone page entry, final leaves, Quiet switching, translations and saved source anchors when pagination changes. Check response and audio behaviour with the relevant existing tests. Verify footer scale and navigation labels on home, poem, catalogue and contact pages.

A local build is not a deployment. Record publishing separately. Keep private editorial reviews and family notes out of the public site and commits unless explicitly authorised.

## Page tool alignment — 6 October 2026

Apply Kabita Live’s direct icon treatment to the Poems catalogue and standalone poem/opening-prose pages. Twelve reading languages use one compact native-script select, rather than twelve buttons. Keep that select and four icons on the same line down to 320px; permit the select to shrink while preserving 44px icon targets. Do not add an Aa/text-size button to these normal pages. The full-screen reader’s existing Aa/settings remain intact.

Catalogue tools act on the collection: Listen opens the audiobook, Share shares Poems with its selected language, and Read quietly begins at the front cover. Language updates opening lines and poem destinations, including the suggested reading path. The catalogue has no search field, search prompt or section count. Its bookmark icon opens saved places across the book, without a bookmark-current-page action. Poem tools retain their current poem, language and saved-passage context; Read quietly returns to its originating page on exit. Normal-page bookmark panels do not contain language, background, size or search settings.

Tooltips must not cause horizontal overflow, obscure an open panel or compete with keyboard focus. Bookmark panels dismiss on Escape/outside click; Escape and the close button restore focus to the trigger. Publication is recorded separately from this local implementation.

### Poems page hierarchy and separators — 6 October 2026

Keep the opening heading, then the suggested reading path, then the single-line bookmark/language toolbar immediately above the complete poem list. Use one subtle rule below the suggested path. Remove the heading's lower border, the small waterline and the five path-row separators. Retain the site's masthead/footer treatment and the list's functional dotted page-number leaders. This supersedes placing tools above the suggested path.
