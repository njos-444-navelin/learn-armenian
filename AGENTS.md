# Working in this repo

Read [docs/CONVENTIONS.md](docs/CONVENTIONS.md) first: those rules are treated as bugs when broken. [README.md](README.md) has setup and the docs index.

There is no test suite and no CI. `npm run check` and `npm run lint` are the only automated checks; run both before pushing.

## Comments

A comment explains a decision about *this code* that the code itself can't show: a non-obvious constraint, a subtle invariant, why an odd-looking line is deliberate. Nothing else.

- Don't restate what the code does.
- Don't document product decisions, alternatives considered, or history. Code isn't product documentation — that belongs in `docs/` or the commit message.
- Keep it to a line or two whenever possible. If a comment is longer than the code it sits on, something's wrong.
- No comment beats a comment that will quietly go stale.

Applies to every file type here, including SQL migrations, scripts and `app.html`. Copy shown to learners (word comments, dictionary strings) is content, not a code comment — these rules don't apply to it.

The same goes for `docs/`: state the fact and the consequence, not the story of how it was found.

## Git

One branch per piece of work, named for that work. Combining a few tasks under a single branch is acceptable when named and described correctly; one PR per branch, merged into `main` and deleted.

## Structure

```
src/
  hooks.server.ts             locale resolution, <html lang>, request-scoped Supabase client
  params/locale.ts            route matcher for /en, /ru
  routes/
    +page.server.ts           "/" redirects by Accept-Language
    auth/confirm/+server.ts   verifies magic-link emails
    [lang=locale]/            everything the learner sees
      learn/                  alphabet, vocabulary, dialogues
      account/                sign in, register, change password/email, delete
  lib/
    i18n/                     locale, dictionaries, t() / getLocale()
    styles/tokens.css         design tokens — the only place colours are defined
    components/               shared UI
    content/words/            the word library: every word once (Conventions §10)
    content/vocabulary/       deck catalog + per-deck id lists
    content/dialogues/        dialogue catalog, characters, per-dialogue lines
    dialogues/                the player's playback state machine
    alphabet/                 session building, drill questions, mastery
    srs/scheduler.ts          pure SRS algorithm, shared client + server
    actions/ forms/ stores/   Svelte actions, form helpers, cross-component state
    server/                   server-only: auth guard, service-role client
static/audio/                 pre-generated clips: words/ and dialogues/
scripts/                      local tooling, never shipped
supabase/migrations/          one file per applied schema change
```

## Backend and deploys

Supabase is reached through the MCP server in [`.mcp.json`](.mcp.json) (OAuth, no committed secret). There is no local stack: the one live project serves both dev and production. `apply_migration` both runs and records a change, so [`supabase/migrations/`](supabase/migrations/) stays a true history.

**Every `create policy` needs a matching `grant`, in the same migration.** Postgres checks table-level privileges before RLS, so a correct policy without `grant ... to authenticated` fails every request with "permission denied for table" — indistinguishable from an RLS block. This silently broke "Add to my collection" once.

Some auth configuration lives in the Supabase dashboard and isn't reachable over MCP — see [docs/AUTH.md](docs/AUTH.md).

Netlify is reached through an account-level MCP connector (not declared in this repo, so only available where it's authorized): deploy status and history, environment variables per context, one-off deploys, forms. Without either connector, fall back to the dashboards.

## Content

Vocabulary and dialogue content is drafted in code and edited on the local review page, not polished in the editor — see [docs/WORDS.md](docs/WORDS.md). Every word and every letter ships with an audio clip; there is no fallback for a missing one (Conventions §11, §13).
