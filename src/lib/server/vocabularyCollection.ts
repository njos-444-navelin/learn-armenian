import { fail } from '@sveltejs/kit';
import type { SupabaseClient } from '@supabase/supabase-js';
import { VOCABULARY_CATALOG } from '$lib/content/vocabulary/catalog';

type CollectionActionResult = { success: true } | ReturnType<typeof fail<{ errorCode: string }>>;

/**
 * Shared by the deck list page's and the deck page's own `addToCollection`/
 * `removeFromCollection` actions (see Conventions §3) — the list page can
 * add/remove any deck inline, the deck page only ever acts on its own, but
 * the underlying writes are identical either way.
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

	// Clears this deck's per-word SRS progress first — removing a deck is
	// meant to be a real reset, not just hiding it, so re-adding it later
	// starts every word "new" again rather than resurrecting old due dates.
	// Done before the membership row so a failure here leaves the deck fully
	// in place (still added, still tracked) rather than silently orphaning
	// progress the user can no longer see.
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
