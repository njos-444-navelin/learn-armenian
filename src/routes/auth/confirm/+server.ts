import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals: { supabase } }) => {
	const token_hash = url.searchParams.get('token_hash');
	const type = url.searchParams.get('type');
	const next = url.searchParams.get('next') ?? '/';

	if (token_hash && type) {
		const { error } = await supabase.auth.verifyOtp({ type, token_hash });
		if (!error) {
			// Force a freshly-minted JWT rather than trusting whatever session
			// verifyOtp left in place. This is what makes a completed email
			// change actually show the new address once we land back on
			// /account — otherwise the caller's still-valid access token keeps
			// serving the old email in its claims until its next natural
			// refresh (up to ~1h later). Best-effort: a refresh hiccup should
			// never block the redirect, since the confirmation itself already
			// succeeded.
			try {
				const { error: refreshError } = await supabase.auth.refreshSession();
				if (refreshError) console.error('auth/confirm: session refresh failed', refreshError);
			} catch (err) {
				console.error('auth/confirm: session refresh threw', err);
			}
			redirect(303, next);
		}
	}

	redirect(303, '/auth/error');
};
