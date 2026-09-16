/**
 * An ordered list of ids into the word library (`words/entries.ts`) — the
 * deck owns the *selection and order*, never the words themselves. Loaded
 * through `loadDeck.ts`, which resolves the ids and rejects a typo'd one;
 * never import this file directly (Conventions §10).
 */
export const WORD_IDS: readonly string[] = [
	'mayrik',
	'hayrik',
	'papik',
	'tatik',
	'kuyr',
	'akhper',
	'kin',
	'amusin',
	'mard',
	'tgha',
	'aghjik',
	'tghamard',
	'ynker',
	'morkur',
	'horkur',
	'hopar',
	'keri',
	'yerekha',
	'harazat',
	'barekam'
];
