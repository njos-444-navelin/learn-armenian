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

**Scope exemption:** the PWA manifest (`vite.config.ts`) is a single
build-time file that can't be resolved per-request/per-locale, so its
`name`/`short_name`/`description` are not run through the i18n system. This is
the only exemption.

## 2. No hardcoded colors

Every color used in a component's `<style>` block must be a `var(--color-...)`
custom property from [`src/lib/styles/tokens.css`](../src/lib/styles/tokens.css).
If a component needs a color that doesn't exist yet, add a new token to
`tokens.css` (with a semantic name, not a raw color name) rather than writing a
literal hex/rgb value inline.

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
