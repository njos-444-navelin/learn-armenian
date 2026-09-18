/**
 * An ordered list of ids into the word library (`words/entries.ts`) — the
 * deck owns the *selection and order*, never the words themselves. Loaded
 * through `loadDeck.ts`, which resolves the ids and rejects a typo'd one;
 * never import this file directly (Conventions §10).
 *
 * The lesson's order, with Նա and Նրանք listed once each — the lesson has
 * them twice, as a personal pronoun and as a demonstrative, and one card
 * carries both senses.
 */
export const WORD_IDS: readonly string[] = [
	'yes',
	'du',
	'na',
	'menk',
	'duk',
	'nrank',
	'sa',
	'da',
	'srank',
	'drank',
	'ays',
	'ayd',
	'ayn'
];
