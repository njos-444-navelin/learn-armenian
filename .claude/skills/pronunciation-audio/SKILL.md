---
name: pronunciation-audio
description: Generating and installing pronunciation clips with the ElevenLabs connector - word clips, alphabet letter clips and dialogue line recordings. Use when a new word or letter needs audio, when a shipped clip sounds wrong, or when recording a dialogue's lines. Triggers - generate audio, voice a word, re-roll a take, breath or gasp on a clip, wrong stress, question reads as a statement, split a read, m4a, ElevenLabs.
---

# Pronunciation audio

Read the doc for the case before generating: [VOCABULARY_AUDIO.md](../../../docs/VOCABULARY_AUDIO.md) for words (and first, for everything — it holds the storage, encoding, voice and model rules), [ALPHABET_AUDIO.md](../../../docs/ALPHABET_AUDIO.md) for letter phonemes, [DIALOGUES.md, "Line audio"](../../../docs/DIALOGUES.md#line-audio) for dialogue lines.

Most of what makes a clip good is not readable from the code. Don't reason it out from first principles — the docs record what was measured.

## Constants

|              |                                                                                                 |
| ------------ | ----------------------------------------------------------------------------------------------- |
| Main voice   | Tereza jan, `B7DEF4tn54LpozCVN7ah` — every word and letter clip, no exception                   |
| Second voice | Lazy Dmitrii, `oNYQkBHg8N8sOXiVNvyU` — his dialogue lines only                                  |
| Model        | `eleven_v3`. `eleven_multilingual_v2` is a last resort, not a control arm                       |
| Paths        | `static/audio/words/<wordId>.m4a`, `alphabet/<letterId>.m4a`, `dialogues/<dialogueId>/<nn>.m4a` |

```sh
ffmpeg -i <input> -ac 1 -ar 24000 -c:a aac -b:a 32k -movflags +faststart <out>.m4a
```

## Prompt rules that are engine bugs, not orthography

All of these are prompt-only — the app's text stays correct.

- **Word-initial "Ո" is "vo"**: send `Վոնց`, keep `Ոնց` in the data. Not when the Ո isn't first (`Չորս`), not for the digraph `Ու`, not for `ով` and its forms. Applies inside a dialogue line too, checked per word.
- **End an Armenian prompt with `։` (U+0589), never a Latin `.`** — it fixes stress. Drop it on a one-syllable word, which has no stress to fix and drawls with it.
- **Keep the word capitalized.** Lowercasing roughly doubles the duration.
- **Bare letter glyphs that fail** (`Պ`, `Ռ`, `Տ`, `Գ` so far) take a schwa: `Պը`. Save under the plain id. Treat the list as open — apply it on any bare-glyph failure.

## Generating

1. One word per message, `generations_count` = the concurrency cap **named in the error**; it changes. Failed generations still bill.
2. Poll `creative_get_flow_run_status` with the `flow_id` and `session_ids`. Keep those ids outside the scratchpad — re-polling mints fresh download URLs for free, and they expire after 7200 s.
3. Download every take, run `scripts/audio/breath_trim.py` over the directory, transcode whatever it left alone.
4. **Build the picker page** (`scripts/audio/review_page.py`) and get a human to listen. Generation succeeding is not evidence the clip is good, and the agent generating can't hear. Take volume is cheap; the human's listening time isn't.
5. Save under the id and commit the `.m4a` with the library change.

## Dialogue lines

Never generate a line at a time — eleven separate generations are eleven slightly different voices. One `creative_generate_speech` per speaker, that speaker's lines joined by blank lines, two takes, the two calls **in separate messages**. Redoing one line: sandwich it between throwaways.

Then `scripts/audio/split_read.py` cuts the read. Silence alone can't find the boundaries; the relative per-segment RMS it reports (~0.15 on accepted reads) is the gate. A question that reads as a statement is a pitch-peak problem — DIALOGUES.md has the levers in the order to try.

## Tooling

`scripts/audio/`: `split_read.py`, `breath_trim.py`, `pitch.py`, `bend.py`, `review_page.py`. They need `numpy`, `ffmpeg`/`ffprobe`, and `rubberband` in ffmpeg for `bend.py`.
