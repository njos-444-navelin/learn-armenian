/**
 * Letters that trade places with each other in a beginner's ear — used as
 * the first-choice distractor when building a drill question, so the wrong
 * options are the ones actually worth testing against, not random filler.
 * Խ and Ճ each appear in two pairs, so this has to be a pair list + lookup
 * function rather than a single `confusableWith?` field per letter.
 */
export const CONFUSABLE_PAIRS: readonly (readonly [string, string])[] = [
	['to', 'tiwn'], // Թ / Տ — aspirated vs. unaspirated "t"
	['ca', 'tso'], // Ծ / Ց — unaspirated vs. aspirated "ts"
	['cheh', 'cha'], // Ճ / Չ — unaspirated vs. aspirated "ch"
	['peh', 'piwr'], // Պ / Փ — unaspirated vs. aspirated "p"
	['ken', 'keh'], // Կ / Ք — unaspirated vs. aspirated "k"
	['ghad', 'xeh'], // Ղ / Խ — gargled "gh" vs. raspy "h"
	['ra', 'reh'], // Ռ / Ր — rolled vs. soft "r"
	['ho', 'xeh'], // Հ / Խ — light "h" vs. raspy "h"
	['jheh', 'cheh'], // Ջ / Ճ — voiced "j" vs. unaspirated "ch"
	['yech', 'e'], // Ե / Է — position-dependent "e" vs. always "e"
	['o', 'vo'] // Օ / Ո — both "o", position-dependent for Ո
];

/** Every letter id this `letterId` is worth confusing with, in pair order. */
export function confusablePartners(letterId: string): readonly string[] {
	return CONFUSABLE_PAIRS.filter(([a, b]) => a === letterId || b === letterId).map(([a, b]) =>
		a === letterId ? b : a
	);
}
