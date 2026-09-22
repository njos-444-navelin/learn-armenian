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
 * Resolves text that may be missing in this locale (see `PartiallyTranslated`)
 * — `undefined` when there is none, so the caller can skip the element. There
 * is deliberately no fallback to the other language: showing a Russian reader
 * a sentence written for an English one is the thing this type exists to
 * avoid.
 */
export function tPartial(dict: PartiallyTranslated | undefined): string | undefined {
	return dict?.[getLocale()];
}
