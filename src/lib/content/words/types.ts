import type { PartiallyTranslated, Translated } from '$lib/i18n/types';

/** Armenian, like Russian, has an informal and a formal form of some everyday
 * words — see `Ոնց`/`Ինչպես` in `entries.ts`. */
export type WordRegister = 'informal' | 'formal';

/**
 * One entry in the app-wide word library (`entries.ts`): the single definition
 * every feature shares. Its pronunciation clip lives at `wordAudioSrc(id)`,
 * once, however many features play it.
 */
export interface Word {
	id: string;
	/** Always capitalized — see Conventions §10. */
	armenian: string;
	/** Capitalized in both languages — see Conventions §10. */
	translation: Translated;
	register?: WordRegister | undefined;
	/** Shown everywhere the word appears. Says what the word *is*, must be true of
	 * it in any sentence, and never quotes a phrase (docs/DIALOGUES.md, "Word
	 * comments"). May carry one language only, when the fact is worth stating to
	 * one reader and not the other — but never half of a comment both want. */
	global?: PartiallyTranslated | undefined;
	/** Shown on the word's card only, where the learner meets it without a
	 * sentence around it. Never in a dialogue popover, where the line is the usage
	 * and the token's `here` covers what that line needs. Unlike `global`, it may
	 * quote a phrase. One language only is allowed here too. */
	cardOnly?: PartiallyTranslated | undefined;
}
