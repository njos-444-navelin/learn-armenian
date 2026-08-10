import { LOCALES, type Locale } from './locale';

/** Prefixes an absolute pathname with a locale segment, e.g. `withLocale('ru', '/learn')` -> `/ru/learn`. */
export function withLocale(locale: Locale, pathname: string): string {
	const normalized = pathname.startsWith('/') ? pathname : `/${pathname}`;
	return normalized === '/' ? `/${locale}` : `/${locale}${normalized}`;
}

/** Strips a leading `/en` or `/ru` segment from a pathname, e.g. `/ru/learn` -> `/learn`. */
export function withoutLocale(pathname: string): string {
	for (const locale of LOCALES) {
		const prefix = `/${locale}`;
		if (pathname === prefix) {
			return '/';
		}
		if (pathname.startsWith(`${prefix}/`)) {
			return pathname.slice(prefix.length);
		}
	}
	return pathname;
}
