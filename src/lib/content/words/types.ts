import type { Translated } from '$lib/i18n/types';

/**
 * A word's register — which social context it's appropriate in. Armenian,
 * like Russian, distinguishes an informal/colloquial form from a
 * formal/literary one for some everyday words (see `Ոնց`/`Ինչպես` and
 * `Ապրես`/`Ապրեք` in `entries.ts`).
 */
export type WordRegister = 'informal' | 'formal';

/**
 * One entry in the app-wide word library (`entries.ts`) — the single
 * definition of a word that every feature shares: a vocabulary deck lists
 * it by id, the alphabet trainer shows it as a letter's "in a word"
 * example, a dialogue links an inflected token back to it. Its
 * pronunciation clip lives at `wordAudioSrc(id)` (see `audio.ts`), once,
 * however many features play it.
 */
export interface Word {
	id: string;
	/** Always capitalized — see Conventions §10. */
	armenian: string;
	/** Capitalized in both languages — see Conventions §10. */
	translation: Translated;
	register?: WordRegister | undefined;
	/** Extra context that doesn't fit in a one-line translation, e.g. explaining a grammatical form. */
	note?: Translated | undefined;
}
