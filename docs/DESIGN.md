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
[`Button.svelte`](../src/lib/components/Button.svelte). The one exception
is `Button`'s `opaque` prop, for a secondary button sitting in a fixed
element over scrollable content (see the alphabet trainer's floating
footer buttons in [`docs/ALPHABET_TRAINER.md`](ALPHABET_TRAINER.md#the-floating-footer-buttons-three-extracted-to-button-three-kept-bespoke))
— there, letting the background show through defeats the whole point of
the button being fixed in the first place, so it swaps in
`--color-background` instead. `--color-error` and
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

### The neutral ramp reads cool — reserve it for an actual neutral/informational meaning, not as a default fill

Same underlying fact as the hover-state note above (the neutral ramp reads
as a distinct, cooler/greyer hue next to this app's warm palette, whatever
its raw hex value technically is), generalized beyond hover: **don't reach
for `--color-neutral-*` as the default/idle fill for something just because
nothing else was specified.** It's correct where the *meaning* is genuinely
neutral or informational and a warm tone would misrepresent that — e.g.
`--color-toast-info`'s neutral-800 fill, where "info" is deliberately not
success (sage) or error (the hand-picked red) and shouldn't borrow either's
color language. It reads wrong as the resting/default state of something
that has no particular meaning yet, which is a different case: the alphabet
trainer's letter grid originally filled an unmet ("level 0") tile with
`--color-neutral-200` and it read as an odd cool-grey wash sitting among the
sage-tinted tiles of letters in progress. The fix was `--color-neutral-100`
instead — close enough to `--color-background` itself to read as "blank
page showing through," not as a competing hue — which is the general
pattern to reach for: **a "nothing to show yet" state wants something close
to the page's own ground, not a step off the neutral ramp**, even a light
one. Reserve the neutral ramp itself for spots where cool/grey is actually
the right signal.

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
mark and the alphabet trainer's learn-step letter-circle both use plain
`--color-surface`, with the glyph itself carrying the accent color
(`--color-accent-700/800`) instead of the circle behind it. Small badges
(the per-letter glyph pills a word card's speaker row sits in) keep a
light background tint fine, since a badge a few characters wide doesn't
dominate the page the way a hero circle or a full-width card does — this
is a matter of scale, not a blanket ban on tinted backgrounds.

The alphabet trainer's 39-tile letter grid (`AlphabetLetterGrid.svelte`)
looks like it should collide with this rule — collectively the tiles cover
most of the screen — but each tile is individually small (the same
scale as a glyph pill), and a *new* learner's grid reads as mostly the
flat neutral "not met yet" tone rather than a tinted wash, since the sage
mastery tint only fills in gradually per tile as levels rise. Many small
elements sitting side by side read differently from one large tinted
area; this rule is about the latter.

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

### Form controls don't inherit type by default — that's a global reset, not a per-button fix

`button`/`input`/`select`/`textarea` don't inherit `font-family` (or
`color`) from their ancestors in any browser's default stylesheet — left
alone, they render in the OS's own UI font instead of Noto Serif, which
reads as a generic, out-of-place control against the rest of the page.
[`app.css`](../src/app.css) fixes this once, globally
(`button, input, select, textarea { font: inherit; color: inherit; }`),
rather than leaving every component to redeclare `font-family` itself —
that per-component approach is what most buttons in this codebase
actually do anyway (`Button.svelte`, `.next`, `.mute`, ...), and it's
fragile by construction: it silently works until exactly one button
forgets to, which is precisely how the alphabet drill's answer options
shipped with the browser's default sans-serif instead of the app's own
serif for a while. The individual `font-family` declarations elsewhere
weren't removed after this reset landed — they're redundant now, not
wrong — but any *new* interactive control no longer needs one to look
right.

## Shape

Controls (buttons, inputs, tags) use `--radius-pill` (a full 999px pill).
Cards and other containers use the over-rounded `--radius-lg`. Small
circular badges (icon buttons, glyph badges, the hero mark) are `50%`.
Nothing in this system has a sharp or barely-rounded corner — if a new
element needs *some* rounding but doesn't fit the pill/card categories
above, `--radius-md`/`--radius-sm` exist for that, but pill/lg should be
the first instinct.

### Padding must clear the corner radius, not just look "roomy enough"

A large radius carves a real bite out of each corner — content padded less
than that radius sits visually *inside* the curve instead of clear of it,
which reads as content "starting before the border-radius ends," not as a
tight/efficient layout. This is easy to miss because it only becomes
obvious once there's content anchored to an edge near a corner (left-aligned
text, a badge) — a short, centered single line in the same box can look
fine at the identical padding, which is why this slips through: the same
component can look right in one spot and wrong in another depending purely
on what content ends up flush against which edge.

Concretely:
- **A rounded rectangle** (`--radius-lg`, 28px): padding should be at or near
  the radius itself, not a fraction of it. `--space-5` (26.4px) is the
  practical match for `--radius-lg` at this scale — several cards across the
  alphabet trainer (`AlphabetLetterSheet.svelte`/`AlphabetLearnStep.svelte`'s
  `.word-card`) originally used `--space-3` (13.2px, under half the radius)
  and visibly pinched their left-aligned content into the corner curve; the
  fix was raising padding to `--space-5`, not touching the radius.
- **A pill** (`--radius-pill`, fully rounded — cap radius = half the
  element's height): the *horizontal* padding needs to clear that cap
  radius, which scales with height, not with the pill's own font size. A
  short single-line pill button can look fine on modest padding; a *taller*
  pill (two-line label, larger content) needs proportionally more —
  `AlphabetTrainer.svelte`'s `Practice` button is a two-line pill roughly
  70px tall, so its ~36px cap radius needed `--space-6` (35.2px) horizontal
  padding, not the `--space-4` (17.6px) that a single-line pill button gets
  away with. Vertical padding on a pill isn't under the same constraint —
  the top/bottom edges between the two caps are flat, not curved.
- When in doubt, sanity-check against the radius value itself rather than
  reusing whatever spacing token a nearby element happens to use — two
  elements with the same padding token can need different actual clearance
  if their radius or their content's alignment differs.

## Icons

Inline SVGs, stroke-based, `stroke-width="2.75"` — round, chunky strokes
rather than thin default ones (`stroke-linecap="round"`,
`stroke-linejoin="round"`). For an icon with a filled shape (e.g. the
speaker cone in [`SpeakerButton.svelte`](../src/lib/components/SpeakerButton.svelte)),
the fill carries the visual weight and the stroke is just a thin join
smoother (~1.5), not the full 2.75 — that's only for genuinely
stroke-only paths (the speaker's sound-wave arcs, the chevron in
`BackButton.svelte`).

**Icon provenance is mixed — verify against the real path data before
assuming an icon is "Lucide," this codebase has no such dependency.**
The Claude Design "Organic" reference project (not this repo) documents
its icon set as Lucide, which raised the question of whether this app's
own hand-authored SVGs actually trace back to it. Checked against
Lucide's published paths directly:
[`BackButton.svelte`](../src/lib/components/BackButton.svelte)'s
chevron (`m15 18-6-6 6-6`) is a byte-for-byte match to Lucide's
`chevron-left`. [`UserMenu.svelte`](../src/lib/components/UserMenu.svelte)'s
signed-in icon reuses Lucide's `circle-user` circles exactly
(`cx="12" cy="12" r="10"` / `cx="12" cy="10" r="3"`) but redraws the
shoulders as a plain arc instead of Lucide's boxier shoulder path.
The signed-out door-and-arrow icon isn't a Lucide icon at all — it's a
custom glyph in the spirit of Lucide's `log-in`/`log-out` pair
(mirrored door, arrow through it), with none of the actual coordinates
or corner radii copied. Don't assume any other icon in this app can be
swapped for its "equivalent" Lucide glyph without a visual diff — some
paths here are literal Lucide, some are Lucide-inspired hand-drawings,
and there's no dependency or build step that would keep the two in
sync if Lucide's own paths change.

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

**A primary (`--color-primary`-filled) button that navigates to a new
screen or flow gets a trailing arrow, not a chevron-in-a-circle.** A full
arrow (shaft + head — Lucide's `arrow-right`: `M5 12h14` plus
`m12 5 7 7-7 7`) reads as "go" more directly than a bare chevron
(`m9 18 6-6-6-6`, a `›` shape with no shaft), and the circular tinted
backing a chevron often sits in doesn't add anything once the arrow
itself already carries the meaning — drop it, let the arrow sit directly
on the button's own fill. See the alphabet trainer's `Practice` button
(`AlphabetTrainer.svelte`) for the current example. This is specifically
about *navigational* primary buttons — one that submits a form or confirms
an in-place action doesn't need a directional affordance at all, since it
isn't taking the learner anywhere.

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
- **A two-way crossfade inside a vertically-centered flex column shifts the
  page.** [`AlphabetTrainer.svelte`](../src/lib/components/AlphabetTrainer.svelte)
  fades between its four screens (`home`/`learn`/`drill`/`summary`) as they
  swap inside an `{#if}/{:else if}` chain. A true two-way `transition:fade`
  keeps the outgoing screen mid-fade-out *and* the incoming screen
  mid-fade-in simultaneously in the DOM — briefly doubling the flex
  column's height and visibly nudging everything else in the centered
  layout. Using `in:fade` only (no `out:`) removes the outgoing screen
  instantly instead, so only one `.screen` element ever exists at a time —
  confirmed via a `MutationObserver` count during the swap. If a future
  screen-swap transition needs a genuine crossfade (both screens visible
  together on purpose), it has to happen outside the page's normal
  document flow (e.g. absolutely positioned during the transition only),
  not inside a plain centered flex column.
- **A conditionally-taller footer shifts everything above it, even when
  it's fixed-position.** `AlphabetDrillQuestion.svelte`'s answer footer
  reveals a feedback card only after an option is picked — sizing the
  footer to its shortest state's height meant the reveal changed the
  footer's actual height, and since the screen's content centers in
  whatever space is left above it, that shift moved the glyph and options
  above it too, not just the footer itself. Reserve height for the
  *tallest* state a fixed/sticky footer can show, not its default one —
  here that meant measuring the tallest real case (two-line feedback text,
  a button, and the card's own padding) and setting `min-height: 8.25rem`
  on the outer `.footer` up front, unconditionally, regardless of which of
  the four states (nothing yet, a bare button, or the card) is actually
  showing — so a state change fills existing space instead of growing
  into it. The reserved height living on a *different* element than the
  one that visually changes size (`.footer`, not `.footer-card`) is
  deliberate: it's what let the card itself skip rendering entirely for
  the "nothing to show yet" state without that also being a footer-height
  change — see "Fixed floating elements" in [`ALPHABET_TRAINER.md`](ALPHABET_TRAINER.md)
  for the fuller story, including a real bug where the card rendered
  empty for a state that had nothing to put in it.
- **A fixed element's own box can block clicks even where it has nothing
  visible.** [`FloatingActionBar.svelte`](../src/lib/components/FloatingActionBar.svelte)'s
  `.bar` is `position: fixed`, sized to its tallest possible content (see
  the point above) — so on a shorter viewport, or whenever its actual
  content is smaller than that reserved box (a single small centered
  button, or nothing at all), the *empty* margin within that box still
  sat on top of and intercepted clicks meant for whatever was genuinely
  visible underneath it (the alphabet drill's options grid, in the bug
  that surfaced this). Fixed once, generally, rather than per-caller:
  `.bar` itself is `pointer-events: none`, and only real
  `button`/`a`/`form` descendants get `pointer-events: auto` back. Any
  future child of this component just needs to be a real interactive
  element to work correctly — nothing extra to opt into.
- **Prefer a plain CSS `animation` + `@keyframes` over a `svelte/transition`
  directive for anything that must self-verify.** [`Toast.svelte`](../src/lib/components/Toast.svelte)
  switched from `svelte/transition`'s `fly`/`fade` to `animation:
  toast-in`/`.closing { animation: toast-out }` with an `animationend`
  listener driving actual removal (see
  [`toasts.svelte.ts`](../src/lib/stores/toasts.svelte.ts)'s `closing`
  flag). This wasn't a performance call — a CSS animation is directly
  observable (computed style, `getAnimations()`, `animationend`) in a way
  that made a real, reproducible bug trivial to pin down after a `fly`
  transition intermittently appeared not to run at all. `.closing`
  overrides the entrance animation by naming a different `animation`
  rather than layering a second one, and `prefers-reduced-motion` has to
  short-circuit removal in JS (`dismissToast()`), not just disable the
  animation in CSS — otherwise a toast whose `animation: none` never fires
  `animationend` would sit on screen forever waiting for an event that's
  never coming.
- **New UI that appears in response to something the learner just did
  fades in — it doesn't just pop into existence.** An abrupt appearance
  reads as a flash/glitch even when it's fully intentional, and it's easy
  to miss during development precisely because it renders correctly, just
  too abruptly to register as deliberate. `AlphabetDrillQuestion.svelte`'s
  `.footer-card` — the feedback text and Next/Mute button(s) that appear
  the instant an option is picked — uses `in:fade` (entrance only, same
  reasoning as the screen-crossfade entry above) with the same
  reduced-motion-aware duration pattern as `AlphabetTrainer.svelte`'s own
  screen fade. Reach for this by default for anything conditionally
  rendered in direct response to a click, not just this one case.

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
