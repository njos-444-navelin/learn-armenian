import { fail, redirect } from '@sveltejs/kit';
import { DEFAULT_LOCALE, isLocale } from '$lib/i18n/locale';
import { withLocale } from '$lib/i18n/paths';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals: { claims }, params }) => {
	if (claims !== null) {
		const locale = isLocale(params.lang) ? params.lang : DEFAULT_LOCALE;
		redirect(307, withLocale(locale, '/account'));
	}
};

export const actions: Actions = {
	magiclink: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const email = String(formData.get('email') ?? '');
		const { error } = await supabase.auth.signInWithOtp({
			email,
			options: { shouldCreateUser: false }
		});
		if (error) return fail(400, { email, errorCode: error.code });
		return { email, success: true };
	}
};
