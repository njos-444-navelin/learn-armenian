import { redirect } from '@sveltejs/kit';
import type { JwtPayload } from '@supabase/supabase-js';
import { DEFAULT_LOCALE, isLocale } from '$lib/i18n/locale';
import { withLocale } from '$lib/i18n/paths';

/**
 * Identifies a gated action to replay once the visitor is back, signed in —
 * see the "resume after login" section in docs/AUTH.md. `url` is the page
 * they were on when the gate turned them away (typically `event.url` from
 * the action that called `requireSignedIn`); `action` is an id the calling
 * page's own client code recognizes and knows how to re-trigger (e.g.
 * re-submitting a specific form) after landing back on `url` with
 * `?resume=<action>`.
 */
interface ResumeAfterLogin {
	url: URL;
	action: string;
}

/**
 * Redirects to the locale-prefixed sign-in page if `claims` is `null`,
 * otherwise returns the narrowed, non-null claims. `redirect()` returns
 * `never`, so TypeScript narrows `claims` correctly after the guard.
 *
 * Call this from BOTH a protected page's `load` (blocks direct navigation)
 * AND the top of every action on that page — SvelteKit runs a POST's action
 * before `load` re-runs to render the result, so a `load`-only guard does
 * not protect the action itself from an unauthenticated direct POST.
 *
 * Pass `resume` when the gated thing is an action worth automatically
 * replaying after sign-in (see docs/AUTH.md) — this only round-trips
 * through **password** sign-in (`account/+page.server.ts`'s `login`
 * action); the magic-link flow's landing page is fixed by the Supabase
 * dashboard email template and can't carry a dynamic `next`, so a
 * magic-link sign-in from here just lands on the bare account page same as
 * calling this without `resume`.
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
