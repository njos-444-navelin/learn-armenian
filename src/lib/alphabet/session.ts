import type { AlphabetLetter } from '$lib/content/alphabet';
import { LEVEL_MIN } from './mastery';

const MAX_NEW_LETTERS = 5;
const WEAKEST_WITH_NEW = 3;
const WEAKEST_ONLY = 8;

export interface PracticeSession {
	/** Never-met letters (level 0) to introduce one-by-one before drilling. */
	learnLetters: readonly AlphabetLetter[];
	/** Every letter this session drills — `learnLetters` plus already-met
	 * weak letters, or just the weakest letters if nothing is unmet. */
	drillLetters: readonly AlphabetLetter[];
}

/**
 * Builds one adaptive practice session: up to 5 never-met letters (in
 * canonical alphabet order) get introduced, then drilled alongside the 3
 * weakest already-met letters; once nothing is unmet, a session is just the
 * 8 weakest letters straight to drill. Pure — runs identically for the
 * Practice button's subtitle preview and for actually starting a session,
 * since every letter's level is already available client-side.
 */
export function buildSession(
	letters: readonly AlphabetLetter[],
	levelByLetterId: Readonly<Record<string, number>>
): PracticeSession {
	const levelOf = (letter: AlphabetLetter): number => levelByLetterId[letter.id] ?? LEVEL_MIN;

	const unmet = letters.filter((letter) => levelOf(letter) === LEVEL_MIN).slice(0, MAX_NEW_LETTERS);
	const weakest = letters
		.filter((letter) => levelOf(letter) > LEVEL_MIN)
		.slice()
		.sort((a, b) => levelOf(a) - levelOf(b))
		.slice(0, unmet.length > 0 ? WEAKEST_WITH_NEW : WEAKEST_ONLY);

	return { learnLetters: unmet, drillLetters: [...unmet, ...weakest] };
}
