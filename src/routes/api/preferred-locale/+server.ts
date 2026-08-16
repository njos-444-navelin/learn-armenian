import { json } from '@sveltejs/kit';
import { isLocale } from '$lib/i18n/locale';
import type { RequestHandler } from './$types';

/**
 * Persists the signed-in user's chosen UI language, called fire-and-forget
 * from the client right after it navigates to the picked locale (see
 * [lang=locale]/+page.svelte and UserMenu.svelte) — this endpoint never
 * drives navigation itself, it only records the choice for next time.
 */
export const POST: RequestHandler = async ({ request, locals: { supabase, claims } }) => {
	if (claims === null) {
		return json({ errorCode: 'unauthenticated' }, { status: 401 });
	}

	const body: unknown = await request.json().catch(() => null);
	const locale =
		body !== null && typeof body === 'object' && 'locale' in body ? body.locale : undefined;
	if (typeof locale !== 'string' || !isLocale(locale)) {
		return json({ errorCode: 'invalid_locale' }, { status: 400 });
	}

	const { error } = await supabase.from('user_preferences').upsert(
		{
			user_id: claims.sub,
			preferred_locale: locale,
			updated_at: new Date().toISOString()
		},
		{ onConflict: 'user_id' }
	);

	if (error) {
		console.error('preferred locale: failed to persist', error);
		return json({ errorCode: 'generic' }, { status: 500 });
	}

	return json({ success: true });
};
