# The alphabet trainer

How `/learn/alphabet` is put together. Audio generation is in [ALPHABET_AUDIO.md](ALPHABET_AUDIO.md); visual rules are in [DESIGN.md](DESIGN.md).

## One screen, no sub-routes

The grid, the letter sheet, learning, drilling and the summary are all client-side state in a single route. A `Screen` type (`'home' | 'learn' | 'drill' | 'summary'`) owned by [`AlphabetTrainer.svelte`](../src/lib/components/AlphabetTrainer.svelte) picks the child component; the letter sheet is independent of it, since it opens from `home` without leaving it. The whole practice flow reads as one session, not a sequence of pages.

## Access model

Browsing the grid and opening a letter works signed out. Only **Practice** needs a session, and the gate is the `answer` action's `requireSignedIn()` — not `load`, which stays public, and not the client-side check in `clickPractice()`, which is a UX nicety. If that check is bypassed, the first answer's POST redirects instead of saving, handled with a toast rather than a crash. Sign-in resumes into practice through the same `?next=…&resume=…` pattern as [AUTH.md](AUTH.md), replaying a state transition rather than resubmitting a form.

## The top-left bubble: Back, or Close — decided by a store, not a prop

Every non-`home` screen shows an X that returns to `home`, rather than the usual chevron. `screen` is state, not a URL, so the shared `BackButton.svelte` would otherwise compute "back" from the route's parent and land the learner a level higher than they meant to go.

`BackButton` is rendered once in the locale layout, a sibling of page content rather than an ancestor, so it can't take a callback by prop. [`topLeftAction.svelte.ts`](../src/lib/stores/topLeftAction.svelte.ts) bridges that the way [`toasts.svelte.ts`](../src/lib/stores/toasts.svelte.ts) does for toasts:

```ts
$effect(() => {
	if (screen === 'home') return;
	setCloseAction(backHome);
	return () => setCloseAction(null);
});
```

The cleanup runs before every re-run and on unmount, so neither switching screens nor navigating away can strand another page with a stuck X. Any future multi-screen single-route flow calls the same two functions.

## Mastery: a plain 0–10 level per letter

[`mastery.ts`](../src/lib/alphabet/mastery.ts)'s `applyAnswer()` moves a level by ±1, clamped. Deliberately not the vocabulary trainer's SM-2 scheduler — recognition strength isn't "when should this resurface".

A letter with no row is level 0, so **level 0 is overloaded**: never seen and seen-but-always-wrong look identical. A deliberate simplification, not something to fix with a separate "seen but weak" state.

## Building a practice session

[`session.ts`](../src/lib/alphabet/session.ts)'s `buildSession()` runs client-side from levels already in `page.data`, and is **not pure** — it shuffles. Calling it for the Practice button's preview and again on press picks different letters, which is fine because the preview only shows counts.

- **Unmet letters** (level 0), up to 5, become the learn queue, each with its own intro step. Which 5 is random: every level-0 letter is equally unknown.
- **Weakest met letters** fill the rest — 3 alongside unmet ones, or 8 when nothing is left to introduce. Weaker always comes before stronger, but _within a tie_ the choice rotates, so ten letters stuck at level 1 don't produce the same 3 forever. The mechanism: shuffle once up front, then sort by level — `.sort()` is stable, so same-level letters keep their shuffled order instead of snapping back to alphabet order.
- The drill queue is `[...unmet, ...weakest]`, each letter once, no requeuing a missed letter within a session. A wrong answer just ends the session at a lower level and comes back first next time.

## Drill questions: three types, confusable-aware

[`drillQuestion.ts`](../src/lib/alphabet/drillQuestion.ts) round-robins by index: `sound` → `audio` → `case` → …

- **`sound`** — shown the glyph pair, pick the voicing.
- **`audio`** — hear the phoneme, pick the glyph pair. The only type with a skip path.
- **`case`** — shown one case, pick the other, direction randomized per question. `yev` (և) has no uppercase, so a `case` question for it falls back to `sound`.

Wrong options aren't random: [`alphabetConfusables.ts`](../src/lib/content/alphabetConfusables.ts) lists genuinely mixable pairs, and a question's first distractor is the tested letter's partner where it has one. `case` questions also filter `yev` out of the filler pool.

A `sound` option shows `voicingLabel` alone; the learn step and sheet show both halves through `fullVoicing()`. The split exists so a tight option button never has to fit the full explanation.

**A confusable pair needs two genuinely different `voicingLabel`s, and two different `transliteration`s.** Both fields are short, glance-able tags, and both had the same bug independently: `vo` (Ո) and `yech` (Ե) are position-dependent and were labelled with their _mid-word_ sound, identical to their own listed confusables' labels — unguessable once a question shows the label alone. Relabelled to their distinguishing sound (`"vo"`, `"ye"`). The same held for `transliteration`: `vo`/`o` shared a tag in both languages. When adding a pair to `CONFUSABLE_PAIRS`, check both fields. Two _unrelated_ letters sharing a tag is a coincidence worth living with — `xeh`/`ho` both read `х` in Russian, which has no separate letter for either sound — but two letters listed as each other's confusable sharing one defeats the point.

An `audio` question's clip uses `preload="auto"` (not `SpeakerButton`'s `none`) and autoplays on mount. Both are safe because the question can't be answered without hearing it, and the component always remounts in response to a click, which keeps it inside the autoplay-permission window; `playAudio()`'s `.catch()` covers a block anyway.

### Skipping an audio question doesn't cost anything — but repeated skips can mute audio questions entirely

"I can't listen right now" advances without touching the level — nothing is logged, and the summary omits that letter entirely, since the summary is framed as "which letters moved".

Skipping _suggests_ muting audio questions for 15 minutes; only the explicit button starts it. While muted, `buildQuestionFor()` substitutes `sound` for any `audio` slot, so a muted learner never sees one rather than skipping again. [`audioMute.ts`](../src/lib/alphabet/audioMute.ts) uses `localStorage`, since the duration outlives the tab, and clears its own key on expiry — the round-robin's second question is always `audio`, so that happens at least once per session.

## The word library

Each letter's "in a word" examples are ids into the shared library (Conventions §10), so an example word is defined and recorded once. Most letters reference one word; two only where the sound depends on position — `yech` (Ե) and `vo` (Ո) — and order matters there, mid-word pronunciation first.

Three entries were swapped after audio review — see [ALPHABET_AUDIO.md](ALPHABET_AUDIO.md#words-swapped-after-audio-review).

## Persistence: optimistic, one row per letter

`user_alphabet_progress` (`user_id, letter_id, level, updated_at`) follows `user_vocabulary_progress`'s shape, with its grant in the same migration as the table.

Grading is optimistic, the same documented exception as the vocabulary trainer (Conventions §8): picking an option updates the UI and in-memory levels at once — right/wrong is a pure client-side comparison — while a hidden form submits in the background. A failed save toasts and doesn't roll back; the next review of that letter self-corrects the stored value.

The `answer` action recomputes correctness from `letterId` + `chosenId` rather than trusting a client verdict. A forged request can still move _a_ letter's level, but only by naming a real option.

**Two bugs worth keeping in mind**, from when the save-failed toast first appeared:

- **The migration was never applied.** Distinguish this by _error code_, not status: a table that exists but denies anon access returns `401`/`42501`; one that was never created returns `404`/`PGRST205`. That's a read-only check needing no `service_role`:
  ```bash
  curl "$PUBLIC_SUPABASE_URL/rest/v1/<table>?select=*&limit=1" \
    -H "apikey: $PUBLIC_SUPABASE_ANON_KEY" -H "Authorization: Bearer $PUBLIC_SUPABASE_ANON_KEY"
  ```
  After applying, PostgREST's schema cache may need `NOTIFY pgrst, 'reload schema';` and a few seconds.
- **The action read a field the form never sent** (`outcome`), so every save 400'd before any Supabase call. It stayed hidden because a `use:enhance` action returns a real failure inside a `200 OK` — the signal is `{"type":"failure","status":400,…}` in the body, not the status.

## Fixed floating elements

Every screen here has at least one `position: fixed` piece over content that varies in height. Nearly every non-obvious bug in this feature came from that combination; [DESIGN.md](DESIGN.md#motion) has the general write-ups.

**A screen with its own progress header fills the full height PageShell would otherwise centre it within.** In normal flow, content height varying by letter moved where PageShell centred the block, carrying the header with it. Both screens set `min-height: var(--page-content-min-height)`, defined once on PageShell's `main` — Svelte's CSS scoping affects selector matching, not custom-property inheritance — with the header in normal flow at the top and the rest in a `flex: 1` wrapper that centres in what's left. **`<FloatingActionBar>` must be inside that wrapper**, since its measured bottom spacer has to be one of the same column's children; a wrapper trying to predict that spacer's height double-counted it and overflowed.

The shared [`AlphabetProgressHeader.svelte`](../src/lib/components/AlphabetProgressHeader.svelte) encodes its two callers' difference as data: the learn step has no "done vs current" distinction, so it emits only `'current'` and reads as one growing bar; the drill uses all three `DotState` values.

**Centring that inner wrapper isn't always right.** For a question with less content than the tallest case, centring split the slack above and below, and the lower half read as a gap before the floating footer — the one edge next to something visible. The drill uses `justify-content: flex-end`, moving the slack up under the header where nothing sits beside it.

**Sizing by viewport width alone can overflow a short viewport, and a wide one.** The letter circles clamp against `vw` with no reference to height, so a wide-but-short phone needs a `@media (max-height: 700px)` step. The grid hits the mirror image: `auto-fill` stretched each tile to its track, so a _wider_ phone made tiles — and, via `aspect-ratio`, six rows of them — taller than intended. Capping `.tile`'s `max-width` at the same `3rem` floor `auto-fill` uses (plus `justify-items: center`) stops that without changing the column count.

**A fixed footer needs an opaque-enough background.** Transparent is fine in flow; fixed, it lets scrolled-up content show through. Three tokens, each a different opacity for a different context: `--color-background` (opaque, where the button must read clearly), `--color-background-translucent` (94%, for `.skip`, which benefits from reading less solid), and `--color-background-translucent-soft` (86%, with a softer border, for `.footer-card`, a panel wrapping several pieces).

`.footer-card` exists because wrapping _everything_ the footer might show in one background rendered an empty bordered box for the states with nothing to show yet. The card renders only for the states with feedback text; the bare skip button and the "nothing yet" state sit directly in `.footer`, which is what reserves the constant height.

## The floating footer buttons: three extracted to `<Button>`, three kept bespoke

Three copies of a primary pill and two of a secondary one became `Button` (Conventions #3). The secondary ones needed `Button`'s `opaque` prop first, since the documented `transparent` secondary doesn't work in a fixed footer.

Three stayed bespoke — `.prev`, `.skip` and `.mute` — each for a reason recorded on its own CSS rule: a non-pill shape, a smaller tap footprint, a label that needs a smaller font than `Button`'s fixed size. The home screen's pulsing Practice button was a fourth until a third copy of that pill appeared and it became [`PulseCta.svelte`](../src/lib/components/PulseCta.svelte).

The rule that falls out: extract when the duplication is real and the abstraction can absorb the per-consumer difference cheaply; don't force a consumer with a deliberate deviation through a shared component that would need new surface area for one caller.
