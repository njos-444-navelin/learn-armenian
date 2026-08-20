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
  path from [`wordAudioSrc()`](../src/lib/content/words/audio.ts). Flat, not
  deck-scoped, since this registry isn't organized into decks (see the
  comment atop [`words/entries.ts`](../src/lib/content/words/entries.ts) for
  why this is a separate registry from `vocabulary/decks/*.ts` rather than
  reusing it).

Same encoding as vocabulary audio: `ffmpeg -i <input> -ac 1 -ar 24000 -c:a aac
-b:a 32k -movflags +faststart`. Same voice (`B7DEF4tn54LpozCVN7ah`, "Tereza
jan speaks Armenian") and model (`eleven_v3`, `generations_count: 1`) via the
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

### Three letters need a schwa buffer: `peh`, `ra`, `tiwn`

`Պ` (peh), `Ռ` (ra) and `Տ` (tiwn) — three unrelated, unaspirated
stop/rolled-consonant letters — each consistently failed generation as a bare
glyph, in both upper- and lowercase, with punctuation or without: ElevenLabs
returned `"There was an unexpected error processing this generation. Please
try again."` on every attempt (confirmed not a transient/concurrency fluke —
still failed on a fresh, uncontended retry). The same letters generate fine
as part of a real word (e.g. `panir`'s `Պանիր`), so the trigger is specific to
submitting one of these three as an isolated single-character prompt, not the
sound itself.

**Fix: append the schwa Ը** (the same vowel as the letter `uht`, "a quick,
unstressed sound") to make the prompt `Պը`/`Ռը`/`Տը` instead of the bare
glyph. This is the same trick English phonics uses to make an isolated stop
consonant sayable at all ("buh" for B, "duh" for D) — pedagogically fine, not
a hack — and it reliably generates (confirmed on all three, first try after
the switch). Still save as `peh.m4a`/`ra.m4a`/`tiwn.m4a` — the schwa is only
in the TTS prompt, same "never in stored text" rule as the "Ո"→"Վ" fix below.
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

## Two techniques for common quality problems, with honest effectiveness notes

Beyond the schwa-buffer and "Ո"→"Վ" fixes above (which fix generation
*failures* and *wrong phonemes*), two more techniques help with quality
complaints on clips that generate successfully but sound off. Neither is a
guaranteed fix — both have already had cases where a first application didn't
fully resolve the complaint, requiring another round:

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

**Also open:** `jheh` (ջ) and the schwa-buffer takes of `xeh`/`sha` have had
tone complaints ("too enthusiastic," "sounds disappointed") independent of
the isolation fix that schwa-buffering already solved for them — still need
a regeneration round.

`nor` (Նոր, "new") was re-recorded on 2026-08-20 as `[speaking clearly,
enunciating the ending] Նոր.` (direction tag plus trailing period, targeting
the final Ր that was reading as "not") and confirmed by listen — resolved.

`ho` (հ) took two rounds the same day. First attempt,
`[speaking energetically] Հը` (kept the existing schwa buffer, added an
energetic direction tag for the "sounds a little odd, not energetic"
complaint), came back sounding skeptical/doubting instead — likely because a
bare, unpunctuated `Հը` is also how the Armenian interjection "huh?" is
written, and the model leaned into that reading despite the tag. Second
attempt added a trailing period and reworded the tag to explicitly rule out
a question: `[speaking plainly and confidently, as a statement, not a
question] Հը.`. Pending a human listen to confirm. **Takeaway for next time:**
if a schwa-buffered letter's *un-punctuated* text happens to double as a
real interjection/word in Armenian, try a trailing period before iterating
further on the direction tag — punctuation may be doing more work than the
tag for steering statement-vs-question prosody.

## Adding a new letter or word

Follow `VOCABULARY_AUDIO.md`'s "Adding audio for a new word" checklist,
substituting the path/prompt conventions above:
- A new `AlphabetLetter` needs a clip at `static/audio/alphabet/<id>.m4a`,
  prompt = the bare glyph (respelled "Ո"→"Վ" only if the glyph is `vo`; add a
  schwa buffer if it fails outright as a bare glyph; add a delivery-direction
  tag if it generates but the tone is off).
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
