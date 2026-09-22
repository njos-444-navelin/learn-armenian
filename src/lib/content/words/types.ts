import type { PartiallyTranslated, Translated } from '$lib/i18n/types';

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
	/** The comment that shows everywhere the word appears — its card, the trainer and every
	 * dialogue popover. Says what the word *is*: a grammatical form, an extra sense, a look-alike
	 * to keep it apart from (գնալ / գնել, one letter apart). Must be true of the word in any
	 * sentence and must not quote a phrase (docs/DIALOGUES.md, "Word comments").
	 *
	 * May carry one language only, when the fact is worth stating to one reader and not the
	 * other; the other reader then sees no comment, which beats a sentence written for someone
	 * else. Never half of a comment that both readers want — that's an unfinished entry. */
	global?: PartiallyTranslated | undefined;
	/** The comment that shows on the word's card only (the deck list and the trainer), where the
	 * learner meets the word without a sentence around it: when and to whom it's said, the
	 * greeting it makes, where its mark sits. Never in a dialogue popover: there the line itself
	 * is the usage, and anything a specific line needs is the token's `here` remark — a learner
	 * tapping Լույս in "there's a lot of light in here" doesn't need to hear about բարի լույս.
	 * Unlike `global`, this may quote a phrase, since explaining the phrase is the point.
	 * One language only is allowed here too — see `global`. */
	cardOnly?: PartiallyTranslated | undefined;
}
