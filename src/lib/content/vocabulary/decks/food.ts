/**
 * An ordered list of ids into the word library (`words/entries.ts`) — the
 * deck owns the *selection and order*, never the words themselves. Loaded
 * through `loadDeck.ts`, which resolves the ids and rejects a typo'd one;
 * never import this file directly (Conventions §10).
 *
 * The lesson's order, with one change: Ձուկ is lifted to sit next to Ձու, a
 * letter apart and a syllable apart, so the pair is read together. The rest
 * already reads well as a sequence: Միս comes before the two kinds of meat
 * built on it, and Կաթ before Կաթնաշոռ, whose comment points back to it.
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
