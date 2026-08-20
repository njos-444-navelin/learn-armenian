# Design system

The visual language for this app: a warm, rounded, calm aesthetic — a cream
ground, a terracotta primary accent, a sage second accent, serif type
throughout. It started as an import of a Claude Design reference project
("Organic") and was substantially retuned from there through several rounds
of direct visual feedback; this doc captures where it landed and, more
importantly, *why* — several of the rules below only exist because an
earlier, more literal version of the design read wrong in practice. Treat
those the same as [`CONVENTIONS.md`](CONVENTIONS.md): load-bearing, not
stylistic preference.

[`src/lib/styles/tokens.css`](../src/lib/styles/tokens.css) is the single
source of truth for every value mentioned here — this doc explains the
reasoning; the file has the numbers. Convention #2 in
[`CONVENTIONS.md`](CONVENTIONS.md#2-no-hardcoded-colors) still applies: no
component hardcodes a color, ever.

## Color

### Ground, text, surface

`--color-background` (cream) is the page. `--color-surface` (a slightly
deeper sand) is the default fill for anything that reads as a distinct
block on that page — a card, a list row, a flashcard face, an icon badge
sitting on the page. `--color-text-primary` is near-black ink;
`--color-text-secondary` is a muted brown-grey for supporting text.

### Tonal ramps

Three 100–900 ramps — `--color-neutral-*`, `--color-accent-*` (terracotta),
`--color-accent-2-*` (sage) — generated on a shared perceptual lightness
scale, so step 500 of any ramp carries the same visual weight as step 500
of another. Use 100–300 for tinted fills, 500 as a role's base color, and
700–900 for text sitting on a tinted fill. Prefer a ramp step over an
ad-hoc `color-mix()` wherever one fits.

### Semantic tokens

`--color-primary` (terracotta, ramp step ~500) is the one primary action
color. `--color-secondary` is deliberately `transparent` — secondary
buttons are outlined on the ground, not filled with a second color; see
[`Button.svelte`](../src/lib/components/Button.svelte). `--color-error` and
the vocabulary trainer's `--color-grade-*` tokens are hand-picked rather
than literal ramp steps — see the comments directly above them in
`tokens.css` for why each one isn't just aliased to the nearest ramp step.

**Text on a filled accent background is dark ink, not white/cream.** The
terracotta-to-cream pair only reaches about 3:1 contrast — enough for icons
and large chrome, not for normal-size text (WCAG AA wants 4.5:1). Every
place text sits on a solid `--color-primary` fill (`Button`'s primary
variant, the `Ա` hero glyph, the letter-circle) uses
`--color-text-primary`/an ramp's 700–800 step instead, which reaches ~4.6:1
against the accent. Don't "fix" this by lightening the button text back to
white — that was tried and fails contrast.

### Hover state: darken the element's own color, don't jump to the neutral ramp

A card or button whose rest fill is `--color-surface` (or another warm
token) should darken *that same color* on hover, not switch to
`--color-neutral-200`. The neutral ramp reads as a genuinely different,
cooler/greyer hue sitting next to a warm surface tone, even though its hex
value is technically still warm-tinted — it looked like an unrelated "grey
hover" bolted onto a warm card. `--color-surface-hover` (a `color-mix()` of
`--color-surface` with a touch of `--color-neutral-900`) is the fix: same
hue family, just a shade deeper — the same relationship
`--color-primary-hover` already has to `--color-primary`. Used by the home
screen's language cards and the `/learn` hub cards; reach for the same
`color-mix()` pattern before adding a new `*-hover` token for any other
`--color-surface`-based element, rather than aliasing to a neutral step.

### Icon-badge circles inside a card: `--color-background`, not a neutral step

The small round badge that sits inside a `--color-surface` card — the
home screen's language-flag circle, the `/learn` hub cards' icon
circle — should fill with plain `--color-background` (the page's own
cream), the same lighter-than-`--color-surface` contrast used
everywhere a badge needs to read as a distinct layer on top of a card.
The language-flag circle briefly drifted to `--color-neutral-200`
instead — a different token that happens to sit close to
`--color-background` in hex but reads as a faint grey mismatch once
the two badge styles are seen side by side (one screen has flag
badges, the other has lesson-icon badges, and going back and forth
between them made the drift obvious even though neither one looked
wrong in isolation). If a future badge-in-a-card needs its own visual
treatment, start from `--color-background` and vary something other
than the base token — same principle as the hover rule above: don't
reach for a neutral ramp step just because its hex value happens to
look close enough.

### The `--color-primary` outline/border means "selected," not "hovered"

A 1.5px `--color-primary` border on an otherwise-transparent-bordered card
or row is reserved for marking the *currently selected* item — e.g. the
home screen's language picker, where the current-language card gets
`border-color: var(--color-primary)` (see `.lang-card.current` in
[`+page.svelte`](../src/routes/[lang=locale]/+page.svelte)). Hover must
never reuse that same border treatment, even on elements that have no
selected state at all — a hover outline reads as "this is the selected
one" the instant the cursor lands, which is misleading on a plain list
like the vocabulary deck list where nothing is selected yet. Hover gets
the `--color-surface-hover` background treatment from the rule above
instead. If a component needs both states (selectable *and* hoverable),
keep them on visually distinct properties — border for selected,
background for hover — so the two don't collide into the same signal.

### Don't pair accent and accent-2 as competing backgrounds

Terracotta and sage sitting as backgrounds *next to each other* — e.g. two
cards in a row, each with its own tinted fill — reads as a red/green
right-or-wrong signal even though neither color means that here. This
happened twice: the `/learn` hub cards (Alphabet in a terracotta tint,
Vocabulary in a sage tint, side by side) and the vocabulary deck list's
"added" state (a sage-tinted row background). Both were pulled back to the
plain `--color-surface` fill everyone else uses, with the accent color
demoted to a *small* element instead — an icon glyph, a pill badge — never
the dominant background of a card that sits next to a similarly-treated
sibling. If a new pair of side-by-side elements needs to be told apart by
color, reach for an icon or badge tint before a card-wide background tint.

### Reserve tinted backgrounds for small elements, not hero-sized ones

Related but distinct: even a *single* large area filled with a light
accent tint (not paired against anything) can read as an unintentional
"pink" or "off" wash once it's big enough — the home screen's `Ա` hero
mark and the alphabet quiz's big letter-circle both started on
`--color-accent-100` and were moved to plain `--color-surface`, with the
glyph itself carrying the accent color (`--color-accent-700/800`) instead
of the circle behind it. Small badges (the per-letter glyph pills in
`LetterList.svelte`) keep a light background tint fine, since a badge a
few characters wide doesn't dominate the page the way a hero circle or a
full-width card does — this is a matter of scale, not a blanket ban on
tinted backgrounds.

## Typography

`--font-heading` and `--font-family-body` both resolve to **Noto Serif**
paired with **Noto Serif Armenian** — literal companion faces from the
same coordinated Google Noto project, drawn together so Armenian script
sits naturally next to English/Russian instead of looking like an
unrelated font got bolted on for one script. One family serves every role;
heading vs. body is weight only (`--font-heading-weight: 700`, body
unset/regular). The browser resolves each character to the first font in
the stack that actually has a glyph for it, so this one stack quietly
covers all three of the app's languages with no `lang`-specific override
anywhere.

This wasn't the first pairing tried. The app went **Caprasimo/Figtree**
(the literal Organic reference fonts, Latin-only) → **Comfortaa/Nunito**
(genuinely bilingual EN/RU, verified against Google Fonts' own served
Cyrillic subsets) → **Noto Serif** (the current pairing). The
Comfortaa/Nunito step fixed the English/Russian mismatch but left a new
one: neither face covers Armenian, so Armenian text fell through to Noto
Serif Armenian regardless — a traditional book serif that looked nothing
like Comfortaa's rounded bubble display face once actually rendered,
most visible flipping the vocabulary flashcard (Armenian on the front,
English/Russian on the back, in two unrelated typefaces). Noto Serif
resolved that by being Armenian's own companion face, not just another
font that happens to also draw Cyrillic — **the lesson: when Armenian,
Russian, and English all need to look related, pick the Latin/Cyrillic
face by what it's designed to sit next to, not just by whether it
technically has the right glyphs.**

Also worth knowing: Comfortaa caps out at weight 700 on Google Fonts, so
an earlier version of this system used a synthetic `-webkit-text-stroke`
to fake a bolder heading weight. Noto Serif goes to a true 900 (Black), so
that hack is gone — don't reintroduce it if the type system changes again;
check the real weight range first.

## Shape

Controls (buttons, inputs, tags) use `--radius-pill` (a full 999px pill).
Cards and other containers use the over-rounded `--radius-lg`. Small
circular badges (icon buttons, glyph badges, the hero mark) are `50%`.
Nothing in this system has a sharp or barely-rounded corner — if a new
element needs *some* rounding but doesn't fit the pill/card categories
above, `--radius-md`/`--radius-sm` exist for that, but pill/lg should be
the first instinct.

## Icons

Inline SVGs, stroke-based, `stroke-width="2.75"` — round, chunky strokes
rather than thin default ones (`stroke-linecap="round"`,
`stroke-linejoin="round"`). For an icon with a filled shape (e.g. the
speaker cone in [`SpeakerButton.svelte`](../src/lib/components/SpeakerButton.svelte)),
the fill carries the visual weight and the stroke is just a thin join
smoother (~1.5), not the full 2.75 — that's only for genuinely
stroke-only paths (the speaker's sound-wave arcs, the chevron in
`BackButton.svelte`).

**Icon buttons are flat: a `--color-surface` fill, no border, no
shadow.** The earlier version had a `--color-background`-filled circle
with a `1px` border and `--shadow-sm` — visually redundant once the fill
itself was changed to the *contrasting* `--color-surface` tone, since
surface-vs-background is already enough tonal difference to read as a
distinct button without needing an edge or elevation to fake it. See
[`TopBubbleLink.svelte`](../src/lib/components/TopBubbleLink.svelte) (the
back/account bubbles). If a future icon button still looks like it's
floating unclearly against its background, fix that with a stronger fill
tone first, not by adding the border/shadow back.

**The `/learn` hub menu icons are a matched set.** They sit side by side
in the same list, so any mismatch between them (a heavier stroke, a
filled shape, a different viewBox) reads immediately, unlike two icons
used in unrelated parts of the app. Every hub icon — the alphabet-trainer
Ա glyph, the vocabulary-trainer deck-of-cards, the dialogues speech-bubble
(currently a disabled placeholder — see below), and any future addition —
uses the same 24×24 viewBox, `stroke-width="2.75"`, round caps/joins, and
no fill, per the site-wide rule above. Icon identity follows the *feature*,
not the menu slot: when dialogues borrowed the speech-bubble that
vocabulary used to have, vocabulary got a new deck-of-cards-with-a-word
icon rather than the two swapping meanings some other way. The Ա glyph
itself is hand-traced from the printed letter,
not a generic "U" — see
[`+page.svelte`](../src/routes/[lang=locale]/learn/+page.svelte): a
symmetric U-bowl for the main body, plus a separate short hook stroke
for the small flourish the real glyph has branching off the right
stem. Two things went wrong on the way to the current path data, both
worth knowing if this icon is ever redrawn:

- **Reference against a sans-serif face, not a serif one.** Noto Serif
  Armenian's flourish carries extra serif-style shaping that isn't
  structural to the letter — it exaggerates exactly the part being
  hand-traced. Noto Sans Armenian's monoline-ish strokes are much
  closer to what a 2.75-stroke icon should mimic.
- **Measure the reference, don't eyeball it.** Even against the sans
  face, eyeballing a screenshot placed the hook's branch point around
  52% of the letter's height — visibly too high, producing a long
  droopy tail. Sampling actual pixels (render the glyph to a `<canvas>`
  at a large size, scan rows for where the hook's ink first separates
  from the main stem) found the real branch point at ~67% — right
  where the straight stem ends and the bowl curve begins, not partway
  up — with the hook's descender ending almost level with the bowl's
  own bottom. The current path (branch ~y 13.5 of an 18.5-tall glyph,
  ending ~y 18.2) reflects the measured version, not the eyeballed
  one.

## Motion

- **Hover/interactive-state transitions**: `--transition-fast` (150ms
  `ease`), applied to whatever property actually changes (`background-color`,
  `border-color`, ...). Every custom interactive element needs an explicit
  `transition` — it is not inherited from anywhere, and a bubble button once
  shipped with a hover color change but no `transition` at all, which read as
  an abrupt flicker instead of a hover.
- **Primary button hover/press physicality**: at rest the primary button
  carries `--shadow-sm`; hovering raises it to `--shadow-md` with a
  `translateY(-2px)` lift, and pressing settles it back to `--shadow-sm`
  with no offset — a deliberate "you're about to commit to something"
  weight that the secondary/success/error variants don't get (see
  [`Button.svelte`](../src/lib/components/Button.svelte)). Disabled drops
  the shadow and transform entirely, and `prefers-reduced-motion` keeps the
  shadow change but drops the transform. The lift alone caused a real bug:
  a cursor approaching the button from below could cross the original
  bottom edge, trigger `:hover`, watch the button rise out from under it,
  lose `:hover`, and repeat — flickering in place. Fixed with an invisible
  `::after` strip a few pixels taller than the lift distance, positioned
  just below the button, so the hoverable area still covers wherever the
  cursor landed even after the button moves. Any future hover-triggered
  `transform` needs the same buffer, not just a smaller transform distance.
- **Page-to-page transitions**: a native browser View Transition
  (`document.startViewTransition`, wired up in the root
  [`+layout.svelte`](../src/routes/+layout.svelte) via SvelteKit's
  `onNavigate`), cross-fading the whole page at 185ms (the browser's own
  250ms default, tuned faster — see the comment in
  [`app.css`](../src/app.css)). Feature-detected (`if
  (!document.startViewTransition) return`) and skipped outright under
  `prefers-reduced-motion` — that check has to be explicit in the JS, since
  `::view-transition-*` pseudo-elements live outside the regular DOM tree
  and aren't reached by `app.css`'s blanket `*, *::before, *::after`
  reduced-motion rule.
- **Navigation loading bar**
  ([`NavigationProgress.svelte`](../src/lib/components/NavigationProgress.svelte)):
  a thin terracotta bar at the top of the page, driven by SvelteKit's
  `navigating` state from `$app/state`. It does **not** appear the instant
  a navigation starts — it waits 150ms first, and only then fills toward
  ~82% over a slow 4s ease-out (a "trickle," since there's no real progress
  percentage to report). This delay matters: most navigations in this app
  (hover-preloaded links, already-cached routes) resolve well under
  150ms, and a bar that flashes on for every single click reads as noise,
  not progress — this was a real reported issue (rapidly toggling the
  language links on the home screen flashed the bar on every click) before
  the delay was added. On completion the bar snaps to 100% quickly, holds
  briefly, then fades out and resets. If the delay is ever removed "to make
  it feel more responsive," that regression will come back.

## Where things live

| What | File |
| --- | --- |
| Every design token | [`src/lib/styles/tokens.css`](../src/lib/styles/tokens.css) |
| Global element defaults (`body`, headings, links, view-transition timing, reduced-motion) | [`src/app.css`](../src/app.css) |
| Buttons | [`src/lib/components/Button.svelte`](../src/lib/components/Button.svelte) |
| Top-of-screen icon buttons (back, account) | [`src/lib/components/TopBubbleLink.svelte`](../src/lib/components/TopBubbleLink.svelte) |
| Brand mark (the 3-stripe flag glyph) | [`src/lib/components/Flagmark.svelte`](../src/lib/components/Flagmark.svelte) |
| Page-to-page transition wiring | [`src/routes/+layout.svelte`](../src/routes/+layout.svelte) |
| Navigation loading bar | [`src/lib/components/NavigationProgress.svelte`](../src/lib/components/NavigationProgress.svelte) |
