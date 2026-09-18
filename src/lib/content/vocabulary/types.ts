import type { Translated } from '$lib/i18n/types';

// A deck's words are `Word`s from the app-wide library (`words/types.ts`) —
// there is no separate vocabulary word type. Re-exported so vocabulary code
// can keep importing its word-related types from one place.
export type { Word, WordRegister } from '$lib/content/words/types';

/** A deck's difficulty tier — shown alongside its word count (see
 * `deckMetaLabel` in `dictionaries/vocabulary.ts`). Only one tier exists so
 * far, but every deck already carries it explicitly so a future
 * intermediate/advanced deck doesn't require retrofitting the catalog. */
export type VocabularyLevel = 'beginner';

/** One glyph per deck, rendered by `VocabularyDeckIcon.svelte` — see
 * docs/DESIGN.md's Icons section. Extend this union (and that component's
 * icon lookup) when a new deck needs a shape that doesn't exist yet. */
export type VocabularyDeckIconId = 'hand' | 'zap' | 'people' | 'person';

export interface VocabularyDeck {
	id: string;
	title: Translated;
	/** Shown under the title in the deck list, and under the heading on the
	 * deck's own page. */
	description: Translated;
	level: VocabularyLevel;
	/** Must match the length of this deck's `WORD_IDS` in `decks/<id>.ts` —
	 * kept as a plain number here (not derived from the list) so the catalog
	 * stays free of word data; see Conventions §10. */
	wordCount: number;
	icon: VocabularyDeckIconId;
}
