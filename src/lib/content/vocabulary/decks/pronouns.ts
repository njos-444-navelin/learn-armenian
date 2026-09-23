/**
 * An ordered list of ids into the word library: the deck owns the selection
 * and order, never the words. Loaded through `loadDeck.ts`; never import it
 * directly (Conventions §10).
 *
 * The lesson's order, with two changes: Նա and Նրանք appear once each, with
 * both senses on one card, and Այս, Այդ and Այն come before the words whose
 * comments explain them as "Այս used on its own".
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
