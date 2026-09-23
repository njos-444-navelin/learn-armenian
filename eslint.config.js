import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// Hand-built locale-prefixed path literal, the anti-pattern Conventions #5
// bans. Matches a segment that is exactly "en" or "ru", not any string
// starting with those letters ("/entry", "/rustic").
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
			// Type-aware linting, so svelte/no-navigation-without-resolve can
			// recognize a value as safe by its type rather than only as a literal
			// `resolve(...)` call — which is what lets paths.ts's wrappers count.
			// svelte-check remains the source of truth for type correctness.
			parserOptions: {
				projectService: {
					// Root config and tooling files aren't part of tsconfig's `src/`-scoped
					// project, so the service falls back to a single-file project for
					// these rather than erroring.
					allowDefaultProject: [
						'eslint.config.js',
						'stylelint.config.js',
						'tooling/stylelint-rules/*.js',
						'scripts/words/*.js'
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
		// recommendedTypeChecked is tuned for plain TS and fires constantly on
		// idiomatic SvelteKit patterns (an async `load` returning an object literal
		// reads as a misused promise). svelte-check gives the real guarantee; the
		// type-checked rules kept below are the ones that catch what it doesn't.
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
			// Flags even an explicit `String(formData.get('x') ?? '')`, the codebase's
			// own correct pattern, because it inspects the inner expression rather
			// than recognizing the outer String() as the guard.
			'@typescript-eslint/no-base-to-string': 'off',
			// Conventions #4: exactOptionalPropertyTypes needs `field?: T | undefined`,
			// which this rule calls redundant.
			'@typescript-eslint/no-duplicate-type-constituents': 'off'
		}
	},
	{
		// Conventions #10: deck words load only through loadDeckWords(), dialogue
		// lines only through loadDialogue() — the one place each id list is
		// validated, and the lazy import that keeps content out of other bundles.
		rules: {
			'no-restricted-imports': [
				'error',
				{
					patterns: [
						{
							group: ['*/content/vocabulary/decks/*', '$lib/content/vocabulary/decks/*'],
							message:
								'Import deck words via loadDeckWords() in $lib/content/vocabulary/loadDeck.ts instead — it resolves and validates the deck\'s word ids and keeps the deck lazily loaded (Conventions #10).'
						},
						{
							group: ['*/content/dialogues/dialogues/*', '$lib/content/dialogues/dialogues/*'],
							message:
								'Import a dialogue via loadDialogue() in $lib/content/dialogues/loadDialogue.ts instead — it validates the dialogue against the word library and keeps its lines lazily loaded (Conventions #10).'
						}
					]
				}
			],
			'no-restricted-syntax': ['error', localePathRestriction, localePathTemplateRestriction]
		}
	},
	{
		// TypeScript's own unused-parameter checking is stricter; this rule is here
		// only to flag unused imports and locals, which the compiler doesn't.
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
			// Svelte 5 registers a reactive dependency with a bare property-access
			// statement inside $effect(), which a JS-only rule can't tell from a
			// useless expression. Left on for plain .ts files.
			'no-unused-expressions': 'off',
			'@typescript-eslint/no-unused-expressions': 'off'
		}
	}
);
