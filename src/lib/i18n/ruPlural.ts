/**
 * Declines a Russian noun that follows the standard 1/2-4/5+ count pattern
 * (e.g. слово/слова/слов) by count. `forms` is `[one, few, many]` — the
 * singular, the 2-4 form, and the 5+/11-14 form, in that order.
 */
export function ruPluralForm(count: number, forms: readonly [string, string, string]): string {
	const mod10 = count % 10;
	const mod100 = count % 100;
	if (mod10 === 1 && mod100 !== 11) return forms[0];
	if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1];
	return forms[2];
}

/** `ruPluralForm()` specialized for "слово" (word) — used wherever a count of
 * vocabulary words needs a Russian noun, e.g. `collectionCountLabel` in
 * `dictionaries/account.ts` and `deckMetaLabel` in `dictionaries/vocabulary.ts`. */
export function ruWordForm(count: number): string {
	return ruPluralForm(count, ['слово', 'слова', 'слов']);
}
