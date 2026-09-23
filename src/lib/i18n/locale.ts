export const LOCALES = ['en', 'ru'] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';

export function isLocale(value: string): value is Locale {
	return (LOCALES as readonly string[]).includes(value);
}

/** Decorative, identical in every UI language, so it lives outside the i18n
 * dictionaries and must always be rendered `aria-hidden` alongside a real
 * translated label — see docs/CONVENTIONS.md. */
export const LOCALE_FLAGS: Record<Locale, string> = {
	en: '🇬🇧',
	ru: '🇷🇺'
};
