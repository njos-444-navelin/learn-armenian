# Learn Armenian

A PWA for learning Armenian. Learners pick the language they already know —
English or Russian — and learn Armenian from there.

## Tech stack

- **[SvelteKit](https://svelte.dev/docs/kit) 2** on **Svelte 5** (runes mode), built with **Vite 8**
- **TypeScript**, run in strict mode with several additional strictness flags on
  top of `strict: true` — see [`tsconfig.json`](tsconfig.json)
- **[Supabase](https://supabase.com)** for backend services (data persistence and auth) —
  Claude manages the schema directly via the Supabase MCP server, see
  [Database schema and Supabase management](#database-schema-and-supabase-management)
- A custom, fully-typed **i18n system** (English/Russian) — no UI string is ever
  rendered without going through it
- A small **design-token-based design system** — no component ever hardcodes a color
- **[`@vite-pwa/sveltekit`](https://github.com/vite-pwa/sveltekit)**, so the app installs and works offline as a PWA
- Deployed on **Netlify** via `@sveltejs/adapter-netlify` — Claude manages the
  site (env vars, deploys) directly via the Netlify MCP connector, see
  [Deployment and Netlify management](#deployment-and-netlify-management)

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

| Variable                     | Description                          |
| ---------------------------- | ------------------------------------- |
| `PUBLIC_SUPABASE_URL`        | Your Supabase project URL             |
| `PUBLIC_SUPABASE_ANON_KEY`   | Your Supabase project's anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY`  | **Secret** — used only by the delete-account feature ([`src/lib/server/supabaseAdmin.ts`](src/lib/server/supabaseAdmin.ts)) to remove a user server-side. Deliberately has no `PUBLIC_` prefix — never expose it client-side, never paste it anywhere but your own `.env`/deploy config. |

The two `PUBLIC_SUPABASE_*` vars build without being set, but are required
at runtime — every request creates a server-side Supabase client (see
[`src/hooks.server.ts`](src/hooks.server.ts)) for the sign-in/sign-up flow
under `/account`, so a deploy with these unset will fail on every route, not
just auth ones. Set them in your deploy platform's environment variables too
(e.g. Netlify's Site configuration → Environment variables), for both
Production and Deploy Previews — or ask Claude to set them, since the
Netlify MCP connector can read/write a site's env vars directly (see
[Deployment and Netlify management](#deployment-and-netlify-management)).

`SUPABASE_SERVICE_ROLE_KEY` is different: it's optional for the app to
*run*. If it's unset, every route except delete-account works normally —
delete-account fails gracefully with an error message instead of crashing
(see `getSupabaseAdmin()`'s error handling).

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
      account/               # sign in (default) — email/password + magic link
      account/register/      # sign up, linked from the sign-in page
      account/change-password/ # requires a session
      account/change-email/    # requires a session, sends confirmation email(s)
      account/delete/          # requires a session, uses the service-role key
      account/contact/         # static support info, no session required
  lib/
    i18n/                  # locale, dictionaries, and the t()/getLocale() helpers
    styles/tokens.css      # design tokens (the only place colors are defined)
    components/            # shared, reusable UI (Button, Seo, PageShell, UserMenu, ...)
    content/vocabulary/    # vocabulary deck data (code, not DB) — see Conventions §10
                            # audio.ts derives each word's pronunciation clip path —
                            # see docs/VOCABULARY_AUDIO.md
    srs/scheduler.ts       # pure spaced-repetition algorithm, shared client + server
    actions/               # Svelte actions (e.g. fitText — shrink text to fit one line)
    stores/                # cross-component reactive state (e.g. toasts.svelte.ts)
    server/                # server-only helpers (SvelteKit enforces this boundary at
                            # build time) — auth guard, service-role admin client
static/
  audio/vocabulary/        # pre-generated pronunciation clips, one per word — see
                            # docs/VOCABULARY_AUDIO.md
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

## Vocabulary trainer

Signed-in learners build a personal vocabulary collection
(`/learn/vocabulary`) by adding topic decks, then drill them with spaced
repetition (`/learn/vocabulary/train`) — flip a card, grade it
Again/Hard/Good/Easy, Anki-style.

- **Deck content lives in code, not the database.** Each deck is a
  `readonly VocabularyWord[]` under
  [`src/lib/content/vocabulary/decks/`](src/lib/content/vocabulary/decks/),
  code-split per deck (see [Conventions §10](docs/CONVENTIONS.md#10-vocabulary-decks-are-code-split-and-always-capitalized)).
  The database only ever stores a user's *choices*: which decks they've
  added (`user_vocabulary_decks`) and their per-word spaced-repetition
  state (`user_vocabulary_progress`) — never the words/translations
  themselves.
- **The scheduling algorithm is a single pure module,**
  [`src/lib/srs/scheduler.ts`](src/lib/srs/scheduler.ts) — no framework
  dependency, no I/O. It runs identically on the client (to preview each
  grade button's resulting wait before the learner picks one) and on the
  server (to compute the value that actually gets persisted); the two are
  never allowed to drift into separate implementations of the same logic.
- **A word with no `user_vocabulary_progress` row is "new."** A row is
  only written once that word is actually graded, so the table stays
  sized to what a learner has studied, not the full catalog — and
  removing a deck deletes its progress rows too, so re-adding it later
  starts clean rather than resurrecting old due dates.
- **Grading is optimistic**, deliberately breaking the app's usual
  pending-state rule — see
  [Conventions §8's exception note](docs/CONVENTIONS.md#8-async-actions-always-show-their-pending-state)
  for why.
- **Every word has a pre-generated pronunciation clip**, played by the
  "loudspeaker" button next to its Armenian text
  ([`SpeakerButton.svelte`](src/lib/components/SpeakerButton.svelte)). Files
  are static assets, not Supabase-hosted — see
  [`docs/VOCABULARY_AUDIO.md`](docs/VOCABULARY_AUDIO.md) for the storage/
  encoding rationale and, importantly, **the checklist for voicing a newly
  added word** — there's no fallback for a missing clip.

## Database schema and Supabase management

Claude has direct access to this project's Supabase backend via the
Supabase MCP server (configured in [`.mcp.json`](.mcp.json), not committed
with any secret — it authenticates through an OAuth session, not an API
key). This repo has no local Supabase stack and no Supabase CLI project
linked, so Claude works straight against the one live project (local dev
and production point at the same project — see
[`docs/AUTH.md`](docs/AUTH.md#testing-against-the-live-project)).

**Claude owns Postgres/Supabase for this project** — the human maintainer
doesn't need Postgres or Supabase knowledge to work on this app. In
practice that means Claude should, via MCP rather than by asking the human
to click through the dashboard or paste SQL:

- Write and apply schema changes (new tables, columns, RLS policies)
- Track every change as a migration file under
  [`supabase/migrations/`](supabase/migrations/), one file per change, in
  the order they were applied — applying a migration through MCP
  (`apply_migration`) both runs it and records it, so this directory stays
  a true history of the live schema
- Run queries, inspect tables, and read logs/advisors to debug issues
- Consult [`docs/AUTH.md`](docs/AUTH.md) before touching anything
  auth-related — some auth configuration lives in the Supabase dashboard
  and isn't reachable through MCP (see the checklist there), so that part
  still needs a human with dashboard access

**Every `create policy` needs a matching `grant`, in the same migration.**
Postgres checks table-level privileges *before* RLS is ever evaluated — a
table with a correct policy but no `grant select/insert/update/delete on
<table> to authenticated` fails every request with "permission denied for
table", which looks identical to an RLS block from the outside and is easy
to mistake for one while debugging. This caused a real bug: the vocabulary
feature's first two tables had correct policies but no grants, so the "Add
to my collection" button silently did nothing until a follow-up migration
added them (see `supabase/migrations/20260816121000_grant_authenticated_access_to_vocabulary_tables.sql`).
For every operation a policy allows, grant it too — don't rely on RLS alone.

If Claude's Supabase MCP session isn't connected in a given environment,
fall back to the old manual path: open the new migration file and run its
contents in the Supabase dashboard's SQL Editor by hand, for every
environment that needs the change.

## Deployment and Netlify management

Claude also has direct access to this project's Netlify site (`learn-armenian`,
serving [learn-armenian.com](https://learn-armenian.com)) via a Netlify MCP
connector. Unlike Supabase's server, this isn't declared in this repo's
[`.mcp.json`](.mcp.json) — it's connected at the account level, so it's only
available in sessions where the maintainer has authorized it there.

The site **auto-deploys from this repo's GitLab remote**
(`git@gitlab.com:njosnavelin/learn-armenian.git`, see `git remote -v`) —
Netlify picks up every push the normal way, so merging/pushing to the
production branch is enough on its own; nothing needs to be manually
triggered for an ordinary change to go live.

Through the MCP connector, Claude can — instead of asking the human to click
through the Netlify dashboard:

- Read the site's config, deploy status, and deploy history
- Read and write environment variables directly (the MCP-backed alternative
  to the manual step in [Environment variables](#environment-variables)
  above), scoped to Production, Deploy Previews, or both
- Trigger a one-off deploy outside the normal push-to-deploy flow (e.g. to
  pick up a Netlify-side config change without a new commit)
- Read/manage forms and form submissions, and look up team/user info

As with Supabase, if this connector isn't available in a given session, fall
back to the Netlify dashboard (Site configuration) by hand.

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
