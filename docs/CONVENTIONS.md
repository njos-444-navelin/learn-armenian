# Conventions

Rules that keep the app internationalized, accessible, on-token and strictly typed. Load-bearing, not stylistic — review treats a violation as a bug.

## 1. No string skips i18n

Every string rendered on screen — headings, labels, aria labels, page titles — is a `Translated` (`{ en, ru }`, see [`i18n/types.ts`](../src/lib/i18n/types.ts)) resolved through `t()`.

- New copy goes in a dictionary under `src/lib/i18n/dictionaries/`, grouped by page or feature. Don't inline `Translated` literals in components.
- Interpolated text is a function returning a `Translated`, not a template string built after resolving one language.
- Dictionaries are for UI chrome. Lesson content with bilingual fields (e.g. [`content/alphabet.ts`](../src/lib/content/alphabet.ts)) lives under `src/lib/content/`.

Exemptions: the PWA manifest in `vite.config.ts`, which is build-time and can't be per-locale; decorative glyphs identical in every language (the locale flags), which must be `aria-hidden` beside a real label and can never carry meaning alone; and `brandName`, a plain string, since a product name stays as-is per locale. Build every `pageTitle` from `brandName` rather than hand-writing the app's name.

## 2. No hardcoded colors

Every colour in a `<style>` block is a `var(--color-...)` from [`tokens.css`](../src/lib/styles/tokens.css). A colour that doesn't exist yet gets a new token with a semantic name, not a literal hex.

[DESIGN.md](DESIGN.md) says how to pick one; this rule says where it comes from. Enforced by `npm run lint:css` for `color`, `*-color`, `fill` and `stroke` — not `box-shadow`, which the rule can't check reliably, so that stays manual review. A deliberate exception (e.g. [`Flagmark.svelte`](../src/lib/components/Flagmark.svelte)'s flag colours) takes a `stylelint-disable-next-line` with a reason, not a rule change.

## 3. Duplicated UI becomes a shared component

The moment an element is used twice, extract it to `src/lib/components/`.

## 4. Optional props are always `T | undefined`

`exactOptionalPropertyTypes` is on, so every optional field is written `field?: T | undefined`. Otherwise explicitly passing `undefined` — common for a conditionally set prop — doesn't type-check.

## 5. Locale-prefixed paths go through the i18n path helpers

Never hand-build a `/en/...` or `/ru/...` string. Build with `withLocale()`, read with `withoutLocale()`/`getLocale()`, so the set of locales is defined in one place. Enforced by `npm run lint:js`, which rejects a literal starting with a bare `/en/` or `/ru/` segment.

`withLocale()` wraps SvelteKit's `resolve()`, which checks the path against a generated union of every route, so a typo fails `svelte-check` rather than breaking a link silently. It accepts only the literal keys of its own `ROUTES` map — add a route there as well as under `src/routes/`. Three narrower siblings cover the rest:

- `withLocaleDeck()` — the one route with a dynamic segment.
- `withLocaleQuery()` — a fixed route plus a query string.
- `resolveRuntimePath()` — a path computed at runtime, which can't be checked at compile time. Only ever call it with a pathname derived from `page.url.pathname`.

`svelte/no-navigation-without-resolve` covers raw `href`/`goto()` calls. It accepts a value by its static type being `ResolvedPathname` (type-aware linting is on for this reason), which is what lets `Button`'s and `TopBubbleLink`'s `href` prop types cover every caller. Shallow routing with a mutated copy of `page.url` is the one shape it can't bless — hence the narrow disable comments in `AlphabetTrainer.svelte` and `[deckId]/+page.svelte`.

## 6. Design mobile-first, verify the full device range

Small phones through widescreen desktops, not a laptop-sized dev window. Prefer fluid techniques to breakpoints: `clamp()` for type, `flex-wrap` and intrinsic sizing for layout, and the shared `--measure` token (applied once in [`PageShell.svelte`](../src/lib/components/PageShell.svelte)) rather than a per-page `max-width`. Where a breakpoint is genuinely unavoidable, reuse `480px`, `768px`, `1024px`, `1440px` so they don't multiply.

Interactive elements meet `--tap-target-min` (44px). Check new UI at ~375px, ~768px and ~1920px before calling it done.

## 7. Auth/password forms use single-purpose `autocomplete` values

A password input declares exactly one purpose: `new-password` for account creation, `current-password` for signing in. Password managers decide whether to offer to _generate_ a password from this attribute alone, so a shared sign-in/sign-up field silently breaks that on sign-up. A page needing both flows gives each its own `<form>` with its own password field.

**A `current-password` + `new-password` pair needs a `username` field too**, even though the app knows the email from the session and never reads the field. Password managers use it to tell which saved credential the new password belongs to; without it, some (confirmed: Proton Pass on iOS) autofill the current password but decline to suggest a generated one. Add a real `<input autocomplete="username">` with the known email, hidden with CSS `display: none` — not `type="hidden"`, which some parsers skip. See [Chromium's password-form guidance](https://www.chromium.org/developers/design-documents/create-amazing-password-forms/) and [`account/change-password/+page.svelte`](../src/routes/[lang=locale]/account/change-password/+page.svelte).

## 8. Async actions always show their pending state

Any button that triggers a network request must, for the duration:

- Show a spinner, via `Button`'s `loading` prop rather than a one-off indicator. It never moves the label; that rule and its two mechanisms live in [`Button.svelte`](../src/lib/components/Button.svelte).
- Be disabled. `loading` forces this and sets `aria-busy`; pass `disabled` to the page's other buttons too, so a second request can't overlap.

See `submitAction()` in [`account/+page.svelte`](../src/routes/[lang=locale]/account/+page.svelte): `pending` set before the request, cleared in a `finally`.

**Anti-pattern: inputs going blank mid-flight.** `use:enhance` with no custom submit function resets the form on any non-redirect response, so what you just typed vanishes a moment after clicking Sign in. It reads as data loss. Pass `update({ reset: false })`, which also leaves a failed submission's input in place to fix.

Exceptions:

- A confirmed-successful submission of sensitive credentials may clear its own fields — `reset: result.type === 'success'`.
- **Grading a card** is optimistic: the queue advances before the `POST` resolves, a failure shows a toast, and the UI doesn't roll back. The write is one idempotent row, and an unsaved grade self-corrects at the next review. Reach for this only where a write is that cheap to redo and that cheap to lose.
- **Persisting the chosen UI language** is the same shape: the click navigates immediately, the write happens in the background, and there's nothing to roll back to. It retries next time the learner picks a language.

**Related:** a route whose `load` redirects unauthenticated visitors must repeat the guard at the top of every action. SvelteKit runs a POST's action before `load` re-runs, so a `load`-only guard doesn't stop a replayed POST from a signed-out session. See `requireSignedIn()`.

**Debugging:** an action's `fail()` comes back inside a `200 OK` — SvelteKit puts the outcome in the body (`{"type":"failure","status":400,…}`), not the transport status. A 200 in the network log doesn't mean the action succeeded; read the body or `result.type`.

## 9. Russian UI text uses the formal register (вы, not ты)

Every Russian string addressing the learner uses **вы**, never **ты**.

- Imperatives take the вы-conjugation: `Выберите`, `Изучайте`, `Проверьте`. This is the commonest mistake — the informal form is shorter and easier to reach for.
- Pronouns and possessives are вы/ваш and their oblique forms.
- **`Вы`/`Ваш`/`Вас`/`Вам`/`Вами` are always capitalized**, mid-sentence included. Also when a comment _mentions_ the polite form — `тому, с кем на «Вы»` — even though quoted examples in comments are otherwise lowercase (§10). Lowercase `«вы»` stays lowercase where it names the grammatical form covering both, as in `форма «вы»`.
- Infinitives (`Продолжить`, `Начать обучение`) are register-neutral and are the normal convention for button labels.

If unsure of a conjugation, check it against a known-correct example in the dictionaries rather than guessing — the difference is often one syllable.

## 10. Words live in one shared library; decks and dialogues reference it by id

There is one definition of any word — [`entries.ts`](../src/lib/content/words/entries.ts) — and one clip for it (§11). Every feature points at it by id: a **deck** is an ordered `WORD_IDS` list, the **alphabet trainer** uses `exampleWordIds`, a **dialogue** token carries the `wordId` of the word its inflected form belongs to, plus its own `gloss`/`here` only where the in-context meaning differs.

- **Never duplicate a word to make it available somewhere new.** A different translation for a new context is a token `gloss` or a comment, not a second entry — `uzel` serves both the verbs deck and the dialogue's `ուզում եմ`.
- **Ids are one flat namespace**, and a transliteration of the word (`khaghal`, not `play`). `entries.ts` throws on a duplicate at module load; `loadDeckWords()`/`loadDialogue()` throw on an id the library lacks.
- **New words are drafted in `entries.ts`, then edited on the review page** — see [WORDS.md](WORDS.md).
- **Never import a `decks/*.ts` or `dialogues/dialogues/*.ts` file directly.** Go through `loadDeckWords()` / `loadDialogue()`, where ids are resolved and validated and each file stays its own lazy chunk. The catalogs — ids, titles, counts, no content — are what's safe to import anywhere. Enforced by `npm run lint:js`.
- **A deck's `wordCount` and a dialogue's `lineCount` must match the content file.** Both are checked at load and throw on a mismatch. A deck's count is arithmetic, not decoration: the practice counts subtract progress rows from it, so a drifted number promises words that don't exist.
- **A word's `armenian` and `translation` are capitalized**, in both languages and including function words — capitals read differently enough that a learner still shaky on the alphabet gets practice just by browsing. Dialogue tokens are the exception: they keep the line's real casing and punctuation.
- **Inside a comment, examples are lowercase**, Armenian and translation alike: `e.g. բարի լույս — "good morning"`. Capitals are for a word standing on its own and for whatever opens a sentence, Armenian included.
- **Each language is written for its own reader**, never translated from the other, down to the construction: «-ի на слове տավար» is English grammar in Russian words, where Russian says «в конце слова» (`entries.ts` throws on that phrasing as a tripwire — read the Russian aloud before saving). A comment may be filled in one language alone when the fact is worth stating to one reader only.
- **One fact per sentence, about this word, in plain words** — not an etymology opening with a different word, not three facts stacked with dashes. `entries.ts` also throws on `+`/`→`/emoji, a lowercase Armenian opening, and a Latin letter inside a Cyrillic word.

The library is one module, not code-split: at low hundreds of entries it's a few KB gzipped, cheaper than the duplication a per-feature split reintroduced. Shard it behind `getWord()` if it ever grows enough to matter.

## 11. Every library word ships with a pronunciation audio file

Every `Word` has a clip at `static/audio/words/<wordId>.m4a` — the path [`wordAudioSrc()`](../src/lib/content/words/audio.ts) derives and `SpeakerButton.svelte` plays wherever the word appears. There is no missing-audio state: a word added without its clip fails silently on tap. Follow [VOCABULARY_AUDIO.md](VOCABULARY_AUDIO.md)'s checklist in the same change that adds the word.

Dialogue _lines_ are separate recordings at `static/audio/dialogues/<dialogueId>/<nn>.m4a` (see [DIALOGUES.md](DIALOGUES.md)). Until they exist the player treats each as a fixed-length silence, so the flow can be exercised end to end — a stopgap for content in progress, not a fallback.

## 12. English UI copy is British English

Colour, -ise, travelling/cancelled, licence (noun) / license (verb), grey, centre. A fixed house style, not a per-string call. Doesn't apply to identifiers, file names or third-party terms (`color-mix()`).

## 13. Every alphabet letter ships with a pronunciation audio file

Every `AlphabetLetter` has a clip at `static/audio/alphabet/<letterId>.m4a`, the path [`letterAudioSrc()`](../src/lib/content/alphabetAudio.ts) derives. Same no-fallback rule as §11; the words it references are covered there. [ALPHABET_AUDIO.md](ALPHABET_AUDIO.md) has the checklist and the two alphabet-specific decisions the vocabulary pipeline doesn't cover.
