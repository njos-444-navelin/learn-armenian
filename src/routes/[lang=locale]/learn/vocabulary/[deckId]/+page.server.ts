import { error } from '@sveltejs/kit';
import { VOCABULARY_CATALOG } from '$lib/content/vocabulary/catalog';
import { loadDeckWords } from '$lib/content/vocabulary/loadDeck';
import { requireSignedIn } from '$lib/server/authGuard';
import { addDeckToCollection, removeDeckFromCollection } from '$lib/server/vocabularyCollection';
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
		return addDeckToCollection(supabase, verified.sub, params.deckId);
	},

	removeFromCollection: async ({ params, locals: { supabase, claims } }) => {
		const verified = requireSignedIn(claims, params.lang);
		return removeDeckFromCollection(supabase, verified.sub, params.deckId);
	}
};
