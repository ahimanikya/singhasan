# Singhasan listening edition

`audio-book-run.json` is the portable snapshot of this production run. It records the exact unchanged book text, the approved prompt, model and controls, submission timestamps, both candidate URLs and the selected review take. The active working run is kept outside the website build and synchronized here at checkpoints.

The user authorized the whole book, one track per poem, plus a short English welcome and closing. They chose the first take for review, with replacements as needed. This rule does not constitute pronunciation approval. Full text proofreading remains part of the existing editorial review.

The requested introduction is the existing Odia prose “ସିଂହଦ୍ଵାର”, not a newly written welcome. Its exact source is prepared in four sections at completed paragraph boundaries in `prose-introduction-run.json`. Automatic approval review requires explicit clarification before spending credits, because the earlier wording “I will record” could mean the user will narrate it. Once a recording is available, insert one introduction track after the English welcome and before poem 1. Do not create an empty or unplayable entry while it is pending.

Only downloaded, validated files appear in `../audio-edition.json` and on the listening page. Audio is stored with Git LFS; the publishing workflow fetches LFS objects before creating the Pages artifact. The site provides continuous playback, track links, speed controls and a listening position saved on the listener's device. Playback begins only after a listener action.

Do not resubmit a track marked submitting or submitted without reconciling its Suno workspace. Preserve both candidates and existing files. Download through the normal Suno controls; do not use hidden media endpoints or buy allowance without a specific user instruction.
