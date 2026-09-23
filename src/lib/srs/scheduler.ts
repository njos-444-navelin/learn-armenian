/**
 * A simplified Anki-style SM-2 scheduler. Pure and framework-free so the
 * client's preview of each grade button and the server's persisted value come
 * out of the same code.
 */

export type Grade = 'again' | 'hard' | 'good' | 'easy';

export type CardPhase = 'learning' | 'relearning' | 'review';

/** Matches the columns of `user_vocabulary_progress`, so a graded result upserts as-is. */
export interface CardState {
	phase: CardPhase;
	/** Index into the current phase's step list. Meaningless once `phase` is 'review'. */
	step: number;
	/** Days until the next review. Only meaningful once `phase` is 'review'. */
	intervalDays: number;
	easeFactor: number;
	dueAt: Date;
	reps: number;
	lapses: number;
}

/** A word the learner has never graded: "new" is an absent row, not a stored phase. */
export const NEW_CARD: CardState = {
	phase: 'learning',
	step: 0,
	intervalDays: 0,
	easeFactor: 2.5,
	dueAt: new Date(0),
	reps: 0,
	lapses: 0
};

const LEARNING_STEPS_MIN = [1, 10] as const;
const RELEARNING_STEPS_MIN = [10] as const;
// Must stay apart: if they matched, 'good' and 'easy' would show and
// schedule the same wait on a card's last learning step.
const GRADUATING_INTERVAL_DAYS = 1;
const EASY_INTERVAL_DAYS = 2;
const MIN_EASE = 1.3;
const HARD_INTERVAL_MULTIPLIER = 1.2;
const EASY_BONUS = 1.3;
/** Anki's default ceiling; review intervals compound by ease factor without one. */
const MAX_INTERVAL_DAYS = 36500;
const LAPSE_EASE_PENALTY = 0.2;
const HARD_EASE_PENALTY = 0.15;
const EASY_EASE_BONUS = 0.15;
/** Each better review grade must land this much later than the one below it. At
 * the ease floor the multipliers alone leave 'hard' and 'good' 8% apart, which
 * rounds to identical whole-day labels. */
const MIN_GRADE_SEPARATION_DAYS = 1;

const MINUTE_MS = 60_000;
const DAY_MS = 24 * 60 * MINUTE_MS;

function addMinutes(now: Date, minutes: number): Date {
	return new Date(now.getTime() + minutes * MINUTE_MS);
}

function addDays(now: Date, days: number): Date {
	return new Date(now.getTime() + days * DAY_MS);
}

function gradeLearningLikePhase(
	state: CardState,
	steps: readonly number[],
	grade: Grade,
	now: Date
): CardState {
	if (grade === 'again') {
		const first = steps[0] ?? 1;
		return { ...state, step: 0, dueAt: addMinutes(now, first) };
	}
	if (grade === 'easy') {
		return {
			...state,
			phase: 'review',
			step: 0,
			intervalDays: EASY_INTERVAL_DAYS,
			dueAt: addDays(now, EASY_INTERVAL_DAYS),
			reps: state.reps + 1
		};
	}

	if (grade === 'hard') {
		// Repeats the current step, but offset between it and the next one so it
		// never lands on the same wait as 'again' (which resets to this step).
		const current = steps[state.step] ?? steps[steps.length - 1] ?? 1;
		const next = steps[state.step + 1];
		const delay = next !== undefined ? (current + next) / 2 : current * 1.5;
		return { ...state, dueAt: addMinutes(now, delay) };
	}

	// good
	const nextStep = state.step + 1;
	const nextDelay = steps[nextStep];
	if (nextDelay === undefined) {
		return {
			...state,
			phase: 'review',
			step: 0,
			intervalDays: GRADUATING_INTERVAL_DAYS,
			dueAt: addDays(now, GRADUATING_INTERVAL_DAYS),
			reps: state.reps + 1
		};
	}
	return { ...state, step: nextStep, dueAt: addMinutes(now, nextDelay) };
}

function gradeReviewPhase(state: CardState, grade: Grade, now: Date): CardState {
	if (grade === 'again') {
		const first = RELEARNING_STEPS_MIN[0];
		return {
			...state,
			phase: 'relearning',
			step: 0,
			easeFactor: Math.max(MIN_EASE, state.easeFactor - LAPSE_EASE_PENALTY),
			dueAt: addMinutes(now, first),
			lapses: state.lapses + 1
		};
	}
	// Chained so each success grade schedules strictly later than the one below
	// it; only the MAX_INTERVAL_DAYS cap may collapse them together.
	const hardDays = Math.min(MAX_INTERVAL_DAYS, state.intervalDays * HARD_INTERVAL_MULTIPLIER);
	const goodDays = Math.min(
		MAX_INTERVAL_DAYS,
		Math.max(hardDays + MIN_GRADE_SEPARATION_DAYS, state.intervalDays * state.easeFactor)
	);

	if (grade === 'hard') {
		const easeFactor = Math.max(MIN_EASE, state.easeFactor - HARD_EASE_PENALTY);
		return {
			...state,
			easeFactor,
			intervalDays: hardDays,
			dueAt: addDays(now, hardDays),
			reps: state.reps + 1
		};
	}
	if (grade === 'good') {
		return { ...state, intervalDays: goodDays, dueAt: addDays(now, goodDays), reps: state.reps + 1 };
	}

	// easy
	const easeFactor = state.easeFactor + EASY_EASE_BONUS;
	const easyDays = Math.min(
		MAX_INTERVAL_DAYS,
		Math.max(goodDays + MIN_GRADE_SEPARATION_DAYS, state.intervalDays * easeFactor * EASY_BONUS)
	);
	return { ...state, easeFactor, intervalDays: easyDays, dueAt: addDays(now, easyDays), reps: state.reps + 1 };
}

/**
 * Deterministic in `now`, so client and server agree. Never trust a
 * client-computed `CardState` — only the `Grade` it submits.
 */
export function gradeCard(current: CardState, grade: Grade, now: Date): CardState {
	if (current.phase === 'review') {
		return gradeReviewPhase(current, grade, now);
	}
	const steps = current.phase === 'learning' ? LEARNING_STEPS_MIN : RELEARNING_STEPS_MIN;
	return gradeLearningLikePhase(current, steps, grade, now);
}

/** Lets the UI label each grade button with the wait it would schedule. */
export function previewGrades(current: CardState, now: Date): Record<Grade, CardState> {
	return {
		again: gradeCard(current, 'again', now),
		hard: gradeCard(current, 'hard', now),
		good: gradeCard(current, 'good', now),
		easy: gradeCard(current, 'easy', now)
	};
}

/** Floored at 0, so an already-due card is safe to feed into a duration label. */
export function minutesUntilDue(state: CardState, now: Date): number {
	return Math.max(0, Math.round((state.dueAt.getTime() - now.getTime()) / MINUTE_MS));
}

export function isDue(state: CardState, now: Date): boolean {
	return state.dueAt.getTime() <= now.getTime();
}

const GRADES: readonly Grade[] = ['again', 'hard', 'good', 'easy'];

export function isGrade(value: string): value is Grade {
	return (GRADES as readonly string[]).includes(value);
}

/** The `user_vocabulary_progress` row as Supabase returns it. */
export interface CardStateRow {
	phase: CardPhase;
	step: number;
	interval_days: number;
	ease_factor: number;
	due_at: string;
	reps: number;
	lapses: number;
}

export function cardStateFromRow(row: CardStateRow): CardState {
	return {
		phase: row.phase,
		step: row.step,
		intervalDays: row.interval_days,
		easeFactor: row.ease_factor,
		dueAt: new Date(row.due_at),
		reps: row.reps,
		lapses: row.lapses
	};
}

export function cardStateToRow(state: CardState): CardStateRow {
	return {
		phase: state.phase,
		step: state.step,
		interval_days: state.intervalDays,
		ease_factor: state.easeFactor,
		due_at: state.dueAt.toISOString(),
		reps: state.reps,
		lapses: state.lapses
	};
}
