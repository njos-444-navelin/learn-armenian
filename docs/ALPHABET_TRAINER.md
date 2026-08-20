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
`buildSession()` is pure and runs client-side (no server round-trip — every
letter's level is already in `page.data` from `load`), which is also why
it's safe to call twice: once for the Practice button's subtitle preview,
again when the button is actually pressed.

- **Unmet letters** (level 0), up to 5, in canonical alphabet order, become
  the "learn" queue — each gets its own intro step
  (`AlphabetLearnStep.svelte`) before any drilling starts.
- **Weakest already-met letters** (level > 0, sorted ascending) fill out the
  rest: 3 of them if there were any unmet letters, or 8 if the learner has
  already met every letter at least once (nothing left to introduce, so the
  whole session is review).
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

## The words registry, and why letters reference it instead of embedding examples

Every letter's "in a word" example(s) are ids into
[`src/lib/content/words/entries.ts`](../src/lib/content/words/entries.ts),
not inline text on the `AlphabetLetter` itself — see the module comment
there for the full reasoning (a flat, cross-feature word registry meant to
also back a future Dialogues feature and dictionary; deliberately not
merged with `vocabulary/decks/*.ts`, which is a separate, larger, explicitly
deferred refactor). Most letters reference one word; two only for the
letters whose sound genuinely depends on position in a word:

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

## Layout lessons worth not re-learning

Two non-obvious bugs surfaced while building this screen, both general
enough to matter beyond the alphabet trainer specifically — see
[`docs/DESIGN.md`](DESIGN.md#motion) for the full writeups:

- **A fixed-position action bar needs a height reserved for its tallest
  possible content**, not just its current content, or conditionally
  revealing taller content (e.g. answer feedback text) shifts everything
  above it in a vertically-centered page.
- **A true two-way crossfade between screens in a vertically-centered flex
  column doubles that column's height for the overlap window** where both
  the outgoing and incoming screens briefly coexist in the DOM — visibly
  shifting the whole page. Fading only the incoming screen in (`in:`, not
  `transition:`) avoids the overlap entirely.
