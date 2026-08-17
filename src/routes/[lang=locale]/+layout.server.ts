import type { LayoutServerLoad } from './$types';

/**
 * Cheap "does this user have anything due right now" check, powering the
 * notification dot on the account menu (see UserMenu.svelte). Deliberately
 * only checks `user_vocabulary_progress` rows past their `due_at` — brand
 * new, never-studied words don't count as "review" here, matching the
 * new/due distinction the training page itself draws (see
 * vocabularyTraining.ts's todaysCountLabel). Runs on every page under this
 * layout, so it stays a single indexed existence check rather than the
 * training page's full queue build.
 */
export const load: LayoutServerLoad = async ({ locals: { supabase, claims } }) => {
	if (claims === null) {
		return { hasWordsToReview: false };
	}

	const { data, error } = await supabase
		.from('user_vocabulary_progress')
		.select('word_id')
		.eq('user_id', claims.sub)
		.lte('due_at', new Date().toISOString())
		.limit(1);

	if (error) {
		console.error('layout: failed to check due vocabulary', error);
		return { hasWordsToReview: false };
	}

	return { hasWordsToReview: data.length > 0 };
};
