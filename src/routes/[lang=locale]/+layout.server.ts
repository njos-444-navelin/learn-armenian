import { countVocabularyProgress } from '$lib/server/vocabularyCounts';
import type { LayoutServerLoad } from './$types';

/**
 * Whether the learner has anything to practice, for the notification dot on the
 * account menu. Mirrors the new/due split the training page draws.
 *
 * This runs on every page under the layout, which is why it asks for counts
 * rather than rows (see `vocabularyCounts.ts`). It declares the
 * `vocabulary:practice-status` dependency, which the trainer invalidates after
 * each graded card — targeted, so grading doesn't re-run the queue load.
 */
export const load: LayoutServerLoad = async ({ depends, locals: { supabase, claims } }) => {
	depends('vocabulary:practice-status');

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
	const counts = await countVocabularyProgress(supabase, claims.sub, deckIds, new Date());

	// A database that couldn't answer shows no dot: it points at work the
	// learner may not have, and a wrong dot is worse than a missing one.
	return { hasWordsToPractice: counts !== undefined && (counts.due > 0 || counts.unseen > 0) };
};
