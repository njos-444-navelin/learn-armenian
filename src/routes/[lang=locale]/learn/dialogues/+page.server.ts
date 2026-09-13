import { DIALOGUE_CATALOG } from '$lib/content/dialogues/catalog';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase, claims } }) => {
	if (claims === null) {
		return { dialogues: DIALOGUE_CATALOG, completedIds: [] as string[] };
	}

	const { data, error } = await supabase
		.from('user_dialogue_progress')
		.select('dialogue_id')
		.eq('user_id', claims.sub);

	if (error) {
		console.error('dialogues list: failed to load completed dialogues', error);
		return { dialogues: DIALOGUE_CATALOG, completedIds: [] as string[] };
	}

	return { dialogues: DIALOGUE_CATALOG, completedIds: data.map((row) => row.dialogue_id as string) };
};
