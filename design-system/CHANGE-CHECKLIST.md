# Singhasan change checklist

Use with the [rulebook](BOOK-SITE-RULEBOOK.md) and [design system](SINGHASAN-DESIGN-SYSTEM.md). Updated 5 October 2026.

Copy the relevant sections into a private change record. Mark each item **pass**, **fail**, **not checked** or **not applicable**, with brief evidence. An unchecked box is not approval or a pass. Run checks proportionate to the change; repeat only after relevant changes or unresolved failures. Documentation-only work needs consistency and link checks, not a full browser audit.

## Before changing anything

- [ ] Read the current user request, repository instructions, rulebook and applicable design/skill guidance.
- [ ] Identify affected pages, languages, modes, data and services. Inspect working changes and preserve unrelated work.
- [ ] Identify source inputs versus generated output; do not edit generated HTML as the sole fix.
- [ ] Distinguish established decisions from pilots and historical experiments. Use existing authorization without introducing redundant approvals.

## Text or translations

- [ ] Original Odia remains exact except for authorized corrections; all 69 sections retain identity/order and complete text.
- [ ] Extracts, verse line/stanza order, introduction and hidden/display-only ornaments are handled correctly.
- [ ] Translation uses the current source and contextual glossary; source fingerprints are current.
- [ ] Meaning, agency, negation, quantities, roles/names, satire and final emotional turn survive; no invented explanatory lines or forced rhyme.
- [ ] The target preserves the human effect, irony and revelation; idioms do not introduce different implications, and grammatical gender does not invent participant identity.
- [ ] Uncertain words are privately flagged; structural screening, complete literary reading, fluent review, acceptance and release are recorded separately, with before/after versions and an exact remaining queue.
- [ ] Actual coverage is verified. `ready` and `published: true` changes expose only intended sections; private pilots remain excluded.
- [ ] Script fonts, language tags, punctuation, wrapping and saved language-specific positions work. For Urdu, check RTL, Nastaliq overhang, title and switch back to LTR.
- [ ] A source/recording change triggers review of affected translations and timing; old evidence is not silently reused.

## Visual or layout changes

- [ ] Active A masthead, throne favicon and both preserved logo templates remain correct. Icon/title alignment works at phone and desktop sizes.
- [ ] Original poem font remains Noto Serif Oriya; masthead/cover typography remains Anek Odia. Translation fonts render their scripts.
- [ ] Home cover opens Poems; the primary reading action enters the book. Closing three actions and menu Listen remain available.
- [ ] Illustration and English narrative share one leaf, with poem text on the next. Narratives have balanced margins and art is not cropped.
- [ ] Like is below the poem only; Comments starts collapsed with one text box. Standalone footer has no previous/next navigation.
- [ ] Footer art matches across normal pages. Ending ornaments/line art do not overlap text, create empty leaves or change source offsets.
- [ ] Check phone and desktop, enlarged text, a short viewport and night/light surfaces when affected. No clipped text or horizontal page overflow.
- [ ] Keyboard focus, icon labels, touch targets, contrast, language/direction and reduced motion remain usable.

## Reader changes

- [ ] Front-cover click enters; the book ends at the back cover. Both modes keep identical covers.
- [ ] Illustrated defaults to whole-paper turns; Quiet defaults off. Explicit mode preferences persist independently; sound is opt-in and reduced motion wins.
- [ ] Desktop has two leaves and the shaded divider; phone has one. Folios match the actual leaves in the selected mode.
- [ ] Traverse first, intermediate and last leaves of a short poem, a long poem and the opening prose. No omitted, duplicated or clipped text; correct section transitions.
- [ ] Resize/change text size, language and Quiet setting mid-passage. Saved place and underlines still identify the intended text, not an old page number.
- [ ] Enter from home, Poems and a standalone poem; Exit returns to the correct origin, language and position. Direct reader links have a sensible fallback.
- [ ] Book tools stay focused on reading. Closing/opening tools and searching a section do not unexpectedly navigate or reset place.
- [ ] Test actual touch gestures on a physical device when gesture code changes; record explicitly if only emulated viewport checks were possible.

## Images and sharing

- [ ] Approved masters are preserved. New variants have a clear review state; no unrequested substitutions.
- [ ] Responsive image/source hashes and dimensions match. Tiny preview appears in a reserved box; final image reveals without layout shift.
- [ ] Visible cover is prioritized, other images lazy-load, and Quiet does not eagerly fetch hidden interior art. Test a cold/slow load for loading changes.
- [ ] Unchanged artwork retains stable URLs after a text-only rebuild.
- [ ] Each affected public page has the correct canonical, title/description, main sharing image, type/dimensions and alt text in initial HTML.
- [ ] Social preview tests distinguish generated metadata from a platform's cached/rendered result. No private local URL or editorial note leaks into public output.

## Audio or services

- [ ] Odia playback works; translation selection pauses/disables it, and returning to Odia does not auto-play. Audio entry hides illustrations.
- [ ] Timing matches the recording hash/source; unavailable or incomplete timing is disclosed. Do not replace deferred recordings as incidental cleanup.
- [ ] Like/unlike state and counts behave correctly, including failure; no second header Like control appears.
- [ ] Comments start collapsed, submission stays pending moderation, and private-contact context identifies the poem.
- [ ] Form success appears only after successful write; failure preserves input and duplicate submission is prevented.
- [ ] No family email/private data appears in public HTML, scripts, configuration, metadata or public comments.
- [ ] Dedicated Singhasan configuration remains isolated from Kabita Live. Authentication, private access, throttling and moderation rules are checked for service changes.
- [ ] Test messages are clearly labelled, created only where appropriate, and cleaned up. Do not publish a test comment or send a private message as an incidental layout check.

## Checks to run

Run from the repository root using Python **3.12+** and the available Node runtime. Commands here are verification options, not a requirement to run unrelated suites for every small edit.

| Change | Relevant verification |
| --- | --- |
| Site content/templates/styles | `python3 site/build_pages.py` then `python3 site/validate_site.py`; browser-check affected pages |
| Translation/release selection | `python3 site/tests/test_translation_release.py`; coverage/source hashes; private and public variant inspection |
| Image-loading code | `python3 site/tests/test_progressive_images.py`; cold/slow browser load |
| Reader/page-turn/bookmark code | `node --test site/tests/reader-state.test.mjs site/tests/reader-pagination.test.mjs site/tests/reader-effects.test.mjs site/tests/book-turn-state.test.mjs`; actual reader walkthrough |
| Audio/following code | `node --test site/tests/read-along.test.mjs site/tests/read-along-language.test.mjs site/tests/spoken-progress.test.mjs` |
| Contact/engagement client | `node --test site/services/tests/contact.test.mjs site/services/tests/engagement.test.mjs`; `npm --prefix site/services run build` to refresh bundles |
| Firestore rules/indexes | `npm --prefix site/services run test:rules` (local emulator, Java 21+ and pinned service dependencies); deliberate deployment and affected-operation verification |
| Any code/data edit | `git diff --check`; inspect the actual changed files and any unexpected generated differences |
| Documentation only | Resolve local links, compare against the latest decisions, and check that future contributors can find the documents |

Image preparation tools are for artwork changes, not ordinary text builds. Python building/validation does not deploy Firebase or replace browser checks. If a runtime, emulator or physical device is unavailable, record the missing check and its practical effect instead of claiming success.

## Before publishing, when publication is authorized

- [ ] Confirm the release contains only intended changes, assets and translation entries. Private review notes, personal data and unrelated files stay out.
- [ ] Build, validate and complete affected checks against the actual release version. Note any unresolved limitations.
- [ ] Inspect the staged diff explicitly. A push to `main` automatically deploys; do not confuse a backup push with private storage.
- [ ] Record commit, deployment workflow result and public URL. Verify the changed live pages/assets and the intended language availability.
- [ ] If Firebase changed, verify its deployment separately; a successful Pages deployment does not confirm service rules.
- [ ] State clearly what is local versus published, and what remains deferred or awaiting language review.

## Small change-record template

```text
Change / date:
User decision or request:
Affected source files and pages:
Languages / modes affected:
Checks performed and evidence:
Checks not performed / not applicable, with reason:
Unresolved issues:
Rulebook/design-system update, if a decision changed:
Publication: local only OR commit + successful workflow + live verification
```
