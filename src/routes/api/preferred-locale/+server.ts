import { json } from '@sveltejs/kit';
import { isLocale } from '$lib/i18n/locale';
import type { RequestHandler } from './$types';

/**
 * Records the signed-in user's chosen UI language for next time. Called
 * fire-and-forget after the client has already navigated; it never drives
 * navigation itself.
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
