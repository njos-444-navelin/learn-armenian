import { error, fail } from '@sveltejs/kit';
import { VOCABULARY_CATALOG } from '$lib/content/vocabulary/catalog';
import { loadDeckWords } from '$lib/content/vocabulary/loadDeck';
import { requireSignedIn } from '$lib/server/authGuard';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals: { supabase, claims } }) => {
	const deck = VOCABULARY_CATALOG.find((candidate) => candidate.id === params.deckId);
	if (deck === undefined) {
		error(404, 'Deck not found');
	}

	const words = await loadDeckWords(deck.id);
	if (words === undefined) {
		error(404, 'Deck not found');
	}

	let added = false;
	if (claims !== null) {
		const { data, error: queryError } = await supabase
			.from('user_vocabulary_decks')
			.select('deck_id')
			.eq('user_id', claims.sub)
			.eq('deck_id', deck.id)
			.maybeSingle();

		if (queryError) {
			console.error('vocabulary deck: failed to check collection membership', queryError);
		} else {
			added = data !== null;
		}
	}

	return { deck, words, added };
};

export const actions: Actions = {
	addToCollection: async ({ params, url, locals: { supabase, claims } }) => {
		const verified = requireSignedIn(claims, params.lang, { url, action: 'addToCollection' });

		const deck = VOCABULARY_CATALOG.find((candidate) => candidate.id === params.deckId);
		if (deck === undefined) {
			return fail(404, { errorCode: 'deck_not_found' });
		}

		const { error: upsertError } = await supabase
			.from('user_vocabulary_decks')
			.upsert(
				{ user_id: verified.sub, deck_id: deck.id },
				{ onConflict: 'user_id,deck_id', ignoreDuplicates: true }
			);

		if (upsertError) {
			console.error('vocabulary deck: failed to add to collection', upsertError);
			return fail(500, { errorCode: 'generic' });
		}

		return { success: true };
	},

	removeFromCollection: async ({ params, locals: { supabase, claims } }) => {
		const verified = requireSignedIn(claims, params.lang);

		const deck = VOCABULARY_CATALOG.find((candidate) => candidate.id === params.deckId);
		if (deck === undefined) {
			return fail(404, { errorCode: 'deck_not_found' });
		}

		// Clears this deck's per-word SRS progress first — removing a deck
		// is meant to be a real reset, not just hiding it, so re-adding it
		// later starts every word "new" again rather than resurrecting old
		// due dates. Done before the membership row so a failure here
		// leaves the deck fully in place (still added, still tracked)
		// rather than silently orphaning progress the user can no longer see.
		const { error: progressDeleteError } = await supabase
			.from('user_vocabulary_progress')
			.delete()
			.eq('user_id', verified.sub)
			.eq('deck_id', deck.id);

		if (progressDeleteError) {
			console.error('vocabulary deck: failed to clear progress on removal', progressDeleteError);
			return fail(500, { errorCode: 'generic' });
		}

		const { error: deleteError } = await supabase
			.from('user_vocabulary_decks')
			.delete()
			.eq('user_id', verified.sub)
			.eq('deck_id', deck.id);

		if (deleteError) {
			console.error('vocabulary deck: failed to remove from collection', deleteError);
			return fail(500, { errorCode: 'generic' });
		}

		return { success: true };
	}
};
