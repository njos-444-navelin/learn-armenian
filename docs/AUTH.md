# Authentication

Sign-in lives at `/account` (locale-prefixed: `/en/account`, `/ru/account`),
reachable from the user-menu popover in the top-right corner of every page
(`src/lib/components/UserMenu.svelte`). Sign-up is a separate page,
`/account/register`, linked from the bottom of `/account` — the sign-in page
is deliberately the default landing spot and doesn't also try to sell
registration; see Design decisions. It's backed by
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
   `magiclink`, and `logout` form actions, each a thin wrapper around
   `locals.supabase.auth.*`. The `signup` action lives on the separate
   **`src/routes/[lang=locale]/account/register/+page.server.ts`**, whose
   `load` also redirects to `/account` if `claims` is already non-null (no
   point showing a registration form to someone already signed in).
6. **`src/routes/auth/confirm/+server.ts`** — the magic-link (and email-
   change) landing route. Verifies the emailed token
   (`verifyOtp({ token_hash, type })`) and redirects. Lives outside the
   `[lang=locale]` prefix by design (see the dashboard config below — the
   email templates hardcode this path).
7. **`account/change-password`, `account/change-email`, `account/delete`**
   — each a `load` + single named action, requiring a signed-in user via
   [`src/lib/server/authGuard.ts`](../src/lib/server/authGuard.ts)'s
   `requireSignedIn()`, called in *both* `load` and the action itself (see
   Design decisions for why the second call is required, not redundant).
   `delete`'s action additionally uses
   [`src/lib/server/supabaseAdmin.ts`](../src/lib/server/supabaseAdmin.ts),
   a lazily-created admin client authenticated via
   `SUPABASE_SERVICE_ROLE_KEY`, to call `auth.admin.deleteUser()` — there is
   no self-service "delete my own account" method in the regular client
   SDK.

`src/routes/account/+page.server.ts` and `src/routes/auth/error/+page.server.ts`
are locale-negotiation redirect stubs, the same pattern as the root
`+page.server.ts` — they exist so a locale-less `/account` link (e.g. from an
email) still lands on the right `/en/account` or `/ru/account`.

## Required Supabase dashboard configuration

None of this is set by code or by running the app — it has to be clicked
through in the Supabase dashboard for the project this app points at
(`PUBLIC_SUPABASE_URL`). Unlike schema/migration work (see
[README § Database schema and Supabase management](../README.md#database-schema-and-supabase-management)),
none of it is reachable through the Supabase MCP server either — there's no
MCP tool for auth provider settings or email templates — so this checklist
still needs a human with dashboard access. Do all of these:

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
6. **Authentication → Emails → Templates → Change Email Address** —
   replace the template body with:
   ```html
   <p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/account">Confirm email change</a></p>
   ```
   Same token-hash/PKCE pattern as the Magic Link template — deliberately
   `type=email` here too, matching what the Magic Link template already
   uses successfully in production (not `type=email_change`, which is a
   valid enum value in the SDK's types but unverified against this
   project's actual GoTrue behavior via the token-hash path). If a real
   test shows `type=email` doesn't verify for this template specifically,
   switch this one template to `type=email_change` — no code change needed,
   `src/routes/auth/confirm/+server.ts` is fully generic over `type`.
7. **Authentication → Providers → Email → "Secure password change"** —
   confirm this is **OFF** (the default). Leave it off: turning it on adds
   an emailed-OTP reauthentication step to `updateUser({password})` for
   sessions older than 24h, which the change-password page doesn't build
   for — it has its own, independent old-password check instead.
8. **Authentication → Providers → Email → "Secure Email Change"** —
   confirm this is **ON** (the default). With it on, `updateUser({email})`
   requires confirmation from *both* the old and new address before the
   change applies — this app's change-email page assumes that and says so
   in its success message.

## Environment variables

`PUBLIC_SUPABASE_URL` / `PUBLIC_SUPABASE_ANON_KEY` — see the
[README](../README.md#environment-variables) for local setup. The important
part repeated here because it's easy to miss: **the app now requires these at
runtime, not just build time.** `hooks.server.ts` builds a real Supabase
client on every request, which throws if they're unset — a deploy missing
them 500s on every route, not just auth ones. Set them in Netlify (or
whichever host) *and* trigger a fresh deploy — env var changes don't apply
retroactively to an already-built deploy.

`SUPABASE_SERVICE_ROLE_KEY` is different — see the
[README](../README.md#environment-variables) for details. It's secret
(never `PUBLIC_`-prefixed), and unlike the two vars above it's only used
lazily inside the delete-account action
([`src/lib/server/supabaseAdmin.ts`](../src/lib/server/supabaseAdmin.ts)),
not wired into `hooks.server.ts` — a missing key breaks only that one
feature, not the whole site. Find it in Supabase's dashboard under
Settings → API → "service_role" key.

## Testing against the live project

Local dev (`npm run dev`) and production point at the **same Supabase
project** — there's no separate local/staging backend. Any account created
while testing sign-up, magic link, or the account-management pages is a
real row in `auth.users` on the live project, not a throwaway.

**Claude: delete every test account you create before finishing a task
that involved testing an auth flow.** Don't leave them for the user to find
later. In order of preference:

1. If you were already testing `/account/delete`, use it as the cleanup
   step — sign in as the test account, submit its own email there. Verifies
   the real feature and cleans up in one action.
2. Otherwise, use the admin API directly with `SUPABASE_SERVICE_ROLE_KEY`
   (the same credential `src/lib/server/supabaseAdmin.ts` uses) — a short
   throwaway Node script with `@supabase/supabase-js`'s `createClient`,
   `auth.admin.listUsers()` to find the account by email, then
   `auth.admin.deleteUser(id)`. Load the key from `.env` (it's not exposed
   through `$env/dynamic/private` outside the SvelteKit dev server, so a
   standalone script needs to read `.env` itself).

**Only delete accounts you created this session, identified by email.**
Never delete an account you didn't create or aren't certain is a test
artifact — check `auth.users` (via `listUsers()`, or a read-only
`execute_sql` query through the Supabase MCP server) first if there's any
doubt, and never touch the project owner's own account. Prefer the MCP
query for checking, since it needs no service-role key — but still perform
the actual deletion through option 1 or 2 above, not a raw `DELETE` via
MCP's `execute_sql`, since the admin API (and the app's own delete-account
feature) handle Auth's related cleanup that a direct table delete wouldn't.

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

- **Sign-up is a separate page (`/account/register`), not a section on the
  sign-in page.** `/account` is the default, most-visited case (an existing
  user coming back) and shouldn't have to look past a registration form to
  find it. `/account/register` links back to `/account` ("Already have an
  account?"), and `/account` links to it ("New here?") — see
  `hasAccountPrompt`/`registerPrompt` in
  [`dictionaries/account.ts`](../src/lib/i18n/dictionaries/account.ts).
- **Magic link is sign-in only, not sign-up** (`shouldCreateUser: false` in
  the `magiclink` action). Password sign-up is the only account-creation
  path, so no account ever ends up without a password set.
- **Sign-in and sign-up are two separate `<form>`s**, not one form with two
  submit buttons. See
  [Conventions §7](CONVENTIONS.md#7-authpassword-forms-use-single-purpose-autocomplete-values)
  for why — in short, a shared password field can't correctly declare both
  `autocomplete="current-password"` and `autocomplete="new-password"`, which
  breaks password-manager-generated passwords on sign-up.
- **`change-password` includes a hidden `username`/email field even though
  the action never reads it** — confirmed necessary, not just theoretical:
  Proton Pass on iOS would autofill the current-password field but decline
  to suggest a generated new password without it. See
  [Conventions §7](CONVENTIONS.md#7-authpassword-forms-use-single-purpose-autocomplete-values)
  for the full reasoning and source.
- **Every form on this page shows a spinner and keeps your input on screen
  while the request is in flight**, instead of `use:enhance`'s default
  behavior of silently clearing the form. See
  [Conventions §8](CONVENTIONS.md#8-async-actions-always-show-their-pending-state)
  — this is the general pattern for any async action in the app, not just
  auth, and the anti-pattern it fixes is worth reading if you're adding a
  new form anywhere.
- **Delete-account is the one feature backed by a privileged `service_role`
  client**, created lazily inside its action rather than wired into
  `hooks.server.ts` like the anon key. Deliberate asymmetry: the anon key
  is required at runtime because auth is core to every page; the
  service-role key is required only for one rarely-used, high-stakes
  action, so a missing/misconfigured key should degrade that one feature
  (a friendly error) rather than 500 the whole site.
- **Change-password verifies the old password via a real
  `signInWithPassword` call**, not Supabase's built-in reauthentication-
  nonce flow (gated by the "Secure password change" dashboard toggle, off
  by default — see the checklist above). That flow emails an OTP and is a
  different, opt-in mechanism; our own check is independent and works
  regardless of that setting.
- **Every action on `change-password`/`change-email`/`delete` calls the
  shared `requireSignedIn()` guard both in `load` and again at the top of
  the action itself** — not redundant. SvelteKit runs a page's action
  before `load` re-runs to render the result, so a `load`-only guard
  doesn't protect a direct/replayed POST to the action from a signed-out
  session.
