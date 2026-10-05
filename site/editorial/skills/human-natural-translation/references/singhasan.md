# Singhasan application

This is Pravakar Satapathy's first book, written during his involvement in politics. Preserve the correlations between political life, mythology, history, and ordinary people without inventing his party, office, or intentions beyond the text.

Resolve the current repository from the workspace. Its current location is `output/singhasan-edition` within Poem Without Borders; do not assume that absolute machine path on another installation.

Before drafting, read these current project files:

- `site/dist/assets/reading-book.json`: the complete current source, including section 0 (prose introduction) and poems 1-68. It is generated from `site/dist/book.js`.
- `site/editorial/corrections-2026-10-04.json`: approved corrections and confirmed unchanged wording. The previous review questions are resolved, not an open queue.
- `site/translations/poem-context.json`: user-confirmed meanings and exact source expressions. Load the applicable section's context before choosing equivalents.
- `site/translations/README.txt` and `site/translation_data.py`: current storage and draft/ready release behavior.
- `site/EDITORIAL-PREFERENCES.txt`, if present: book-specific presentation preferences.

The user initially selected English, Tamil and Hindi, then added Bengali. As of 4 October 2026, the introduction and all 68 poems are available in those four languages alongside Odia, with explicit permission to publish the existing translations. Telugu, Malayalam, Kannada, Marathi, Gujarati and Assamese remain planned. Audio work is deferred; translation permission does not authorize audio generation.

The English pilot used poems 1, 21 and 24, followed by language-specific pilots and complete-book batches. Preserve the accepted voice and user-confirmed meanings. Do not restart completed pilots or infer that publication certifies every editorial question. Tamil awaits the family's fluent review; unresolved questions in the other languages remain in their private review records. Consult current section statuses and, when available, `site/editorial/translation-review/PLAN.json` for progress rather than treating the original plan as current. Review records may be local-only; do not invent missing review evidence from their absence in a checkout.

Poem 21 is a key fidelity check. Keep the approved source expression `ବଢ଼ାକ ଯାକ`. The user identifies `ବଢ଼ାକ` with `ବଢ଼ା`, a milk pot, and confirms `ଅଧାମ` as the residue remaining after the milk is taken. The action takes even that residue: everything down to the last bit. Do not replace it with cream, curds, or whey, translate it as merely drinking milk, or silently change the Odia spelling. Preserve the image and the complete-extraction sense without adding an explanatory moral.

Store translations in `site/translations/{language}.json` under `sections`, with `title`, `stanzas`, and `status: draft` until the agreed source comparison and target-language review are complete. Keep review records under `site/editorial/translation-review/`, outside the public `dist` directory. The site publishes entries marked `ready` or separately authorized with `published: true`. Keep honest draft/ready status independent of publication; explicit release approval does not mean fluent-reader review is complete. Empty language files are not completed translations. No public translator credits or AI-process notices are requested for this book.

For each pilot, record a source hash and review evidence. Verify English, Tamil, and Hindi render in the appropriate local fonts and that longer translations paginate without clipping. Test using an isolated preview fixture if necessary; never mark a test translation ready in the published data. Keep Odia as the authoritative source and preserve language-specific reading positions and marks.
