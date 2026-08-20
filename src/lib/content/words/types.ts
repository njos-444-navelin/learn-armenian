import type { Translated } from '$lib/i18n/types';

/**
 * Deliberately independent from `vocabulary/types.ts`'s `WordRegister`, not
 * imported from it — the two registries aren't unified (see the comment atop
 * `entries.ts`). Keep them identical in shape so a future merge is a rename,
 * not a redesign.
 */
export type WordRegister = 'informal' | 'formal';

/**
 * A cross-feature word: currently sourced by the alphabet trainer's "in a
 * word" examples, meant to also back a future Dialogues feature (tap a word
 * in a transcript, hear it) and a searchable dictionary — see `entries.ts`.
 */
export interface Word {
	id: string;
	/** Always capitalized — same convention as `VocabularyWord.armenian` (Conventions §10). */
	armenian: string;
	translation: Translated;
	register?: WordRegister | undefined;
	note?: Translated | undefined;
}
