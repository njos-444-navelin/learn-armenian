import { fail } from '@sveltejs/kit';
import { requireSignedIn } from '$lib/server/authGuard';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals: { claims }, params }) => {
	requireSignedIn(claims, params.lang);
};

export const actions: Actions = {
	changePassword: async ({ request, params, locals: { supabase, claims } }) => {
		const verified = requireSignedIn(claims, params.lang);
		if (verified.email === undefined) {
			return fail(400, { action: 'changePassword' as const, errorCode: 'generic' });
		}

		const formData = await request.formData();
		const currentPassword = String(formData.get('currentPassword') ?? '');
		const newPassword = String(formData.get('newPassword') ?? '');

		const { error: verifyError } = await supabase.auth.signInWithPassword({
			email: verified.email,
			password: currentPassword
		});
		if (verifyError) {
			return fail(400, { action: 'changePassword' as const, errorCode: verifyError.code });
		}

		const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
		if (updateError) {
			return fail(400, { action: 'changePassword' as const, errorCode: updateError.code });
		}

		return { action: 'changePassword' as const, success: true };
	}
};
