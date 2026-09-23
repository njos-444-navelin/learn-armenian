import { resolve } from '$app/paths';
import type { Pathname, ResolvedPathname } from '$app/types';
import { isLocale, LOCALES, type Locale } from './locale';

/**
 * Every locale-scoped route, keyed by the locale-stripped path callers use
 * and mapped to the route ID `resolve()` needs. Add a route here as well as
 * under `src/routes/` for it to be reachable via `withLocale()`.
 */
const ROUTES = {
	'/': '/[lang=locale]',
	'/account': '/[lang=locale]/account',
	'/account/change-email': '/[lang=locale]/account/change-email',
	'/account/change-password': '/[lang=locale]/account/change-password',
	'/account/contact': '/[lang=locale]/account/contact',
	'/account/delete': '/[lang=locale]/account/delete',
	'/account/magic-link': '/[lang=locale]/account/magic-link',
	'/account/register': '/[lang=locale]/account/register',
	'/learn': '/[lang=locale]/learn',
	'/learn/alphabet': '/[lang=locale]/learn/alphabet',
	'/learn/dialogues': '/[lang=locale]/learn/dialogues',
	'/learn/vocabulary': '/[lang=locale]/learn/vocabulary',
	'/learn/vocabulary/train': '/[lang=locale]/learn/vocabulary/train'
} as const;

type LocaleRoutePath = keyof typeof ROUTES;
type LocaleRouteId = (typeof ROUTES)[LocaleRoutePath];

/** Prefixes an absolute pathname with a locale segment, e.g. `withLocale('ru', '/learn')` -> `/ru/learn`. */
export function withLocale(locale: Locale, pathname: LocaleRoutePath): ResolvedPathname {
	const routeId: LocaleRouteId = ROUTES[pathname];
	return resolve(routeId, { lang: locale });
}

/**
 * Same as `withLocale()`, for the routes that take a dynamic segment. Kept
 * separate rather than widening `withLocale()`'s type, which would weaken
 * every other call site to accommodate two.
 */
export function withLocaleDeck(locale: Locale, deckId: string): ResolvedPathname {
	return resolve('/[lang=locale]/learn/vocabulary/[deckId]', { lang: locale, deckId });
}

export function withLocaleDialogue(locale: Locale, dialogueId: string): ResolvedPathname {
	return resolve('/[lang=locale]/learn/dialogues/[dialogueId]', { lang: locale, dialogueId });
}

/** Same as `withLocale()`, with a query string appended. */
export function withLocaleQuery(
	locale: Locale,
	pathname: LocaleRoutePath,
	query: Record<string, string>
): ResolvedPathname {
	const routeId: LocaleRouteId = ROUTES[pathname];
	const search = new URLSearchParams(query).toString();
	const routeIdWithQuery: `${LocaleRouteId}?${string}` = `${routeId}?${search}`;
	return resolve(routeIdWithQuery, { lang: locale });
}

/**
 * For the few call sites that rebuild a path computed at runtime — the
 * current pathname, or one derived from it — rather than a `ROUTES` literal.
 * Such a value can't be checked against the route list at compile time, so
 * this takes the cast `resolve()` can't avoid. Only ever call it with a path
 * derived from `page.url.pathname`, never with unvalidated input.
 */
export function resolveRuntimePath(locale: Locale, pathname: string): ResolvedPathname {
	const normalized = pathname.startsWith('/') ? pathname : `/${pathname}`;
	const full = normalized === '/' ? `/${locale}` : `/${locale}${normalized}`;
	return resolve(full as Pathname);
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
 * True only for a same-origin, locale-prefixed app path — not an absolute
 * URL, a protocol-relative `//host/...`, or a bare `/account`. Validate any
 * user-controllable path (e.g. a `next` param) with this before redirecting.
 */
export function isSafeInternalPath(path: string): boolean {
	if (!path.startsWith('/') || path.startsWith('//')) return false;
	const [, lang] = path.split('/');
	return lang !== undefined && isLocale(lang);
}

/** One level up, given a locale-stripped pathname. `undefined` at the locale
 * root, where there's nowhere further to go. */
export function parentPath(pathname: string): string | undefined {
	if (pathname === '/') return undefined;
	const segments = pathname.split('/').filter((segment) => segment.length > 0);
	segments.pop();
	return segments.length === 0 ? '/' : `/${segments.join('/')}`;
}
