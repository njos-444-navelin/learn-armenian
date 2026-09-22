import { countVocabularyProgress } from '$lib/server/vocabularyCounts';
import type { LayoutServerLoad } from './$types';

/**
 * "Does this user have anything to practice right now" check, powering the
 * notification dot on the account menu (see UserMenu.svelte). Mirrors the
 * new/due split the training page itself draws (see
 * `train/+page.server.ts`): a word counts once it's either past its
 * `due_at` in `user_vocabulary_progress`, or has no row there at all (never
 * studied) despite belonging to a deck the user has added.
 *
 * This runs on every page under this layout, which is exactly why it asks
 * the database for counts rather than rows — see `vocabularyCounts.ts` for
 * what that replaced. Both halves of the question ("anything due?",
 * "anything never studied?") come back as integers, so the cost of this no
 * longer grows with how much the learner has studied.
 *
 * The dot is suppressed while the learner is on the training page itself
 * (see `onTrainPage` in UserMenu.svelte) — it's meant to point *toward*
 * that page, so it has nothing left to say once they've arrived — but this
 * value itself does update while they're there: it declares the
 * `vocabulary:practice-status` dependency, and VocabularyTrainer.svelte
 * calls `invalidate('vocabulary:practice-status')` after every graded card
 * so it's already fresh by the time they navigate away. That's a targeted
 * `invalidate()`, not `invalidateAll()`, specifically so grading doesn't
 * also re-run (and needlessly re-fetch) the training page's own full
 * queue load.
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
