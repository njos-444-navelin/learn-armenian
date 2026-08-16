import { redirect } from '@sveltejs/kit';
import { isLocale } from '$lib/i18n/locale';
import { withLocale } from '$lib/i18n/paths';
import type { PageServerLoad } from './$types';

/**
 * A signed-in user who has ever picked a language before shouldn't be asked
 * again — send them straight to their lessons, in their stored locale (not
 * necessarily the `[lang]` this request happened to land on, e.g. via
 * Accept-Language negotiation). Runs server-side before the picker renders,
 * so there's no flash of the picker screen first.
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
