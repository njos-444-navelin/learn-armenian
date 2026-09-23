import { fail, redirect } from '@sveltejs/kit';
import { requireSignedIn } from '$lib/server/authGuard';
import { getSupabaseAdmin } from '$lib/server/supabaseAdmin';
import { DEFAULT_LOCALE, isLocale } from '$lib/i18n/locale';
import { withLocale } from '$lib/i18n/paths';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals: { claims }, params }) => {
	requireSignedIn(claims, params.lang);
};

export const actions: Actions = {
	deleteAccount: async ({ request, params, locals: { supabase, claims } }) => {
		const verified = requireSignedIn(claims, params.lang);
		const formData = await request.formData();
		const email = String(formData.get('email') ?? '')
			.trim()
			.toLowerCase();

		if (verified.email === undefined || email !== verified.email.toLowerCase()) {
			return fail(400, { action: 'deleteAccount' as const, errorCode: 'email_mismatch' });
		}

		let admin;
		try {
			admin = getSupabaseAdmin();
		} catch (err) {
			console.error('delete-account: admin client unavailable', err);
			return fail(500, { action: 'deleteAccount' as const, errorCode: 'generic' });
		}

		const { error } = await admin.auth.admin.deleteUser(verified.sub);
		if (error) {
			return fail(400, { action: 'deleteAccount' as const, errorCode: error.code });
		}

		// Clears this response's session cookies. GoTrueClient runs
		// removeCurrentSession() on every path, so there's no result to branch on.
		// Never let it block the redirect: the account is already deleted.
		try {
			await supabase.auth.signOut();
		} catch (err) {
			console.error('delete-account: signOut after deletion failed', err);
		}

		const locale = isLocale(params.lang) ? params.lang : DEFAULT_LOCALE;
		redirect(303, withLocale(locale, '/account'));
	}
};
