# Lessons from a multilingual poetry review

These checks come from a partial, source-compared review of Odia, Hindi and English poems. They are review prompts, not universal substitutions or native-speaker certification. Examples are diagnostic excerpts, not approved replacement translations.

## Preserve uncertainty and relationships

- Track participants through a whole stanza. A classmate entrusted with a letter and “another girl” may be the same intermediary, distinct from the beloved. Do not accidentally create an extra person.
- Distinguish grammatical agreement from invented biography. Hindi may require a gender choice, but an author's gender does not establish a lyric speaker's gender. “Friends” does not establish female friends; “grandmother” does not establish maternal or paternal lineage. Prefer natural neutral constructions where available, and record unavoidable choices.
- Mark source corruption or uncertain spelling separately from translation errors. An unclear source word retained in its original script is still an unresolved reader obstacle, not evidence that a guessed meaning would be better.
- Familiar mythology must not supply facts the poem omits. A named hunter need not acquire a community identity from a remembered version of the story. Do not silently replace the poem's account with the conventional story.

## Personification and author feedback

In user-relayed feedback on Shakuntala Gupta’s Odia poem “ମୋ ଭିତରେ ଗାଆଁଟିଏ” (Kabita Live, poem 628), the poet noted that the Hindi village had become masculine despite the new-bride and beloved imagery, and suggested “टोली”. The existing “गाँव … खिलखिलाता / पहनता / सजता” follows the noun’s ordinary grammar; the issue is its effect on the feminine personification. Read the whole poem before choosing a response.

- Treat the suggested word as contextual author feedback. Check its intended settlement or regional sense, voice and cadence; neither automatically reject it because another sense is more familiar nor make गाँव → टोली a general replacement rule.
- Compare a faithful noun choice with a natural syntactic recasting. Do not merely attach feminine endings to an unchanged masculine construction, or narrow the setting just to make agreement easy.
- Follow the chosen image through the title, repeated nouns, pronouns, possessives and verbs. Preserve deliberate changes in personification; mechanical uniformity is not the goal.
- Keep the personified village separate from the lyric participants. Its feminine imagery does not determine the speaker’s or addressee’s gender.
- Record whether feedback came directly from the author or was relayed, its exact scope, and which revised wording has actually been reviewed. A suggestion or broad encouragement for wordplay is not approval of an entire translation or licence for added imagery.

Project evidence: Kabita Live, `kb/production/translation-revisions/author-feedback/poem-628-2026-10-05.json`. This record preserves the source, current Hindi and an unapplied candidate; it is not evidence of approved final wording.

## Check the effect of the wording

- Test idioms in the actual relationship: “I am afraid I may disappoint you” can soften defiance rather than express fear. Preserve the speaker's stance across the refrain.
- Compare insult intensity and social use, not just dictionary equivalents. Avoid both sanitising an abusive narrator and increasing the abuse beyond the source.
- Keep lexical relationships that do poetic work. “Nothingness / thingness” is a marked word pair; replacing one half with ordinary “existence” can erase the ending's device. A source contrast between everyday and literary synonyms needs a perceptible target contrast, not merely an unexplained transliteration.
- Check a poem's statements about its own language. If a source calls a quotation “three words,” count the translated phrase and handle the changed count consciously. Do not pad a phrase merely to keep the original count.
- Preserve the source's erotic, political, devotional or awkward register. Ornate source language is not a translator's added ornament; a peculiar soil/seed image is not automatically a typo to repair.

## Let target-language form work

Do not use identical line counts as a pass/fail measure of poetic fidelity. An isolated English preposition can be a mechanical consequence of matching an Odia break. Source files can also contain print or screen wrapping rather than intentional verse lines. Compare the full poem's breath, emphasis and turns before relineating.

If a renderer reuses source line indices to cut author addresses or footnotes from translated text, fix or explicitly map that dependency before accepting independently relineated targets. A literary improvement must not cause the renderer to delete a different ending.

## Separate diagnostics, evidence and approval

1. Validate the source/target versions and verse boundaries before literary review. Detect copied production conversation, broken markup and author contact/job details; preserve the original and flag editorial cleanup rather than deleting source material silently.
2. Screen the whole inventory for missing targets, stale source hashes, blank content, script anomalies and structural corruption. Decode HTML entities before comparing numbers. Count Devanagari/Odia letters and marks separately from shared punctuation; danda is not proof of a wrong-language passage.
3. Triage every automatic candidate against source and target. Digits written as words, crore/million conversions and idiomatic “24/7” equivalents are not omissions merely because digit strings differ.
4. Keep structural screening, full source/target literary reading and independent fluent review as separate coverage counts. Save exact resume positions and invalidate a review when either version changes.
5. Record exact evidence, impact, confidence and a proposed next action. Distinguish a confirmed defect, an editorial preference, a source query and a dismissed false positive. Carry prior notes forward as prior notes, not newly proven errors. Do not imply that a repeated scanner warning represents a separate root problem.

## Small regression set for future work

Use these cases as reasoning checks, not tests of exact preferred wording:

| Case | Review should catch | Review should avoid |
|---|---|---|
| Village as bride/beloved → masculine Hindi agreement | Personification weakened despite grammatical correctness | Automatic गाँव → टोली replacement, or assuming participant gender |
| Grandmother → maternal grandmother | Unsupported kinship narrowing | Inferring the side of the family from the author |
| “I will return” → “मैं लौटूँगा”, still labelled three words | Broken self-reference | Adding filler to force three words |
| “Nothingness / thingness” → unrelated standard nouns | Lost lexical device | Explaining the philosophy inside the poem |
| 150 million → fifteen crore | Equivalent quantity | A false omission flag |
| Shared danda in Odia text | Valid punctuation | Wrong-language diagnosis |
| Literal `br>` or production conversation after verse | Source/editorial contamination | Accusing the translator of inventing source residue |
| Source line count matches target exactly | Coverage evidence only | Declaring poetic rhythm correct |

Evidence: Kabita Live, `kb/research/translation-poetic-natural-review-2026-10-04/`. The initial detailed checkpoint covered editions 47–45 and risk-selected older poems; the remaining literary review was still open. None of these examples constitutes approval to rewrite or publish a poet's work.
