import { VOCABULARY_CATALOG } from '$lib/content/vocabulary/catalog';
import type { PageServerLoad } from './$types';

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
