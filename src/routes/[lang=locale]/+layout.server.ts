import { VOCABULARY_CATALOG } from '$lib/content/vocabulary/catalog';
import { loadDeckWords } from '$lib/content/vocabulary/loadDeck';
import type { LayoutServerLoad } from './$types';

/**
 * "Does this user have anything to practice right now" check, powering the
 * notification dot on the account menu (see UserMenu.svelte). Mirrors the
 * new/due split the training page itself draws (see
 * `train/+page.server.ts`): a word counts once it's either past its
 * `due_at` in `user_vocabulary_progress`, or has no row there at all (never
 * studied) despite belonging to a deck the user has added.
 *
 * Runs on every page under this layout, so the due check stays a single
 * indexed existence check and short-circuits before the heavier new-word
 * check — most signed-in loads with something due never need it. The
 * new-word check still avoids the training page's full per-word queue
 * build: it only compares per-deck word *counts* (catalog size vs. rows in
 * `user_vocabulary_progress`), never loading translations or SRS state.
 */
export const load: LayoutServerLoad = async ({ locals: { supabase, claims } }) => {
	if (claims === null) {
		return { hasWordsToPractice: false };
	}

	const { data: addedDecks, error: decksError } = await supabase
		.from('user_vocabulary_decks')
		.select('deck_id')
		.eq('user_id', claims.sub);

	if (decksError) {
		console.error('layout: failed to load added decks', decksError);
		return { hasWordsToPractice: false };
	}

	const deckIds = addedDecks.map((row) => row.deck_id as string);
	if (deckIds.length === 0) {
		return { hasWordsToPractice: false };
	}

	const { data: dueRows, error: dueError } = await supabase
		.from('user_vocabulary_progress')
		.select('word_id')
		.eq('user_id', claims.sub)
		.lte('due_at', new Date().toISOString())
		.limit(1);

	if (dueError) {
		console.error('layout: failed to check due vocabulary', dueError);
		return { hasWordsToPractice: false };
	}
	if (dueRows.length > 0) {
		return { hasWordsToPractice: true };
	}

	const { data: progressRows, error: progressError } = await supabase
		.from('user_vocabulary_progress')
		.select('deck_id')
		.eq('user_id', claims.sub)
		.in('deck_id', deckIds);

	if (progressError) {
		console.error('layout: failed to check studied vocabulary', progressError);
		return { hasWordsToPractice: false };
	}

	const studiedCountByDeck = new Map<string, number>();
	for (const row of progressRows) {
		const deckId = row.deck_id as string;
		studiedCountByDeck.set(deckId, (studiedCountByDeck.get(deckId) ?? 0) + 1);
	}

	for (const deckId of deckIds) {
		const deck = VOCABULARY_CATALOG.find((candidate) => candidate.id === deckId);
		if (deck === undefined) continue;
		const words = await loadDeckWords(deckId);
		if (words === undefined) continue;
		const studied = studiedCountByDeck.get(deckId) ?? 0;
		if (studied < words.length) {
			return { hasWordsToPractice: true };
		}
	}

	return { hasWordsToPractice: false };
};
