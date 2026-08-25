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

/** Never mutates `items`. Repeated splice, not a swap-based Fisher-Yates —
 * the alphabet is small enough (39 letters) that splice's O(n) shift per
 * pick doesn't matter, and it sidesteps `noUncheckedIndexedAccess` flagging
 * every `arr[i]` in a swap as possibly `undefined`. */
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
 * Builds one adaptive practice session: up to 5 never-met letters get
 * introduced, then drilled alongside the 3 weakest already-met letters;
 * once nothing is unmet, a session is just the 8 weakest letters straight
 * to drill. Not pure — see the shuffle below — so the Practice button's
 * subtitle preview and an actually-started session can (and normally do)
 * land on different specific letters; that's fine, since the preview only
 * ever displays a *count* (`sessionPreview.learnLetters.length` etc. in
 * AlphabetTrainer.svelte), never a specific letter.
 */
export function buildSession(
	letters: readonly AlphabetLetter[],
	levelByLetterId: Readonly<Record<string, number>>
): PracticeSession {
	const levelOf = (letter: AlphabetLetter): number => levelByLetterId[letter.id] ?? LEVEL_MIN;

	// Shuffled once, up front, rather than per tier: `.sort()` is guaranteed
	// stable (ES2019+), so sorting this shuffled order by level below keeps
	// same-level letters in their (already random) relative order instead
	// of snapping back to canonical alphabet order — "weakest genuinely
	// first" and "random among a tie" for free from one shuffle.
	const pool = shuffled(letters);

	const unmet = pool.filter((letter) => levelOf(letter) === LEVEL_MIN).slice(0, MAX_NEW_LETTERS);
	const weakest = pool
		.filter((letter) => levelOf(letter) > LEVEL_MIN)
		.sort((a, b) => levelOf(a) - levelOf(b))
		.slice(0, unmet.length > 0 ? WEAKEST_WITH_NEW : WEAKEST_ONLY);

	return { learnLetters: unmet, drillLetters: [...unmet, ...weakest] };
}
