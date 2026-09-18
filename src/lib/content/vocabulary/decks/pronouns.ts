/**
 * An ordered list of ids into the word library (`words/entries.ts`) — the
 * deck owns the *selection and order*, never the words themselves. Loaded
 * through `loadDeck.ts`, which resolves the ids and rejects a typo'd one;
 * never import this file directly (Conventions §10).
 *
 * The lesson's order, with two changes: Նա and Նրանք are listed once each
 * (the lesson has them twice, as a personal pronoun and as a demonstrative,
 * and one card carries both senses), and Այս, Այդ and Այն come before Սա
 * and the rest, whose comments explain them as "Այս used on its own" — a
 * learner going through the deck in order has to have met Այս first.
 */
export const WORD_IDS: readonly string[] = [
	'yes',
	'du',
	'na',
	'menk',
	'duk',
	'nrank',
	'ays',
	'ayd',
	'ayn',
	'sa',
	'da',
	'srank',
	'drank'
];
