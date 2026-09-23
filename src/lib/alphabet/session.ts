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

/** Never mutates `items`. Repeated splice rather than a swap-based
 * Fisher-Yates: 39 letters make the O(n) shift irrelevant, and it avoids
 * `noUncheckedIndexedAccess` flagging every `arr[i]` in a swap. */
function shuffled<T>(items: readonly T[]): T[] {
	const pool = items.slice();
	const result: T[] = [];
	while (pool.length > 0) {
		const [picked] = pool.splice(Math.floor(Math.random() * pool.length), 1);
		if (picked !== undefined) result.push(picked);
	}
	return result;
}

/**
 * One adaptive practice session: up to 5 never-met letters are introduced and
 * then drilled with the 3 weakest already-met ones; once nothing is unmet, a
 * session is the 8 weakest letters straight to drill. Not pure — see the
 * shuffle below — so a preview and the real session pick different letters.
 * Only the counts are ever displayed.
 */
export function buildSession(
	letters: readonly AlphabetLetter[],
	levelByLetterId: Readonly<Record<string, number>>
): PracticeSession {
	const levelOf = (letter: AlphabetLetter): number => levelByLetterId[letter.id] ?? LEVEL_MIN;

	// Shuffled once up front rather than per tier: `.sort()` is stable, so
	// sorting by level keeps same-level letters in random relative order
	// instead of snapping back to alphabet order.
	const pool = shuffled(letters);

	const unmet = pool.filter((letter) => levelOf(letter) === LEVEL_MIN).slice(0, MAX_NEW_LETTERS);
	const weakest = pool
		.filter((letter) => levelOf(letter) > LEVEL_MIN)
		.sort((a, b) => levelOf(a) - levelOf(b))
		.slice(0, unmet.length > 0 ? WEAKEST_WITH_NEW : WEAKEST_ONLY);

	return { learnLetters: unmet, drillLetters: [...unmet, ...weakest] };
}
