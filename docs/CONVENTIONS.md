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
  via `Button`'s `loading` prop, not a one-off loading indicator. The
  spinner never moves the label: with a leading icon it *replaces* the
  icon in place, without one it floats beside the text — see
  [§15](#15-a-buttons-spinner-never-moves-its-label).
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

## 10. Words live in one shared library; decks and dialogues reference it by id

There is exactly one definition of any word in the app —
[`src/lib/content/words/entries.ts`](../src/lib/content/words/entries.ts),
the word library — and exactly one pronunciation clip for it
(`static/audio/words/<id>.m4a`, see §11). Every feature that shows or
plays a word points at that entry by id rather than carrying its own copy:

- A **vocabulary deck** (`src/lib/content/vocabulary/decks/<deckId>.ts`) is
  an ordered `WORD_IDS` list, nothing more. The deck owns the selection and
  order; the library owns the words.
- The **alphabet trainer**'s "in a word" examples are `exampleWordIds` on
  each letter.
- A **dialogue** (`src/lib/content/dialogues/dialogues/<id>.ts`) links each
  spoken token — an inflected form like `հա՞ցը` — to the library word it's
  a form of (`wordId: 'hats'`), so the tap-to-look-up popover shows the base
  form and plays the shared clip. A token only carries its own `gloss`/`here`
  where the in-context meaning differs from the library entry's.

Rules that follow from that:

- **Never duplicate a word to make it available somewhere new.** If a deck
  or dialogue needs a word the library doesn't have, add it to `entries.ts`
  (with its clip, §11) and reference the id. If a word already exists under
  a slightly different translation than the new context wants, that's a
  token `gloss` (dialogues) or a `global`/`cardOnly` comment, not a second
  entry — see how
  `uzel` serves both the verbs deck ("To want") and the dialogue's
  `ուզում եմ` ("want").
- **Word ids are one flat namespace.** `entries.ts` throws at module load
  on a duplicate id, and `loadDeckWords()`/`loadDialogue()` throw on an id
  the library doesn't have, so a typo fails on the first page that loads the
  content rather than rendering a silently shorter list. Keep the id a
  transliteration of the word (`khaghal`, not `play`), matching the existing
  entries — `xaghal`/`khaghal` once coexisted as two ids for one word and
  had to be merged.
- **New words are drafted in `entries.ts`, then edited on the review
  page, not in the editor.** Add the entries and the deck file, open
  `http://localhost:4747/?deck=<id>` (`node scripts/words/notes.js`) and
  do the actual wording there, where the deck reads as a set — the
  README's "Adding words" has the steps.
- **Never import a `decks/*.ts` or `dialogues/dialogues/*.ts` file
  directly.** Go through `loadDeckWords()` in
  [`loadDeck.ts`](../src/lib/content/vocabulary/loadDeck.ts) and
  `loadDialogue()` in
  [`loadDialogue.ts`](../src/lib/content/dialogues/loadDialogue.ts): that's
  where the ids are resolved and validated, and each file stays its own
  lazily-loaded chunk so browsing the catalog never pulls the content in.
  [`vocabulary/catalog.ts`](../src/lib/content/vocabulary/catalog.ts) and
  [`dialogues/catalog.ts`](../src/lib/content/dialogues/catalog.ts) — ids,
  titles, counts, but never the content itself — are the files that are
  safe to import from anywhere. Enforced by `npm run lint:js`
  (`no-restricted-imports` in [`eslint.config.js`](../eslint.config.js)).
- **A deck's `wordCount` and a dialogue's `lineCount` in their catalogs must
  match the content file.** Kept as plain numbers so the catalogs stay free
  of content; `loadDialogue()` checks its count at load time, a deck's is
  checked by hand. Update it in the same change that adds or removes an
  entry.
- **Every word's `armenian` field is capitalized** (e.g. `Ուշ`, not `ուշ`),
  even where normal running Armenian text would use lowercase, and even
  for function words (`Եմ`, `Այս`). Deliberate, not a typo to "fix":
  capital letters look different enough from lowercase that a learner
  still shaky on the alphabet gets extra reading practice on them just by
  browsing the vocabulary list. Dialogue *tokens* are the exception — they
  are the line's actual text and keep its real casing and punctuation.
- **`translation` is capitalized too, in both `en` and `ru`** (e.g. `{ en:
  'Hi', ru: 'Привет' }`, not `{ en: 'hi', ru: 'привет' }`) — a word and its
  translation should match in this respect. Applies to `translation`
  specifically, not a `global`/`cardOnly` comment (ordinary sentence-cased
  prose) and not a dialogue token's `gloss` (which reads as a running-text
  gloss, "the bread").
- **Inside a comment, examples are lowercase — the Armenian and its
  translation alike:** `e.g. բարի լույս — “good morning”`, `գնել (“to
  buy”)`, `դուք — «вы»`. Capitals are for a word standing on its own (the
  two fields above) and for whatever opens a sentence, an Armenian word
  included (`Բարի գիշեր — “good night” — is a goodbye`, `Մայր — “mother”
  — with the affectionate -իկ`, never `մայր — …`): a comment follows
  natural sentence flow. Applies to `global`, `cardOnly` and a dialogue
  `here` remark alike — docs/DIALOGUES.md, "Word comments", rule 6.
- **Each language is written for its own reader, and a comment may be in
  one language only.** The `en` and the `ru` are two sentences written
  from scratch, not one translated twice — down to the construction:
  «-ի на слове տավար» is "the -ի on տավար" in Russian words and English
  grammar, where Russian says «в конце слова» (read the Russian aloud
  before saving it; `entries.ts` throws on that one phrasing as a
  tripwire). And when a fact is worth stating to only one of the two
  readers, fill in that language alone — `global` and `cardOnly` are
  `PartiallyTranslated`, and the other reader then sees no comment, which
  is better than a sentence written for someone else.
- **A comment says one fact per sentence, about this word, in plain
  words** — not an etymology that opens with a different word, not three
  facts stacked with dashes. Match the feel of the existing decks' comments
  before writing new ones — docs/DIALOGUES.md, "Word comments", rules 1
  and 5.
- **A comment is typeset like a book, not diagrammed:** words for
  relations (`տղա and մարդ`, `as mother becomes mum`), never `+`, `→` or
  emoji — rule 13 there. `entries.ts` throws at load on this, on a
  lowercase Armenian opening, and on a Latin letter inside a Cyrillic word
  (the invisible «женщинy» typo).

The library is one plain module, not code-split — at low hundreds of short
entries it's a few KB gzipped, cheaper than the duplication a per-feature
split reintroduced. If it ever grows large enough to matter, shard it behind
`getWord()` rather than letting features grow private copies again.

If you're unsure whether a verb form is formal, check it against a known-
correct example already in the dictionaries (e.g. `Войдите`/`Создайте` in
[`dictionaries/account.ts`](../src/lib/i18n/dictionaries/account.ts)) rather
than guessing — the ты/вы conjugation difference is often a single
letter/syllable and easy to get wrong by ear.

## 11. Every library word ships with a pronunciation audio file

Every `Word` in [`entries.ts`](../src/lib/content/words/entries.ts) must
have a matching pre-generated clip at `static/audio/words/<wordId>.m4a` —
the path [`wordAudioSrc()`](../src/lib/content/words/audio.ts) derives and
the "loudspeaker" button (`SpeakerButton.svelte`) plays, wherever the word
appears: a deck's word list, the flashcard trainer, a letter's example, a
dialogue's word popover. One word, one file. There is no "missing audio" UI
state — a word added without its clip just fails silently to play when
tapped.

See [`docs/VOCABULARY_AUDIO.md`](VOCABULARY_AUDIO.md) for the storage/
encoding decisions and, most importantly, the exact steps to generate and
save a new word's clip — **follow that checklist for every new word**, in
the same change that adds it to the library.

Dialogue *lines* are recorded separately (a line is a unique two-voice
recording, not a word) at `static/audio/dialogues/<dialogueId>/<nn>.m4a` —
see [`docs/DIALOGUES.md`](DIALOGUES.md). Until a dialogue's line clips
exist, the player treats each missing line as a fixed-length silence so the
listen-through flow still works end to end; that's a deliberate stopgap for
content-in-progress, not a fallback to rely on.

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

## 13. Every alphabet letter ships with a pronunciation audio file

Every `AlphabetLetter` (in [`src/lib/content/alphabet.ts`](../src/lib/content/alphabet.ts))
must have a matching clip at `static/audio/alphabet/<letterId>.m4a` — the
path [`letterAudioSrc()`](../src/lib/content/alphabetAudio.ts) derives. The
words it references via `exampleWordIds` are library words and are covered
by §11. Same "no missing audio" rule: nothing falls back gracefully if a
clip is absent.

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

## 15. A button's spinner never moves its label

When a `Button` goes into its `loading` state (Conventions #8), the label
stays exactly where it was — not a pixel of horizontal or vertical shift,
whether the button has a leading icon or not, and however long the label
is. A pending state should read as *the same button, now busy*: the user's
eye stays where it was, on the thing they just pressed. A label that jumps
sideways when the spinner arrives and jumps back when it leaves pulls the
eye to the movement instead. It's small, and it's twice per click on every
async button in the app, which is what makes it worth ruling out inside
[`Button.svelte`](../src/lib/components/Button.svelte) rather than trusting
each call site to get it right. Two mechanisms, one per case:

**With a leading icon: the spinner replaces the icon, in the icon's box.**
A button that carries an icon (the door-and-arrow on "Sign out", the
checkmark on "That's a wrap — mark it done", the plus on "Add to my
collection") shows exactly one glyph at a time — the icon at rest, the
spinner while busy — never both. Two rules make that hold:

- **Pass the icon through `Button`'s `icon` snippet prop, not inline in its
  label.** `loading` then swaps the slot's contents between the icon and
  the spinner. An icon dropped into the button's children instead sits
  *after* the spinner, so the user sees spinner + icon + label — a visibly
  busier button than the one they just clicked, which is exactly the
  "That's a wrap" button's bug this rule came from.
- **The icon must not carry its own `width`/`height`.** The slot is a
  fixed `1.125em` × `1.125em` box (`flex-shrink: 0`) and stretches whatever
  is inside it to fill; the spinner fills the same box the same way. The
  box never changes size, so the swap can't reflow the label. An icon with
  its own dimensions would still render at the slot's size (the slot's
  CSS wins), so it isn't a bug so much as a lie — drop the attributes so
  the markup says what happens.

**Without an icon: the label reserves the spinner's room on both sides,
and the spinner floats into it.** An iconless button that *can* load — one
that's given the `loading` prop at all, even as `false`; `undefined` means
"never loads" and skips this, so don't pass the prop on a button that has
no async action — pads its label by the spinner's size plus a gap on
*both* sides, permanently. The spinner is then absolutely positioned at
the label box's left edge, inside that reserved room, taking no layout
space of its own. Symmetric so the text stays centred; permanent so the
spinner's arrival changes nothing about the layout. That covers every
label length without a special case:

- A short label on a wide button ("Sign in" at full width): the spinner
  sits right beside the text, the text doesn't move.
- A label that fills the whole line, or wraps to two: the label box is
  the whole content box, so the spinner sits at the content box's left
  edge — the button's full horizontal padding clear of the border,
  vertically centred between the lines. It never lands *in* the padding
  or up against the pill's cap curve.

The cost is roughly a spinner-and-gap's width more on each side of such a
button at rest (~25px a side at the standard size). The full-width form
buttons (sign in, register, the account settings) don't show it, and a
modal's confirm button is `flex: 1` beside its Cancel, so the pair shares
the width evenly regardless. An earlier version floated the spinner
*outside* the label with no reservation, relying on the button's padding
to hold it when the label was long — that put the spinner a couple of
pixels from the border on a two-line label, visibly jammed into the cap
curve, which is what this replaced. Reserving on the left only was ruled
out because it would centre the text off-axis at rest.

**If a spinner ever looks like it's touching or crossing the button's left
edge,** something has removed the label's reservation (a `:global` rule
overriding `.label`'s padding, or a button rendered without its `loading`
prop and then made to load) — fix that, don't nudge the spinner. Its
position is derived from the label's, and moving it breaks the "beside the
text" case to patch the "fills the line" case.
