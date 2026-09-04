import { fail } from '@sveltejs/kit';
import { VOCABULARY_CATALOG } from '$lib/content/vocabulary/catalog';
import { requireSignedIn } from '$lib/server/authGuard';
import { addDeckToCollection, removeDeckFromCollection } from '$lib/server/vocabularyCollection';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase, claims } }) => {
	if (claims === null) {
		return { decks: VOCABULARY_CATALOG, addedDeckIds: [] as string[] };
	}

	const { data, error } = await supabase
		.from('user_vocabulary_decks')
		.select('deck_id')
		.eq('user_id', claims.sub);

	if (error) {
		console.error('vocabulary list: failed to load added decks', error);
		return { decks: VOCABULARY_CATALOG, addedDeckIds: [] as string[] };
	}

	return { decks: VOCABULARY_CATALOG, addedDeckIds: data.map((row) => row.deck_id as string) };
};

export const actions: Actions = {
	// Unlike the deck page's own version of these actions, this page can
	// add/remove any deck in the catalog inline — the deck being acted on
	// comes from the submitted form, not the route.
	addToCollection: async ({ request, params, url, locals: { supabase, claims } }) => {
		const formData = await request.formData();
		const deckId = String(formData.get('deckId') ?? '');
		if (deckId === '') {
			return fail(400, { errorCode: 'invalid_request' });
		}
		// Folds the deck id into the resume action id (see requireSignedIn's
		// doc comment) so the client knows which of this page's several "Add"
		// forms to replay after sign-in — see the `resume` effect in
		// VocabularyDeckList.svelte.
		const verified = requireSignedIn(claims, params.lang, { url, action: `addToCollection:${deckId}` });
		return addDeckToCollection(supabase, verified.sub, deckId);
	},

	removeFromCollection: async ({ request, params, locals: { supabase, claims } }) => {
		const formData = await request.formData();
		const deckId = String(formData.get('deckId') ?? '');
		if (deckId === '') {
			return fail(400, { errorCode: 'invalid_request' });
		}
		const verified = requireSignedIn(claims, params.lang);
		return removeDeckFromCollection(supabase, verified.sub, deckId);
	}
};
