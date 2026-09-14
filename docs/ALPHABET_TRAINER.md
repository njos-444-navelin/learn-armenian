# The alphabet trainer

What the `/learn/alphabet` screen actually does and why it's shaped the way
it is — the architecture behind [`AlphabetTrainer.svelte`](../src/lib/components/AlphabetTrainer.svelte)
and its five child components. Audio generation specifics live in
[`docs/ALPHABET_AUDIO.md`](ALPHABET_AUDIO.md); general visual-design rules
(color, shape, motion) live in [`docs/DESIGN.md`](DESIGN.md) — this doc is
about how the feature itself is put together.

## The shape of it: one screen, no sub-routes

Everything — the letter grid, the drawer, learning new letters, drilling
them, the session summary — is client-side state inside a single route
(`src/routes/[lang=locale]/learn/alphabet/`), not separate pages. A `Screen`
type (`'home' | 'learn' | 'drill' | 'summary'`) owned by `AlphabetTrainer.svelte`
picks which child component renders; a fifth state, the letter sheet
(`sheetLetterId`), is independent of `screen` since it can open from `home`
without leaving it. This was a deliberate departure from the feature's
previous shape (separate `/quiz`, `/quiz/all`, `/quiz/practice` routes) —
see the git history around when this was built for the fuller reasoning; the
short version is that the whole practice flow reads as one continuous
session, not a sequence of pages to navigate between.

## Access model

Browsing the grid and opening a letter's drawer works signed out. Only
**Practice** requires a session. The gate is enforced in exactly one
place — the `answer` form action in `+page.server.ts`, via
`requireSignedIn()` — not in `load` (which stays public on purpose) and not
really by the client-side check in `clickPractice()` either, which is a UX
nicety that redirects before a signed-out visitor even sees the practice
flow, not the actual security boundary. If that client check is ever
bypassed, the first drill answer's POST redirects instead of saving,
handled gracefully (a toast, not a crash) rather than relied upon not to
happen. Sign-in resumes straight back into practice via the same
`?next=...&resume=practice` querystring pattern documented in
[`docs/AUTH.md`](AUTH.md) — copy that doc's "resuming a gated action"
section if this pattern needs to be reused elsewhere; it's the same shape,
just replaying a client-side state transition (`startPractice()`) instead
of resubmitting a form, since clicking Practice itself isn't a form
submission.

## The top-left bubble: Back, or Close — decided by a store, not a prop

Every non-`home` screen (`learn`/`drill`/`summary`) shows an "X" in the
top-left bubble instead of the usual chevron "Back," and tapping it
returns to `home` (`AlphabetTrainer.svelte`'s `backHome()` — the same
function the summary screen's own "Back to alphabet" button already
called) rather than leaving the route entirely. That distinction matters
because `screen` is client-side state, not a URL — see "The shape of it"
above — so the generic `BackButton.svelte` (rendered once, globally, in
the root locale layout) would otherwise compute "back" from the *route's*
parent (`/learn`), not from this component's own internal state, and
land a learner one level higher than they meant to go.

`BackButton.svelte` is a sibling of this page's content under that shared
layout, not its ancestor, so `AlphabetTrainer.svelte` can't just hand it a
callback via a prop. [`topLeftAction.svelte.ts`](../src/lib/stores/topLeftAction.svelte.ts)
bridges that gap the same way [`toasts.svelte.ts`](../src/lib/stores/toasts.svelte.ts)
does for the toast stack: a small shared `$state` store `BackButton`
itself checks, falling back to its normal parent-path behavior when
nothing's overridden it. The wiring is one `$effect`:

```ts
$effect(() => {
	if (screen === 'home') return;
	setCloseAction(backHome);
	return () => setCloseAction(null);
});
```

The cleanup (which Svelte runs before every re-run of the effect, and on
unmount) is what makes this safe — it always hands the bubble back before
deciding what it should be next, so neither switching screens nor
navigating away entirely can strand some *other* page with a stuck "X."

This was built generally on purpose, not as an alphabet-specific hack:
any future multi-screen, single-route lesson flow that needs the same
"X returns to my own start screen, not the route's parent" behavior calls
the same two functions and needs no changes to `BackButton.svelte`, the
root layout, or this store.

## Mastery: a plain 0–10 level per letter, not spaced repetition

[`src/lib/alphabet/mastery.ts`](../src/lib/alphabet/mastery.ts) is
deliberately simple: `applyAnswer(current, correct)` moves a letter's level
by exactly ±1, clamped to 0–10. This is a different, much simpler domain
than the vocabulary trainer's SM-2-ish scheduler
([`src/lib/srs/scheduler.ts`](../src/lib/srs/scheduler.ts)) — no due dates,
no ease factor, no spaced review. Don't reach for the SRS scheduler here;
letter recognition strength isn't the same thing as "when should this word
resurface."

A letter with no `user_alphabet_progress` row is level 0 ("unmet") — same
"absent row = default state" convention as the vocabulary progress table's
`NEW_CARD`. This means **level 0 is overloaded**: a letter you've never
seen and a letter you've seen but keep answering wrong both look identical
(neutral grid tile, reappears in the next session's "new letters" pass).
That's a deliberate simplification, not an oversight — confirmed as
intentional when this was built, not something to "fix" by adding a
separate "seen but weak" state.

## Building a practice session

[`src/lib/alphabet/session.ts`](../src/lib/alphabet/session.ts)'s
`buildSession()` runs client-side (no server round-trip — every letter's
level is already in `page.data` from `load`) but is **not** pure: it
shuffles which letters it picks, so calling it twice — once for the
Practice button's subtitle preview, again when the button is actually
pressed — normally lands on two different letter selections. That's fine
specifically because the preview only ever displays a *count* ("5 new
letters, then weakest") and never names a specific letter; nothing reads
`sessionPreview.learnLetters` itself, only its `.length`.

- **Unmet letters** (level 0), up to 5, become the "learn" queue — each
  gets its own intro step (`AlphabetLearnStep.svelte`) before any drilling
  starts. *Which* 5 (of however many are still unmet) is random, not
  always the next ones in alphabet order — every letter at level 0 is
  equally "not known at all," so there's no meaningful order to prefer
  between them.
- **Weakest already-met letters** (level > 0, weaker levels first) fill out
  the rest: 3 of them if there were any unmet letters, or 8 if the learner
  has already met every letter at least once (nothing left to introduce,
  so the whole session is review). Genuinely weaker letters still always
  come before stronger ones — that prioritization isn't randomized — but
  *within* a tie (two letters sitting at the same level), which ones make
  the cut and in what order is random rather than always the same
  alphabet-first letters, so a learner with, say, ten letters stuck at
  level 1 sees a rotating sample of them instead of the same 3 forever.
  The mechanism: shuffle the whole letter list once up front, then
  `Array.prototype.sort()` it by level — sort is guaranteed stable
  (ES2019+), so same-level letters keep their already-shuffled relative
  order instead of snapping back to the original array's (alphabet) order.
  One shuffle, reused for both tiers, rather than a separate one per tier.
- The drill queue is `[...unmet, ...weakest]` — each letter appears
  **exactly once** per session, answered in order, no requeuing a missed
  letter for another attempt within the same session (unlike the old
  `AlphabetQuiz.svelte`, which did requeue misses — deliberately dropped;
  a letter you get wrong just ends the session at a lower level and comes
  back first next time, per `buildSession()`'s own weakest-first ordering).

## Drill questions: three types, confusable-aware

[`src/lib/alphabet/drillQuestion.ts`](../src/lib/alphabet/drillQuestion.ts)
round-robins three question types across a session by index
(`sound → audio → case → sound → ...`):

- **`sound`** — shown the glyph pair, pick the matching voicing description.
- **`audio`** — hear the letter's phoneme, pick the matching glyph pair. The
  only type with a skip path (below).
- **`case`** — shown one case of the glyph, pick the other. Direction
  (upper→lower or lower→upper) is randomized per question, not fixed, per
  the original spec ("sometimes ... a capitalized letter for a lowercase
  one and vice versa"). `yev` (և) has no uppercase form at all, so a `case`
  question for it silently falls back to `sound` instead — the one letter
  where this substitution happens.

Wrong-answer options aren't random: [`alphabetConfusables.ts`](../src/lib/content/alphabetConfusables.ts)
lists letter pairs that are genuinely easy to mix up (Թ/Տ, Ծ/Ց, Ճ/Չ, Պ/Փ,
Կ/Ք, Ղ/Խ, Ռ/Ր, Հ/Խ, Ջ/Ճ, Ե/Է, Օ/Ո — note Խ and Ճ each appear in two pairs,
which is why this is a pair list with a lookup function rather than a
single `confusableWith?` field). A question's first-choice wrong option is
always the tested letter's confusable partner if it has one; the rest are
random fillers. `case`-type questions additionally filter `yev` out of the
*filler* pool too, not just as the tested letter — it has no form to show
in either direction.

A `sound`-type option button shows `letter.voicingLabel` alone (e.g.
`"t", aspirated`) — never `letter.voicingDetail` (`the normal English "t",
like in "top"`), and never the two concatenated. `AlphabetLetter` splits
what used to be a single `voicing` field into these two specifically so a
tight option button never has to fit the full explanation; the learn step
and letter sheet still show both, joined by
[`fullVoicing()`](../src/lib/content/alphabet.ts) (`"${label} — ${detail}"`).
Every one of the 39 entries already had this exact `label — detail` shape
before the split (verified by inspection, not assumed), so the split was
purely mechanical, not a rewrite — if a future entry's `voicingDetail`
ever needs to reference the label itself, that's what `fullVoicing()` is
for, not string-duplicating the label into `voicingDetail` directly.

**A confusable pair needs two genuinely different `voicingLabel`s, not
just two different `voicingDetail`s.** `vo` (Ո) and `yech` (Ե) are both
position-dependent — mostly one sound, a different one word-initially —
and both originally labeled themselves with only their *mid-word* sound
(`"o"`, `"e"`), identical to their own listed confusable partner's label
(`o`/Օ's `"o"`, `e`/Է's `"e"` — see `alphabetConfusables.ts`). That's
invisible when the full `voicing` text is shown (the detail half still
differed), but once a `sound`-type question shows `voicingLabel` alone,
picking between two options that read exactly the same is unguessable —
a real bug, not just a design nitpick, found by actually hitting the
question rather than by inspecting the data. Both were re-labeled with
their genuinely distinguishing sound instead (`"vo"`, `"ye"`), with
`voicingDetail` reworded to match without repeating it.

The exact same mistake was independently sitting in `transliteration` —
the *other* short, glance-able tag every letter has, shown under the
glyph in `AlphabetLetterGrid.svelte` rather than in a drill option —
which nothing about fixing `voicingLabel` touches, since it's a
completely separate field. `vo` and `o` shared the identical `'o'`/`'о'`
tag in *both* languages; `xeh` (Խ) and `ho` (Հ) shared the identical `'х'`
in Russian specifically (Russian has no separate letter for either of
Armenian's two "h" sounds, so this one's noted directly in
`AlphabetLetter`'s own doc comment as a real, accepted limitation — it's
`vo`/`o` sharing *both* languages' tags that was the actual bug). Fixed
the same way: `vo` → `'vo'`/`'во'`, and `xeh` → `"х'"` (the apostrophe
convention the aspirated/unaspirated stop pairs already use, reused here
since `xeh` already reads as the "marked" one everywhere else — its EN
tag is `kh` rather than plain `h`, and its `voicingLabel` calls out
"raspy"). If a future letter is added to `CONFUSABLE_PAIRS`, check *both*
`voicingLabel` and `transliteration` for this — a shared `voicingDetail`
or a shared `transliteration` between two *unrelated* letters that just
happen to sound similar is a coincidence worth living with (the "1-3
character hint" doc comment already accepts this in general), but a
shared tag between two letters *explicitly listed as each other's
confusable* defeats the one thing that field/that question type exists
to do.

An `audio` question's clip also both preloads (`preload="auto"`, not the
`preload="none"` a word's optional pronunciation elsewhere in the app
uses — see [`SpeakerButton.svelte`](../src/lib/components/SpeakerButton.svelte))
and autoplays the instant the question mounts, via a plain `$effect` with
no dependency guard beyond `question.type === 'audio'`. Both are safe
specifically *because* this is a graded question: the learner cannot
answer without hearing the clip regardless, so eagerly loading and playing
it is never wasted the way it could be for a word they might not tap.
Autoplay works here without hitting browser autoplay-blocking because this
component always remounts (see the round-robin note above) in direct
response to a click — Practice, Next, or an answer — never on a bare page
load; `playAudio()`'s existing `.catch(() => {})` still covers a browser
blocking it anyway.

### Skipping an audio question doesn't cost anything — but repeated skips can mute audio questions entirely

"I can't listen right now" (`audioSkipLabel`) advances without touching the
letter's level — no `onAnswered()` call, so nothing is logged and the
summary screen doesn't mention that letter at all (skipped letters are
absent from the summary, not shown as "unchanged"). This was a deliberate
choice, matching how the summary is framed as "which letters moved," not a
complete answer log.

Skipping also **suggests** (never auto-applies) muting audio questions for
15 minutes, matching Duolingo's handling of "can't listen right now" —
[`src/lib/alphabet/audioMute.ts`](../src/lib/alphabet/audioMute.ts) backs
this with `localStorage` (not `sessionStorage`, since "for the next 15
minutes" is a real wall-clock duration meant to survive closing the tab).
Only tapping the explicit "Mute for 15 min" button actually starts the
mute — plain skip alone never does. While muted, `AlphabetTrainer.svelte`'s
`buildQuestionFor()` silently substitutes `sound` for any `audio` slot the
round-robin would otherwise land on, so muted learners simply never see an
audio question rather than seeing one they'd have to skip again. No
separate cleanup pass exists for the stored mute timestamp:
`isAudioMuted()` deletes its own key the moment it notices the mute period
has lapsed. It's only actually called when the round-robin lands on an
`audio` slot, not on every question — but that happens at least once per
real session (the round-robin's second question is always `audio`), which
is enough that a stale key can't outlive the next session. Verified
directly (no test account needed — this is pure `localStorage`, no auth or
DB involved): muting with a short synthetic duration, confirming
`isAudioMuted()` flips to `false` *and* the stored key is actually removed
once the duration passes, and that a corrupted stored value is treated as
unmuted and cleaned up rather than thrown on.

## The word library, and why letters reference it instead of embedding examples

Every letter's "in a word" example(s) are ids into the app-wide word
library, [`src/lib/content/words/entries.ts`](../src/lib/content/words/entries.ts),
not inline text on the `AlphabetLetter` itself — the same library the
vocabulary decks list their words from and dialogues link their tokens to
(Conventions §10), so an example word here is defined and recorded once,
however many features show it. Most letters reference one word; two only
for the letters whose sound genuinely depends on position in a word:

- `yech` (Ե): `dzez` (mid-word "eh") then `yereko` (word-initial "yeh").
- `vo` (Ո): `mot` (mid-word plain "o") then `vonts` (word-initial "vo").

Order matters for these — the sheet and learn step show examples in the
array's order, mid-word/default pronunciation first.

Three entries were swapped for a different word after the original turned
out to be a poor fit for either pedagogy or the TTS voice — see
[`docs/ALPHABET_AUDIO.md`](ALPHABET_AUDIO.md#words-swapped-after-audio-review)
for the full list and the reasoning behind each (a technically-correct but
pedagogically odd choice, a loanword whose generated audio stressed the
wrong syllable, and a word the model simply wouldn't say correctly no
matter the prompt).

## Persistence: optimistic, one row per letter

`user_alphabet_progress` (`user_id, letter_id, level, updated_at`) follows
the same shape and gotchas as `user_vocabulary_progress` — see that
migration's own comments for the RLS-doesn't-grant-table-privileges lesson,
repeated correctly here (grant statement in the same migration as the
table, not a follow-up one, matching `user_preferences`'s more mature
shape rather than the original vocabulary split).

`AlphabetDrillQuestion.svelte` grades optimistically, same pattern and
justification as `VocabularyTrainer.svelte` (Conventions §8's documented
exception): picking an option updates the UI and the in-memory `levels`
immediately — no network round-trip needed to know right/wrong, since
that's a pure client-side comparison — while a hidden form
(`action="?/answer"`, `use:enhance`) submits in the background. A failed
save shows a toast and does **not** roll back; the next time that letter
comes up for review, answering it again self-corrects the stored value.

The `answer` action (`+page.server.ts`) recomputes correctness itself from
`letterId` + `chosenId` (`chosenId === letterId`) rather than trusting a
client-sent verdict — a forged request can still move *a* letter's level,
but only by actually naming a real option, not by asserting "I got this
right" directly. This wasn't just a hardening choice: the form has never
had anywhere else to get correctness from. It only ever posts `letterId`
(hidden input) and `chosenId` (the clicked option's own `value`) — there
was briefly a version of this action that read a third field, `outcome`,
that no form input has ever actually sent, so every single save
unconditionally 400'd (`invalid_request`) regardless of table state. See
"Two real bugs, one misleading toast" below — this is exactly why the
save-failed toast fires.

## Two real bugs, one misleading toast

The "Couldn't save your progress on that letter..." toast showed up during
this feature's first end-to-end testing pass, and tracking down *why* it
appeared turned into a two-layer investigation worth recording, since
either layer alone would have looked like the whole story:

1. **The migration was never applied.** `supabase/migrations/20260820120000_create_user_alphabet_progress.sql`
   existed in the repo but the live project had no such table —
   confirmed by querying PostgREST directly with the anon key and reading
   the *error code*, not just the status: a table that exists but denies
   anon access returns `401`/`42501` ("permission denied"), while a table
   that was never created returns `404`/`PGRST205` ("Could not find the
   table ... in the schema cache"). The second one is what came back — a
   reliable, read-only way to check whether a migration actually landed,
   without needing `service_role` or write access:
   ```bash
   curl "$PUBLIC_SUPABASE_URL/rest/v1/<table>?select=*&limit=1" \
     -H "apikey: $PUBLIC_SUPABASE_ANON_KEY" -H "Authorization: Bearer $PUBLIC_SUPABASE_ANON_KEY"
   ```
   After applying the migration, PostgREST's schema cache didn't pick up
   the new table immediately either — `NOTIFY pgrst, 'reload schema';` is
   the fix, and it can take a few seconds to actually propagate even after
   that.
2. **Separately, and more fundamentally: the `answer` form action read a
   field the form never sent.** The action expected `formData.get('outcome')`
   (`'correct'` / `'incorrect'`), but `AlphabetDrillQuestion.svelte`'s
   `<form>` only ever posts `letterId` (hidden input) and `chosenId` (the
   clicked option's own `value` — see the markup). There was no code path
   that ever set an `outcome` field. This meant **every single save,
   always, regardless of the table existing** — the validation check
   failed before any Supabase call was even made, returning
   `fail(400, { errorCode: 'invalid_request' })`. Fixed by having the
   action recompute correctness itself from `letterId`/`chosenId` (see
   Persistence above) instead of expecting a field that was never wired up.

The reason bug 2 stayed hidden during casual testing: **SvelteKit form
actions submitted via `use:enhance` respond with a real, embeddable
failure inside a `200 OK` HTTP response** — a simplified network-request
log (status code + URL only) reads as a clean success. The actual signal
is in the response body: `{"type":"failure","status":400,"data":"..."}`.
Any future "the toast fired but the request said 200" investigation should
go straight to the response body, not the HTTP status, for exactly this
reason — the HTTP status only tells you the *transport* succeeded, not
that the action did.

## Fixed floating elements

Every screen in this feature is built around at least one genuinely
`position: fixed` piece — the top bubbles, a `FloatingActionBar` footer,
or both — sitting on top of content that itself varies in height letter
to letter or question to question. Almost every non-obvious bug this
feature has hit came from that combination specifically. See
[`docs/DESIGN.md`](DESIGN.md#motion) for the general write-ups (a
two-way crossfade doubling a centered column's height, a footer sized to
its shortest state instead of its tallest, a fixed element's *empty*
space still blocking clicks); this section covers the alphabet-specific
patterns those lessons turned into.

**A screen with its own progress header (`AlphabetLearnStep.svelte`,
`AlphabetDrillQuestion.svelte`) forces itself to fill the full height
PageShell would otherwise center it within**, rather than sitting in
PageShell's normal shrink-to-fit-and-center flow. Left in that normal
flow, the screen's total height varies with its own content (the voicing
text and word count on the learn step; the option text and question type
on the drill step), which changed *where PageShell centered the whole
block* — carrying the progress header along with it, so it visibly moved
between letters instead of staying put under the top bubbles. Both
screens use the identical shape: a wrapper (`.learn-step`, `.drill-step`)
with `min-height: var(--page-content-min-height)`, a custom property
defined once on `PageShell.svelte`'s own `main` (alongside, and mirroring
exactly, the top/bottom padding terms that already push its content down
from the top bubbles) rather than recomputed as a matching `calc()` at
each call site — Svelte's CSS scoping only affects selector matching, not
custom-property inheritance, so a property set on a parent's scoped
`<style>` block is still visible to every descendant regardless of which
component defined it. That's what keeps the wrapper's top edge landing
exactly where PageShell would have started it: with the header in normal
flow at the top (now genuinely fixed-position-adjacent without needing
`position: fixed` itself) and the rest of the content in a `flex: 1`
inner wrapper (`.stage-wrap`, `.content-wrap`) that centers *within
whatever's actually left over*, instead of the header. Getting this wrong
the first time produced a real regression worth remembering:
`<FloatingActionBar>` has to be *inside* this wrapper, not a sibling of
it, because its own dynamically-measured bottom spacer needs to be one of
the same flex column's children for `flex: 1` to correctly absorb only
the genuine leftover space — a wrapper that tried to independently
predict the spacer's height (which isn't a static, calc()-able number at
all, since it's set from the real bar's measured `clientHeight`) just
double-counted it and overflowed instead.

The progress header itself — section label, "N of total" counter, and the
row of dots — is [`AlphabetProgressHeader.svelte`](../src/lib/components/AlphabetProgressHeader.svelte),
shared by both screens rather than duplicated. The one real difference
between its two callers is encoded as data, not markup: `DotState` has
three values (`'filled' | 'current' | 'empty'`), but the learn step's own
progress has no "already done vs. currently on" distinction to make (every
letter up to and including the current one is just "in progress"), so it
only ever emits `'current'`, reading as one steadily-growing bar. The
drill screen does have that distinction — a question already answered is
a genuinely different state from the one you're on — so it uses all
three. Each caller computes its own `dotStates` array and hands it down;
the shared component just renders whatever it's given.

**Centering that inner leftover-space wrapper isn't always right.** Both
screens started with `justify-content: center` on the inner wrapper,
matching how the content used to sit in PageShell's own centering — but
for a question with less content than the tallest case (a short `sound`
question's voicing labels, an `audio` question with no option text to
wrap), centering split the slack evenly *above and below* the content,
and the "below" half read as "too much space before the floating footer"
specifically because that's the one edge sitting next to something else
visible. `AlphabetDrillQuestion.svelte`'s `.content-wrap` uses
`justify-content: flex-end` instead — bottom-aligning stage+options so
that same slack moves above the stage, next to the header, where there's
nothing else nearby for a gap to read as wrong against.

**Sizing relative to viewport *width* alone can still make a *short*
viewport overflow — in both directions.** `AlphabetLearnStep.svelte`'s
letter circle and `AlphabetDrillQuestion.svelte`'s circle/audio-button
both clamp between a floor and a `vw`-based ceiling with no reference to
viewport height at all — reasonable for sizing by width, but on a phone
that's wide-but-short (or a browser whose chrome isn't fully collapsed,
shrinking the *effective* height without changing width), that same
circle can still be taller than the room actually available. Both add a
`@media (max-height: 700px)` step that shrinks the circle's own clamp
range. The letter *grid* (`AlphabetLetterGrid.svelte`, on `home`, the one
screen in this feature with no fixed footer or header of its own) hits
the mirror image of the same mistake: `.tile`'s `grid-template-columns:
repeat(auto-fill, minmax(3rem, 1fr))` stretched every tile to fill
whatever row width `auto-fill` produced, so a *wider* phone — not a
shorter one — could make tiles (and, via their own `aspect-ratio: 1`,
6 rows of them) taller than intended, sometimes taller than a *narrower*
phone's tiles landed. Capping `.tile`'s own `max-width` at the same
`3rem` floor `auto-fill` already uses (plus `justify-items: center` on
`.grid`, so a capped tile doesn't just hug one edge of its now-wider
track) stops that growth without changing which breakpoint gets how many
columns — `auto-fill`'s own column count is still driven only by the
`3rem` minimum. None of these are a guarantee of zero scrolling on every
conceivable size, just a real, verified improvement to how much overflows
in the cases actually tested.

**A fixed footer sitting on top of content needs an opaque-enough
background, and it has to be undone carefully once something no longer
needs it.** `.prev` (`AlphabetLearnStep.svelte`), `.mute`/`.skip`
(`AlphabetDrillQuestion.svelte`), and the secondary button on the summary
screen all started `background: transparent`, which is fine for an
in-flow button but means a *fixed* one lets whatever scrolled-up content
is genuinely behind it show straight through — not just a visual nitpick,
since it surfaced alongside a related, worse bug: the drill's own answer
options were occasionally unreachable underneath that same fixed footer,
not just visible-through it (see `FloatingActionBar.svelte`'s
`pointer-events` fix in `DESIGN.md`). Fixed with a small family of tokens
in `tokens.css`, each an intentionally different opacity for a different
context, not one value reused everywhere: `--color-background` (fully
opaque — `.prev`, `.mute`, `Button`'s `opaque` secondary variant, anywhere
the button *is* the only thing that needs to read clearly),
`--color-background-translucent` (94% — `.skip`, a button that benefits
from reading as slightly less solid than the surface below it), and
`--color-background-translucent-soft` (86%, with its own
`--color-border-soft` at 10% ink instead of the standard border's 16% —
`.footer-card`, a panel meant to read as one soft, cohesive surface
wrapping several pieces rather than competing with the button(s) sitting
on it). Each has a matching `-hover` where the element is itself
interactive.

That last one — `.footer-card` — is also the shape of a real regression,
not just a design choice: it exists specifically because wrapping
*everything* the footer might show in one background (an earlier version
of this fix) meant a state with *nothing* to show yet — before an option
is picked, for a `sound`/`case` question — rendered an empty floating box
with a visible border and background and nothing inside it. The card only
renders for the two states that actually have feedback text to frame
(answered, or skipped-with-mute); the bare `.skip` button and the
"nothing yet" state both render outside it, directly in `.footer`, which
is what still reserves the constant height (see the point above on
reserving height for the tallest state) without forcing a card to exist
just to occupy it.

## The floating footer buttons: three extracted to `<Button>`, three kept bespoke

Three screens each ended up with their own byte-for-byte-identical (or
nearly so) copy of a primary pill button — "Next" on the learn step, two
separate "Next" buttons on the drill screen (one standalone, one paired
with "Mute"), and "Back to alphabet" on the summary screen — plus two
copies of a secondary/opaque pill for "Mute" and "Practice again". Per
Conventions #3's low threshold ("used in two or more places → extract
it"), the primary ones became [`Button.svelte`](../src/lib/components/Button.svelte)'s
existing `variant="primary"`, no changes needed there. The secondary ones
needed one addition first: `Button`'s `secondary` variant is documented
in `DESIGN.md` as deliberately `background: transparent`, which doesn't
work for a button sitting in a fixed footer over scrollable content (see
the point above) — so `Button` gained an `opaque?: boolean` prop that
swaps in `--color-background`/`--color-background-hover` for that one
variant. `--color-on-secondary` already equals `--color-text-primary` in
`tokens.css`, so `opaque` only ever needs to touch the background, never
the text or border color.

`AlphabetSessionSummary.svelte`'s "Back to alphabet"/"Practice again" pair
sits in a plain `flex-direction: column` `.actions` div with no
`align-items` override — the default `stretch` is what makes each
`<Button>` span the row's full width, not `FloatingActionBar`'s own `.bar
:global(.button) { flex: 1 }` rule, since `flex: 1` governs *main-axis*
size (here, vertical) in a column flex container, not width. The drill
screen's standalone "Next" (the branch with no "Mute" beside it) is the
one place that rule doesn't do the width work either — its
`.footer-card` parent centers children (`align-items: center`) instead of
stretching them, the same reason the pre-extraction `.next` there needed
an explicit `width: 100%` — so a local `.footer-card > :global(.button) {
width: 100% }` reproduces that, deliberately scoped to a *direct* child
so it doesn't also catch the "Mute"-paired Next nested one level deeper
inside `.skip-actions` (which gets its width from the inherited `flex: 1`
correctly, since `.skip-actions` is a row).

**Three buttons deliberately did not move to `<Button>`**, despite living
right next to ones that did:

- **`.prev`** (`AlphabetLearnStep.svelte`) — a circular icon-only control.
  Structurally nothing like `Button`'s pill shape, and used in exactly one
  place; not worth a shared abstraction for a single, structurally
  distinct consumer.
- **`.skip`** (`AlphabetDrillQuestion.svelte`, "Can't listen right now") —
  deliberately smaller than the other footer buttons (no `min-width`, no
  flex stretch, sized to its own text) per an explicit design request, and
  its translucent (not opaque) background is its own genuinely different
  token (`--color-background-translucent`, not `--color-background` — see
  the token table above). `Button` has no size variant and one isn't
  worth adding for this single case.
- **`.mute`** (`AlphabetDrillQuestion.svelte`, "Mute for 15 min") — sits
  beside a full-width Next in a half-width `flex: 1` slot, and its label
  ("Mute for 15 min" / "Отключить на 15 мин") is real content, not a short
  button label — it needs a smaller `font-size` than `Button`'s fixed
  `--font-size-md` to keep fitting there without wrapping awkwardly.
  Same reasoning as `.skip`: no size variant on `Button`, not worth adding
  for one consumer.

(The home screen's pulsing Practice button was a fourth bespoke one at the
time — its two-line label and pulse had no home in `Button` — and it
later found one: once the vocabulary deck page needed a third copy of
that exact pill, it became
[`PulseCta.svelte`](../src/lib/components/PulseCta.svelte), see
`DESIGN.md`'s Motion section. Same rule, later tipping point.)

All three read, in hindsight, as instances of the same rule: extract when
the duplication is real and the abstraction has nowhere to absorb a
genuine per-consumer difference cheaply; don't force a consumer with a
real, deliberate deviation (smaller tap footprint, smaller font, a
non-pill shape) through a shared component that would need new surface
area — a prop, a slot, a size variant — to support just that one caller.
