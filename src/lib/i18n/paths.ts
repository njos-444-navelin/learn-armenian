import { isLocale, LOCALES, type Locale } from './locale';

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

/**
 * True for a same-origin, locale-prefixed app path (`/en/...`, `/ru/...`) —
 * never for an absolute URL, a protocol-relative `//host/...` path, or a
 * bare `/account` with no locale segment. Use this to validate any path
 * that arrives as user-controllable input (e.g. a `next` query param) before
 * redirecting to it — see `requireSignedIn()`'s `resume` option in
 * [`authGuard.ts`](../server/authGuard.ts), the only current caller.
 */
export function isSafeInternalPath(path: string): boolean {
	if (!path.startsWith('/') || path.startsWith('//')) return false;
	const [, lang] = path.split('/');
	return lang !== undefined && isLocale(lang);
}

/**
 * The path one level up in the app's route hierarchy, given a locale-stripped
 * pathname (e.g. `/learn/alphabet/quiz` -> `/learn/alphabet`). `undefined` at
 * the locale root (`/`) — there's nowhere further up to go.
 */
export function parentPath(pathname: string): string | undefined {
	if (pathname === '/') return undefined;
	const segments = pathname.split('/').filter((segment) => segment.length > 0);
	segments.pop();
	return segments.length === 0 ? '/' : `/${segments.join('/')}`;
}
