import type { AlphabetLetter } from '$lib/content/alphabet';
import { confusablePartners } from '$lib/content/alphabetConfusables';

export type DrillQuestionType = 'sound' | 'audio' | 'case';

/** Round-robin order questions cycle through across a session. */
export const DRILL_QUESTION_TYPES: readonly DrillQuestionType[] = ['sound', 'audio', 'case'];

export type CaseDirection = 'upperToLower' | 'lowerToUpper';

export interface DrillQuestion {
	type: DrillQuestionType;
	/** The letter this question is actually testing — always among `optionIds`. */
	letter: AlphabetLetter;
	/** 4 letter ids, shuffled, one of which is `letter.id`. */
	optionIds: readonly string[];
	/** `type: 'case'` only — which form is shown and which is asked for, chosen
	 * randomly per question so both directions occur. */
	caseDirection?: CaseDirection | undefined;
}

const OPTION_COUNT = 4;

function shuffle<T>(items: readonly T[]): T[] {
	const copy = [...items];
	for (let i = copy.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		const a = copy[i];
		const b = copy[j];
		if (a === undefined || b === undefined) continue;
		copy[i] = b;
		copy[j] = a;
	}
	return copy;
}

/**
 * One drill question for `letter`: its confusable partner, if it has one, is
 * the first-choice distractor, backfilled with shuffled fillers to 4 options.
 *
 * `type: 'case'` needs a `letter.uppercase`, which 'yev' (և) hasn't got, so
 * that letter falls back to a `'sound'` question.
 */
export function buildDrillQuestion(
	letter: AlphabetLetter,
	allLetters: readonly AlphabetLetter[],
	type: DrillQuestionType
): DrillQuestion {
	const effectiveType = type === 'case' && letter.uppercase === undefined ? 'sound' : type;
	// A case question's distractors need both forms too, so 'yev' (և) can't
	// fill in as a wrong option either.
	const candidateLetters =
		effectiveType === 'case'
			? allLetters.filter((entry) => entry.uppercase !== undefined)
			: allLetters;

	const partner = shuffle(
		confusablePartners(letter.id).filter((id) => candidateLetters.some((entry) => entry.id === id))
	).slice(0, 1);
	const usedIds = new Set([letter.id, ...partner]);
	const fillers = shuffle(candidateLetters.filter((entry) => !usedIds.has(entry.id))).map(
		(entry) => entry.id
	);
	const optionIds = shuffle([letter.id, ...partner, ...fillers].slice(0, OPTION_COUNT));

	if (effectiveType !== 'case') {
		return { type: effectiveType, letter, optionIds };
	}
	const caseDirection: CaseDirection = Math.random() < 0.5 ? 'upperToLower' : 'lowerToUpper';
	return { type: effectiveType, letter, optionIds, caseDirection };
}
