# Design system

A warm, rounded, calm aesthetic: cream ground, terracotta primary, sage second accent, serif type throughout. Started from the "Organic" Claude Design reference and was retuned from there. The rules below are load-bearing — several exist because a more literal version of the design read wrong in practice.

[`tokens.css`](../src/lib/styles/tokens.css) holds every value; this doc says how to choose between them. No component hardcodes a colour ([Conventions §2](CONVENTIONS.md#2-no-hardcoded-colors)).

## Color

`--color-background` (cream) is the page. `--color-surface` (deeper sand) fills anything that reads as a distinct block on it. `--color-text-primary` is near-black ink, `--color-text-secondary` a muted brown-grey.

Three 100–900 ramps — neutral, accent (terracotta), accent-2 (sage) — share a perceptual lightness scale, so step 500 of one weighs the same as step 500 of another. 100–300 for tinted fills, 500 for a role's base, 700–900 for text on a tinted fill. Prefer a ramp step to an ad-hoc `color-mix()`.

`--color-primary` is the one primary action colour. `--color-secondary` is `transparent`: secondary buttons are outlined on the ground, not filled. The exception is `Button`'s `opaque` prop, for a secondary button in a fixed element over scrollable content, where showing the content through defeats the point. `--color-error` and the `--color-grade-*` tokens are hand-picked rather than ramp steps — `tokens.css` says why per token.

**Text on a filled accent is dark ink, never cream.** Terracotta-to-cream reaches only ~3:1 — fine for icons and large chrome, under AA for body text. Use `--color-text-primary` or a 700–800 ramp step (~4.6:1). Lightening the label back to white was tried and fails contrast.

### Hover darkens the element's own colour

A `--color-surface` element darkens that same colour on hover (`--color-surface-hover`, a `color-mix()` toward `--color-neutral-900`), the relationship `--color-primary-hover` already has to `--color-primary`. Don't switch to `--color-neutral-200`: the neutral ramp reads as a cooler, greyer hue beside a warm surface, so it looks like a grey hover bolted onto a warm card.

### The neutral ramp reads cool — reserve it for neutral meaning

Same fact, generalized: don't use `--color-neutral-*` as a default fill just because nothing else was specified. It's right where the _meaning_ is neutral or informational and a warm tone would misrepresent it (`--color-toast-info`). It's wrong as a resting state — the letter grid's unmet tiles read as a cool grey wash among sage tiles until they became `--color-neutral-100`, close enough to the page's own ground to read as blank. **A "nothing yet" state wants the page's ground, not a step off the neutral ramp.**

### Icon-badge circles inside a card: `--color-background`

A round badge inside a `--color-surface` card fills with the page's own cream — the lighter-than-surface contrast that makes a badge read as a layer on top. `--color-neutral-200` sits close in hex but reads as a faint grey mismatch once two badge styles are seen in sequence. A badge needing its own treatment starts from `--color-background` and varies something other than the base token.

Exception: [`VocabularyDeckIcon.svelte`](../src/lib/components/VocabularyDeckIcon.svelte)'s fill _is_ the meaning — solid terracotta with a cream glyph for a deck in the collection, warm sand for one not added. That's the small-element tint allowance below, applied to a badge that carries state.

### A `--color-primary` border means "selected", not "hovered"

A 1.5px primary border marks the currently selected item (the language picker's current card, a dialogue's playing line). Hover must never reuse it, even where nothing is selectable — it reads as "this is the selected one" the moment the cursor lands. Hover gets the surface-hover background instead. A component with both states keeps them on distinct properties: border for selected, background for hover.

### Tinted backgrounds are for small elements

- **Don't pair accent and accent-2 as competing backgrounds.** Terracotta and sage side by side read as a right/wrong signal. This happened twice (the `/learn` hub cards, the deck list's "added" row); both went back to plain `--color-surface` with the accent demoted to an icon or badge. To tell side-by-side elements apart by colour, tint a small element, not the card.
- **Even a single large tinted area reads as an "off" wash.** The `Ա` hero mark and the learn-step letter circle use plain `--color-surface` with the glyph carrying the accent. Small badges keep a light tint fine — it's scale, not a ban.
- Chat bubbles are the one bubble-sized tint: `--color-accent-100` for the "own side" of the conversation, plain surface for the other. A chat needs its two parties told apart, a bubble is still small, and the two fills are surface-vs-tint rather than two competing accents.
- The 39-tile letter grid isn't an exception: each tile is glyph-pill sized, and many small tinted elements read differently from one large tinted area.

## Typography

Both font roles resolve to **Noto Serif** with **Noto Serif Armenian**, companion faces from the same Noto project, so Armenian sits naturally beside English and Russian. One family, one stack for all three languages; heading vs body is weight only.

Two things worth keeping:

- **Pick the Latin/Cyrillic face by what it's designed to sit next to, not by whether it has the right glyphs.** Comfortaa/Nunito covered EN/RU but not Armenian, which fell through to Noto Serif Armenian — a book serif beside a rounded display face, most visible flipping a flashcard between the two.
- Noto Serif reaches a true 900, so the synthetic `-webkit-text-stroke` that faked a bolder heading under Comfortaa's 700 cap is gone. Check a face's real weight range before reintroducing anything like it.

### A word card's note is set apart and a step smaller, never paler

The word and its translation are the pair that must pop, both in `--color-text-primary`. The comments under them are for the curious: `--space-2` away, `--font-size-xs` (13px, the only role that size exists for), tighter leading. The demotion is size and spacing only — the ink stays `--color-text-secondary`, because the next lighter step reaches ~3.4:1 on surface, under the 4.5:1 text needs.

### Form controls don't inherit type — that's a global reset

`button`/`input`/`select`/`textarea` inherit neither `font-family` nor `color` from any browser's default stylesheet. [`app.css`](../src/app.css) fixes it once globally. Per-component `font-family` is fragile by construction: it works until one control forgets, which is how the drill's answer options shipped in the browser's default sans-serif.

## Shape

Controls use `--radius-pill`; cards use `--radius-lg`; small circular badges use `50%`. Nothing here has a sharp corner — `--radius-md`/`-sm` exist for an element that fits neither category, but pill and lg are the first instinct.

### Padding must clear the corner radius

A large radius carves a real bite out of each corner: content padded less than the radius sits inside the curve. It's easy to miss, because a short centred line looks fine at a padding that visibly pinches left-aligned text or a badge.

- **A rounded rectangle** wants padding at or near the radius itself, not a fraction of it — `--space-5` (26.4px) for `--radius-lg` (28px).
- **A pill**'s horizontal padding must clear the cap radius, which is half the element's _height_, not a function of its font size. A two-line pill ~70px tall needs `--space-6`, where a single-line one gets away with `--space-4`. Vertical padding isn't constrained — the edges between the caps are flat.
- Check against the radius value, not against whatever token a neighbour uses.

## Icons

Inline SVGs, stroke-based, `stroke-width="2.75"`, round caps and joins. Where a shape is filled (the speaker cone) the fill carries the weight and the stroke drops to ~1.5; 2.75 is for genuinely stroke-only paths.

**Icon provenance is mixed — diff against the real path data before assuming an icon is Lucide; there's no such dependency here.** `BackButton`'s chevron is a byte-for-byte Lucide `chevron-left`. `UserMenu`'s signed-in icon reuses Lucide's `circle-user` circles but redraws the shoulders. The signed-out door-and-arrow is a custom glyph in Lucide's spirit. Nothing keeps these in sync if Lucide's paths change.

**Icon buttons are flat:** a `--color-surface` fill, no border, no shadow. Surface-vs-background is already enough tonal difference. If one looks like it's floating unclearly, strengthen the fill rather than adding an edge back.

**The `/learn` hub icons are a matched set** — same 24×24 viewBox, stroke width, caps and joins, no fill — because they sit side by side, where any mismatch reads immediately. Icon identity follows the _feature_, not the menu slot: when dialogues took the speech bubble, vocabulary got a new deck-of-cards icon rather than the two swapping meanings.

The `Ա` glyph is hand-traced from the printed letter. If it's ever redrawn: reference a **sans** face (Noto Sans Armenian), since the serif's flourish shaping isn't structural to the letter; and **measure rather than eyeball** — rendering the glyph to a canvas and scanning rows put the hook's branch point at ~67% of the letter's height, where eyeballing had put it at ~52%, which gave it a long droopy tail.

**Vocabulary deck icons follow the topic, not a matched-set rule** — a hand for Greetings, a bolt for verbs — because a growing catalog needs each deck recognizable at a glance. Same viewBox and stroke width as everywhere else; extend `VocabularyDeckIconId` and the component's lookup rather than reusing an unrelated deck's glyph.

**The two dialogue characters are a matched pair of drawn faces**, both on the same 40×40 canvas with the same shoulders path, coloured from the ramps. Photos of the real people were tried first and read as a different, heavier kind of image than anything else here.

**A leading icon goes through `Button`'s `icon` prop**, carries no `width`/`height`, and is replaced in place by the spinner while loading — see [`Button.svelte`](../src/lib/components/Button.svelte). An icon earns its place by findability: the account page's "Sign out" is the one action in that list that ends the session.

**A primary button that navigates gets a trailing arrow, not a chevron.** A full arrow (shaft + head) reads as "go"; a bare chevron needs a tinted circular backing to carry the same meaning, which the arrow makes unnecessary. This is for navigational primaries only — one that submits a form isn't taking the learner anywhere.

**The account dashboard's progress tiles are a horizontal, snapping row**, not a wrapping grid: same tile shape on every screen, bleeding to the page's edges so a part-visible tile is the cue that there's more. The scrollbar is hidden and the cue is an edge fade set from the live scroll position by [`scrollEdgeCues`](../src/lib/actions/scrollEdgeCues.ts) — a fade rather than a cut, so it still reads when the row is only slightly too wide. An `auto-fit` grid worked at two tiles and became an odd 2+1 wrap at three.

**An action button overlaid on a card link is absolutely positioned, not a flex sibling.** The two must be DOM siblings (a `<button>` can't nest in an `<a>`), and flexing them made the row's height follow the taller box — which on a narrow phone read as the small button squashing the card. Overlaying removes the comparison; the card's right padding keeps text from running under it.

## Layering

Every `z-index` comes from one scale in `tokens.css`, never a bare number:

| token              | value | what sits there                   |
| ------------------ | ----- | --------------------------------- |
| `--z-floating-bar` | 10    | the fixed action bar              |
| `--z-popover`      | 15    | transient UI the user just opened |
| `--z-bubble-link`  | 20    | the corner bubble links           |
| `--z-toast`        | 50    | toasts                            |
| `--z-page-top`     | 100   | skip link, navigation progress    |

Native `<dialog>` modals sit in the browser's top layer and need no entry. The order encodes one decision: something just opened outranks persistent chrome, and both sit under notifications. The scale exists because the popover (8) and the bar (10) were numbered independently in different files, so a popover on a dialogue's last lines drew underneath the bar.

## Motion

- **Hover transitions** use `--transition-fast` (150ms) on whatever property changes. Every custom interactive element needs its own explicit `transition`; it isn't inherited, and a hover colour change without one reads as a flicker.
- **Focus rings are never animated** — [Conventions §14](CONVENTIONS.md#14-focus-rings-are-never-animated--no-transition-on-outlineoutline-color).
- **Every modal fades and pops, in and out**, enforced inside [`Modal.svelte`](../src/lib/components/Modal.svelte) so a caller can't opt out. Reduced motion keeps the fade and drops the movement.
- **Primary button physicality**: `--shadow-sm` at rest, `--shadow-md` plus a 2px lift on hover, back to rest on press. Another variant opts in with `lift` when it _is_ the screen's commit action. Disabled drops both; reduced motion keeps the shadow, drops the transform. The lift needs its invisible `::after` strip below the button: without it a cursor approaching from below triggers hover, watches the button rise away, loses hover, and flickers. Any future hover-triggered `transform` needs the same buffer.
- **One call to action per screen pulses, through one component** — [`PulseCta.svelte`](../src/lib/components/PulseCta.svelte), a full-width primary pill in a `<FloatingActionBar bare>`, whose own pill and shadow are the container (a second visible box around it read as a button in a tray). It pings once rather than throbbing, and stops under reduced motion and while busy, where the spinner is the signal and a pulse on an untappable control is a lie.
- **Page-to-page transitions** are a native View Transition wired through `onNavigate`, cross-fading at 185ms. Feature-detected, and skipped under reduced motion by an explicit JS check — `::view-transition-*` pseudo-elements sit outside the DOM tree, so `app.css`'s blanket reduced-motion rule can't reach them.
- **The navigation loading bar waits before showing anything**, because most navigations here resolve inside that delay and a bar that flashes on every click reads as noise. The timings and the trickle are in [`NavigationProgress.svelte`](../src/lib/components/NavigationProgress.svelte).
- **The bar is a pixel ornament in the flag's colours**, a 12px band of 4px cells drawn as a repeating SVG pattern anchored at the left edge, so the tip advances over a fixed design. The grid is drawn in a comment in [`NavigationProgress.svelte`](../src/lib/components/NavigationProgress.svelte) and the rects are generated from it — edit the grid first. Two load-bearing parts: the **field is `--color-primary` because that's the PWA's `theme_color`**, so on an Android install the band reads as the status bar continuing into the page — any other field colour draws a clashing seam right under it; and the **flag's red and blue are fixed tokens**, muted for the warm palette, deliberately not ramp steps, shared with [`Flagmark.svelte`](../src/lib/components/Flagmark.svelte). 12px is what makes a pattern legible at all; 3px can't hold one.
- **A two-way crossfade inside a centred flex column shifts the page.** Both screens are briefly in the DOM, doubling the column's height. Use `in:` only, so the outgoing screen is removed instantly. A genuine crossfade has to happen out of normal flow.
- **A clip box for a slide-in must reveal the distance travelled**, and the _page_, not a tight local clip, should be what prevents overflow. The flashcard's entrance was invisible for most of its 380ms because `.card-clip` was sized for the resting shadow. PageShell's `<main>` now clips at the viewport edge, so a local clip can be sized generously for the animation. Verify this kind of thing with a real mid-transition screenshot: JS frame sampling of the transform repeatedly misreported it as stuck.
- **An absolutely positioned child resolves `inset` against its nearest positioned ancestor**, which may not be the box it conceptually fills — so a clip box and the element inside it have to mirror each other's insets on every side, not just the one being changed.
- **Reserve a fixed footer's height for its tallest state.** Sizing `AlphabetDrillQuestion`'s footer to its shortest state meant revealing the feedback card changed the footer's height, which moved the centred content above it too. The reserved height lives on `.footer`, not on the card that changes size, so the card can skip rendering entirely for a state with nothing to show.
- **A fixed element's empty box still blocks clicks.** [`FloatingActionBar`](../src/lib/components/FloatingActionBar.svelte)'s `.bar` is `pointer-events: none`, with real `button`/`a`/`form` descendants getting it back. Fixed once, generally: any future child just needs to be a real interactive element.
- **Prefer a CSS `animation` to a Svelte transition for anything that must self-verify.** [`Toast.svelte`](../src/lib/components/Toast.svelte) moved to keyframes with an `animationend` listener driving removal, because a CSS animation is directly observable (computed style, `getAnimations()`) where an intermittently-not-running `fly` was not. Reduced motion must short-circuit removal in JS: an animation set to `none` never fires `animationend`, so the toast would wait forever.
- **An expanding section animates height natively** — `interpolate-size: allow-keywords` plus `transition: height`, not a measured pixel height. The body stays in the DOM and toggles a class (plus `inert`), since an element Svelte removes can't animate closed. Browsers without `interpolate-size` snap the height and keep the fade; don't add a JS measurement path for them.
- **Anything that fades in should fade out**, which a conditionally rendered element needs a transition directive for, not a CSS animation — an element in an `{#if}` is gone the moment its condition flips. (The Toast preference above still stands where removal is self-verified.)
- **New UI that appears in response to a tap fades in.** An abrupt appearance reads as a glitch even when intentional, and it's easy to miss in development because it renders correctly, just too fast to register as deliberate.

## Where things live

| What                                                            | File                                                                           |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Every design token                                              | [`tokens.css`](../src/lib/styles/tokens.css)                                   |
| Global element defaults, view-transition timing, reduced motion | [`app.css`](../src/app.css)                                                    |
| Buttons                                                         | [`Button.svelte`](../src/lib/components/Button.svelte)                         |
| The pulsing call-to-action pill                                 | [`PulseCta.svelte`](../src/lib/components/PulseCta.svelte)                     |
| Top-of-screen icon buttons                                      | [`TopBubbleLink.svelte`](../src/lib/components/TopBubbleLink.svelte)           |
| Brand mark                                                      | [`Flagmark.svelte`](../src/lib/components/Flagmark.svelte)                     |
| Page transition wiring                                          | [`+layout.svelte`](../src/routes/+layout.svelte)                               |
| Navigation loading bar                                          | [`NavigationProgress.svelte`](../src/lib/components/NavigationProgress.svelte) |
