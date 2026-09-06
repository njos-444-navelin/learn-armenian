# Conventions

Rules that keep the app internationalized, accessible, on-token, and strictly
typed as it grows. These are load-bearing, not stylistic preferences — code
review should treat violations as bugs.

## 1. No string skips i18n

Every piece of text rendered on screen — headings, button labels, aria labels,
page titles/descriptions, even things that feel like proper nouns (e.g. the
name "English"/"Russian" themselves, see
[`src/lib/i18n/dictionaries/common.ts`](../src/lib/i18n/dictionaries/common.ts)) —
must be a `Translated` object (`{ en: string; ru: string }`, see
[`src/lib/i18n/types.ts`](../src/lib/i18n/types.ts)) resolved through
`t()` from [`$lib/i18n/current`](../src/lib/i18n/current.ts). Never write a
string literal directly into markup.

Add new copy to a dictionary under `src/lib/i18n/dictionaries/`, grouped by
page or feature — don't inline `Translated` object literals in components.
Dynamic/interpolated text still applies: write a function that returns a
`Translated` (see `progressLabel()` in
[`dictionaries/alphabetTrainer.ts`](../src/lib/i18n/dictionaries/alphabetTrainer.ts)),
not a template string built after resolving one language.

`src/lib/i18n/dictionaries/` is for UI chrome copy (headings, labels, SEO
text). Lesson *content* that happens to carry bilingual fields — e.g. the
Armenian alphabet data in
[`src/lib/content/alphabet.ts`](../src/lib/content/alphabet.ts) — lives under
`src/lib/content/` instead, kept separate from UI copy as the set of lessons
grows.

**Scope exemptions:**
- The PWA manifest (`vite.config.ts`) is a single build-time file that can't
  be resolved per-request/per-locale, so its `name`/`short_name`/`description`
  are not run through the i18n system.
- Purely decorative glyphs that are identical in every language — e.g. the
  locale flag emoji in [`LOCALE_FLAGS`](../src/lib/i18n/locale.ts) — aren't
  translatable text, so they skip the dictionary system. They must always be
  rendered `aria-hidden="true"` alongside a real translated label; they can
  never be the only thing conveying the meaning.
- The app's own name, `brandName` in
  [`dictionaries/common.ts`](../src/lib/i18n/dictionaries/common.ts), is a
  plain string, not a `Translated`. Unlike a language name (a real word that
  differs per language — see "English"/"Russian" above), a product's own
  brand name is a proper noun that conventionally stays as-is in every
  locale (the literal Russian translation read as unintentionally blunt/rude
  as a title). Every page's `pageTitle` should build its brand-including
  suffix/prefix from this constant (e.g. `` `${brandName} — choose a lesson` ``)
  rather than hand-writing "Learn Armenian" — that's what keeps a future
  page's title from silently reintroducing a translated brand name.

## 2. No hardcoded colors

Every color used in a component's `<style>` block must be a `var(--color-...)`
custom property from [`src/lib/styles/tokens.css`](../src/lib/styles/tokens.css).
If a component needs a color that doesn't exist yet, add a new token to
`tokens.css` (with a semantic name, not a raw color name) rather than writing a
literal hex/rgb value inline.

See [`docs/DESIGN.md`](DESIGN.md) for the reasoning behind the palette itself
(when to use a tinted background vs. a plain surface, why accent and accent-2
shouldn't sit as competing backgrounds, contrast rules for text on a filled
accent) — this rule says *where* colors must come from, that doc says *how*
to pick one.

Enforced by `npm run lint:css` (`scale-unlimited/declaration-strict-value` in
[`stylelint.config.js`](../stylelint.config.js)) for `color`, `*-color`,
`fill`, and `stroke` — not `box-shadow`, which the rule can't reliably check
(see the config's own comment on that exclusion) and stays a manual-review
concern. A deliberate exception (e.g. [`Flagmark.svelte`](../src/lib/components/Flagmark.svelte)'s
literal flag colors) gets a `stylelint-disable-next-line` comment explaining
why, not a rule change.

## 3. Duplicated UI becomes a shared component

The moment a UI element (a button, a layout shell, a form field, ...) is used
in two or more places, extract it to `src/lib/components/`. Don't let the same
markup/styling drift across pages — see `Button.svelte` and `PageShell.svelte`
for the current examples.

## 4. Optional props are always `T | undefined`

The project enables `exactOptionalPropertyTypes` in `tsconfig.json`. Every
optional field in a hand-written interface must be written as
`field?: T | undefined`, not just `field?: T`, so that explicitly passing
`undefined` (common when a prop is conditionally set) type-checks.

## 5. Locale-prefixed paths go through the i18n path helpers

Never hand-build a `/en/...` or `/ru/...` string. Use `withLocale()` to build
one and `withoutLocale()`/`getLocale()` (all in
[`src/lib/i18n/paths.ts`](../src/lib/i18n/paths.ts) and
[`current.ts`](../src/lib/i18n/current.ts)) to read one. This keeps the set of
supported locales defined in exactly one place
([`src/lib/i18n/locale.ts`](../src/lib/i18n/locale.ts)).

Enforced by `npm run lint:js` (`no-restricted-syntax` in
[`eslint.config.js`](../eslint.config.js)), which rejects any string or
template literal starting with a bare `/en/` or `/ru/` segment.

`withLocale()` itself wraps SvelteKit's `resolve()` (`$app/paths`, since
2.26), which checks its first argument against a generated union of every
route in the app — a typo'd path is a build/`svelte-check` failure instead of
a silently broken link. `withLocale(locale, pathname)` only accepts one of
the fixed literal keys in its own `ROUTES` map (add a route there, not just
under `src/routes/`, for it to be reachable this way); three narrower
siblings cover what that can't:

- `withLocaleDeck()` — the one route with a dynamic segment (`/learn/vocabulary/[deckId]`).
- `withLocaleQuery()` — a fixed route with a query string appended (e.g. the
  sign-in redirect's `?next=`).
- `resolveRuntimePath()` — the couple of call sites that rebuild a path
  computed at runtime (the current page's own pathname, or one derived from
  it — "switch language on whatever page you're on", "go up one level")
  rather than one of `ROUTES`'s literals, so it can't be checked against the
  route list at compile time. Only ever call it with a pathname derived from
  `page.url.pathname`, never from unvalidated input — see its doc comment.

`eslint-plugin-svelte`'s `svelte/no-navigation-without-resolve` enforces the
same thing for raw `href`/`goto()`/`pushState()`/`replaceState()` calls that
don't go through any of the above — it recognizes a value as safe either by
literally being a `resolve()` call, or (type-aware linting is on for this
reason — see `eslint.config.js`'s `languageOptions.parserOptions`) by its
static type being `ResolvedPathname`, which is what lets `Button.svelte`'s
and `TopBubbleLink.svelte`'s own `href` prop types (not `string`) cover every
caller automatically. `replaceState`/`pushState` with a mutated copy of
`page.url` (SvelteKit's own shallow-routing pattern) is the one shape this
rule has no way to bless — see the disable comments in
`AlphabetTrainer.svelte` and `learn/vocabulary/[deckId]/+page.svelte` for why
that's a deliberate, narrow exception, not a bypass.

## 6. Design mobile-first, verify the full device range

The app must work from small phones through widescreen desktops — not just a
laptop-sized dev window. Default to fluid techniques over fixed breakpoints:
`clamp()` for type, `flex-wrap`/intrinsic sizing for layout, and the shared
`--measure` token ([`tokens.css`](../src/lib/styles/tokens.css), applied via
[`PageShell.svelte`](../src/lib/components/PageShell.svelte)) to cap content
width instead of a per-page `max-width`. Reach for a fixed `@media` breakpoint
only when a fluid technique genuinely can't express the change; if you do,
reuse these standard widths so breakpoints don't multiply ad hoc: `480px`
(large phone), `768px` (tablet), `1024px` (small laptop), `1440px` (widescreen).

Interactive elements must meet the `--tap-target-min` (44px) minimum size —
see `Button.svelte`. Before calling new UI done, check it at a small phone
width (~375px), a tablet width (~768px), and a widescreen width (~1920px).

## 7. Auth/password forms use single-purpose `autocomplete` values

A password `<input>` must declare exactly one `autocomplete` value describing
its actual purpose: `"new-password"` for account creation, `"current-password"`
for signing in. A field can't correctly serve both — password managers
(Proton Pass, 1Password, browser built-ins, ...) decide whether to offer to
*generate* a password based on this attribute alone, so a shared sign-in/
sign-up form with one ambiguous password field silently breaks that
assistance on sign-up. If a page needs both flows, give each its own
`<form>` with its own password field rather than sharing one field across two
submit actions — see
[`[lang=locale]/account/+page.svelte`](../src/routes/[lang=locale]/account/+page.svelte)
and [`docs/AUTH.md`](AUTH.md#design-decisions).

**A `current-password` + `new-password` pair in the same form (a change-
password form) needs a `username`/`email` field too, even if the app
already knows it from the session and never reads the field's value.**
Confirmed directly from
[Chromium's own password-form guidance](https://www.chromium.org/developers/design-documents/create-amazing-password-forms/):
password managers use that field to know *which* saved credential a new
password belongs to (a site can have more than one account) — without it,
some autofill implementations (confirmed: Proton Pass on iOS) will autofill
the `current-password` field but silently decline to suggest a generated
password for `new-password`, since they can't tell what account they'd be
generating one for. Add a real `<input>` (not `type="hidden"` — some
autofill parsers skip those), visually hidden via CSS `display: none`, with
`autocomplete="username"` and `value` set to the known email — see
[`account/change-password/+page.svelte`](../src/routes/[lang=locale]/account/change-password/+page.svelte).

## 8. Async actions always show their pending state

The app's current state must always be visible — never leave the user
guessing whether their click registered. Any button that triggers a network
request (a form submission, a fetch-backed action) must, for the duration of
that request:

- Show a spinner — use [`Spinner.svelte`](../src/lib/components/Spinner.svelte)
  via `Button`'s `loading` prop, not a one-off loading indicator.
- Be disabled — `Button`'s `loading` prop forces this automatically (and sets
  `aria-busy`), but pass `disabled` on other buttons on the page too while
  one action is pending, so the user can't fire a second overlapping request.

See the `submitAction()` helper in
[`[lang=locale]/account/+page.svelte`](../src/routes/[lang=locale]/account/+page.svelte)
for the pattern: a `pending` state set before the request and cleared in a
`finally` after it, wired to every submit button on the page via `loading`/
`disabled`.

**Anti-pattern, treat as a bug: don't let inputs go blank while a request is
in flight.** SvelteKit's `use:enhance`, when not given a custom submit
function, resets the `<form>` on any non-redirect action response. On a page
like `/account`, that meant the email/password you'd just typed visibly
vanished a moment after clicking "Sign in" — before anything else on screen
explained why. It reads as data loss, not a state change, and it's worse
than showing nothing at all. The `submitAction()` helper above fixes this by
passing `update({ reset: false })`, which also means a *failed* submission
correctly leaves your input in place to fix, rather than making you retype
everything.

**Exception:** a *confirmed-successful* one-time submission of sensitive
credentials (e.g. a password change) may reset its own fields on success —
clearing them is the safer default once the operation is done and there's
nothing left to fix. The anti-pattern above is specifically about clearing
on failure/no explanation; `reset: result.type === 'success'` (see
[`account/change-password/+page.svelte`](../src/routes/[lang=locale]/account/change-password/+page.svelte))
is not a violation of this rule.

**Exception:** grading a card in
[`VocabularyTrainer.svelte`](../src/lib/components/VocabularyTrainer.svelte)
is deliberately optimistic — the queue advances the instant a grade button is
clicked, with no spinner and no disabled wait, before the `POST` has even
resolved. This is a considered exception, not an oversight: the write is
low-stakes (one row in `user_vocabulary_progress`) and idempotent (regrading
the same word just upserts the same row again), so blocking a fast flashcard
session on a round-trip for every single card would cost real feel for no
correctness benefit. A failed write shows an error toast (see
[`Toast.svelte`](../src/lib/components/Toast.svelte)) instead of a spinner,
and the UI does **not** roll back — the unsaved grade simply never persisted,
which self-corrects the next time that word comes up for review. Don't reach
for this exception elsewhere by default; it applies specifically to writes
that are both this cheap to redo and this inexpensive to lose.

**Exception:** persisting a signed-in user's chosen UI language (the locale
buttons on [`[lang=locale]/+page.svelte`](../src/routes/[lang=locale]/+page.svelte)
and the "Switch language" button in the signed-in view of
[`account/+page.svelte`](../src/routes/[lang=locale]/account/+page.svelte),
both via
[`persistPreferredLocale()`](../src/lib/i18n/persistPreferredLocale.ts)) is
the same shape: the click navigates immediately, the write to
`user_preferences` happens in the background, and a failure shows an error
toast with no rollback — there's nothing to roll back to, since the user is
already on the new locale's page by the time the write could fail. The write
is one row, keyed by `user_id`, and simply retries itself next time the user
picks a language (or lands back on the picker, per the redirect logic in
[`[lang=locale]/+page.server.ts`](../src/routes/[lang=locale]/+page.server.ts)),
so losing it costs nothing beyond being asked again once.

**Related, separate concern:** a route whose `load` redirects unauthenticated
visitors away must repeat that same guard at the top of every action on that
route, not just in `load`. SvelteKit runs a POST's action before `load`
re-runs to render the result, so a `load`-only guard doesn't stop a direct
or replayed POST to the action from a signed-out session. See
`requireSignedIn()` in
[`src/lib/server/authGuard.ts`](../src/lib/server/authGuard.ts), called from
both places on every route under `account/` that requires a session.

**Debugging note:** a form action submitted via `use:enhance` returns a real
`fail()`/error response *inside* a `200 OK` HTTP response — SvelteKit embeds
the actual outcome in the response body (`{"type":"failure","status":400,...}`),
not the transport status. A network log showing "200 OK" for one of these
POSTs does not mean the action succeeded; check the response body, or the
`result.type` your own `use:enhance` callback receives. This is exactly how
the alphabet trainer's save-progress action silently 400'd on every single
request for a while — see
[`docs/ALPHABET_TRAINER.md`](ALPHABET_TRAINER.md#two-real-bugs-one-misleading-toast)
for the full story.

## 9. Russian UI text uses the formal register (вы, not ты)

Every Russian string that addresses the user — an instruction, a button
label, an imperative, a question — uses the formal/polite **вы**-form, never
the informal **ты**-form. The informal register reads as presumptuous or
blunt from an app to a stranger; it's only appropriate between people who
already know each other. Concretely:

- Imperative verbs take the **вы**-conjugation: `Выберите` (not `Выбери`),
  `Изучайте` (not `Изучай`), `Проверьте` (not `Проверь`), `Не торопитесь`
  (not `Не торопись`). This is the single most common mistake — the
  informal imperative is shorter and easier to reach for by default, so
  double-check every verb addressed to the user.
- Second-person pronouns and possessives are **вы/ваш** (not **ты/твой**),
  and their oblique forms **вас/вам/вами** (not **тебя/тебе/тобой**).
- Second-person verb conjugations use the **вы**-ending: `хотите` (not
  `хочешь`).

**`Вы`/`Ваш` (and oblique forms `Вас`/`Вам`/`Вами`) are always capitalized**,
wherever they fall in a sentence — not just at the start. This is the
traditional, textbook convention for the polite form of address in Russian,
and the one this app follows throughout: `Вы`, never `вы`. Don't lowercase
it just because it's mid-sentence (e.g. "как Вы хотите", "Ваш аккаунт") —
that's a different, more casual house style some software adopts, but it's
not the one used here.

This does **not** apply to infinitive-form verbs (`Проверить себя`,
`Продолжить`, `Начать обучение`) — infinitives don't inflect for person, so
they're register-neutral and are the normal convention for button labels
regardless of this rule.

## 10. Vocabulary decks are code-split and always capitalized

Two rules for [`src/lib/content/vocabulary/`](../src/lib/content/vocabulary/):

- **Never import a file under `decks/*.ts` directly.** The whole point of
  giving each deck its own file is that a learner who opens one deck never
  downloads another deck's words — go through `loadDeckWords()` in
  [`loadDeck.ts`](../src/lib/content/vocabulary/loadDeck.ts), which uses
  `import.meta.glob` so Vite keeps each deck in its own chunk, fetched only
  when that deck's page is visited.
  [`catalog.ts`](../src/lib/content/vocabulary/catalog.ts) — deck ids,
  titles, descriptions, levels, word counts and icons, but never the words
  themselves — is the one file in here that's safe to import from anywhere,
  e.g. the topic list. Enforced by `npm run lint:js`
  (`no-restricted-imports` in [`eslint.config.js`](../eslint.config.js)).
- **A deck's `wordCount` in `catalog.ts` must match its own file's actual
  word count.** Kept as a plain number rather than derived from the words
  themselves, specifically so the catalog stays free of word data per the
  rule above — which means nothing enforces it automatically. Update it by
  hand in the same change that adds or removes a word from a
  `decks/<id>.ts` file, the same way §11 below asks for a new audio clip in
  that same change.
- **Every word's `armenian` field is capitalized** (e.g. `Ուշ`, not `ուշ`),
  even where normal running Armenian text would use lowercase. Deliberate,
  not a typo to "fix": capital letters look different enough from lowercase
  that a learner still shaky on the alphabet gets extra reading practice on
  them just by browsing the vocabulary list.
- **`translation` is capitalized too, in both `en` and `ru`** (e.g. `{ en:
  'Hi', ru: 'Привет' }`, not `{ en: 'hi', ru: 'привет' }`) — a word and its
  translation should match in this respect, so a capitalized Armenian
  headword doesn't sit next to a lowercase English/Russian one. Applies to
  `translation` specifically, not `note` (already ordinary sentence-cased
  prose, capitalized for its own reason).

If you're unsure whether a verb form is formal, check it against a known-
correct example already in the dictionaries (e.g. `Войдите`/`Создайте` in
[`dictionaries/account.ts`](../src/lib/i18n/dictionaries/account.ts)) rather
than guessing — the ты/вы conjugation difference is often a single
letter/syllable and easy to get wrong by ear.

## 11. Every vocabulary word ships with a pronunciation audio file

Every `VocabularyWord` (in any file under
[`src/lib/content/vocabulary/decks/`](../src/lib/content/vocabulary/decks/))
must have a matching pre-generated audio clip at
`static/audio/vocabulary/<deckId>/<wordId>.m4a` — the path
[`wordAudioSrc()`](../src/lib/content/vocabulary/audio.ts) derives and the
"loudspeaker" button (`SpeakerButton.svelte`) plays. There is no "missing
audio" UI state — a word added without its clip just fails silently to play
when tapped.

See [`docs/VOCABULARY_AUDIO.md`](VOCABULARY_AUDIO.md) for the storage/
encoding decisions and, most importantly, the exact steps to generate and
save a new word's clip — **follow that checklist for every new word**, in
the same change that adds the word to its deck file.

## 12. English UI copy is British English

Every `en` string in `src/lib/i18n/dictionaries/` uses British spelling, not
American — e.g. **colour** (not color), **organise**/**-ise** endings (not
-ize), **travelling**/**cancelled** (double consonant), **licence** as a
noun vs. **license** as a verb, **grey** (not gray), **centre** (not
center). This is a fixed house style, not a per-string judgment call — if
you're unsure which side of a spelling difference is British, check it
rather than guessing. Doesn't apply to code identifiers, file names, or
third-party API/library terms (e.g. `color-mix()`, CSS `background-color`),
only to user-facing English copy.

## 13. Every alphabet letter and example word ships with a pronunciation audio file

Every `AlphabetLetter` (in [`src/lib/content/alphabet.ts`](../src/lib/content/alphabet.ts))
must have a matching clip at `static/audio/alphabet/<letterId>.m4a`, and every
`Word` it references via `exampleWordIds` (in
[`src/lib/content/words/entries.ts`](../src/lib/content/words/entries.ts))
must have one at `static/audio/words/<wordId>.m4a` — the paths
[`letterAudioSrc()`](../src/lib/content/alphabetAudio.ts) and
[`wordAudioSrc()`](../src/lib/content/words/audio.ts) derive. Same "no missing
audio" rule as §11: nothing falls back gracefully if a clip is absent.

See [`docs/ALPHABET_AUDIO.md`](ALPHABET_AUDIO.md) for the checklist — it
builds on `docs/VOCABULARY_AUDIO.md`'s pipeline but adds two alphabet-specific
decisions (send a letter's bare glyph as the prompt, and the letter `vo`
itself needs the same "Ո"→"Վ" prompt fix vocabulary words do) that aren't
obvious from the vocabulary doc alone.

## 14. Focus rings are never animated — no `transition` on `outline`/`outline-color`

[`app.css`](../src/app.css) shows/hides the `:focus-visible` ring instantly
(`:focus { outline: none }`, `:focus-visible { outline: 3px solid
var(--color-focus-ring) }`), with no `transition` on `outline`/`outline-color`
anywhere in the app. Never add one — not globally, not on a single component.

This used to work the other way (an always-present, transparent `outline`
plus a `transition: outline-color` on `*`, so the ring faded in/out) but that
turned an intermittent Firefox/Chrome bug into a visible, repeated glitch: a
button that keeps DOM focus after a pointer click (correctly showing no ring,
since `:focus-visible` doesn't match a pointer click) could have that
still-focused element's `:focus-visible` status spuriously re-evaluated as
*matching* for a single style-recalc pass whenever a later, unrelated
interaction happened elsewhere on the page — e.g. tapping a "tap to replay"
button, then picking an answer option, briefly re-showed a ring on the replay
button. Confirmed on Firefox (Linux and Android) and Chrome (Android), so not
one device or engine. With the transition in place, that one-frame recalc
glitch played out as a ~150ms fade-in/fade-out flash; without it, the same
glitch (if it still happens at all) is at most a single imperceptible frame.
See [`blurAfterClick`](../src/lib/actions/blurAfterClick.ts) for a related,
narrower mitigation (blurring an element right after a non-keyboard click) —
kept alongside this rule, not a replacement for it.
