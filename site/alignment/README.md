# Singhasan narration timings

The cues in `site/dist/assets/audio-sync/` come from acoustic forced alignment of
the existing, exact catalog recordings against the original Odia book text.
They are not calculated by dividing the recording duration among the words.

The pipeline uses PyTorch/TorchAudio **2.8.0** `MMS_FA`, with `uroman` romanization
using language code `ori`. Audio is decoded to 16 kHz mono PCM with FFmpeg.
The model receives 20-second chunks with one second of context on either side;
only the middle frames are retained. Token time resolution is 20 ms. Each cue
contains the original source line, character offsets, exact word, its acoustic
start/end time and support score. The audio and source text SHA-256 hashes bind
each file to its exact recording and original text.

Implementation follows the official [TorchAudio multilingual forced alignment
tutorial](https://docs.pytorch.org/audio/2.8/tutorials/forced_alignment_for_multilingual_data_tutorial.html).
TorchAudio marks this API deprecated after 2.8; the local alignment environment
is pinned to that supported version. Runtime playback only uses JSON and does
not require the model or Python packages.

`align_recordings.py` produces cues for all 69 source sections. Its `--ids`
argument can limit a run. Model weights and emission caches stay outside the
published site. `audit_timings.py` verifies all hashes, cue ordering and source
offsets, and writes the durable report in this directory. Acoustic scores are
not pronunciation approval or evidence that every supplied word was spoken.
All timings remain pending fluent listening review.

## Completeness findings from 2026-10-02

Independent greedy decoding must omit the wildcard channel, otherwise the
wildcard takes the highest score and yields an uninformative `*` transcript.
The initial full forced alignment of the introduction had mean score 0.508,
and its terminal paragraphs were packed into the last seconds of each Suno
part with very low scores. Independent decoding suggests each of the four
existing introduction takes ends before its submitted text ends. Part 4 also
repeats a phrase about ordinary suffering and happiness.

`realign_introduction.py` uses the known, exact four assembly boundaries from
`site/production/prose-introduction-take-2-run.json` and aligns the recorded
source prefixes, including the apparent repeat. The revised mean score is
0.875. Unsupported source words receive no invented timestamp. Some Sanskrit
words at the end of Part 3 may be audible but are omitted conservatively until
listening review. The exact source omissions are saved in the timing file.

Poem 50 has a similar unsupported terminal cluster. Independent decoding ends
near its quoted invitation to join hands, around source lines 73–75; lines
76–84 had near-zero scores. `realign_truncated_poem.py --id 50 --through-line 75`
aligns the apparent recorded prefix. Its score rises from 0.790 to 0.869, with
27 unsupported source words left without cues.

Both revised files declare `partialCoverage: true` and `syncSafe: false`.
Ordinary audio playback remains available; automatic following should remain
off for these two sections until their completeness is reviewed. Their original
full forced outputs are preserved in `archive/`. No text or audio was edited,
trimmed, regenerated or replaced during this timing work. The other 67 poems
have full source-line cue coverage and no comparable weak terminal cluster.

## Reproducible local commands

Use the existing local `tmp/singhasan-align-env` Python environment with
`TORCH_HOME` set to `tmp/singhasan-alignment/torch`. Pass the existing FFmpeg
binary and `tmp/singhasan-alignment` cache to `align_recordings.py`. Paths are
local environment details and should be resolved from the project root.

Run the two correction scripts against the same cache, then run
`audit_timings.py --out site/alignment/TIMING-AUDIT-2026-10-02.json` from the
Singhasan repository root. Replacing a recording requires a new acoustic
alignment tied to its new SHA-256 hash; reusing its earlier cues is invalid.

## Approved text corrections - 4 October 2026

The family approved 46 text corrections, recorded in
`site/editorial/corrections-2026-10-04.json`. The remaining word ଅଧାମ was confirmed unchanged; no current proofreading questions remain.
The original recording-production submissions remain historical evidence.

For the 27 affected sections, cue character offsets now reference the corrected
reading text. Acoustic start/end times, scores, romanizations, and existing
completeness flags are unchanged. Each timing file records `textRevision` with
the previous source hash; changed cue wording retains its `alignedText`. This
is an editorial offset mapping, not a fresh acoustic alignment or pronunciation
approval. Corrected wording still needs comparison with the existing recordings
during the planned natural-audio review.
