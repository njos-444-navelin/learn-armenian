/**
 * An ordered list of ids into the word library (`words/entries.ts`) — the
 * deck owns the *selection and order*, never the words themselves. Loaded
 * through `loadDeck.ts`, which resolves the ids and rejects a typo'd one;
 * never import this file directly (Conventions §10).
 */
export const WORD_IDS: readonly string[] = [
	'barev',
	'bari',
	'dzez',
	'luys',
	'aravot',
	'or',
	'irikun',
	'gisher',
	'ush',
	'hajogh',
	'hajoghutyun',
	'tstesutyun',
	'shnorhakalutyun',
	'apres',
	'aprek',
	'vonts',
	'inchpes',
	'lav',
	'vat',
	'normal'
];
