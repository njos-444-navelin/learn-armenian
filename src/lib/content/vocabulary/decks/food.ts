/**
 * An ordered list of ids into the word library: the deck owns the selection
 * and order, never the words. Loaded through `loadDeck.ts`; never import it
 * directly (Conventions §10).
 *
 * The lesson's order, with one change: Ձուկ is lifted next to Ձու, a letter
 * and a syllable apart, so the pair reads together.
 */
export const WORD_IDS: readonly string[] = [
	'hats',
	'kat',
	'panir',
	'karag',
	'dzu',
	'dzuk',
	'mis',
	'tavari-mis',
	'khozi-mis',
	'hav',
	'brindz',
	'alyur',
	'shakaravaz',
	'agh',
	'dzet',
	'ttvaser',
	'katnashor',
	'jur',
	'tey',
	'surch'
];
