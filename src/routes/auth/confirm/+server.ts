import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals: { supabase } }) => {
	const token_hash = url.searchParams.get('token_hash');
	const type = url.searchParams.get('type');
	const next = url.searchParams.get('next') ?? '/';

	if (token_hash && type) {
		const { error } = await supabase.auth.verifyOtp({ type, token_hash });
		if (!error) {
			// Force a freshly-minted JWT rather than trusting the session verifyOtp
			// left in place: otherwise a completed email change keeps serving the
			// old address in its claims until the token's next refresh. Best-effort,
			// since the confirmation itself already succeeded.
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
