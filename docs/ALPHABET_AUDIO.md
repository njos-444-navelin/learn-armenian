# Alphabet trainer pronunciation audio

Every letter is voiced twice: its own phoneme clip, and one clip per word in its `exampleWordIds`. Same pipeline as [VOCABULARY_AUDIO.md](VOCABULARY_AUDIO.md) — read that first for the storage case, the encoding, and the voice and model rules. This covers only what's specific to the alphabet.

## Where the files live

- Letter phonemes: `static/audio/alphabet/<letterId>.m4a`, from [`letterAudioSrc()`](../src/lib/content/alphabetAudio.ts).
- Example words: `static/audio/words/<wordId>.m4a`. These are ordinary library entries shared with decks and dialogues — a letter's example word is the same entry and the same clip a deck would use (Conventions §10).

Same encoding, voice and model as words.

## Letter phonemes: send the bare glyph

The prompt is the glyph itself — not the traditional letter name (`Այբ`, `Բեն`), not a carrier phrase. A bare single-character prompt reliably produces a short, clean clip; changing this would mean regenerating the whole letter set for consistency. For the digraph `u` (ՈՒ) and the ligature `yev` (և, lowercase only), send the glyphs exactly as they appear in `alphabet.ts`.

### Some letters need a schwa buffer

`Պ`, `Ռ`, `Տ` and `Գ` fail as bare glyphs with a generic "unexpected error processing this generation", in either case, with or without punctuation, on fresh uncontended retries. The same letters generate fine inside a real word, so the trigger is the isolated single character, not the sound.

**Membership isn't fixed**: `Գ` generated fine as a bare glyph until it started failing during a later regeneration. Treat the list as the letters *known* to need it and apply the fix on any bare-glyph failure.

**Fix: append the schwa `Ը`** — `Պը`, `Ռը`, `Տը`, `Գը` — the same trick English phonics uses to make an isolated stop consonant sayable ("buh" for B). Still save under the plain letter id; the schwa is prompt-only.

## The "Ո" → "Վ" fix applies to the letter `vo` itself

`vo`'s traditional letter name *is* "vo", so a bare `Ո` hits the same engine bug words do and produces a flat "o" — which is also `o`'s (Օ) sound. Since `o`/`vo` is a listed confusable pair, two identical clips would make the drill's `audio` question unanswerable for it. Generate `vo` from the prompt `Վո`; `o` needs no trick.

The rule applies per *word* as well, checked per word rather than inherited from whichever letter the word illustrates — the "Ու" digraph and the `ով`/`ովքեր` exceptions are unaffected.

## This pipeline needs a human listening pass — every time

Quality can't be verified by the agent generating it: metadata catches outright failures and gross mismatches, not pacing, tone, clipped edges or stress. Generation is non-deterministic, so the same prompt gives a better or worse take run to run. A clip isn't done because generation succeeded. Expect more than one round on a tricky letter; that's normal.

## Two superseded techniques

Both were used for quality complaints and neither survived measurement. The current rules live in [VOCABULARY_AUDIO.md](VOCABULARY_AUDIO.md):

- **A trailing Latin period is the wrong terminal.** End an Armenian prompt with `։`, never `.`. Letters generated as bare glyphs have no terminal at all, which is fine; if a glyph ever needs one, it's `։`.
- **Delivery-direction tags cost ~8× and over-articulate** — ≈55 credits against ≈7, and takes at 1.0–2.2 s against 0.6–0.9 s. For a loanword's stress use the shesht `՛`; otherwise `։` is enough.
- **Two takes picked by ear beats one take steered by a tag.** Re-roll at eight only for a clip already rejected once.

One related content lesson: **when a word's generated audio persistently says a different real word than the one requested, rename the entry to match the audio rather than spending more generations.** The model kept saying "Ռուսական" for "Ռուս" across several prompts, and the existing file only needed renaming.

If a letter reads as a question — a bare `Հը` is also how the interjection "huh?" is written — the lever is the terminal `։`, then a different take. Not a direction tag: the dialogue work measured that what separates a question from a statement in this voice is **where the pitch peak lands, not the terminal punctuation**.

## Breath trim

Measured across all 39 letter clips, **none has a detectable trailing breath** and none is longer than 0.56 s — bare-glyph clips are tight, so nothing needs re-trimming. The glued-breath spectral rule fires on nothing here, including `seh` (Ս), only because the clips have no quiet trailing region to misread. **That's luck, not safety:** if a letter clip is ever regenerated with a tail, don't run that rule on a name ending in a fricative — pick another take.

## Adding a new letter or word

Follow VOCABULARY_AUDIO.md's checklist, with these substitutions:

- A new letter needs `static/audio/alphabet/<id>.m4a`, prompt = the bare glyph (respelled "Ո"→"Վ" only for `vo`; add a schwa buffer if it fails outright). If the tone is off, generate two takes and pick — not a direction tag.
- A new word needs `static/audio/words/<id>.m4a`, prompt = its `armenian` verbatim plus `։`, respelled "Ո"→"Վ" only if it starts with a bare "Ո".
- Either way, **listen before calling it done.** There's no missing-audio fallback: a wrong clip fails silently to the learner, not loudly to you.

## Words swapped after audio review

Three example words were replaced outright, not just re-recorded:

- `kov` (Կով, "cow") → `mot` (Մոտ, "near") for `vo` — correct but a pedagogically odd way to show Ո as mid-word "o".
- `radio` (Ռադիո) → `rus` (Ռուս) for `ra` — the loanword's audio stressed the wrong syllable; a monosyllable removes stress as a variable.
- `rus` → `rusakan` (Ռուսական) — the model wouldn't reliably say "Ռուս", so the entry was renamed to what it kept saying. No new audio needed.
