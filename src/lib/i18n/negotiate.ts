import { DEFAULT_LOCALE, isLocale, type Locale } from './locale';

/**
 * Picks the best-matching locale from an `Accept-Language` header, falling
 * back to {@link DEFAULT_LOCALE}. A simple primary-subtag match rather than
 * full RFC 4647: it only decides where `/` redirects to.
 */
export function resolveAcceptLanguage(header: string | null): Locale {
	if (header === null) {
		return DEFAULT_LOCALE;
	}

	const tags = header.split(',').map((part) => part.split(';')[0]?.trim().toLowerCase());

	for (const tag of tags) {
		if (tag === undefined) {
			continue;
		}
		const primary = tag.split('-')[0];
		if (primary !== undefined && isLocale(primary)) {
			return primary;
		}
	}

	return DEFAULT_LOCALE;
}
