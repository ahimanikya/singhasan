# Singhasan application

This is Pravakar Satapathy's first book, written during his involvement in politics. Preserve the correlations between political life, mythology, history, and ordinary people without inventing his party, office, or intentions beyond the text.

Resolve the current repository from the workspace. Its current location is `output/singhasan-edition` within Poem Without Borders; do not assume that absolute machine path on another installation.

Before drafting, read these current project files:

- `site/dist/assets/reading-book.json`: the complete current source, including section 0 (prose introduction) and poems 1-68. It is generated from `site/dist/book.js`.
- `site/editorial/corrections-2026-10-04.json`: approved corrections and confirmed unchanged wording. The previous review questions are resolved, not an open queue.
- `site/translations/poem-context.json`: user-confirmed meanings and exact source expressions. Load the applicable section's context before choosing equivalents.
- `site/translations/README.txt` and `site/translation_data.py`: current storage and draft/ready release behavior.
- `site/EDITORIAL-PREFERENCES.txt`, if present: book-specific presentation preferences.

The first translation languages are English, Tamil, and Hindi, per the user's 4 October 2026 direction. Other planned languages are Bengali, Telugu, Malayalam, Kannada, Marathi, Gujarati, and Assamese, for a later phase. Audio work is deferred. This priority does not erase the later-language plan or create permission to generate audio.

Begin with poems 1, 21, and 24 as a proposed compact voice/meaning pilot: a shift in authority, a clarified cultural passage, and a short poem. Confirm the whole source of poem 24 before treating it as representative; change the pilot if its content does not serve the comparison. Do not treat a proposed pilot selection as user approval of its translations. Complete each chosen poem in all three languages and review before multiplying the approach across 69 sections.

Poem 21 is a key fidelity check. Keep the approved source expression `ବଢ଼ାକ ଯାକ`. The user identifies `ବଢ଼ାକ` with `ବଢ଼ା`, a milk pot, and confirms `ଅଧାମ` as the residue remaining after the milk is taken. The action takes even that residue: everything down to the last bit. Do not replace it with cream, curds, or whey, translate it as merely drinking milk, or silently change the Odia spelling. Preserve the image and the complete-extraction sense without adding an explanatory moral.

Store translations in `site/translations/{language}.json` under `sections`, with `title`, `stanzas`, and `status: draft` until the agreed source comparison and target-language review are complete. Keep review records under `site/editorial/translation-review/`, outside the public `dist` directory. The site publishes only ready entries. Currently empty language files are not completed translations. No public translator credits or AI-process notices are requested for this book.

For each pilot, record a source hash and review evidence. Verify English, Tamil, and Hindi render in the appropriate local fonts and that longer translations paginate without clipping. Test using an isolated preview fixture if necessary; never mark a test translation ready in the published data. Keep Odia as the authoritative source and preserve language-specific reading positions and marks.
