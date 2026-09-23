import { fail } from '@sveltejs/kit';
import { applyAnswer } from '$lib/alphabet/mastery';
import { requireSignedIn } from '$lib/server/authGuard';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase, claims } }) => {
	if (claims === null) {
		return { levels: {}, signedIn: false };
	}

	const { data, error: queryError } = await supabase
		.from('user_alphabet_progress')
		.select('letter_id, level')
		.eq('user_id', claims.sub);

	if (queryError) {
		console.error('alphabet: failed to load progress', queryError);
		return { levels: {}, signedIn: true };
	}

	const levels = Object.fromEntries(
		data.map((row) => [row.letter_id as string, row.level as number])
	);
	return { levels, signedIn: true };
};

export const actions: Actions = {
	/**
	 * The actual security boundary for Practice; AlphabetTrainer.svelte's
	 * client-side check is a UX nicety. A skip never calls this at all, since it
	 * doesn't change a letter's level.
	 */
	answer: async ({ request, params, url, locals: { supabase, claims } }) => {
		const verified = requireSignedIn(claims, params.lang, { url, action: 'practice' });

		const formData = await request.formData();
		const letterId = String(formData.get('letterId') ?? '');
		const chosenId = String(formData.get('chosenId') ?? '');
		if (letterId === '' || chosenId === '') {
			return fail(400, { errorCode: 'invalid_request' });
		}

		const { data: existing, error: fetchError } = await supabase
			.from('user_alphabet_progress')
			.select('level')
			.eq('user_id', verified.sub)
			.eq('letter_id', letterId)
			.maybeSingle();

		if (fetchError) {
			console.error('alphabet: failed to load current level', fetchError);
			return fail(500, { errorCode: 'generic' });
		}

		const current = existing?.level ?? 0;
		// Recomputed rather than trusted from the client, so a tampered request
		// can't raise a level without picking the right answer.
		const next = applyAnswer(current, chosenId === letterId);

		const { error: upsertError } = await supabase.from('user_alphabet_progress').upsert(
			{
				user_id: verified.sub,
				letter_id: letterId,
				level: next,
				updated_at: new Date().toISOString()
			},
			{ onConflict: 'user_id,letter_id' }
		);

		if (upsertError) {
			console.error('alphabet: failed to save level', upsertError);
			return fail(500, { errorCode: 'generic' });
		}

		return { success: true, level: next };
	}
};
