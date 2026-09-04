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

/** A deck's difficulty tier — shown alongside its word count (see
 * `deckMetaLabel` in `dictionaries/vocabulary.ts`). Only one tier exists so
 * far, but every deck already carries it explicitly so a future
 * intermediate/advanced deck doesn't require retrofitting the catalog. */
export type VocabularyLevel = 'beginner';

/** One glyph per deck, rendered by `VocabularyDeckIcon.svelte` — see
 * docs/DESIGN.md's Icons section. Extend this union (and that component's
 * icon lookup) when a new deck needs a shape that doesn't exist yet. */
export type VocabularyDeckIconId = 'hand' | 'zap';

export interface VocabularyDeck {
	id: string;
	title: Translated;
	/** Shown under the title in the deck list, and under the heading on the
	 * deck's own page. */
	description: Translated;
	level: VocabularyLevel;
	/** Must match this deck's own word count in `decks/<id>.ts` — kept as a
	 * plain number here (not derived from the words themselves) so the
	 * catalog stays free of word data; see Conventions §10. */
	wordCount: number;
	icon: VocabularyDeckIconId;
}
