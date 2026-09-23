import { error, fail } from '@sveltejs/kit';
import { DIALOGUE_CATALOG, getNextDialogueSummary } from '$lib/content/dialogues/catalog';
import { loadDialogue } from '$lib/content/dialogues/loadDialogue';
import { requireSignedIn } from '$lib/server/authGuard';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals: { supabase, claims } }) => {
	const dialogue = await loadDialogue(params.dialogueId);
	if (dialogue === undefined) {
		error(404, 'Dialogue not found');
	}
	const number = DIALOGUE_CATALOG.findIndex((candidate) => candidate.id === dialogue.id) + 1;
	const next = getNextDialogueSummary(dialogue.id);

	// A failed lookup degrades to "not done" rather than a 500: the worst case
	// is the button offering to mark it done again, which `complete` tolerates.
	if (claims === null) {
		return { dialogue, number, next, completed: false };
	}

	const { data: row, error: fetchError } = await supabase
		.from('user_dialogue_progress')
		.select('dialogue_id')
		.eq('user_id', claims.sub)
		.eq('dialogue_id', dialogue.id)
		.maybeSingle();

	if (fetchError) {
		console.error('dialogue: failed to load completion', fetchError);
	}

	return { dialogue, number, next, completed: row !== null && row !== undefined };
};

export const actions: Actions = {
	/**
	 * Signed-out learners can play a dialogue freely; only saving the completion
	 * is gated, and it resumes itself after sign-in. A repeat completion bumps
	 * the counter rather than failing on the primary key.
	 */
	complete: async ({ params, url, locals: { supabase, claims } }) => {
		const verified = requireSignedIn(claims, params.lang, { url, action: 'complete' });

		if (!DIALOGUE_CATALOG.some((candidate) => candidate.id === params.dialogueId)) {
			return fail(404, { errorCode: 'dialogue_not_found' });
		}

		const { data: existing, error: fetchError } = await supabase
			.from('user_dialogue_progress')
			.select('completions')
			.eq('user_id', verified.sub)
			.eq('dialogue_id', params.dialogueId)
			.maybeSingle();

		if (fetchError) {
			console.error('dialogue: failed to load completion', fetchError);
			return fail(500, { errorCode: 'generic' });
		}

		const { error: upsertError } = await supabase.from('user_dialogue_progress').upsert(
			{
				user_id: verified.sub,
				dialogue_id: params.dialogueId,
				completions: (existing?.completions ?? 0) + 1,
				completed_at: new Date().toISOString()
			},
			{ onConflict: 'user_id,dialogue_id' }
		);

		if (upsertError) {
			console.error('dialogue: failed to save completion', upsertError);
			return fail(500, { errorCode: 'generic' });
		}

		return { success: true };
	},

	/**
	 * Deletes the row rather than zeroing anything: "no row = not completed" is
	 * the table's convention, and `completions` has a `>= 1` check. Not
	 * `resume`-gated — only a signed-in learner can see the button.
	 */
	uncomplete: async ({ params, locals: { supabase, claims } }) => {
		const verified = requireSignedIn(claims, params.lang);

		if (!DIALOGUE_CATALOG.some((candidate) => candidate.id === params.dialogueId)) {
			return fail(404, { errorCode: 'dialogue_not_found' });
		}

		const { error: deleteError } = await supabase
			.from('user_dialogue_progress')
			.delete()
			.eq('user_id', verified.sub)
			.eq('dialogue_id', params.dialogueId);

		if (deleteError) {
			console.error('dialogue: failed to remove completion', deleteError);
			return fail(500, { errorCode: 'generic' });
		}

		return { success: true };
	}
};
