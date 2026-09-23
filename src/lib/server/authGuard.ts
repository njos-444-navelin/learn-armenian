import { redirect } from '@sveltejs/kit';
import type { JwtPayload } from '@supabase/supabase-js';
import { DEFAULT_LOCALE, isLocale } from '$lib/i18n/locale';
import { withLocale } from '$lib/i18n/paths';

/**
 * A gated action to replay once the visitor is back, signed in — see
 * docs/AUTH.md. `url` is the page they were turned away from; `action` is an
 * id that page's own client code knows how to re-trigger on `?resume=<action>`.
 */
interface ResumeAfterLogin {
	url: URL;
	action: string;
}

/**
 * Redirects to sign-in if `claims` is `null`, otherwise returns the narrowed
 * claims — `redirect()` returns `never`, so the narrowing holds after the call.
 *
 * Call it from a protected page's `load` *and* the top of every action on it:
 * SvelteKit runs a POST's action before `load` re-runs, so a `load`-only guard
 * leaves the action open to an unauthenticated POST.
 *
 * `resume` only round-trips through password sign-in — the magic-link landing
 * page is fixed by the Supabase email template and can't carry a `next`.
 */
export function requireSignedIn(
	claims: JwtPayload | null,
	lang: string,
	resume?: ResumeAfterLogin | undefined
): JwtPayload {
	if (claims === null) {
		const locale = isLocale(lang) ? lang : DEFAULT_LOCALE;
		const accountHref = withLocale(locale, '/account');
		if (resume === undefined) {
			redirect(307, accountHref);
		}
		const next = `${resume.url.pathname}?resume=${encodeURIComponent(resume.action)}`;
		redirect(307, `${accountHref}?next=${encodeURIComponent(next)}`);
	}
	return claims;
}
