import { redirect } from '@sveltejs/kit';
import type { JwtPayload } from '@supabase/supabase-js';
import { DEFAULT_LOCALE, isLocale } from '$lib/i18n/locale';
import { withLocale } from '$lib/i18n/paths';

/**
 * Redirects to the locale-prefixed sign-in page if `claims` is `null`,
 * otherwise returns the narrowed, non-null claims. `redirect()` returns
 * `never`, so TypeScript narrows `claims` correctly after the guard.
 *
 * Call this from BOTH a protected page's `load` (blocks direct navigation)
 * AND the top of every action on that page — SvelteKit runs a POST's action
 * before `load` re-runs to render the result, so a `load`-only guard does
 * not protect the action itself from an unauthenticated direct POST.
 */
export function requireSignedIn(claims: JwtPayload | null, lang: string): JwtPayload {
	if (claims === null) {
		const locale = isLocale(lang) ? lang : DEFAULT_LOCALE;
		redirect(307, withLocale(locale, '/account'));
	}
	return claims;
}
