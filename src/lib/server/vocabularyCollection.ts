import { fail } from '@sveltejs/kit';
import type { SupabaseClient } from '@supabase/supabase-js';
import { VOCABULARY_CATALOG } from '$lib/content/vocabulary/catalog';

type CollectionActionResult = { success: true } | ReturnType<typeof fail<{ errorCode: string }>>;

/**
 * Shared by the list page's and the deck page's `addToCollection`/
 * `removeFromCollection` actions (Conventions §3): the writes are identical,
 * only the set of decks each page can act on differs.
 */
export async function addDeckToCollection(
	supabase: SupabaseClient,
	userId: string,
	deckId: string
): Promise<CollectionActionResult> {
	const deck = VOCABULARY_CATALOG.find((candidate) => candidate.id === deckId);
	if (deck === undefined) {
		return fail(404, { errorCode: 'deck_not_found' });
	}

	const { error } = await supabase
		.from('user_vocabulary_decks')
		.upsert(
			{ user_id: userId, deck_id: deck.id },
			{ onConflict: 'user_id,deck_id', ignoreDuplicates: true }
		);

	if (error) {
		console.error('vocabulary collection: failed to add deck', error);
		return fail(500, { errorCode: 'generic' });
	}

	return { success: true };
}

export async function removeDeckFromCollection(
	supabase: SupabaseClient,
	userId: string,
	deckId: string
): Promise<CollectionActionResult> {
	const deck = VOCABULARY_CATALOG.find((candidate) => candidate.id === deckId);
	if (deck === undefined) {
		return fail(404, { errorCode: 'deck_not_found' });
	}

	// Clears this deck's per-word SRS progress first: removing a deck is a real
	// reset, so re-adding it starts every word new. Before the membership row,
	// so a failure here leaves the deck fully in place rather than orphaning
	// progress the learner can no longer see.
	const { error: progressDeleteError } = await supabase
		.from('user_vocabulary_progress')
		.delete()
		.eq('user_id', userId)
		.eq('deck_id', deck.id);

	if (progressDeleteError) {
		console.error('vocabulary collection: failed to clear progress on removal', progressDeleteError);
		return fail(500, { errorCode: 'generic' });
	}

	const { error: deleteError } = await supabase
		.from('user_vocabulary_decks')
		.delete()
		.eq('user_id', userId)
		.eq('deck_id', deck.id);

	if (deleteError) {
		console.error('vocabulary collection: failed to remove deck', deleteError);
		return fail(500, { errorCode: 'generic' });
	}

	return { success: true };
}
