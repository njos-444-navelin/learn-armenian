import type { Translated } from '$lib/i18n/types';

/**
 * A word's register — which social context it's appropriate in. Armenian,
 * like Russian, distinguishes an informal/colloquial form from a
 * formal/literary one for some everyday words (see `Ոնց`/`Ինչպես` and
 * `Ապրես`/`Ապրեք` in `decks/greetings.ts`).
 */
export type WordRegister = 'informal' | 'formal';

export interface VocabularyWord {
	id: string;
	/** Always capitalized — see Conventions §10. */
	armenian: string;
	translation: Translated;
	register?: WordRegister | undefined;
	/** Extra context that doesn't fit in a one-line translation, e.g. explaining a grammatical form. */
	note?: Translated | undefined;
}

export interface VocabularyDeck {
	id: string;
	title: Translated;
}
