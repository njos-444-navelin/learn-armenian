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
	/** Extra context that doesn't fit in a one-line translation, e.g. explaining a grammatical form.
	 * Shown everywhere the word appears — its card and every dialogue popover — so it must be true
	 * of the word in any sentence and must not quote a phrase (docs/DIALOGUES.md, "Word notes"). */
	note?: Translated | undefined;
	/** How the word is used — the phrase it's mostly met in, which of two greetings it makes, and
	 * the like — or a look-alike to keep it apart from (Գնալ / Գնել, one letter apart). Shown on
	 * the word's card only (the deck list and the trainer), where the learner
	 * meets the word without a sentence around it. Never in a dialogue popover: there the line
	 * itself is the usage, and anything a specific line needs is the token's `here` remark — a
	 * learner tapping Լույս in "there's a lot of light in here" doesn't need to hear about
	 * Բարի լույս. Unlike `note`, this may quote a phrase, since explaining the phrase is the point. */
	usage?: Translated | undefined;
}
