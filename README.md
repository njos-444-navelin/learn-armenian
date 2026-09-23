# Learn Armenian

A web app for learning the amazing Armenian language. Learners pick the language they already know — English or Russian — and learn Armenian from there.

Lessons come in three forms: an alphabet trainer, vocabulary decks drilled with spaced repetition, and two-person dialogues. Lesson content lives in code; the database only ever stores a learner's own choices and progress.

## Stack

- [SvelteKit](https://svelte.dev/docs/kit) 2 on Svelte 5 (runes), Vite 8
- [Supabase](https://supabase.com) for auth and progress
- [`@vite-pwa/sveltekit`](https://github.com/vite-pwa/sveltekit) — installable, works offline
- Netlify via `@sveltejs/adapter-netlify`
- A typed i18n system (en/ru) and a design-token system

## Develop

```sh
npm install
npm run dev
```

PWA features activate only in the production build — `vite dev` skips them so HMR isn't disrupted.

## Environment

Copy [`.env.example`](.env.example) to `.env`:

| Variable | |
| --- | --- |
| `PUBLIC_SUPABASE_URL` | Supabase project URL |
| `PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | **Secret.** Used only by delete-account ([`supabaseAdmin.ts`](src/lib/server/supabaseAdmin.ts)). No `PUBLIC_` prefix — never expose it client-side. |

The two `PUBLIC_` vars build without being set but are required at runtime: every request builds a server-side Supabase client, so a deploy without them fails on every route, not just auth ones. Set them in Netlify too, for both Production and Deploy Previews.

`SUPABASE_SERVICE_ROLE_KEY` is optional. Unset, only delete-account fails, and it fails with an error message rather than crashing.

## Build and check

```sh
npm run build     # npm run preview to serve it
npm run check     # svelte-check
npm run lint      # eslint + stylelint
```

This is a YOLO project, so nothing gates the deploy: there is no CI pipeline and no test suite. Run `npm run check` and `npm run build` before pushing.

## Deploy

Netlify serves [learn-armenian.com](https://learn-armenian.com) and auto-deploys on push to `main`. A config change that needs no commit can be picked up with a one-off deploy from the dashboard.

## Docs

| | |
| --- | --- |
| [AGENTS.md](AGENTS.md) | Working in this repo: conventions index, structure, git, backend access |
| [docs/CONVENTIONS.md](docs/CONVENTIONS.md) | The rules code review treats as load-bearing |
| [docs/DESIGN.md](docs/DESIGN.md) | Palette, type, motion, icons |
| [docs/AUTH.md](docs/AUTH.md) | Auth architecture and the Supabase dashboard checklist |
| [docs/ALPHABET_TRAINER.md](docs/ALPHABET_TRAINER.md) | Alphabet lesson model |
| [docs/DIALOGUES.md](docs/DIALOGUES.md) | Dialogue content model and word comments |
| [docs/WORDS.md](docs/WORDS.md) | Adding vocabulary, and the word-comments review page |
| [docs/VOCABULARY_AUDIO.md](docs/VOCABULARY_AUDIO.md) | Generating word clips |
| [docs/ALPHABET_AUDIO.md](docs/ALPHABET_AUDIO.md) | Generating letter clips |

## Packaging

Installable as a PWA today. Wrapping it for app stores (e.g. [Capacitor](https://capacitorjs.com)) should work by pointing `server.url` at the deployed site; the SSR locale redirect and `<html lang>` keep working. A fully offline native build would instead need `adapter-static` and client-side locale resolution.
