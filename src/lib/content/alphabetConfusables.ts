/**
 * Letters that trade places in a beginner's ear, used as the first-choice
 * distractor when building a drill question. A pair list rather than a
 * `confusableWith?` field, since Խ and Ճ each appear in two pairs.
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
