import { redirect } from '@sveltejs/kit';
import { isLocale } from '$lib/i18n/locale';
import { withLocale } from '$lib/i18n/paths';
import type { PageServerLoad } from './$types';

/**
 * A signed-in user who has picked a language before goes straight to their
 * lessons, in their stored locale rather than whichever `[lang]` this request
 * landed on. Server-side, so the picker never flashes first.
 */
export const load: PageServerLoad = async ({ locals: { supabase, claims } }) => {
	if (claims !== null) {
		const { data, error } = await supabase
			.from('user_preferences')
			.select('preferred_locale')
			.eq('user_id', claims.sub)
			.maybeSingle();

		if (error) {
			console.error('home: failed to load preferred locale', error);
		} else if (data !== null && isLocale(data.preferred_locale)) {
			redirect(307, withLocale(data.preferred_locale, '/learn'));
		}
	}

	return {};
};
