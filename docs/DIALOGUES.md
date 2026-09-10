# Dialogues

Short two-person conversations in Armenian, each built around one grammar
rule. This doc covers the content model — in particular how a dialogue
shares words and audio with the rest of the app instead of duplicating
them — the player's behaviour, progress tracking, and the audio checklist
for a new dialogue.

## The two characters

The app has exactly two characters, defined once in
[`src/lib/content/dialogues/characters.ts`](../src/lib/content/dialogues/characters.ts):
**Tereza** and **Dmitrii**. They are the same two people as the app's two
ElevenLabs voices (see "Voices and model" in
[`VOCABULARY_AUDIO.md`](VOCABULARY_AUDIO.md)), so a line shown as Tereza's
is spoken by Tereza's voice. Each has one drawn avatar — the two inline
SVG faces from the Dialogues design (a dark bob for Tereza, a shaved head
for Dmitrii), coloured from the token ramps — in
[`CharacterAvatar.svelte`](../src/lib/components/CharacterAvatar.svelte).
Deliberately not photos: the app's characters are the illustrated pair,
even though the voices behind them are real people. Every dialogue is a
conversation between the two; there is no third speaker and no
per-dialogue cast.

Their names go through `Translated` like everything else (they're
transliterated differently per locale — Tereza/Тереза), unlike `brandName`.

## Content model — one word library, referenced by id

The whole point of the architecture (see
[Conventions §10](CONVENTIONS.md#10-words-live-in-one-shared-library-decks-and-dialogues-reference-it-by-id)):
**a dialogue never defines or records a word.** It links to the app-wide
word library, [`src/lib/content/words/entries.ts`](../src/lib/content/words/entries.ts),
the same registry the vocabulary decks list their words from and the
alphabet trainer takes its example words from.

A dialogue is two files:

- A catalog entry in [`catalog.ts`](../src/lib/content/dialogues/catalog.ts)
  (`DialogueSummary`: id, Armenian title and its translation, the rule's
  headline forms, rough duration, line count). Safe to import anywhere —
  the list page and the account dashboard only ever need this.
- A content file, `dialogues/<id>.ts`, exporting `RULE` (the "one rule
  first" card) and `LINES`. Loaded lazily through
  [`loadDialogue()`](../src/lib/content/dialogues/loadDialogue.ts), never
  imported directly (enforced by eslint).

Each line is a speaker, a translation, and **tokens** — the words as
actually spoken, punctuation included:

```ts
tok('հա՞ցը։', 'hats', { en: 'the bread', ru: 'хлеб (этот)' }, {
	en: 'Definite -ը. The ՞ marks the syllable the voice lifts for a question.',
	ru: '...'
})
```

- `text` is the surface form, verbatim — inflected, with its ՞/՛/։ marks,
  in the line's real casing (the one place Armenian isn't capitalized, since
  this *is* running text).
- `wordId` points at the library entry the token is a form of. Tapping the
  token opens [`DialogueWordPopover.svelte`](../src/lib/components/DialogueWordPopover.svelte),
  which shows the base form (`Հաց`) and plays the library's one clip for it
  via the shared `SpeakerButton`. So `ուզում` links to `uzel` — the verbs
  deck's "To want", with the clip that deck already had — and `Բարև։` to
  `barev`, which is also a greetings-deck word and the alphabet's example
  for Բ. A token with nothing to look up (a name, a bare mark) omits
  `wordId` and renders as plain text.
- `gloss` and `note` are optional and *contextual*: what the token means in
  this line when that differs from the library translation ("the bread" vs
  "Bread"; "want" vs "To want"), and a remark about this occurrence. Both
  fall back to the library word's own `translation`/`note`, so most tokens
  need neither.

`loadDialogue()` throws on a `wordId` the library doesn't have and on a
`lineCount` that doesn't match the file, so a content typo fails on the
first load of that dialogue rather than shipping as an untappable word.

**Adding a dialogue:** write the content file, add the catalog entry, then
for every token whose base word isn't in the library yet, add the library
entry (Conventions §10's capitalization rules apply to the entry, not the
token) and generate its clip per `VOCABULARY_AUDIO.md`. Then record the
lines (below). The bread-shop dialogue needed 18 new library words — all
function words and shop nouns — and reused 5 existing ones.

## The player

[`DialoguePlayer.svelte`](../src/lib/components/DialoguePlayer.svelte),
with one [`DialogueLineBubble.svelte`](../src/lib/components/DialogueLineBubble.svelte)
per line and [`DialogueRuleCard.svelte`](../src/lib/components/DialogueRuleCard.svelte)
on top:

- **Listen vs Read.** In Listen mode (the default) each line's Armenian is
  blurred — present, so revealing it never reflows the page, but
  `aria-hidden` with its word buttons disabled — with a per-line eye button
  to reveal it. Read mode shows everything. Once a line is readable, a
  per-line button toggles its translation, and every word is tappable.
- **Playback** is [`DialoguePlayback`](../src/lib/dialogues/playback.svelte.ts):
  one `<audio>`, one line at a time. The play button on a line plays just
  that line; "Play all" in the fixed bottom bar walks from the cursor to the
  end with a short gap between lines, and the stop button rewinds. A
  generation counter guards against a stale `ended` event advancing the
  cursor after the learner has moved on.
- **Missing line clips are treated as fixed-length silence.** Until a
  dialogue's line files exist, every line 404s; rather than stall "Play all"
  on the first line, the player waits ~1.6s and moves on, highlighting each
  line in turn. That's the same "no missing-audio UI state, fail silently"
  rule as `SpeakerButton`, extended so the flow keeps working — it means a
  missing clip is found by listening, not by the app complaining.
- **The word popover** hangs under its word and shifts itself sideways to
  stay inside the viewport (a wrapped line can put a token anywhere). It
  closes on an outside click, on Escape, and when switching to Listen mode.
  Words the learner opened are collected (once per library word) for the
  done screen's recap.
- **Motion** is fade-dominant and low-travel throughout (4px rises, no
  slides) — the app's reduced-motion rule collapses all of it, and the
  "playing" waveform is replaced by a static shape under reduced motion.
  The rule card's body and each line's translation grow open with a native
  `height: 0 → auto` transition (`interpolate-size: allow-keywords`), text
  fading in a beat behind; the word popover fades and rises in, and fades
  and drops out the same way. See "Design decisions" below.

## Design decisions

Decisions made while reviewing the first build against the Claude Design
mockup, recorded so they don't get re-litigated:

- **Avatars are the mockup's drawn faces, not photos.** The design project
  also held the two people's photos in `uploads/`, and the first build used
  them; the mockup itself only ever drew the two SVG faces, and that's what
  ships (`CharacterAvatar.svelte`). Two colour ramps only — skin from
  `--color-accent-300`, hair/ink/shoulders from the neutral ramp — so the
  pair reads as part of the palette, not as clip art on top of it.
- **Dmitrii is on the right with a tinted bubble; Tereza on the left on
  plain surface.** The one place a tinted fill sits on something bigger
  than a badge; DESIGN.md's colour section explains why that's allowed
  here. Which side a character takes is the player's call
  (`side` on `DialogueLineBubble`), not a property of the line.
- **Expanding sections animate height natively** instead of a measured
  pixel height or a `max-height` guess: `interpolate-size: allow-keywords`
  plus `transition: height`, on an always-rendered element toggled by a
  class (with `inert` while collapsed) so it animates closed as well as
  open. Firefox and Safari don't support it yet and simply snap; that's
  accepted, no JS fallback. Gotcha found on the way: a column flex item's
  `min-height: auto` silently beats `height: 0` — the translation box sets
  `min-height: 0` for that reason.
- **The word popover animates out as well as in.** It sits in an `{#if}`,
  so a CSS entrance animation left it vanishing instantly on close; it now
  uses a Svelte `in:`/`out:` transition, the only mechanism that keeps a
  removed element around long enough to fade. Same 4px fade-and-rise both
  ways, 170ms in / 140ms out.
- **"That's a wrap — mark it done" lifts on hover** like a primary button
  would, via `Button`'s `lift` prop, even though it's the sage `success`
  variant: it's the screen's one commit action, which is exactly what that
  physicality signals. The mockup's extra 1.2° tilt on hover was dropped —
  a straight rise is enough and keeps every lifting button in the app
  behaving identically.
- **The per-line reveal/translate buttons are 2rem, under the 44px tap
  floor.** Two of them stack inside a bubble whose height a single line of
  text sets; the play button and the words themselves are the line's real
  affordances and meet the floor, and the bubble's edges around the small
  buttons are inert. Noted in the component; don't "fix" it by growing the
  bubbles.
- **Missing line audio is a timed silence, not an error state.** So the
  whole player can be exercised before a dialogue's clips exist — see "The
  player" above and the audio checklist below.
- **Signed-out learners can play everything.** Only "mark it done" is
  gated, and it resumes after sign-in rather than losing the tap.

## Progress

"That's a wrap — mark it done" posts the page's `complete` action, which
upserts a row in `user_dialogue_progress` (`user_id, dialogue_id,
completed_at, completions`; migration
`20260908120000_create_user_dialogue_progress.sql`). A signed-out learner
can play a dialogue freely; only saving the completion is gated, and it
resumes itself after sign-in through `requireSignedIn()`'s `resume` option
exactly like adding a vocabulary deck does. Re-completing bumps
`completions` rather than adding a row, so "N of M completed" on the account
dashboard is a row count — filtered to ids still in the catalog, so a
removed dialogue can't push completed past total.

The done screen ([`DialogueDone.svelte`](../src/lib/components/DialogueDone.svelte))
shows the tapped-word recap and a "Next" button for the following catalog
entry, if any. The list page marks completed dialogues with a check on
their number.

## Line audio

A line is a unique recording — a whole sentence, in one of two voices, with
sentence intonation — so unlike words it *is* stored per dialogue:
`static/audio/dialogues/<dialogueId>/<nn>.m4a`, `nn` being the line's
1-based position zero-padded to two digits (`01.m4a`), from
[`lineAudioSrc()`](../src/lib/content/dialogues/audio.ts). The words inside
a line are never re-recorded; their popovers play the library clips.

**`bread-shop` has all eleven line clips**, installed 2026-09-10 from one
chosen read per speaker. Generate a dialogue's lines like this:

### Record each speaker's whole part in ONE generation

Do **not** generate a line at a time. Every `creative_generate_speech` call
is an independent draw of timbre and energy, so eleven separately-generated
lines are eleven slightly different voices. Individually each can sound fine
while the dialogue as a whole sounds assembled from different sessions —
which is exactly how it was first noticed here.

Instead, put **all of one speaker's lines in a single prompt**, separated by
blank lines, and generate four takes of that. Each take is then one
performance: same voice throughout, and livelier, because the model is
reading continuous speech rather than cold-starting eleven times. The
reviewer picks a *read*, not a line.

Then cut the read into lines. This is the fiddly part:

- **Silence alone cannot find the line boundaries.** Armenian sentences
  inside a line produce gaps just as long as the gaps between lines — in one
  Dmitrii read there were eight gaps for six lines, and the *longest* was the
  sentence break inside line 01, after `Բարև։`.
- **`<break time="1.5s" />` does not work.** It is an `eleven_v2` feature;
  `eleven_v3` silently ignores it. A probe with 1.5 s breaks between all six
  lines produced no gap longer than 0.42 s. Do not waste a generation on it.
- **What does work:** pick the (N−1) gaps that best fit the line lengths you
  already know, taken from per-line takes or a previous read. Brute-force all
  combinations, score by squared error against the expected cumulative
  positions, and **reject any combination where a segment is more than 45%
  off its expected length** — without that constraint the optimiser cheerfully
  cuts after `Բարև։` and pays for it later in the read.
- Detect candidate gaps at `silencedetect=noise=-40dB:d=0.06`. `d=0.10` is
  too coarse and loses the real boundaries in fast reads.

Report the **fit** (RMS boundary error) with each read and treat it as a
quality gate: **under ~0.2 s the cut landed correctly**; 0.4 s and above means
it did not, and the read should be rejected rather than shipped. Still listen
for a clipped first or last word — the fit number is evidence, not proof.

Finally, run each cut line through the trailing-breath trim from
`VOCABULARY_AUDIO.md`. Speakers inhale between lines, and that inhale lands
at the end of the preceding line's clip.


### Questions read as statements when the pitch peak lands on the wrong word

Armenian has no sentence-final question mark: the interrogative is marked
*inside* a word by `՞` on the stressed syllable, and the sentence still ends
with `։`. The natural first guess — that the trailing `։` makes the voice fall
and so kills the question — **is wrong**, and it is worth recording why, so
nobody re-derives it.

Measuring the terminal pitch of all eleven `bread-shop` lines (median F0 of
the last 220 ms against the rest) shows the questions the reviewer *accepted*
all **fall** at the end, by 0.9 to 5.2 semitones — just like the statements.
The one line heard as flat, `Էլ ի՞նչ եք ուզում։`, is the only line in the
dialogue whose pitch **rises**. Terminal direction is not the cue.

What separates them is **where the pitch peak sits**:

| line | | peak position | prominence |
|------|---|---------------|------------|
| 02 | Այս հա**՞**ցը։ | 61% | +5.1 st |
| 06 | Այս կա**՞**թը, թե՞ … | 22% | +6.8 st |
| 08 | սրանք ի**՞**նչ են։ | 28% | +2.7 st |
| 10 | դրանք մի**՞**ս են։ | 70% | +8.4 st |
| **04** | **Էլ ի՞նչ եք ուզում։** | **100%** | +6.2 st |

Every accepted question peaks in the middle of the line, on or beside its
`՞`-marked word. Line 04 peaks on the **final** word, `ուզում` — the verb, not
the question word — and a late peak on the verb is a listing or continuation
contour, which is exactly why it reads as a statement.

So the rule is: **the `՞` word must carry the pitch peak.** When the peak
drifts onto the last word, the line stops sounding like a question no matter
what the punctuation says.

Steering it is unresolved. Three prompt variants of that line, two takes
each, measured by peak position (`ի՞նչ` sits at roughly 25–40% of the line):

- `Էլ ի՞նչ եք ուզում։` (baseline, standalone) — peak at 0–4%, on `Էլ`. Worse
  than the in-read version.
- `Էլ ի՞նչ եք ուզու՞մ։` (`՞` repeated on the last word) — peak at 0–1%. **The
  doubled mark did not pull the peak to the end; it made things worse.**
- `Էլ ի՞նչ եք ուզում?` (Latin `?` as terminal) — peak at 28–38%, i.e. **onto
  `ի՞նչ`, the right word**. The most promising of the three.

Treat that as a lead, not a rule: n=2 per arm, and note that a line generated
**standalone** behaves differently from the same line inside a continuous read
— the standalone baseline put the peak on the first word, while the in-read
version at least had strong prominence, merely in the wrong place. The honest
test is to regenerate the speaker's whole part with the Latin `?` on that one
line and compare in context. Also re-check the vowels if you do: the
`VOCABULARY_AUDIO.md` finding that Latin terminal punctuation weakens the
model's commitment to an Armenian reading still applies.

All of this is **prompt-only**. The text shown in the app stays
orthographically correct, exactly as with the "Ո"→"Վ" respelling.

### Steps

1. One `creative_generate_speech` per speaker, `model_id: "eleven_v3"`,
   `generations_count: 2`, prompt = that speaker's lines joined by blank
   lines, exact text with marks included (the ՞ and ՛ help intonation), and
   the speaker's voice: Tereza jan (`B7DEF4tn54LpozCVN7ah`) for
   `speaker: 'tereza'`, Lazy Dmitrii (`oNYQkBHg8N8sOXiVNvyU`) for
   `speaker: 'dmitrii'`. The word-initial "Ո"→"Վ" respelling from
   `VOCABULARY_AUDIO.md` applies inside a line too (`Ոչ` in the last line).
   **Fire the two calls in separate messages** — the subscription allows five
   concurrent requests, and a batch that exceeds it fails individual
   generations with "Too many concurrent requests" while still billing them.
2. Poll, download, split as above, trim, and transcode with the same
   `ffmpeg` command as words.
3. Save as `static/audio/dialogues/<dialogueId>/<nn>.m4a` and commit.
4. Listen to every line before calling the dialogue done — nothing in the
   app will tell you a clip is missing or wrong.
