import type { SupabaseClient } from '@supabase/supabase-js';
import { countDeckWords } from '$lib/content/vocabulary/loadDeck';

/**
 * How much practice a learner has waiting, as three integers.
 *
 * The point of this module is what it *doesn't* do: fetch progress rows. A
 * word is "new" when it has no row at all (see the comment on
 * `user_vocabulary_progress` for why), and absence isn't something a
 * database can be asked about — so every one of these counts used to be
 * worked out by loading every word of every added deck, fetching every
 * progress row, and subtracting one list from the other. The locale
 * layout did it on every page a signed-in learner opened, to decide whether
 * to draw a dot.
 *
 * Subtracting the *sizes* answers the same question without the lists.
 * Every word in an added deck either has a row or is new, so:
 *
 *     unseen = total − studied
 *
 * where `total` is a sum over the deck files (code, free) and `studied` is
 * a count the database returns as one number. At five thousand studied
 * words that's the difference between shipping ~815 KB of rows per request
 * and shipping two integers.
 *
 * The identity holds only while every row belongs to a word its deck still
 * lists. `loadDeckWordIds()` asserts the catalog's `wordCount` against the
 * deck file to keep that honest from the content side; a row left behind by
 * a word deleted from a deck would undercount `unseen` until it's cleaned
 * up.
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
 * One count query. `head: true` is what makes it cheap — Postgres counts the
 * matching rows against an index and answers with the number, rather than
 * serialising the rows themselves for us to count here.
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
		// Served by user_vocabulary_progress_due_idx, the (user_id, due_at)
		// index the table has carried since it was created.
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
 * `undefined` if the database couldn't answer — callers decide what a page
 * shows in that case, rather than having a zero quietly stand in for "we
 * don't know". An empty `deckIds` short-circuits without querying at all: a
 * learner who has added no decks has nothing to count.
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

	// Independent questions, so they go out together rather than in series —
	// three round trips' worth of latency collapses into one.
	const [total, studied, due] = await Promise.all([
		countDeckWords(deckIds),
		countRows(supabase, userId, deckIds),
		countRows(supabase, userId, deckIds, now)
	]);

	if (studied === undefined || due === undefined) {
		return undefined;
	}

	// Clamped: a row for a word its deck no longer lists would otherwise
	// push this negative, and "−3 words waiting" is worse than a stale zero.
	return { total, studied, due, unseen: Math.max(0, total - studied) };
}
