import { fail } from '@sveltejs/kit';
import { requireSignedIn } from '$lib/server/authGuard';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals: { claims }, params }) => {
	requireSignedIn(claims, params.lang);
};

export const actions: Actions = {
	changeEmail: async ({ request, params, locals: { supabase, claims } }) => {
		const verified = requireSignedIn(claims, params.lang);
		const formData = await request.formData();
		const email = String(formData.get('email') ?? '');

		if (verified.email !== undefined && email.trim().toLowerCase() === verified.email.toLowerCase()) {
			return fail(400, { action: 'changeEmail' as const, email, errorCode: 'same_email' });
		}

		const { error } = await supabase.auth.updateUser({ email });
		if (error) return fail(400, { action: 'changeEmail' as const, email, errorCode: error.code });

		return { action: 'changeEmail' as const, email, success: true };
	}
};
