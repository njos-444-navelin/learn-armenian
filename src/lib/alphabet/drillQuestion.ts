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
	/** Only meaningful for `type: 'case'` — which form is shown vs. asked for,
	 * chosen randomly per question so both directions occur (per the user's
	 * own spec: "sometimes ... a capitalized letter for a lowercase one and
	 * vice versa"). */
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
 * Builds one drill question for `letter`: its confusable partner (if any) is
 * the first-choice distractor — the wrong option actually worth testing
 * against — backfilled with shuffled random fillers up to 4 options total.
 *
 * `type: 'case'` needs a `letter.uppercase` to ask about — 'yev' (և) has
 * none (see alphabet.ts), so that one letter quietly falls back to a
 * `'sound'` question instead whenever the round-robin would otherwise land
 * it on 'case'.
 */
export function buildDrillQuestion(
	letter: AlphabetLetter,
	allLetters: readonly AlphabetLetter[],
	type: DrillQuestionType
): DrillQuestion {
	const effectiveType = type === 'case' && letter.uppercase === undefined ? 'sound' : type;
	// A case question's distractors must also have both forms — 'yev' (և)
	// can't fill in as a wrong option any more than it can be the letter
	// being tested, or it'd have no glyph to show in whichever direction
	// this question asks.
	const candidateLetters =
		effectiveType === 'case' ? allLetters.filter((entry) => entry.uppercase !== undefined) : allLetters;

	const partner = shuffle(confusablePartners(letter.id).filter((id) => candidateLetters.some((entry) => entry.id === id))).slice(0, 1);
	const usedIds = new Set([letter.id, ...partner]);
	const fillers = shuffle(candidateLetters.filter((entry) => !usedIds.has(entry.id))).map((entry) => entry.id);
	const optionIds = shuffle([letter.id, ...partner, ...fillers].slice(0, OPTION_COUNT));

	if (effectiveType !== 'case') {
		return { type: effectiveType, letter, optionIds };
	}
	const caseDirection: CaseDirection = Math.random() < 0.5 ? 'upperToLower' : 'lowerToUpper';
	return { type: effectiveType, letter, optionIds, caseDirection };
}
