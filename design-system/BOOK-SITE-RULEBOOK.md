# Singhasan book-site rulebook

Established 5 October 2026. This is the maintenance contract for the book at `singhasan.poemwithoutborders.org`.

## 1. How to use this rulebook

Read this before changing content, design, reader behaviour or services. Use the [change checklist](CHANGE-CHECKLIST.md) to verify the affected experience. The [Singhasan design system](SINGHASAN-DESIGN-SYSTEM.md) controls exact typography, spacing, palette and component treatment; this rulebook controls the product and editorial boundaries.

Authority, in order:

1. The user's latest explicit decision and existing authorization.
2. This rulebook and the current Singhasan design system, each within its scope.
3. Current source data, approved corrections, contextual glossary and applicable skills.
4. The imported [Kabita Live design system](KABITA-LIVE-DESIGN-SYSTEM.md), where consistent with Singhasan.
5. Historical notes, screenshots and audits, as evidence of history rather than current requirements.

Do not silently choose between contradictory current documents. Resolve them against the latest user decision and correct the stale document. Ask only when a material decision remains unknown; continue independent work. A new feature request does not automatically reopen settled typography, page structure or artwork choices.

## 2. Identity and editorial integrity

- This is Pravakar Satapathy's first Odia poetry book, written during his involvement in politics. It is a literary book site, not a journal or a technology showcase.
- The approved book contains the opening prose, ସିଂହଦ୍ଵାର, and 68 numbered poems. Preserve their identity, order, wording, stanza structure and meaningful punctuation. Do not silently correct dialect or unusual words.
- `site/dist/book.js` is the Odia source input. Apply authorized corrections there and rebuild all dependent views. Check affected translations and audio offsets when the source changes; do not silently certify old reviews against new text.
- Home-page extracts must match the source. English illustration narratives interpret artwork; they are not poem translations. Do not insert explanatory prose, invented imagery or morals into a translated poem.
- Keep the poet's name and book title on the cover. Avoid repeating the title in adjacent cover narrative. No PDF/recovery references, AI-generation labels or unsolicited acknowledgements on reader-facing pages. The user-requested design/edition credit to Ahimanikya Satapathy belongs once in Our Story, separate from the poet’s authorship. Preserve internal provenance and required asset/font licences.
- Biography uses family-supplied or verified facts. Do not infer birth dates, political offices, party affiliations or personal history. Review the supplied age when updating it. Invitations to meet the poet in Bhubaneswar go through private Contact; do not publish private addresses or contact details.

## 3. Site structure and navigation

| Destination | Purpose and constraints |
| --- | --- |
| Home | Rich introduction to the book and poet, exact extracts and English image narratives. One primary opening reading action. Cover image opens Poems. Closing invitation offers Read the book, Listen to the audiobook and Browse all poems. |
| Poems (`contents.html`) | Opening-line catalogue for this single book. Keep the established limited search. Visible label is Poems; preserve the existing address. |
| Standalone poem | Permanent shareable page with selectable verse, companion artwork/narrative and an “In the book” panel with illustrated and quiet entry. No footer previous/next navigation. |
| ସିଂହଦ୍ଵାର (`intro.html`) | Full opening prose, paginated where needed for comfortable reading. Do not restore the English “Introduction” heading beside its Odia title. |
| Book reader | One paginated reader with Illustrated and Quiet settings, same source and saved-place model. |
| Our Story | Family purpose, translation essay link, wider Poem Without Borders project/story, and one edition/design credit to Ahimanikya Satapathy. Shared footer entry; not part of the book sequence. |
| Suggested reading path | Compact thematic sequence within `contents.html#reading-path`, linked from a small Home invitation. No separate illustrated guide. Editorial prompts stay separate from titles/verse; contextual continuation stays outside the book reader. |
| Translation essay | Standalone editorial page linked from the home feature and Our Story; outside the book sequence and main menu. |
| Listen | Existing audiobook and Listen & follow. Keep Listen accessible in the top menu and the home closing invitation. |
| Poet | Substantial biography and portrait, without a contributions list. |
| Contact | Simple private Firebase form, including poem context when entered from a poem. |

Preserve established routes, incoming anchors and shared links. The cover is an entry point into the book. Exiting the reader returns to the originating site page with its language and position, rather than always sending the reader home. An unavailable translation must fall back visibly, not masquerade as translated text.

## 4. Reader contract

- Illustrated is the default. Quiet is an option of the same reader, not a second implementation with drifting features.
- Both retain the same front and back covers, book frame, reading typography, language choices, saved passages and exit behaviour. Quiet hides interior illustration leaves.
- An interior illustration and its English narrative share one leaf. The poem begins on the next leaf: right-hand facing page on desktop, next turn on a phone. Do not restore a separate narrative leaf or overlay narrative on verse.
- Use two leaves on desktop and one on phones. Keep folios on their own pages and the approved shaded centre separator. Page turns move the whole paper area, including margins and heading.
- Illustrated animation starts on; Quiet starts off. Remember explicit preferences independently. Reduced motion overrides animation. Page sound is opt-in.
- Keep the complete text selectable. Reflow for font size, language and viewport without losing or duplicating words. Store logical line/character anchors, never page numbers as permanent reading positions.
- Reader tools contain reading options: language, text size, surface, page effects and folded saved-passage/search controls. Do not add site-navigation links or Share to the book-tools panel; people can exit to browse the site.
- No artificial blank spacer leaf between poems. Decorative line art may occupy genuine spare space under the design system's rules; it must never cover text or alter source offsets.
- The English illustration narrative has balanced side margins and a narrow reading measure. It remains prose with natural wrapping.

## 5. Visual system and imagery

- Active masthead is A, “Throne & earth”; preserve both A and B templates. This choice is separate from the type study's option B. Throne favicon stays.
- Masthead and cover title use Anek Odia 600; the cover poet name uses 400. Original verse stays **Noto Serif Oriya**. Do not reapply the rejected Anek verse experiment.
- Reuse existing script-specific fonts, licensed local assets, palette and UI icons. Imported Kabita Live foundations should support the book rather than introduce journal-specific features.
- Maintain woven cloth, earth wash and monsoon wash options; night mode uses readable contrast without paper texture. Keep icon/text alignment, keyboard focus and touch targets consistent.
- Preserve approved artwork and portraits. Requested new imagery follows Human Natural Image with Poetic Natural mode, grounded in each poem's meaning. Save variations separately; generation does not make them approved replacements.
- Normal pages share the same compact grass-and-stone footer at the far left and right. No central throne or boat in the footer. The reader hides the site footer.
- Small botanical closing ornaments vary predictably by poem and stay consistent across that poem's views. Keep ornaments decorative and outside source text.
- Reserve image dimensions, use responsive sizes and a tiny progressive preview, prioritize the visible cover and lazy-load other artwork. Keep unchanged image URLs stable across text-only builds. Preserve composition rather than cropping book art to fit.

## 6. Translation contract

- Odia and the user-confirmed contextual glossary remain authoritative. Use [Human Natural Translation](../site/editorial/skills/human-natural-translation/SKILL.md), with Poetic Natural for poems and Reflective Prose for the complete introduction.
- Carry meaning, emotion, satire, ambiguity and cadence into natural target language. Literal wording is not the sole test. Retain cultural anchors and distinguish roles, generic character types and actual names. Do not quietly relocate a poem into a different culture.
- Test the human effect as well as literal meaning: preserve the timing of irony, implied relationships, intensity and final turn. Distinguish grammatical gender, poetic personification and the actual gender of a participant; never infer one from another. An idiomatic target expression must carry the source action, not introduce a familiar but different joke.
- A bridge translation may assist comparison; disclose that privately and check decisive choices against Odia. Never imply direct or native review that did not happen.
- Eleven target languages: English, Hindi, Bengali, Tamil, Telugu, Malayalam, Kannada, Marathi, Gujarati, Assamese and Urdu. Do not present an empty or pilot-only language as a complete edition.
- Keep section fingerprints, coverage and uncertainty in private review records. Separate drafting, same-assistant review, fluent review, user acceptance and publication. Preserve unresolved questions rather than inventing answers. Record structural screening and complete source/target literary reading as separate coverage counts; keep exact remaining sections and before/after target fingerprints. Preserve prior versions before revisions.
- Release behaviour: `site/translation_data.py` includes an entry when `status` is `ready` **or** `published` is `true`. Changing either can expose text in the next build. Use the project's actual review/release decision, not a blanket status conversion.
- Urdu uses Nastaliq and right-to-left stanzas, with mirrored hanging indents and room for overhanging letterforms. Keep the shared book's page progression. Test logical saved anchors and switching back to left-to-right scripts.
- Current coverage belongs in `site/translations/README.txt` and private `site/editorial/translation-review/PLAN.json`; it is not a permanent rule. As of this rulebook, four translated editions are published and seven additional languages have private three-poem pilots. Audio work and the separate app remain deferred.

## 7. Listening, comments and private contact

- Audio is Odia-only. Opening Listen & follow hides interior illustrations; a reader may turn them back on. Selecting a translation pauses and disables Odia playback. Returning to Odia must not unexpectedly start playback.
- Keep the player compact. Progressive spoken-word highlighting uses verified recording-specific timing and source offsets, not proportional guesses. Replacement audio requires new hash-bound timing and completeness checks.
- Preserve notices for incomplete recordings. Do not imply complete follow-along where source words are missing. Existing playback remains available while new audio work is deferred.
- Like appears once below a standalone poem, never in its header. Like and collapsed Comments share a compact row. Comments open to one text box and a submission action; retain moderation and place service notices inside the disclosure.
- Use the dedicated Singhasan Firebase service. Do not import Kabita Live database identities, credentials or reader data. Keep private contact messages and pending comments private; only reviewed public-comment fields enter public records.
- Never expose the family's personal email in visible text, mailto links, client code, runtime configuration or generated metadata. Contact is a private form, not an email draft.
- Confirm a submission only after it succeeds; preserve entered text on failure and prevent accidental duplicate submissions. Anonymous likes are per browser identity, not verified-person votes. Do not add named registration or analytics without a product decision.

## 8. Sharing, accessibility and resilience

- Every public page has static canonical/Open Graph/Twitter metadata with its own main image. Home/book/listening use the complete lettered cover; poet/contact use the portrait; poems use their associated artwork. The design system defines the other mappings.
- Use absolute public HTTPS image addresses, correct type/dimensions and meaningful alternative text. Preserve stable canonical routes and selected language in reader/share navigation. Do not expose private previews or review notes through metadata, sitemaps or release artifacts.
- All controls work with keyboard and have accessible names, including icon-only controls. Keep visible focus, adequate contrast, useful status messages and readable enlarged text. Decorative art is hidden from assistive technology.
- Core source text remains available when enhancement scripts fail. Test empty/loading/error states when changing services. A social platform's cached preview and a physical-device walkthrough are separate from automated site checks.

## 9. Implementation and release discipline

| Area | Source of truth |
| --- | --- |
| Original text | `site/dist/book.js` and authorized correction/context records |
| Page structure | `site/build_pages.py`, rendering modules and `site/templates/` |
| Reader, styles, icons and artwork | Maintained files under `site/dist/assets/` |
| Translation data and inclusion | `site/languages.json`, `site/translations/`, `site/translation_data.py` |
| Responsive and sharing images | `site/tools/prepare_images.py`, `site/tools/prepare_social_images.py` and their manifests |
| Firebase client/rules | `site/services/src/`, service build, rules and indexes |
| Visual specifications | `design-system/SINGHASAN-DESIGN-SYSTEM.md` |
| Public output | Generated HTML and reading data in `site/dist/` |

Do not treat `site/dist/` as disposable: it contains original text and maintained assets as well as generated output. Fix the source/template, rebuild, then check the generated result. Use Python 3.12 or later. Service changes require rebuilding their bundles; a Python page build does not replace that step.

Apply proportionate checks from the checklist. Keep unrelated working changes intact. Do not stage private notes or all untracked files indiscriminately. A `main` push triggers GitHub Pages; follow the user's existing publication authorization and verify both the workflow and live result. Publishing code, deploying Firebase rules and publishing a translation are distinct actions.

Report what changed, evidence of verification, and any real limitations. Do not describe local work as live. Update the controlling rule/design document when an approved decision changes, and mark superseded guidance so future work does not restore it.
