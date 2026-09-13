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
// text, library word id, gloss for this line, `here` remark for this line
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
- `gloss` is optional and *contextual*: what the token means in this line
  when that differs from the library translation ("the bread" vs "Bread";
  "want" vs "To want"). It falls back to the library `translation`.
- Notes are a two-layer system with its own rules — see the next section.

### Word notes: the library note and the "Here:" remark

Every tapped word can carry two notes, and they are different things:

| | `Word.note` (library, `words/entries.ts`) | `DialogueToken.here` (the token, in the dialogue file) |
|---|---|---|
| **What it is** | The word itself: part of speech, case, what its forms are, how it behaves | This occurrence: why the -ը, where the ՞ sits, an idiom this line builds |
| **Shows** | On every occurrence, in every dialogue and in the trainer | On this token only, always under an italic *Here:* label |
| **Where** | Under the rule, with the dictionary entry (base form · translation · ▶), in the entry's grey | Last, after the library note, same grey — the label is the marker |

The popover reads top to bottom: the gloss (what the tapped form means in
this line) → the dictionary entry with its general note → *Here:*. The
play button sits on the entry row, next to the base form, because the clip
says the base form (`Ուզել`, not `ուզում`); the inflected form is heard
from the line's own play button. When the tapped form *is* the base form
the "from" label is dropped, and the library translation is dropped when it
only repeats the gloss.

There is no per-token override of the library note. If a general note
would mislead in some line, the general note is wrong — fix it.

**Rules for a library note** — every one of these was learned by getting
it wrong in review, several more than once:

1. **True of the word in any sentence a learner could meet it in.** If it
   is only true here, it is a `here`.
2. **Describes the word, not one use of it.** Say what the word *is* — "the
   dative case of Դուք", not "what makes Բարև ձեզ polite". Name the
   grammar (case, mood, auxiliary) rather than talking around it.
3. **Never quotes a phrase.** The tapped line *is* the example. A quoted
   phrase either coincides with a line — then a general note reads as a
   remark about that line, which is exactly what "ուզում եմ" did on «Ես
   ուզում եմ հաց» — or brings in words the learner hasn't met. Forms of
   the word itself (Այո՛, ի՞նչ, սրանք) are fine.
4. **Only words the learner has.** No example vocabulary beyond the
   dialogues so far, and plain English/Russian for the explanation.
5. **No situational wording.** `entries.ts` throws at load on "here",
   "this time", "the shopkeeper" and the like — a tripwire for the exact
   phrasings that slipped through, not a definition of "general".
6. **Formal or informal, always say which.** Armenian has a formal and a
   colloquial word for a lot of everyday things — Շնորհակալություն / մերսի,
   Այո / հա, Ոչ / չէ, and pairs like սիրուն / գեղեցիկ ("beautiful") where
   one is a good deal more formal than the other. A learner who doesn't
   know which they're holding will use the wrong one, so a word with a
   counterpart gets both: `register` on the entry (shown as the italic
   *fml.* / *inf.* marker in the word list and in the popover's entry row)
   and a note that names the counterpart in plain words. When both words
   are in the library, each entry's note points at the other (Ոնց /
   Ինչպես, Ապրես / Ապրեք). Where it's a matter of degree rather than a
   clear pair, the note alone carries it ("slightly more formal").

7. **Write the English and the Russian separately, each for its own
   reader — never translate one into the other.** The two languages don't
   share what needs explaining. English has no polite plural "you", so
   Եք's English note has to spell it out; a Russian reader has вы/Вы and
   only needs "как в русском" — the translated sentence ("вежливая форма
   для любого, к кому обращаются на Вы") reads as nonsense to them. The
   same goes the other way: Russian drops the copula, so «է — есть» needs
   a word of framing that "is" doesn't. For every note, ask what *this*
   reader already knows and what they'd find odd, and write from there.
   This applies to `here` remarks and translations too.

**Rules for a `here` remark:**

1. It is about *this* occurrence, and it would be wrong or odd on another.
2. It is the place for phrases and idioms: «խնդրում եմ, literally "I
   ask"», «ուրիշ բան — the shopkeeper's "anything else?"». Any Armenian
   phrase a note quotes gets its translation in brackets right there —
   the reader may be on their first dialogue and can't translate it
   themselves (line 14's «Էլ ի՞նչ եք ուզում ("what else do you want?")»).
3. It doesn't restate the library note; it adds the exception, the
   specific, the reason for the form in this line.

**Before adding a dialogue**, go through every token with a note and ask,
in this order: *Is this true of the word everywhere?* — then it's a
library note, once, on the entry. *Does it quote a phrase or use words the
learner lacks?* — then it's a `here`, or it goes. *Does the library note
now read as a remark about this line?* — then rewrite the library note.

`loadDialogue()` throws on a `wordId` the library doesn't have and on a
`lineCount` that doesn't match the file, so a content typo fails on the
first load of that dialogue rather than shipping as an untappable word.

**Adding a dialogue:** write the content file, add the catalog entry, then
for every token whose base word isn't in the library yet, add the library
entry (Conventions §10's capitalization rules apply to the entry, not the
token) and generate its clip per `VOCABULARY_AUDIO.md`. Then record the
lines (below). The bread-shop dialogue needed about two dozen new library
words — function words and shop nouns — and reused a handful of existing
ones; every later revision that changed a line's wording added its words
(Սուրճ, Ուրիշ, Բան, Է, Ու) the same way.

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
  Tappable words carry no resting mark, so a one-line hint above the
  transcript says they're tappable — "reveal a line, then tap any word" in
  Listen mode with nothing shown, "tap any word" once something is
  readable — and empties (keeping its height) after the learner's first
  word, per visit; same treatment as the trainer's "tap to reveal" hint.
  Tapping Listen re-blurs every line, the eye-revealed ones included —
  it's "hide the text again", not merely a mode switch, which is why the
  Listen radio listens for `click` rather than `change` (a radio that's
  already checked fires no `change`, and this has to work from inside
  Listen mode too).
- **Playback** is [`DialoguePlayback`](../src/lib/dialogues/playback.svelte.ts):
  one `<audio>`, one line at a time. The play button on a line plays just
  that line; "Play all" in the fixed bottom bar walks from the cursor to the
  end with a short gap between lines, and the stop button rewinds. The bar
  switches to its in-progress layout (stop + "n / N") on the *first* line
  played, alone or via play-all — it keys off `playback.started`, not
  `cursor > 0`, because playing line 1 by itself leaves the cursor at 0 and
  the bar used to stay in its resting layout for that one line. A
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
  would, via `Button`'s `lift` prop, even though it's a sage variant: it's
  the screen's one commit action, which is exactly what that physicality
  signals. The mockup's extra 1.2° tilt on hover was dropped — a straight
  rise is enough and keeps every lifting button in the app behaving
  identically.
- **The commit button has two states, and only one of them commits.** Not
  done: the tinted `success-soft` variant (it *leads to* the success
  state, so it doesn't wear the full success color yet) that posts
  `complete`. Done: the solid `success` variant reading "Already done", no
  lift — there's nothing left to commit — and tapping it opens a confirm
  to take the dialogue back off the done list (see Progress) instead of
  marking it done a second time, which is what the button used to do and
  read as a stale instruction on a finished dialogue.
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
removed dialogue can't push completed past total. (The player no longer
offers a second completion in its UI — see the button's two states above —
but the action still tolerates one, e.g. a stale tab.)

The page's `load` also reports `completed` for the signed-in learner, which
is what flips the button into "Already done". From there the confirm posts
`uncomplete`, which deletes the row outright — "no row = not completed" is
the table's convention, so there's no flag to flip and `completions` never
has to go to zero (it has a `>= 1` check). That needed its own `delete`
policy and grant, migration
`20260911120000_allow_deleting_dialogue_progress.sql`. `uncomplete` isn't
`resume`-gated: only a signed-in learner ever sees the button that posts it.

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
a line are never re-recorded; their popovers play the library clips — and
the play button sits on the popover's *base-form* row ("from Ուզել ▶"), not
next to the tapped form, because the clip says "uzel", not "uzum". The
inflected form is heard from the line's own play button. When the tapped
form is already the dictionary form (Ես, Այս), the "from" label and a
translation identical to the gloss are dropped rather than restated.

**`bread-shop` has all nineteen line clips**, installed 2026-09-13 for the
revised text (seven lines changed on 2026-09-13: the eggs/meat exchange
became `Ձու, խնդրում եմ։` / `Իսկ մի՞ս։`, the coffee exchange lost its `Այն`
lines in favour of `Էլ ի՞նչ։` / `Սուրճ։ …`, and the goodbye became `Լավ։
Ձեզ էլ շնորհակալություն։` / `Ցտեսություն։`). Both speakers' whole parts were
recorded in one generation each, twice, and cut with
[`scripts/audio/split_read.py`](../scripts/audio/split_read.py); the
reviewer picked per line between the two reads (mixing lines from two
reads of the *same* prompt is fine by ear). Exceptions:

- **01 and 02 are "sandwiched" takes.** The first line of every whole-part
  read came out with `Բարև ձեզ` at full scale, and the peak compressor used
  to tame it was what the reviewer heard as "very bad sound quality".
  Re-recording the line *alone* would have sounded like a different session
  (see the 2026-09-11 notes below), so instead each was generated as the
  **middle line of a three-line prompt** — a throwaway line before and
  after, then cut out with the same splitter — which keeps the voice in its
  warmed-up mode while the reviewer gets eight untouched draws to choose
  from. That is now the recipe for any single line that needs redoing.
- **`Բարև` is shouted whatever you do.** Sandwiched or not, uppercase or
  lowercase, with `։` or a comma, this voice attacks the greeting at −6 to
  −8 dB RMS with peaks at 0 dBFS (16 of 16 takes across both voices). It is
  not clipping (no full-scale runs in any source) and not the cold start.
  Don't try to fix it with a compressor; pick the gentlest draw by ear.
- **04 has its glued breath cut** by hand (voiced end + 60 ms, 50 ms fade,
  re-cut from the read) — the line ends in /m/, so the safe case.
- **14 (`Էլ ի՞նչ։`) is a standalone v3 take**, the one exception to the
  sandwich rule: every sandwiched take fell at the end and the reviewer
  wanted a question that rises. The standalone draw that peaks on the last
  syllable sounded "slightly off" but right — see "Fourth round" below for
  the lead that may do better next time.

Levels: a whole-part read lands within ±1 dB of the speaker's shipped mean
(Dmitrii −18.2 dB, Tereza −19.0 dB) with a single gain per read, which is
the point of the method — standalone takes had come out ~3 dB hotter and
needed per-take gain.

The earlier (2026-09-11) 19-line version is worth keeping in mind for
what it taught: lines re-recorded standalone matched the read on paper
(level, breath, format) but the reviewer still heard them as "slightly
different quality" — hence the sandwich recipe above; and a word-internal
`՞` followed by a Latin `?` made the model re-read the word's tail ("uzum
ek… zum ek?"), so the `՞` is dropped from the prompt in that case while the
app text keeps it. Generate a dialogue's lines like this:

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
  already know, taken from per-line takes or a previous read (for a brand-new
  line, letters × the speaker's seconds-per-letter from the known lines is
  close enough). Brute-force all combinations, and **reject any combination
  where a segment is more than 45% off its expected length** — without that
  constraint the optimiser cheerfully cuts after `Բարև։` and pays for it
  later in the read. Three refinements from the 19-line cut (2026-09-11),
  each of which fixed a wrong cut on a real read:
  - **Score by per-segment *relative* length error, not cumulative position
    error.** A mis-estimated long line (`Շնորհակալություն` is long on paper,
    quick in the mouth) drags every later cumulative target and made the
    optimiser prefer a 90 ms hesitation over the real pause two lines
    earlier. Relative per-segment error doesn't accumulate.
  - **A two-sentence line must contain at least one gap that is *not* a
    boundary** — its sentence break. Cheap to check, and it rules out cuts
    that would leave `Սրանք ձու են։ Ես ուզում եմ ձու։` with no internal pause.
  - **Merge two silences separated by a blip under 50 ms into one gap.**
    That's a breath in the middle of a pause; without the merge the cut can
    land on the blip and the breath ends up at the head of the next line.
  - **Measure segments speech-only** (previous pause end → next pause
    start), not mid-pause to mid-pause: a 0.5 s line between two long
    pauses otherwise "measures" 1.1 s and fails the 45% rule.
- Detect candidate gaps at `silencedetect=noise=-40dB:d=0.06`. `d=0.10` is
  too coarse and loses the real boundaries in fast reads.
- **Estimate a new line's length as intercept + slope × letters, not
  letters alone.** A two-word question (`Իսկ մի՞ս?`) takes ~0.9 s where
  letters × seconds-per-letter predicts 0.5 s, and the 45% rule then rejects
  every combination. `split_read.py` fits both from the known lines.
- **Transcription is a dead end for boundaries.** `creative_transcribe_audio`
  on a generation node returns text only (and, for a generated clip, just
  echoes the prompt) — no word timestamps. Don't spend a call on it.

Report the **fit** with each read and treat it as a quality gate — but know
what it measures. The original metric (RMS boundary error against expected
cumulative positions; under ~0.2 s good, 0.4 s bad) is only as good as the
expectations: on the 19-line cut a *correct* Dmitrii cut scored 0.60 s
because two new lines were over-estimated, while a *wrong* one scored 0.69.
The relative per-segment RMS (≈0.15 on every accepted read) is the better
gate, and the two-sentence check above is the real safety net. Still listen
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
| 08 | սրանք ի**՞**նչ են։ | 28% | +2.7 st | *(since re-recorded — see the second round below)* |
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

#### Second round, line 08 (2026-09-11): the reviewer's ear wanted the rise

*(Line texts in this and the next section are as they were at the time;
the dialogue was revised on 2026-09-13 and line 08 is now `Էլ ի՞նչ եք
ուզում։`, line 14 `Էլ ի՞նչ։`. The findings are about question types, not
these sentences.)*

Line 08, `Իսկ սրանք ի՞նչ են։`, was in the "accepted" rows above but the
reviewer later heard it as "really fast, and it goes down, not up". It was
regenerated standalone, 4 takes × 3 prompts, and every take measured with
a small autocorrelation F0 tracker (peak position, peak prominence over the
line's median, and the last 220 ms against the rest):

| prompt | takes that **rise** at the end | takes with the peak on `ի՞նչ` |
|---|---|---|
| `Իսկ սրանք ի՞նչ են։` (baseline) | 1 of 4 (+2.1 st) | 1 of 4 (+4.4 st) |
| `Իսկ սրանք ի՞նչ են?` (Latin `?`) | **2 of 4** (+0.7, +0.8 st; peaks +4.6, **+6.9 st**) | 1 of 4 (weak, +1.7 st) |
| `[curious] Իսկ սրանք ի՞նչ են։` (v3 audio tag) | 0 of 4 | 3 of 4 (+2–4 st), and slower: 1.4–1.9 s |

Two things to take from it:

- **The Latin `?` lead held**: it was the only prompt that reliably produced
  a terminal rise, and the take that shipped is one of those (B take 3:
  1.20 s, peak +6.9 st, +0.8 st terminal rise). The reviewer checked the
  vowels on it before picking; they were fine on this line.
- **The "peak position, not terminal direction" finding above is not the
  whole story.** The shipped take peaks at the *end* of the line (on `են`),
  which the earlier analysis would have called a listing contour — yet the
  reviewer, choosing by ear among twelve, picked it over the mid-line-peak
  takes precisely *because* it rises. Terminal direction evidently does
  matter to a listener when the peak is weak; the earlier table's accepted
  questions all had a **strong** mid-line peak (+5 to +8 st) that carried
  the question on its own. So the working rule is now: a strong peak on the
  `՞` word is sufficient; failing that, a terminal rise is what rescues the
  line. Don't ship a question with neither.
- `[curious]` slowed the read down (which was half the complaint) but never
  produced a rise. Not useless — a candidate for a line that's fast but
  already peaks correctly.

#### Third round (2026-09-11, the 19-line re-record): `ի՞նչ` questions never rise in context

With the whole dialogue re-recorded, the two `ի՞նչ` questions (08 `Իսկ սրանք
ի՞նչ են։`, 14 `Այն ի՞նչ է։`) fell at the end in **every** in-context take:
two whole-part reads, a three-line mini-read × 4, and a two-line mini-read
× 4 with the `՞` moved onto the *final* syllable (`ինչ ե՞ն?`, `ինչ է՞?`) —
0 rises in 14. Meanwhile the yes/no questions (10, 12, 16) rose in most
takes with the Latin `?`. So the pattern is by question *type*: once the
voice is warmed up it reads a wh-question as peak-on-`ինչ`-then-fall, which
is the textbook Armenian contour; only cold standalone takes ever rose on
these (3 of 8 in the second round), and the reviewer heard those as not
matching the read.

What shipped for 08 and 14 is the final-syllable-`՞` mini-read take that
came out *nearly flat* (−2.1 / −0.9 st), 08 additionally with its last
280 ms **pitch-bent up 4 st** by `rubberband` (formant-preserving, driven
by `asendcmd` stepping `pitch` every 20 ms with an ease-in curve so the rise
is late and quick, like speech: `asendcmd=c='t0 rubberband pitch 1.0; …'`
with 15 steps over 280 ms ending 4 st up, then
`rubberband=pitch=1.0:pitchq=quality:formant=preserved`; the ramp starts
280 ms before the last 10 ms window above −38 dB). Measured terminal after
the bend: +0.4 st. The reviewer's verdict was "imperfect" but acceptable in
context. Treat the bend as a last resort: it is audible if pushed past
~4 st, and it can't add the *shape* of a real question, only lift the tail.

Also learned here: **a word-internal `՞` followed by a Latin `?` can make
the model re-read the word's tail** ("uzum ek… zum ek?") — line 16 in both
whole-part reads. Drop the `՞` from the prompt in that case; the `?` alone
carried the rise.

#### Fourth round (2026-09-13): `eleven_multilingual_v2` rises where v3 won't

For `Էլ ի՞նչ։`, eight sandwiched v3 takes and eight standalone v3 takes
all fell or stayed flat (best: peak on the last syllable, terminal −0.9 to
+1.5 st), and the reviewer rejected the +4 st tail bend outright ("none of
these work — it's a statement"). Four standalone takes on
**`eleven_multilingual_v2`** with the same voice rose in three: +3.5,
+5.0, +6.0 st at the end. That is the first setting that reliably produces
a question contour on an `ի՞նչ` line. Two caveats before leaning on it: v2
generated the line ~20 dB quiet (lifted to −19 dB mean, so listen for
hiss), and the reviewer chose a v3 standalone take over it this time, so
whether v2's timbre passes next to v3 lines is untested. Next time a
wh-question has to rise, try v2 *sandwiched* first.

All of this is **prompt-only**. The text shown in the app stays
orthographically correct, exactly as with the "Ո"→"Վ" respelling.

### Tooling

Everything above is scripted in [`scripts/audio/`](../scripts/audio/):
`split_read.py` (gaps → boundaries → gain-matched line clips, from a JSON
list of `[lineNumber, spokenText, shippedClipOrNull]`), `pitch.py` (the
peak/terminal numbers used throughout the questions section),
`bend.py` (the last-resort tail lift) and `review_page.py` (the
single-file picker page a human auditions on, from a JSON spec). They need
`numpy`, `ffmpeg`/`ffprobe`, and `rubberband` compiled into ffmpeg for
`bend.py`. Until 2026-09-13 these lived in a session scratchpad and had to
be rewritten when it was wiped — keep them in the repo.

### Steps

1. One `creative_generate_speech` per speaker, `model_id: "eleven_v3"`,
   `generations_count: 2`, prompt = that speaker's lines joined by blank
   lines, exact text with marks included (the ՛ helps; for question
   sentences end with a Latin `?` instead of `։`, and if a word-internal
   `՞` is followed by that `?`, drop the `՞` from the prompt — see the
   questions section), and the speaker's voice: Tereza jan (`B7DEF4tn54LpozCVN7ah`) for
   `speaker: 'tereza'`, Lazy Dmitrii (`oNYQkBHg8N8sOXiVNvyU`) for
   `speaker: 'dmitrii'`. The word-initial "Ո"→"Վ" respelling from
   `VOCABULARY_AUDIO.md` applies inside a line too (`Ոչ` in lines 11 and 17).
   **Fire the two calls in separate messages** — the subscription allows five
   concurrent requests, and a batch that exceeds it fails individual
   generations with "Too many concurrent requests" while still billing them.
2. Poll, download, split as above, trim, and transcode with the same
   `ffmpeg` command as words.
3. Save as `static/audio/dialogues/<dialogueId>/<nn>.m4a` and commit.
4. Listen to every line before calling the dialogue done — nothing in the
   app will tell you a clip is missing or wrong.
