/**
 * The alphabet trainer's mastery model: a 0-10 level per letter, +1 on a
 * correct drill answer, -1 on an incorrect one. Much simpler than
 * `srs/scheduler.ts` because recognition strength isn't spaced review. Pure,
 * so client and server compute the same value.
 */

export const LEVEL_MIN = 0;
export const LEVEL_MAX = 10;

/** A letter the learner has never answered: "unmet" is an absent row, not a
 * stored value. */
export const NEW_LEVEL = LEVEL_MIN;

export function applyAnswer(current: number, correct: boolean): number {
	if (correct) return Math.min(LEVEL_MAX, current + 1);
	return Math.max(LEVEL_MIN, current - 1);
}
