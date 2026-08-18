import { fail, redirect } from '@sveltejs/kit';
import { isSafeInternalPath } from '$lib/i18n/paths';
import type { Actions } from './$types';

export const actions: Actions = {
	login: async ({ request, url, locals: { supabase } }) => {
		const formData = await request.formData();
		const email = String(formData.get('email') ?? '');
		const password = String(formData.get('password') ?? '');
		const { error } = await supabase.auth.signInWithPassword({ email, password });
		if (error) return fail(400, { action: 'login' as const, email, errorCode: error.code });

		// Sends the visitor back to whatever gated action redirected them here
		// (see requireSignedIn()'s `resume` option) instead of stranding them
		// on the account page — but only to a validated internal path; `next`
		// arrives via the query string, so it's user-editable and must never
		// be trusted as an unchecked redirect target.
		const next = url.searchParams.get('next');
		if (next !== null && isSafeInternalPath(next)) {
			redirect(303, next);
		}

		return { action: 'login' as const, success: true };
	},

	logout: async ({ locals: { supabase } }) => {
		await supabase.auth.signOut();
		return { action: 'logout' as const, success: true };
	}
};
