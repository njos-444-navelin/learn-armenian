# Learn Armenian

A PWA for learning Armenian. Learners pick the language they already know —
English or Russian — and learn Armenian from there.

## Tech stack

- **[SvelteKit](https://svelte.dev/docs/kit) 2** on **Svelte 5** (runes mode), built with **Vite 8**
- **TypeScript**, run in strict mode with several additional strictness flags on
  top of `strict: true` — see [`tsconfig.json`](tsconfig.json)
- **[Supabase](https://supabase.com)** for backend services (data persistence and auth)
- A custom, fully-typed **i18n system** (English/Russian) — no UI string is ever
  rendered without going through it
- A small **design-token-based design system** — no component ever hardcodes a color
- **[`@vite-pwa/sveltekit`](https://github.com/vite-pwa/sveltekit)**, so the app installs and works offline as a PWA
- Deployed on **Netlify** via `@sveltejs/adapter-netlify`

See [`docs/CONVENTIONS.md`](docs/CONVENTIONS.md) for the rules that keep the above
true as the app grows.

## Developing

Install dependencies, then start a dev server:

```sh
npm install
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

PWA features (manifest link, service worker) only activate in the production
build/preview — `vite dev` intentionally skips them so HMR isn't disrupted.

### Environment variables

Copy [`.env.example`](.env.example) to `.env` and fill in your Supabase project's
values:

| Variable                    | Description                          |
| ---------------------------- | ------------------------------------- |
| `PUBLIC_SUPABASE_URL`        | Your Supabase project URL             |
| `PUBLIC_SUPABASE_ANON_KEY`   | Your Supabase project's anon/public key |

The app builds without these set, but requires them at runtime — every
request creates a server-side Supabase client (see
[`src/hooks.server.ts`](src/hooks.server.ts)) for the sign-in/sign-up flow
under `/account`, so a deploy with these unset will fail on every route, not
just auth ones. Set them in your deploy platform's environment variables too
(e.g. Netlify's Site configuration → Environment variables), for both
Production and Deploy Previews.

## Building

```sh
npm run build
```

Preview the production build with `npm run preview`. Type-check the whole project
with `npm run check`.

## Project structure

```
src/
  hooks.server.ts          # resolves the current locale, sets <html lang>,
                            # and wires up the request-scoped Supabase client
  params/locale.ts         # route param matcher for /en, /ru
  routes/
    +layout.server.ts      # exposes the signed-in user's claims to every page
    +layout.ts             # isomorphic Supabase client (browser + SSR)
    +page.server.ts        # "/" -> redirects to /en or /ru by Accept-Language
    account/+page.server.ts # "/account" -> redirects to /en/account or /ru/account
    auth/
      confirm/+server.ts   # verifies magic-link emails, then redirects
      error/+page.server.ts # failed-verification landing, redirects to /account
    [lang=locale]/          # everything the learner sees lives under a locale
      +page.svelte          # language picker / entry point
      learn/+page.svelte    # "start learning" destination
      account/               # sign in / sign up / sign out
  lib/
    i18n/                  # locale, dictionaries, and the t()/getLocale() helpers
    styles/tokens.css      # design tokens (the only place colors are defined)
    components/            # shared, reusable UI (Button, Seo, PageShell, UserMenu, ...)
```

## Authentication

Sign-in/sign-up (`/account`) runs on Supabase Auth via `@supabase/ssr` —
email+password plus a magic-link fallback. Most of what makes it actually
work is Supabase dashboard configuration that lives outside this repo (email
confirmation settings, the magic-link email template, Site URL/Redirect
URLs), not just code. See [`docs/AUTH.md`](docs/AUTH.md) for the full
architecture, the exact dashboard checklist, and gotchas already hit once
(and fixed) — read it before touching anything under `src/hooks.server.ts`,
`src/routes/auth/`, or `src/routes/[lang=locale]/account/`.

## Internationalization

Every locale is a real, crawlable route (`/en`, `/ru`) rather than client-only
state, so each language is independently indexable and linked via
`hreflang` alternates (see [`src/lib/components/Seo.svelte`](src/lib/components/Seo.svelte)).
`/` server-redirects to the best-matching locale based on the request's
`Accept-Language` header.

## Accessibility

Locale pages include a skip-to-content link, use a single `<main>` landmark,
and rely on real `<a>`/`<button>` elements (via the shared `Button` component)
rather than click handlers on generic elements, so navigation stays keyboard-
and screen-reader-operable. Focus is always visible (`:focus-visible`, see
[`src/app.css`](src/app.css)) and respects `prefers-reduced-motion`.

## Responsive design

The app targets every screen size from small phones to widescreen desktop
monitors, not a fixed set of device breakpoints. That's driven by a few tokens
in [`tokens.css`](src/lib/styles/tokens.css) rather than page-specific CSS:

- `--measure` caps content width so line length and layout stay comfortable
  from a 320px phone up to an ultrawide monitor, applied once in
  [`PageShell.svelte`](src/lib/components/PageShell.svelte) rather than per page.
- `--tap-target-min` (44px) is the minimum size for interactive elements
  (`Button.svelte`), meeting WCAG 2.5.5/2.5.8 touch-target guidance.
- Typography (`--font-size-xl`) and layout (`nav` wrapping in the language
  picker) use `clamp()`/`flex-wrap` instead of fixed pixel breakpoints, so
  they scale continuously rather than jumping at specific widths.
- The viewport meta tag includes `viewport-fit=cover`, and `PageShell` pads
  with `env(safe-area-inset-*)`, so content clears notches/home indicators on
  mobile.

See [`docs/CONVENTIONS.md`](docs/CONVENTIONS.md) for the rule this follows.

## Roadmap: app store packaging

The app is built as a standard installable PWA today. Wrapping it for app
stores later (e.g. with [Capacitor](https://capacitorjs.com)) is expected to
work by pointing Capacitor's `server.url` at the deployed Netlify site — the
existing SSR-based locale redirect and `<html lang>` handling keep working
unchanged in that mode. A fully offline-bundled native build would instead
need `adapter-static` and client-side locale resolution; that's a deliberate
fork in the road, not something this codebase needs to decide now.
