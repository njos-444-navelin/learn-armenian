/**
 * An ordered list of ids into the word library (`words/entries.ts`) — the
 * deck owns the *selection and order*, never the words themselves. Loaded
 * through `loadDeck.ts`, which resolves the ids and rejects a typo'd one;
 * never import this file directly (Conventions §10).
 */
export const WORD_IDS: readonly string[] = [
	'aprel',
	'khaghal',
	'gnal',
	'sovorel',
	'ashkhatel',
	'sirel',
	'uzel',
	'utel',
	'kardal',
	'grel',
	'gnel',
	'haskanal',
	'asel',
	'khosel',
	'lsel',
	'nayel',
	'tesnel',
	'anel',
	'linel',
	'khndrel'
];
