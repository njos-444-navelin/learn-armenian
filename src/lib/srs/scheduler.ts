/**
 * A simplified Anki-style SM-2 scheduler: new cards move through a couple of
 * short "learning" steps (minutes), graduate into "review" (days, growing by
 * ease factor), and a failed review card drops into "relearning" before
 * graduating back. This is deliberately not the full Anki algorithm — no
 * fuzz, no leech detection, no per-deck configurable steps — just enough to
 * resemble it per the product spec. Pure and framework-free so it can run
 * identically on the client (to preview each grade button's resulting wait)
 * and on the server (to compute the value that actually gets persisted).
 */

export type Grade = 'again' | 'hard' | 'good' | 'easy';

export type CardPhase = 'learning' | 'relearning' | 'review';

/**
 * Shaped to match the columns of `user_vocabulary_progress` one-to-one, so a
 * graded result can be upserted as-is with no translation step.
 */
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

/** The implicit state of a word the learner has never graded — see the
 * comment on `user_vocabulary_progress` for why "new" is "row absent",
 * not a stored phase. */
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
// Kept apart on purpose: pressing 'good' on a card's last learning step
// graduates it at GRADUATING_INTERVAL_DAYS, and 'easy' from anywhere in
// learning jumps straight to EASY_INTERVAL_DAYS — if these two ever matched,
// the two buttons would show (and schedule) the exact same wait on that
// step, the same ambiguity 'hard'/'again' had before they were split out
// below. 1d vs 2d keeps them visibly distinct at every step, while still
// landing softer than Anki's own 4d default — a first-time-ever "easy" on a
// never-studied word shouldn't jump as far ahead as "easy" on a card you're
// merely reviewing again.
const GRADUATING_INTERVAL_DAYS = 1;
const EASY_INTERVAL_DAYS = 2;
const MIN_EASE = 1.3;
const HARD_INTERVAL_MULTIPLIER = 1.2;
const EASY_BONUS = 1.3;
/** Matches Anki's own default ceiling — a review-phase interval compounds
 * by the ease factor on every successful grade, so without a cap a card
 * reviewed correctly for years on end would keep growing indefinitely. */
const MAX_INTERVAL_DAYS = 36500;
const LAPSE_EASE_PENALTY = 0.2;
const HARD_EASE_PENALTY = 0.15;
const EASY_EASE_BONUS = 0.15;
/** Anki's monotonicity rule: in the review phase each better grade must
 * schedule at least this much later than the grade below it (good ≥ hard +
 * 1d, easy ≥ good + 1d). The multipliers alone can't guarantee that — at
 * the ease floor, 'hard' (×1.2) and 'good' (×1.3) land only 8% apart, close
 * enough that the whole-day button labels render identically. */
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
		// Repeats the current step (doesn't advance `step`), but must never
		// land on the same wait as 'again' — otherwise the two buttons are
		// indistinguishable on a card's very first step, where 'again'
		// resets to exactly the same step 'hard' is already sitting on.
		// Splits the difference between the current step and the next one
		// (or, on the last step, waits 1.5x the current step, since there's
		// no next one to split with).
		const current = steps[state.step] ?? steps[steps.length - 1] ?? 1;
		const next = steps[state.step + 1];
		const delay = next !== undefined ? (current + next) / 2 : current * 1.5;
		return { ...state, dueAt: addMinutes(now, delay) };
	}

	// good: advances to the next step, or graduates to 'review' once the
	// step list is exhausted.
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
	// The three success grades form a chain — each interval is floored at
	// the previous grade's interval plus MIN_GRADE_SEPARATION_DAYS, so the
	// buttons always show (and schedule) strictly increasing waits. Only the
	// MAX_INTERVAL_DAYS cap is allowed to collapse them back together.
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
 * Advances a card's SRS state by one grade. Deterministic in `now` — the
 * client calls this to preview each of the four buttons' resulting wait
 * before the learner picks one, and the server calls the exact same
 * function to compute the value it persists. Never trust a client-computed
 * `CardState`, only the `Grade` it submits.
 */
export function gradeCard(current: CardState, grade: Grade, now: Date): CardState {
	if (current.phase === 'review') {
		return gradeReviewPhase(current, grade, now);
	}
	const steps = current.phase === 'learning' ? LEARNING_STEPS_MIN : RELEARNING_STEPS_MIN;
	return gradeLearningLikePhase(current, steps, grade, now);
}

/** All four grades' resulting states, keyed by grade — lets the UI show
 * each button's resulting wait before the learner picks one. */
export function previewGrades(current: CardState, now: Date): Record<Grade, CardState> {
	return {
		again: gradeCard(current, 'again', now),
		hard: gradeCard(current, 'hard', now),
		good: gradeCard(current, 'good', now),
		easy: gradeCard(current, 'easy', now)
	};
}

/** Whole minutes from `now` until `state` is due, floored at 0 for an
 * already-due (or new) card — never negative, so it's safe to feed straight
 * into a duration label. */
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

/** Column shape of `user_vocabulary_progress`, snake_case to match Postgres
 * as read back from Supabase — the boundary between this module's `CardState`
 * and the DB row lives entirely in the two functions below. */
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
