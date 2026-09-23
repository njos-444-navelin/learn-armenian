# Authentication

Sign-in is `/account`, sign-up the separate `/account/register`, backed by Supabase Auth via `@supabase/ssr`: email+password, plus a magic-link fallback for sign-in only.

This doc exists because most of what makes auth work lives in Supabase's dashboard, which nothing in the code or git history tells you about. Setting up a new project for this app needs **every step in the checklist below**.

## Architecture

1. **`hooks.server.ts`** — `sequence(localeHandle, supabaseHandle, authClaimsHandle)`. `supabaseHandle` builds a request-scoped client from cookies; `authClaimsHandle` puts `getClaims()` on `event.locals.claims` (`null` when signed out), on _every_ request.
2. **`+layout.server.ts`** passes `claims` and the cookie jar down; **`+layout.ts`** creates the isomorphic client and returns `{ supabase, claims }`, which is what makes `page.data.claims` available everywhere.
3. **`+layout.svelte`** subscribes to `onAuthStateChange` and calls `invalidate('supabase:auth')`, so `claims` stays current after sign-in or sign-out without a reload.
4. **`account/+page.server.ts`** has the `login`, `magiclink` and `logout` actions; `signup` lives on `account/register/`, whose `load` redirects away if `claims` is already set.
5. **`auth/confirm/+server.ts`** is the magic-link and email-change landing route. It verifies the token (`verifyOtp`) and redirects. It sits outside the `[lang=locale]` prefix because the email templates hardcode the path.
6. **`change-password`, `change-email`, `delete`** each guard with `requireSignedIn()` in _both_ `load` and the action. `delete` additionally uses the `service_role` client, since there's no self-service account deletion in the regular SDK.

`routes/account/+page.server.ts` and `routes/auth/error/+page.server.ts` are locale-negotiation stubs, so a locale-less link from an email still lands on the right locale.

## Resuming a gated action after sign-in

`requireSignedIn()`'s optional `resume` argument redirects to `/account?next=<page>?resume=<action>` rather than a bare `/account`, and the `login` action redirects back to that `next` on success. The page then replays the action itself.

1. The gated action calls `requireSignedIn(claims, params.lang, { url, action: 'addToCollection' })`.
2. `next` is the original path plus `?resume=<action>`, URL-encoded as one query value.
3. The `login` action redirects there **only if `isSafeInternalPath(next)` passes**. That check is load-bearing, not boilerplate: `next` comes from an editable query string, so an unchecked redirect would be an open redirect. It accepts a single leading `/` followed by a real locale segment, rejecting `//host/…` and absolute URLs.

   **Gotcha:** the login form's `action` can't be a plain `?/login`. A query-only relative reference _replaces_ the whole query string, dropping `next` before the POST. `loginActionHref` re-attaches it (`?next=…&/login`); SvelteKit reads any query key starting with `/` as the action name. Any form that both reads a query param and needs it to survive its own submission has to do the same.

4. The page's `$effect` checks `resume` against the action ids it knows, and calls `requestSubmit()` on the same form a real click would have submitted, so the replay reuses the existing submit, pending and toast logic. A `resumeHandled` flag keeps it to one replay, and `replaceState()` strips the param so a refresh doesn't fire it again.

**Password sign-in only.** The magic-link landing page is fixed by the dashboard's email template (`next=/account` is a hardcoded literal required for PKCE verification), so a magic-link sign-in lands on the bare account page. A deliberate gap; closing it means reworking that template to carry a dynamic redirect.

**Adding a gated action:** pick a unique `action` id, pass `{ url, action }`, and add an `$effect` that recognizes it and re-triggers the same form. `next`/`resume` and the redirect check are already generic.

## Required Supabase dashboard configuration

None of this is set by code, and none of it is reachable through the Supabase MCP server — there's no tool for auth settings or email templates, so this needs a human with dashboard access.

1. **Providers → Email → "Confirm email" OFF.** The sign-up form expects `signUp` to return a live session and redirects straight to the signed-in view. Left on, sign-up silently does nothing from the user's perspective.
2. **Emails → Templates → Magic Link** — replace the body with:
   ```html
   <p>
   	<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/account"
   		>Sign in</a
   	>
   </p>
   ```
   The default `{{ .ConfirmationURL }}` only works with the older implicit flow; `@supabase/ssr` needs PKCE's token-hash form. `next=/account` must be that literal — `{{ .RedirectTo }}` resolves to a full URL and breaks `auth/confirm`, which does `redirect(303, next)` on a bare path.
3. **URL Configuration → Site URL** — the real production origin. Every `{{ .SiteURL }}` in auth emails resolves from it.
4. **URL Configuration → Redirect URLs** — the production origin `/**` and `http://localhost:5173/**`.
5. **SMTP Settings** — built-in sending is rate-limited to a few emails an hour on the free tier. Repeated sign-up or magic-link testing burns through it fast; set up custom SMTP before that kind of testing.
6. **Emails → Templates → Change Email Address** — same token-hash pattern as Magic Link, and deliberately `type=email` too, matching what already works in production rather than the unverified `type=email_change`. If a real test shows it doesn't verify, switch this one template — `auth/confirm` is generic over `type`, so no code change is needed.
7. **Providers → Email → "Secure password change" OFF** (the default). On, it adds an emailed-OTP step to `updateUser({password})` for sessions older than 24h, which the change-password page doesn't build for — it has its own old-password check.
8. **Providers → Email → "Secure Email Change" ON** (the default), so `updateUser({email})` needs confirmation from both addresses. The change-email page's success message says so.

## Environment variables

See the [README](../README.md#environment). The part worth repeating: the two `PUBLIC_` vars are needed **at runtime**, since `hooks.server.ts` builds a client on every request — a deploy missing them 500s on every route. Env var changes need a fresh deploy; they don't apply retroactively.

`SUPABASE_SERVICE_ROLE_KEY` is used lazily inside delete-account only, so a missing key breaks that one feature. It's in the dashboard under Settings → API.

## Testing against the live project

Local dev and production point at the **same Supabase project**. Any account created while testing is a real row in `auth.users`.

**Delete every test account you create before finishing.** In order of preference:

1. If you were testing `/account/delete` anyway, use it — it verifies the feature and cleans up in one action.
2. Otherwise use the admin API with `SUPABASE_SERVICE_ROLE_KEY`: `auth.admin.listUsers()` to find it by email, then `auth.admin.deleteUser(id)`. A standalone script has to read `.env` itself.

**Only delete accounts you created this session, identified by email**, and never the project owner's. Check first through MCP's read-only `execute_sql` if there's any doubt, but do the deletion through the admin API or the app's own feature — a raw `DELETE` skips the Auth cleanup they handle.

## Known gotchas

- **`@supabase/ssr` can call `setAll` more than once per request**, each time resupplying the same cache headers, while `event.setHeaders()` throws on a repeated header name. This 500'd every sign-in until it was caught — see the fix in `supabaseHandle` before touching that handler.
- If sign-up "seems to do nothing" on a fresh project, check step 1 first.

## Design decisions

- **Sign-up is a separate page.** `/account` is the common case — someone coming back — and shouldn't make them look past a registration form. The two pages link to each other.
- **Magic link is sign-in only** (`shouldCreateUser: false`), so no account ever ends up without a password.
- **Sign-in and sign-up are two `<form>`s**, since one shared password field can't declare both `current-password` and `new-password` ([Conventions §7](CONVENTIONS.md#7-authpassword-forms-use-single-purpose-autocomplete-values)).
- **`change-password` includes a hidden `username` field** the action never reads — confirmed necessary, not theoretical (Conventions §7).
- **Every form keeps your input on screen while in flight** ([Conventions §8](CONVENTIONS.md#8-async-actions-always-show-their-pending-state)).
- **Delete-account is the one feature backed by `service_role`**, created lazily in its action rather than wired into hooks. The anon key is required on every page, so it belongs in hooks; a missing service-role key should degrade one rarely-used action, not 500 the site.
- **Change-password verifies the old password with a real `signInWithPassword`**, independent of Supabase's opt-in reauthentication nonce, so it works regardless of that dashboard setting.
- **Every action on the session-gated pages calls `requireSignedIn()` twice**, in `load` and in the action — not redundant, since SvelteKit runs the action before `load` re-runs.
- **The account bubble is a plain link, not a popover trigger.** A button whose icon and label both say "account" should go there. Its old menu items moved onto `/account` itself, and the bubble hides while already there.
- **"Switch language" isn't on the signed-out screen.** The back button already returns to the home screen, where the full picker lives.
