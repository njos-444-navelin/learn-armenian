import { resolve } from '$app/paths';
import type { Pathname, ResolvedPathname } from '$app/types';
import { isLocale, LOCALES, type Locale } from './locale';

/**
 * Every locale-scoped route in the app, keyed by the locale-stripped path
 * `withLocale()`'s callers already use — mapped to the actual SvelteKit
 * route ID `resolve()` needs. Keeping the `[lang=locale]` route-id prefix
 * here, once, is what lets call sites keep writing `withLocale(locale,
 * '/account')` instead of spelling out the route id themselves, while still
 * getting resolve()'s compile-time route-typo protection — add a route here
 * (not just under `src/routes/`) for it to be reachable via `withLocale()`.
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
 * Same as `withLocale()`, for the routes resolve() needs a dynamic segment
 * for. Separate exported functions rather than widening `withLocale()`'s
 * type to cover them — every other route in `ROUTES` takes only the `lang`
 * param, so folding these in would weaken the type of every other call site
 * just to accommodate two.
 */
export function withLocaleDeck(locale: Locale, deckId: string): ResolvedPathname {
	return resolve('/[lang=locale]/learn/vocabulary/[deckId]', { lang: locale, deckId });
}

export function withLocaleDialogue(locale: Locale, dialogueId: string): ResolvedPathname {
	return resolve('/[lang=locale]/learn/dialogues/[dialogueId]', { lang: locale, dialogueId });
}

/** Same as `withLocale()`, with a query string appended (e.g. `next` on the
 * sign-in redirect — see AlphabetTrainer.svelte's `clickPractice()`). */
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
 * `withLocale()`'s escape hatch for the couple of call sites that rebuild a
 * path *computed at runtime* — the current page's own pathname, or one
 * derived from it (going up a level, switching locale on whatever page the
 * visitor is already on) — rather than one of `ROUTES`'s fixed literals.
 * That value can't be checked against the route list at compile time the
 * way a literal can, so this still calls `resolve()` (getting its base-path
 * handling, and satisfying eslint's `svelte/no-navigation-without-resolve`
 * structurally, not by suppressing it) but takes the cast `resolve()` itself
 * can't avoid here. Safe in practice because every caller derives `pathname`
 * from `page.url.pathname` — an already-valid pathname for a page this app
 * is currently rendering — via `withoutLocale()`/`parentPath()`, not from
 * unvalidated input; never call this with a path from outside the app.
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
 * pathname (e.g. `/learn/vocabulary/train` -> `/learn/vocabulary`). `undefined`
 * at the locale root (`/`) — there's nowhere further up to go.
 */
export function parentPath(pathname: string): string | undefined {
	if (pathname === '/') return undefined;
	const segments = pathname.split('/').filter((segment) => segment.length > 0);
	segments.pop();
	return segments.length === 0 ? '/' : `/${segments.join('/')}`;
}
