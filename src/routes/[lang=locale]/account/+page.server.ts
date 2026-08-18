import { fail, redirect } from '@sveltejs/kit';
import { isSafeInternalPath } from '$lib/i18n/paths';
import { VOCABULARY_CATALOG } from '$lib/content/vocabulary/catalog';
import { loadDeckWords } from '$lib/content/vocabulary/loadDeck';
import { cardStateFromRow, isDue } from '$lib/srs/scheduler';
import type { Actions, PageServerLoad } from './$types';

/**
 * Exact count for the "Train vocabulary (N)" button — unlike
 * `hasWordsToPractice` in the locale layout's load (a cheap existence check
 * that short-circuits on the first match, run on every signed-in page load
 * app-wide), this tallies every trainable word across every added deck, so
 * it only runs here on the one page that needs the precise number.
 */
export const load: PageServerLoad = async ({ locals: { supabase, claims } }) => {
	if (claims === null) {
		return { trainableWordCount: 0 };
	}

	const { data: addedDecks, error: decksError } = await supabase
		.from('user_vocabulary_decks')
		.select('deck_id')
		.eq('user_id', claims.sub);

	if (decksError) {
		console.error('account: failed to load added decks', decksError);
		return { trainableWordCount: 0 };
	}

	const deckIds = addedDecks.map((row) => row.deck_id as string);
	if (deckIds.length === 0) {
		return { trainableWordCount: 0 };
	}

	const { data: progressRows, error: progressError } = await supabase
		.from('user_vocabulary_progress')
		.select('deck_id, word_id, phase, step, interval_days, ease_factor, due_at, reps, lapses')
		.eq('user_id', claims.sub)
		.in('deck_id', deckIds);

	if (progressError) {
		console.error('account: failed to load vocabulary progress', progressError);
		return { trainableWordCount: 0 };
	}

	const progressByKey = new Map(
		progressRows.map((row) => [`${row.deck_id}:${row.word_id}`, row])
	);

	const now = new Date();
	let trainableWordCount = 0;

	for (const deckId of deckIds) {
		const deck = VOCABULARY_CATALOG.find((candidate) => candidate.id === deckId);
		if (deck === undefined) continue;
		const words = await loadDeckWords(deckId);
		if (words === undefined) continue;
		for (const word of words) {
			const row = progressByKey.get(`${deckId}:${word.id}`);
			if (row === undefined || isDue(cardStateFromRow(row), now)) {
				trainableWordCount++;
			}
		}
	}

	return { trainableWordCount };
};

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
