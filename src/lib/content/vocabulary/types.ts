import type { Translated } from '$lib/i18n/types';

// A deck's words are `Word`s from the app-wide library; re-exported so
// vocabulary code imports its word types from one place.
export type { Word, WordRegister } from '$lib/content/words/types';

/** Only one tier exists so far, but every deck carries it explicitly so a
 * later one doesn't require retrofitting the catalog. */
export type VocabularyLevel = 'beginner';

/** Extend this union, and `VocabularyDeckIcon.svelte`'s lookup, when a deck
 * needs a shape that doesn't exist yet. */
export type VocabularyDeckIconId = 'hand' | 'zap' | 'people' | 'person' | 'basket';

export interface VocabularyDeck {
	id: string;
	title: Translated;
	/** Shown under the title in the deck list, and under the heading on the
	 * deck's own page. */
	description: Translated;
	level: VocabularyLevel;
	/** Must match the length of this deck's `WORD_IDS`. Kept as a plain number so
	 * the catalog stays free of word data; see Conventions §10. */
	wordCount: number;
	icon: VocabularyDeckIconId;
}
