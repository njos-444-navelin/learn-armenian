import { page } from '$app/state';
import { DEFAULT_LOCALE, isLocale, type Locale } from './locale';
import type { PartiallyTranslated, Translated } from './types';

/** Current locale, derived from the `[lang]` route param. SSR-safe, no store wiring needed. */
export function getLocale(): Locale {
	const raw: string | undefined = page.params['lang'];
	return raw !== undefined && isLocale(raw) ? raw : DEFAULT_LOCALE;
}

/** Resolves a bilingual dictionary entry to the string for the current locale. */
export function t(dict: Translated): string {
	return dict[getLocale()];
}

/**
 * `undefined` when this locale has no text, so the caller can skip the
 * element. No fallback to the other language on purpose — showing a reader a
 * sentence written for the other one is what `PartiallyTranslated` avoids.
 */
export function tPartial(dict: PartiallyTranslated | undefined): string | undefined {
	return dict?.[getLocale()];
}
