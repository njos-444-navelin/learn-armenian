import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// Hand-built locale-prefixed path literal ("/en/...", "/ru/..."), the exact
// anti-pattern Conventions #5 bans — withLocale()/withoutLocale() in
// $lib/i18n/paths.ts are the only place that's allowed to know the locale
// list. Matches a literal/template segment that is exactly "en" or "ru"
// (bounded by a following "/" or the end of the string), not just any string
// that happens to start with those letters (e.g. "/entry", "/rustic").
const LOCALE_PATH_LITERAL = /^\/(en|ru)(\/|$)/;
const localePathRestriction = {
	selector: `Literal[value=/${LOCALE_PATH_LITERAL.source}/]`,
	message:
		'Never hand-build a locale-prefixed path — use withLocale()/withoutLocale() from $lib/i18n/paths instead (Conventions #5).'
};
const localePathTemplateRestriction = {
	selector: `TemplateElement[value.raw=/${LOCALE_PATH_LITERAL.source}/]`,
	message:
		'Never hand-build a locale-prefixed path — use withLocale()/withoutLocale() from $lib/i18n/paths instead (Conventions #5).'
};

export default tseslint.config(
	{
		ignores: [
			'.svelte-kit/',
			'.netlify/',
			'build/',
			'dist/',
			'node_modules/',
			'static/',
			'src/service-worker.ts'
		]
	},
	js.configs.recommended,
	...tseslint.configs.recommendedTypeChecked,
	...svelte.configs['flat/recommended'],
	{
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node
			},
			// Type-aware linting: needed for svelte/no-navigation-without-resolve
			// to recognize a value as safe by its *type* (ResolvedPathname), not
			// just by literally being a `resolve(...)` call — which is what lets
			// $lib/i18n/paths.ts's own withLocale()/resolveRuntimePath()/etc.
			// wrappers count, instead of forcing every call site to call
			// resolve() directly. svelte-check remains the source of truth for
			// type *correctness*; this is only turned on for the rules that need
			// type info to do their job.
			parserOptions: {
				projectService: {
					// Config/tooling files at the repo root aren't part of
					// tsconfig.json's `src/`-scoped project (nor should they
					// be — they're plain Node scripts, not app code), so the
					// project service falls back to a default single-file
					// project for exactly these instead of erroring.
					allowDefaultProject: [
						'eslint.config.js',
						'stylelint.config.js',
						'tooling/stylelint-rules/*.js'
					]
				},
				tsconfigRootDir: import.meta.dirname
			}
		}
	},
	{
		files: ['**/*.svelte', '**/*.svelte.ts'],
		languageOptions: {
			parserOptions: {
				parser: tseslint.parser,
				extraFileExtensions: ['.svelte']
			}
		}
	},
	{
		// recommendedTypeChecked's rules are tuned for plain TS — several fire
		// constantly on idiomatic Svelte 5/SvelteKit patterns this codebase uses
		// throughout (e.g. an async server `load`/action returning a plain
		// object literal reads as a "misused promise" to a rule that doesn't
		// know SvelteKit awaits it). svelte-check already provides the real
		// type-correctness guarantee for this codebase; type-checked ESLint
		// rules are only enabled here where they catch something svelte-check
		// doesn't (see the rest of this file).
		rules: {
			'@typescript-eslint/no-unsafe-assignment': 'off',
			'@typescript-eslint/no-unsafe-member-access': 'off',
			'@typescript-eslint/no-unsafe-call': 'off',
			'@typescript-eslint/no-unsafe-return': 'off',
			'@typescript-eslint/no-unsafe-argument': 'off',
			'@typescript-eslint/no-misused-promises': 'off',
			'@typescript-eslint/no-floating-promises': 'off',
			'@typescript-eslint/require-await': 'off',
			'@typescript-eslint/restrict-template-expressions': 'off',
			// Flags even an explicit `String(formData.get('x') ?? '')` — the
			// codebase's actual, already-correct pattern for a FormData field
			// that's typed `FormDataEntryValue | null` (i.e. could technically
			// be a File) — because it still inspects the *inner* expression
			// for base-to-string risk instead of recognizing the outer
			// String() call as the deliberate, sufficient guard it is.
			'@typescript-eslint/no-base-to-string': 'off',
			// Conventions #4: exactOptionalPropertyTypes requires writing
			// `field?: T | undefined` (not just `field?: T`) so that
			// explicitly passing `undefined` still type-checks — this rule
			// calls that same pattern redundant, flagging the codebase's own
			// mandated convention as a bug.
			'@typescript-eslint/no-duplicate-type-constituents': 'off'
		}
	},
	{
		// Conventions #10: a deck's words are only ever loaded through
		// loadDeckWords() (import.meta.glob, one chunk per deck) — a static
		// import of a decks/*.ts file would pull every deck's words into
		// whatever bundle imports it, defeating the whole point.
		rules: {
			'no-restricted-imports': [
				'error',
				{
					patterns: [
						{
							group: ['*/content/vocabulary/decks/*', '$lib/content/vocabulary/decks/*'],
							message:
								'Import deck words via loadDeckWords() in $lib/content/vocabulary/loadDeck.ts instead — a direct import defeats the per-deck code-splitting (Conventions #10).'
						}
					]
				}
			],
			'no-restricted-syntax': ['error', localePathRestriction, localePathTemplateRestriction]
		}
	},
	{
		// TypeScript's own `noUnusedParameters`-equivalent checking is already
		// stricter/more accurate than ESLint's here (svelte-check runs full
		// type info); this rule only exists in this config to flag genuinely
		// unused imports/locals, which the compiler doesn't catch on its own.
		rules: {
			'@typescript-eslint/no-unused-vars': [
				'error',
				{ argsIgnorePattern: '^_', varsIgnorePattern: '^_' }
			]
		}
	},
	{
		files: ['**/*.svelte'],
		rules: {
			// Svelte 5's runes model relies on a bare property-access
			// expression statement inside $effect() to register a reactive
			// dependency without otherwise using the value (see
			// [deckId]/+page.svelte's `data.deck.id;`, reset-on-navigation)
			// — real Svelte, not a mistake, that a generic JS-only rule
			// can't tell apart from an actually-useless expression. Left on
			// for plain .ts files, where it has no such false positive.
			'no-unused-expressions': 'off',
			'@typescript-eslint/no-unused-expressions': 'off'
		}
	}
);
