# Translation review record

Use the project's existing schema when it has one. Otherwise keep a small record beside the draft with:

- Section, source language, target language, and source fingerprint.
- Mode, intended audience and register.
- Intended human effect: what the reader should understand, infer and feel; how the chosen phrasing carries it.
- Material cultural substitutions, if any, their tradeoffs and whether the result is an adaptation.
- Source of any word explanation: author/user, reliable reference, or translator inference.
- Draft status and revision identity.
- Actual checks performed, distinguishing model self-review from named human review.
- Open decisions: source phrase, draft choice, alternatives, why the distinction matters.
- Coverage: all source passages accounted for, with any deliberate relineation identified.

A useful source fingerprint is SHA-256 of the UTF-8 JSON of source stanza arrays, using ensure_ascii=False and compact separators. Store the exact algorithm with the record. When titles change, compare the source title separately or include it in the fingerprint with a documented schema.

Release evidence should say what occurred, not merely that a checkbox exists. Never fill in a human reviewer or approval date speculatively. A reviewed pilot can guide voice but does not certify later sections. Keep these records private to the editorial workspace; omit translator process notes, machine labels, and attribution boilerplate from reader-facing poems unless requested.

## Behavioral checks before adopting a skill revision

Try actual source passages that exercise different risks:

- A saying whose moral is easy to translate but whose performed joke can disappear: preserve the unprompted denial and test audience recognition without automatically replacing the cultural setting.
- A culturally specific noun with a supplied explanation: the explanation must control the image without becoming an inserted glossary line.
- A passage whose praise is ironic: preserve speaker, target, and distance without adding a political moral.
- A repeated question or negation: natural syntax must not erase recurrence or reverse the assertion.
- A doubtful word: preserve uncertainty in the private record rather than silently fixing the source.
- A publication request with a draft-only rule: produce reviewable work without inventing approval.

Describe this as a same-assistant check unless a separate reviewer actually participated. Structural validators cannot certify literary quality.

For a repeated word attached to different people or images, compare both occurrences together. A natural translation may need different words, but record the lost echo and its effect as a real tradeoff. Do not call a repetition check passed merely because each occurrence is individually plausible, or force one awkward equivalent everywhere to satisfy a checklist.
