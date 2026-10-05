# Singhasan book site — maintenance instructions

These instructions apply to this repository and its subdirectories. They concern Singhasan, not the parent project's separate video work.

Before changing this book site, read:

1. [Book-site rulebook](design-system/BOOK-SITE-RULEBOOK.md).
2. [Current Singhasan design system](design-system/SINGHASAN-DESIGN-SYSTEM.md).
3. The relevant sections of the [change checklist](design-system/CHANGE-CHECKLIST.md).

The user's latest explicit instructions take precedence over these documents. Apply existing authorization; these instructions do not add a requirement to ask for approval on routine fixes. When the user changes an established decision, update its controlling document in the same change. Historical screenshots, audits and imported Kabita Live guidance do not override current Singhasan decisions.

Preserve the approved Odia source, original artwork, both masthead templates, private correspondence and unrelated working changes. Keep private editorial material outside the deployed site. Never display the family's personal email address. Use the Human Natural Translation skill for literary translation and Human Natural Image / Poetic Natural guidance when new imagery is requested.

Edit source templates/data and maintained assets, then rebuild generated pages. Note that `site/dist/book.js` and maintained files in `site/dist/assets/` are source inputs despite the directory name. Do not delete or recreate `site/dist` as disposable build output.

Use the checklist proportionately: record relevant checks as passed, failed, not checked or not applicable, with evidence. Do not treat old test results as checks of new changes, or claim a fluent-reader review from an AI comparison. For documentation-only changes, check links and consistency; a full site/browser test is unnecessary.

Do not commit unrelated files or private review notes by using a blanket add. A push to `main` deploys the site: use the user's publishing authorization, verify the workflow and live result, and report publication separately from a local build. Do not publish translation drafts merely because they exist.
