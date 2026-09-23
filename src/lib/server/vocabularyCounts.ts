import type { SupabaseClient } from '@supabase/supabase-js';
import { countDeckWords } from '$lib/content/vocabulary/loadDeck';

/**
 * How much practice a learner has waiting, as three integers, without fetching
 * a single progress row. A word is "new" when it has no row at all, and
 * absence can't be queried — but subtracting the sizes answers it anyway:
 *
 *     unseen = total − studied
 *
 * The identity holds only while every row belongs to a word its deck still
 * lists; `loadDeckWordIds()` asserts the catalog's `wordCount` to keep that
 * honest.
 */
export interface VocabularyCounts {
	/** Every word across the decks the learner has added. */
	total: number;
	/** Words they've graded at least once — one row each. */
	studied: number;
	/** Of those, the ones whose next review has come due. */
	due: number;
	/** Words with no row at all: `total - studied`. */
	unseen: number;
}

const EMPTY_COUNTS: VocabularyCounts = { total: 0, studied: 0, due: 0, unseen: 0 };

/**
 * `head: true` is what makes it cheap: Postgres counts against an index and
 * answers with the number instead of serialising the rows.
 */
async function countRows(
	supabase: SupabaseClient,
	userId: string,
	deckIds: readonly string[],
	dueBy?: Date
): Promise<number | undefined> {
	let query = supabase
		.from('user_vocabulary_progress')
		.select('*', { count: 'exact', head: true })
		.eq('user_id', userId)
		.in('deck_id', deckIds as string[]);

	if (dueBy !== undefined) {
		// Served by user_vocabulary_progress_due_idx, the (user_id, due_at) index.
		query = query.lte('due_at', dueBy.toISOString());
	}

	const { count, error } = await query;
	if (error) {
		console.error('vocabulary counts: failed to count progress rows', error);
		return undefined;
	}
	return count ?? 0;
}

/**
 * `undefined` if the database couldn't answer, so no caller mistakes a zero
 * for "we don't know". No decks short-circuits without querying.
 */
export async function countVocabularyProgress(
	supabase: SupabaseClient,
	userId: string,
	deckIds: readonly string[],
	now: Date
): Promise<VocabularyCounts | undefined> {
	if (deckIds.length === 0) {
		return { ...EMPTY_COUNTS };
	}

	// Independent questions, so three round trips' latency collapses into one.
	const [total, studied, due] = await Promise.all([
		countDeckWords(deckIds),
		countRows(supabase, userId, deckIds),
		countRows(supabase, userId, deckIds, now)
	]);

	if (studied === undefined || due === undefined) {
		return undefined;
	}

	// Clamped: a row for a word its deck no longer lists would push this
	// negative, and "−3 words waiting" is worse than a stale zero.
	return { total, studied, due, unseen: Math.max(0, total - studied) };
}
