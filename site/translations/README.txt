Current inclusion decision — 4 October 2026

The user authorized adding ALL existing English, Hindi, Bengali and Tamil translations, including the introduction and all 68 poems per language. Each existing entry is explicitly published: true. This overrides earlier ready-only inclusion guidance below without claiming that pending language reviews are complete. The loader includes ready entries or entries with published: true; other drafts remain excluded. Existing draft/ready statuses and editorial questions are preserved. Do not automatically expose new drafts or other languages. Audio remains Odia-only. This change has been built locally; deployment is a separate step.

Singhasan translations

Odia remains the source language. The ten target languages are English, Hindi, Bengali, Tamil, Telugu, Malayalam, Kannada, Marathi, Gujarati and Assamese. The user has authorized Human Natural literary translations. Current coverage and review status are recorded in editorial/translation-review/PLAN.json; no placeholder or unreviewed translation appears publicly.

Add each translation to the matching language file, under sections. Use "0" for the introduction and "1" through "68" for poems. Each section has a title, stanzas (a list of stanzas, each a list of exact lines), and status. Use "draft" while translating and reviewing; use "ready" only when the translation has passed source comparison and the intended language review. Record review status honestly. For introduction prose, put each paragraph in its own stanza as one string. The original and translation can have different line counts.

Example structure (replace placeholders with actual wording before marking ready):
{"language":"en","sections":{"1":{"status":"draft","title":"","stanzas":[]}}}

Rebuild with build_pages.py after adding text. Only ready, nonempty sections appear in the language selector on their poem page and in the quiet reader. Each language has separate bookmarks and underlines. Keep the original poem numbering. No PDF links belong in the reading edition.

Source context for translation

Read poem-context.json before translating or reviewing the covered poems in any target language. It records user-confirmed meanings and editorial decisions. Poem 21 preserves ବଢ଼ାକ ଯାକ (milk-pot expression) and ଅଧାମ (the residue left after taking the milk): everything is extracted, down to the last bit. Keep both the concrete image and its full-extraction meaning. These notes are internal translation guidance, not reader-facing copy or completed translations.

Current phase — 4 October 2026

Start with English, Tamil and Hindi. Bengali now has a complete direct-Odia working edition: all 68 poems and the full introduction. The user approved pilot poems 1, 21 and 24; their exact wording is ready in local edition data. The 66 newly drafted sections remain private pending review. Only two uncertain source expressions remain listed in bengali-full-2026-10-04/Bengali-word-questions.txt. Telugu, Malayalam, Kannada, Marathi, Gujarati and Assamese remain planned for later. All audio work is deferred. Use the installed Human Natural Translation skill; its versioned source is site/editorial/skills/human-natural-translation/. Read the source context before drafting. The private pilot plan and honest review records live in site/editorial/translation-review/. English, Hindi, Tamil and Bengali now have complete working drafts (the unabridged introduction and all 68 poems in each language). All 69 Tamil sections remain drafts for later family/fluent review; see tamil-full-2026-10-04/review.json and the private Tamil/English/Odia comparison page. New full-book Hindi passages remain drafts, with concerns in hindi-full-2026-10-04/review.json; only individually ready sections enter the site build.
