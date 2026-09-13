# Alphabet trainer pronunciation audio

Every [`AlphabetLetter`](../src/lib/content/alphabet.ts) is voiced twice: its own
phoneme clip (played from the letter sheet, the "learn" step, and the drill's
`audio` question type) and one clip per resolved
[`Word`](../src/lib/content/words/types.ts) in its `exampleWordIds`. Same
pipeline and reasoning as [`docs/VOCABULARY_AUDIO.md`](VOCABULARY_AUDIO.md) —
read that doc first for the full case for static files over Supabase Storage,
the encoding rationale, and the voice/model history. This doc only covers
what's specific to the alphabet trainer: two content-decisions arrived at
empirically (not in the vocabulary doc) that the next person adding a letter
or word needs to know.

## Where the files live

- Letter phonemes: [`static/audio/alphabet/<letterId>.m4a`](../static/audio/alphabet/) —
  path from [`letterAudioSrc()`](../src/lib/content/alphabetAudio.ts).
- Example words: [`static/audio/words/<wordId>.m4a`](../static/audio/words/) —
  path from [`wordAudioSrc()`](../src/lib/content/words/audio.ts). These are
  ordinary entries in the app-wide word library
  ([`words/entries.ts`](../src/lib/content/words/entries.ts)), shared with
  the vocabulary decks and dialogues — a letter's example word is the same
  entry, and the same clip, a deck would use (Conventions §10).

Same encoding as vocabulary audio: `ffmpeg -i <input> -ac 1 -ar 24000 -c:a aac
-b:a 32k -movflags +faststart`. Same voice (`B7DEF4tn54LpozCVN7ah`, "Tereza
jan speaks Armenian") and model (`eleven_v3`, `generations_count: 2` — see
the take-count note in `VOCABULARY_AUDIO.md`) via the
ElevenLabs MCP connector's `creative_generate_speech` tool, polled via
`creative_get_flow_run_status` until `all_completed`, downloaded from
`media[].url`.

## Letter phonemes: send the bare glyph, not a spelled-out name or word

For `letterAudioSrc()` clips, the TTS prompt is just the letter's glyph itself
(e.g. `Ա`, `Բ`, `Ք`) — nothing else. This was a genuine open question before
any of this audio existed (confirmed empirically, not assumed): a bare
single-character prompt reliably produces a short (well under a second), clean
clip, verified by round-tripping the very first clip generated (`Ա`) through
`creative_transcribe_audio` and confirming a short, sane result rather than a
long ramble or garbled output. Don't switch to spelling out the letter's
traditional name (`Այբ`, `Բեն`, ...) or wrapping it in a carrier phrase — the
bare glyph is simpler, shorter, and already validated; changing this would
mean regenerating the whole letter set to keep it consistent (same "a voice
swap is a full-catalog redo" reasoning as `VOCABULARY_AUDIO.md`).

For the digraph `u` (ՈՒ) and the ligature `yev` (և, lowercase only — it has no
uppercase form, see the comment on its `alphabet.ts` entry), send the glyph(s)
exactly as they appear in `alphabet.ts` — same rule, no special-casing needed.

### Four letters need a schwa buffer: `peh`, `ra`, `tiwn`, `gim`

`Պ` (peh), `Ռ` (ra), `Տ` (tiwn) and `Գ` (gim) — unrelated, unaspirated
stop/rolled-consonant letters — each consistently failed generation as a bare
glyph, in both upper- and lowercase, with punctuation or without: ElevenLabs
returned `"There was an unexpected error processing this generation. Please
try again."` on every attempt (confirmed not a transient/concurrency fluke —
still failed on a fresh, uncontended retry). The same letters generate fine
as part of a real word (e.g. `panir`'s `Պանիր`), so the trigger is specific to
submitting one of these as an isolated single-character prompt, not the
sound itself.

`gim` joined this set on 2026-09-08: it had generated fine as a bare `Գ`
before, but failed with the same generic error during the full regeneration
and succeeded immediately on `Գը`. So **membership in this set is not fixed —
a letter that generated fine once can start failing.** Treat the list as the
letters known to need the buffer, not a closed set, and apply the fix on any
bare-glyph failure rather than assuming something else is wrong.

**Fix: append the schwa Ը** (the same vowel as the letter `uht`, "a quick,
unstressed sound") to make the prompt `Պը`/`Ռը`/`Տը`/`Գը` instead of the bare
glyph. This is the same trick English phonics uses to make an isolated stop
consonant sayable at all ("buh" for B, "duh" for D) — pedagogically fine, not
a hack — and it reliably generates (confirmed on all four, first try after
the switch). Still save as `peh.m4a`/`ra.m4a`/`tiwn.m4a`/`gim.m4a` — the
schwa is only in the TTS prompt, same "never in stored text" rule as the
"Ո"→"Վ" fix below.
If a *new* letter ever hits this same generic error as a bare glyph, try this
schwa-buffer fix before assuming something else is wrong.

## The "Ո" → "Վ" prompt fix applies to the letter `vo` itself, not just words

`VOCABULARY_AUDIO.md` documents that ElevenLabs misreads a word-initial
standalone "Ո" as a flat "o" instead of the correct "vo", and that the fix is
to respell it "Ո"→"Վ" in the TTS *prompt* only, never in stored text. That
rule was written for vocabulary *words* — but it also applies to the letter
`vo`'s own phoneme clip, for a reason worth spelling out:

`vo`'s traditional Armenian letter name **is** "vo" — sending the bare glyph
"Ո" hits the exact same TTS bug and would produce a flat "o", which is also
`o`'s (Օ) sound. Since `o`/`vo` (Օ/Ո) is a listed confusable pair in
[`alphabetConfusables.ts`](../src/lib/content/alphabetConfusables.ts), two
identical-sounding clips would make the drill's `audio` question type
("which letter did you hear?") unanswerable for that pair — there'd be
nothing to actually hear apart. So `vo`'s clip is generated by sending the
prompt `Վո` (not `Ո`) — same respelling trick, applied to a single letter
instead of a word, for the same underlying reason. `o` (Օ) needs no such
trick and is generated normally.

Applies to any *word* starting with a bare "Ո" too, exactly as
`VOCABULARY_AUDIO.md` describes — e.g. `vonts` (Ոնց) in `words/entries.ts` is
generated with the prompt `Վոնց`. Check this per word, not inherited from
whichever letter it happens to be that word's example — the digraph "Ու" and
the `ով`/`ովքեր` exceptions are unaffected, same as documented there.

## This pipeline needs a human listening pass — every time

Unlike the rest of this codebase, audio quality here can't be verified by the
agent generating it: there's no playback available while working, only
metadata (duration, transcription round-trips, error/success status). Those
catch outright failures and gross mismatches, not quality — pacing, tone,
clipped starts/ends, and stress placement all require an actual human listen.
Generation is also non-deterministic: the *exact same prompt* can produce a
noticeably better or worse take on a different run. Don't treat a clip as
done just because generation succeeded and the duration looks sane — it isn't
done until someone has actually listened to it. Expect more than one round on
letters/words that turn out tricky; that's normal, not a sign the pipeline is
broken.

## Two techniques for common quality problems — both now superseded

Beyond the schwa-buffer and "Ո"→"Վ" fixes above (which fix generation
*failures* and *wrong phonemes*), two more techniques were used for quality
complaints on clips that generate successfully but sound off. **The word
library work of 2026-09-10 measured both, and neither survives.** The
history is kept below for what it documents; the current rules are in
`VOCABULARY_AUDIO.md` and summarised here:

- **The trailing Latin period is the wrong terminal.** End every Armenian
  prompt with the Armenian full stop **`։`** (U+0589), never `.`. A Latin
  period weakens the engine's commitment to an Armenian reading — on a
  loanword it falls back to the source language's stress — and the
  controlled comparison on `Նորմալ`/`Նայել`/`Անել` showed `։` alone fixing
  wrong-syllable stress that the period left broken. Every clip in
  `static/audio/words/` now ends its prompt in `։`. Letters generated as bare
  glyphs have no terminal at all, which is fine; if a glyph ever needs one,
  it is `։`.
- **Delivery-direction tags cost roughly eight times as much and
  over-articulate.** The bracketed text is billed as characters — a tagged
  single word ran ≈55 credits against ≈7 plain — and the takes came back at
  1.0–2.2 s, drawled, against 0.6–0.9 s. Do not reach for a tag for stress
  or energy. For a loanword whose source language stresses a different
  syllable, add the shesht `՛` on the right syllable instead
  (`Նորմա՛լ։`); for a native word the `։` is enough.
- **Two takes, picked by ear, beats one take steered by a tag.** Generate
  `generations_count: 2`, audition both in the picker page described in
  `VOCABULARY_AUDIO.md`, and re-roll at eight only for a clip that has
  already been rejected once.

What was believed before, kept as a record of the reasoning at the time:

- **Delivery-direction tags** (an `eleven_v3` feature): a bracketed
  instruction prepended to the prompt, e.g. `[speaking slowly and clearly]
  Ընկեր.` or `[speaking plainly, calmly] Յոթ.` — not spoken aloud, it steers
  delivery. Reached for on complaints like "too fast," "too emotional," or
  "too enthusiastic." Effectiveness so far is mixed: it fixed the pacing
  complaint on `ynker` and the over-emotional complaint on `yot`, but a
  *later* round still found `xeh` and `sha` "too enthusiastic" even after
  their schwa-buffer regeneration — the schwa fix targets isolation/garbling,
  not tone, so a letter can need *both* a schwa buffer *and* a direction tag.
  If a schwa-buffered letter still sounds off in tone, try combining them,
  e.g. `[speaking calmly] Խը` rather than reaching for a different fix.
- **A trailing period** in the prompt only (never in stored text): meant to
  give the model a clearer "this is the end" cue instead of clipping. Fixed
  the reported end-of-clip artifact on some words, but not reliably — `shun`
  (Շուն) got a trailing-period regeneration for an end artifact, and a
  *later* round found it "juuust a little cut off," this time at the
  *beginning*, a different symptom the period doesn't address at all. Don't
  assume one technique generalizes across a clip's whole timeline.

**A confirmed content bug, resolved by renaming rather than fighting the
model:** the word meant to be the standalone "Ռուս" ("a Russian person")
was consistently generated as "Ռուսական" ("Russian," adjective, e.g. "Russian
cuisine") across multiple prompt attempts — the model kept substituting a
longer, more common derived word for the short one actually requested. This
is a pronunciation-of-the-wrong-word bug, not a delivery issue a direction
tag or period would touch. Rather than keep spending generations trying to
force "Ռուս" specifically, the entry was renamed to `rusakan`/`Ռուսական` to
match what the voice actually says — the existing audio file didn't even
need regenerating, just renaming to `rusakan.m4a` alongside the content
change. **When a word's generated audio persistently says a different real
word than the one requested, consider renaming to match the audio before
spending more generations on it** — same category of fix as `kov`→`mot`
above, just triggered by "the model won't say X" instead of "X was a poor
pedagogical choice."

The per-letter tuning below was all done against the *previous* recording of
the Tereza jan voice. On 2026-09-08 both workspace voices were re-cloned for
higher quality (same `voice_id`s — see the re-clone note in
[`VOCABULARY_AUDIO.md`](VOCABULARY_AUDIO.md)) and the whole catalog was
regenerated, so **every clip in `static/audio/` is a fresh, un-listened-to
take** and the complaints recorded here are history, not current state. Kept
for the technique they document, not as a live to-do list:

- `jheh` (ջ) and `xeh`/`sha` had tone complaints ("too enthusiastic,"
  "sounds disappointed") that outlived their schwa-buffer fix. They were
  regenerated as bare glyphs — the schwa buffer is only *required* for the
  letters that fail outright (below), and these three generate fine without
  it — so if the tone complaint recurs, reach for a direction tag first,
  not the buffer.
- `nor` (Նոր, "new") kept `[speaking clearly, enunciating the ending] Նոր.`
  (direction tag plus trailing period, targeting the final Ր that was
  reading as "not"), which a listen had confirmed resolved it on
  2026-08-20. Same for `ynker`'s pacing tag and `yot`'s calm tag.
- `ho` (հ) took two rounds on 2026-08-20 and ended on `[speaking plainly and
  confidently, as a statement, not a question] Հը.` — a trailing period plus
  a tag explicitly ruling out a question, because a bare unpunctuated `Հը`
  is also how the Armenian interjection "huh?" is written and the model kept
  leaning into that reading. That take was never confirmed by listen, so the
  2026-09 regeneration went back to the plain glyph `Հ`. **Takeaway if it
  recurs:** the 2026-09-10 dialogue work measured what actually separates a
  question from a statement in this voice, and it is **where the pitch peak
  lands, not the terminal punctuation** — every accepted question in
  `bread-shop` *falls* at the end, exactly like the statements. So if `Հը`
  reads as "huh?", the lever is the terminal `։` (never a Latin period —
  see above), and if that is not enough, a different take rather than a
  direction tag.

## Breath trim: the alphabet is clean, and the sibilant trap does not bite it

`VOCABULARY_AUDIO.md` documents the trailing-breath trim: the voice
frequently inhales after a word, and the gap-based rule cuts it. Measured
across all 39 letter clips on 2026-09-10, **none has a detectable trailing
breath** and none is longer than 0.56 s. The letters were generated as bare
glyphs and are tight; nothing needs re-trimming.

The same document records that the "glued breath" spectral rule is a
sibilant detector, not a breath detector — it fires on words ending in
/s/, /tʃ/, /ts/ and would cut the consonant off. Run over the alphabet it
fires on nothing, including `seh` (Ս), because the clips have no quiet
trailing region for it to misread. **That is luck, not safety.** If a letter
clip is ever regenerated with a tail, do not run that rule on a name ending
in a fricative — pick a different take.

## Adding a new letter or word

Follow `VOCABULARY_AUDIO.md`'s "Adding audio for a new word" checklist,
substituting the path/prompt conventions above:
- A new `AlphabetLetter` needs a clip at `static/audio/alphabet/<id>.m4a`,
  prompt = the bare glyph (respelled "Ո"→"Վ" only if the glyph is `vo`; add a
  schwa buffer if it fails outright as a bare glyph). If the tone is off,
  generate two takes and pick — **not** a delivery-direction tag, which is
  superseded above.
- A new `Word` in `words/entries.ts` needs a clip at
  `static/audio/words/<id>.m4a`, prompt = its `armenian` field verbatim
  (respelled "Ո"→"Վ" only if it starts with a bare "Ո", checked per word; add
  a trailing period or direction tag if a first take has quality problems).
- Either way: **listen to it, or have it listened to, before considering the
  entry done.** No code change is needed beyond the content file itself —
  `letterAudioSrc()`/`wordAudioSrc()` derive the path from the id, and
  there's no "missing audio" UI fallback, same as vocabulary — a bad or
  wrong clip fails silently to the learner, not loudly to you.

## Words swapped after audio review

Three `words/entries.ts` example words were replaced entirely (content and,
usually, audio) because review turned up a better-suited word or a word the
model would actually cooperate with — not just a bad take needing a
re-record:
- `kov` (Կով, "cow") → `mot` (Մոտ, "near") for the letter `vo` — technically
  correct but a pedagogically odd choice to demonstrate Ո as mid-word plain
  "o"; `mot` demonstrates the same thing with a far more everyday word.
- `radio` (Ռադիո, "radio") → `rus` (Ռուս, "Russian," noun) for the letter
  `ra` — the loanword's generated audio stressed the wrong syllable; `rus`
  is monosyllabic, sidestepping stress placement as a variable entirely.
- `rus` → `rusakan` (Ռուսական, "Russian," adjective) — see the content-bug
  note above: the model wouldn't reliably say "Ռուս" no matter the prompt,
  so the entry was renamed to the word it actually kept saying instead. This
  one needed no new audio generation, only a rename of the existing file.
