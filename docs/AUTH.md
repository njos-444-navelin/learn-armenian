# Authentication

Sign-in/sign-up lives at `/account` (locale-prefixed: `/en/account`,
`/ru/account`), reachable from the user-menu popover in the top-right corner
of every page (`src/lib/components/UserMenu.svelte`). It's backed by
[Supabase Auth](https://supabase.com/docs/guides/auth) via
[`@supabase/ssr`](https://www.npmjs.com/package/@supabase/ssr), supporting
email+password (sign-up and sign-in) and a magic-link fallback (sign-in only,
for existing accounts — see Design decisions below).

This doc exists because most of what makes auth actually work lives outside
the codebase, in Supabase's dashboard — nothing in git history or the code
itself tells you what to configure there. If you're setting up a new Supabase
project for this app (a fresh environment, a rotated project, onboarding),
**you need every step below**, not just the code.

## Architecture

Request flow, in order:

1. **`src/hooks.server.ts`** — `sequence(localeHandle, supabaseHandle, authClaimsHandle)`.
   `supabaseHandle` builds a request-scoped Supabase client from the request's
   cookies (`event.locals.supabase`). `authClaimsHandle` calls
   `supabase.auth.getClaims()` and stores the result on `event.locals.claims`
   (`null` when signed out) — this runs on *every* request, not just
   `/account`.
2. **`src/routes/+layout.server.ts`** — passes `claims` and the raw cookie jar
   down to the universal load below.
3. **`src/routes/+layout.ts`** — creates the isomorphic client (browser vs.
   server, via `isBrowser()`), re-derives `claims`, and returns
   `{ supabase, claims }` as page data. This is what makes `page.data.claims`
   and `page.data.supabase` available everywhere via `$app/state`.
4. **`src/routes/+layout.svelte`** — subscribes to
   `supabase.auth.onAuthStateChange` and calls `invalidate('supabase:auth')`
   when the session changes, so `claims` stays current without a full reload
   after sign-in/sign-out.
5. **`src/routes/[lang=locale]/account/+page.server.ts`** — the `login`,
   `signup`, `magiclink`, and `logout` form actions, each a thin wrapper
   around `locals.supabase.auth.*`.
6. **`src/routes/auth/confirm/+server.ts`** — the magic-link landing route.
   Verifies the emailed token (`verifyOtp({ token_hash, type })`) and
   redirects. Lives outside the `[lang=locale]` prefix by design (see the
   dashboard config below — the email template hardcodes this path).

`src/routes/account/+page.server.ts` and `src/routes/auth/error/+page.server.ts`
are locale-negotiation redirect stubs, the same pattern as the root
`+page.server.ts` — they exist so a locale-less `/account` link (e.g. from an
email) still lands on the right `/en/account` or `/ru/account`.

## Required Supabase dashboard configuration

None of this is set by code or by running the app — it has to be clicked
through in the Supabase dashboard for the project this app points at
(`PUBLIC_SUPABASE_URL`). Do all of these:

1. **Authentication → Providers → Email** — turn **"Confirm email" OFF**.
   The sign-up form assumes this: it expects `signUp` to return a live
   session immediately and redirects straight to the signed-in view. With
   confirmation left on, sign-up silently does nothing from the user's
   perspective (no session, no obvious error) until they click a
   confirmation email the UI never mentions.
2. **Authentication → Emails → Templates → Magic Link** — replace the
   template body with:
   ```html
   <p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/account">Sign in</a></p>
   ```
   Supabase's default template (`{{ .ConfirmationURL }}`) only works with the
   older "implicit" auth flow; `@supabase/ssr` requires PKCE, which needs
   this token-hash form instead. `next=/account` must be that exact literal
   string — not `{{ .RedirectTo }}`, which resolves to a full URL and breaks
   `src/routes/auth/confirm/+server.ts` (it does `redirect(303, next)`
   expecting a bare path).
3. **Authentication → URL Configuration → Site URL** — set to the real
   production origin (`https://learn-armenian.com`). Every `{{ .SiteURL }}`
   in auth emails, including the template above, resolves from this value.
4. **Authentication → URL Configuration → Redirect URLs** — add
   `https://learn-armenian.com/**` and `http://localhost:5173/**` (for local
   dev).
5. **Authentication → SMTP Settings** (optional, but expect to need it) —
   Supabase's built-in email sending is rate-limited to a handful of
   emails/hour on the free tier. Fine for normal traffic, but repeated
   sign-up/magic-link testing burns through it fast — set up custom SMTP
   before doing that kind of testing.

## Environment variables

`PUBLIC_SUPABASE_URL` / `PUBLIC_SUPABASE_ANON_KEY` — see the
[README](../README.md#environment-variables) for local setup. The important
part repeated here because it's easy to miss: **the app now requires these at
runtime, not just build time.** `hooks.server.ts` builds a real Supabase
client on every request, which throws if they're unset — a deploy missing
them 500s on every route, not just auth ones. Set them in Netlify (or
whichever host) *and* trigger a fresh deploy — env var changes don't apply
retroactively to an already-built deploy.

## Known gotchas

- **`@supabase/ssr`'s cookie writer can call the `setAll` handler more than
  once per request** (e.g. once for the PKCE code verifier, again for the
  session), each time resupplying the same `Cache-Control`/`Expires`/`Pragma`
  headers — but SvelteKit's `event.setHeaders()` throws if the same header
  name is set twice in one request. This crashed every sign-up/sign-in
  attempt with a 500 until it was caught. See the comment and fix in
  `supabaseHandle` in [`src/hooks.server.ts`](../src/hooks.server.ts) before
  touching that cookie handler.
- If a fresh Supabase project ever returns to this app broken with "sign-up
  seems to do nothing," check step 1 above (`Confirm email`) first — it's
  the single most common way to reintroduce that mismatch.

## Design decisions

- **Magic link is sign-in only, not sign-up** (`shouldCreateUser: false` in
  the `magiclink` action). Password sign-up is the only account-creation
  path, so no account ever ends up without a password set.
- **Sign-in and sign-up are two separate `<form>`s**, not one form with two
  submit buttons. See
  [Conventions §7](CONVENTIONS.md#7-authpassword-forms-use-single-purpose-autocomplete-values)
  for why — in short, a shared password field can't correctly declare both
  `autocomplete="current-password"` and `autocomplete="new-password"`, which
  breaks password-manager-generated passwords on sign-up.
