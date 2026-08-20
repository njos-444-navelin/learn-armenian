/**
 * The alphabet trainer's mastery model: a plain 0-10 level per letter, +1 on
 * a correct drill answer, -1 on an incorrect one, clamped at both ends. This
 * is deliberately much simpler than `srs/scheduler.ts`'s SM-2 scheduling
 * (no due dates, no ease factor) — a different domain (recognition
 * strength, not spaced review) that doesn't need that machinery. Pure and
 * framework-free, same shape as the scheduler, so it runs identically on
 * the client (optimistic UI update) and the server (the value that
 * actually gets persisted).
 */

export const LEVEL_MIN = 0;
export const LEVEL_MAX = 10;

/** The implicit level of a letter the learner has never answered — see the
 * comment on `user_alphabet_progress` for why "unmet" is "row absent," not
 * a stored value. */
export const NEW_LEVEL = LEVEL_MIN;

export function applyAnswer(current: number, correct: boolean): number {
	if (correct) return Math.min(LEVEL_MAX, current + 1);
	return Math.max(LEVEL_MIN, current - 1);
}
