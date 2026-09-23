import { fail } from '@sveltejs/kit';
import type { SupabaseClient } from '@supabase/supabase-js';
import { VOCABULARY_CATALOG } from '$lib/content/vocabulary/catalog';
import { loadDeckWordIds, loadDeckWords } from '$lib/content/vocabulary/loadDeck';
import type { TrainingCard } from '$lib/content/vocabulary/training';
import { getWord } from '$lib/content/words/entries';
import { requireSignedIn } from '$lib/server/authGuard';
import { countVocabularyProgress } from '$lib/server/vocabularyCounts';
import { NEW_CARD, cardStateFromRow, cardStateToRow, gradeCard, isGrade } from '$lib/srs/scheduler';
import type { Actions, PageServerLoad } from './$types';

const EMPTY_RESULT = {
	hasAddedDecks: false,
	queue: [] as TrainingCard[],
	newCount: 0,
	dueCount: 0,
	newCardsHeldBack: 0,
	dueCardsHeldBack: 0
};

/**
 * How many never-studied words one session may introduce. Uncapped, five
 * freshly added decks bury the reviews behind ninety new cards. Per session
 * rather than per day: reloading hands out another batch, and it needs no
 * stored counter or ruling on whose midnight ends the day.
 */
const NEW_CARDS_PER_SESSION = 20;

/**
 * How many reviews one round may hold. A month away can leave a four-figure
 * backlog, which an unbounded queue fetched and serialised in full. The
 * end-of-round screen names the true remainder from `vocabularyCounts.ts`,
 * which knows it without fetching anything.
 */
const DUE_CARDS_PER_ROUND = 60;

const PROGRESS_COLUMNS = 'deck_id, word_id, phase, step, interval_days, ease_factor, due_at, reps, lapses';

/**
 * The most overdue cards, chosen and sorted by the database: `lte('due_at')`
 * with this ordering and limit is served by the (user_id, due_at) index.
 */
async function loadDueCards(
	supabase: SupabaseClient,
	userId: string,
	deckIds: readonly string[],
	now: Date,
	limit: number
): Promise<TrainingCard[]> {
	const { data, error } = await supabase
		.from('user_vocabulary_progress')
		.select(PROGRESS_COLUMNS)
		.eq('user_id', userId)
		.in('deck_id', deckIds as string[])
		.lte('due_at', now.toISOString())
		.order('due_at', { ascending: true })
		.limit(limit);

	if (error) {
		console.error('vocabulary train: failed to load due cards', error);
		return [];
	}

	if (data.length === 0) {
		return [];
	}

	// A row is only shown if its deck still lists the word — content can drop a
	// word from a deck while a learner's row for it survives. The id lists are
	// already in memory: the counts above sum them.
	const cards: TrainingCard[] = [];
	const listedByDeck = new Map<string, ReadonlySet<string>>();
	for (const deckId of deckIds) {
		listedByDeck.set(deckId, new Set((await loadDeckWordIds(deckId)) ?? []));
	}

	for (const row of data) {
		const deckId = row.deck_id as string;
		const wordId = row.word_id as string;
		const word = getWord(wordId);
		if (word === undefined || listedByDeck.get(deckId)?.has(wordId) !== true) continue;
		cards.push({ deckId, word, state: cardStateFromRow(row), isNew: false });
	}
	return cards;
}

/**
 * Up to `limit` never-studied words in catalog order, walking deck by deck
 * and stopping as soon as it has enough.
 *
 * Its one query asks which (deck, word) pairs already have a row, the only
 * way to find the pairs that don't; the caller skips it unless the counts say
 * there are unseen words. If a collection ever grows large enough for this to
 * bite, move to a grouped count behind a Postgres function.
 */
async function loadNewCards(
	supabase: SupabaseClient,
	userId: string,
	deckIds: readonly string[],
	limit: number
): Promise<TrainingCard[]> {
	const { data, error } = await supabase
		.from('user_vocabulary_progress')
		.select('deck_id, word_id')
		.eq('user_id', userId)
		.in('deck_id', deckIds as string[]);

	if (error) {
		console.error('vocabulary train: failed to load studied word ids', error);
		return [];
	}

	const studied = new Set(data.map((row) => `${row.deck_id as string}:${row.word_id as string}`));
	const added = new Set(deckIds);
	const cards: TrainingCard[] = [];

	for (const deck of VOCABULARY_CATALOG) {
		if (cards.length >= limit) break;
		if (!added.has(deck.id)) continue;
		const words = await loadDeckWords(deck.id);
		if (words === undefined) continue;
		for (const word of words) {
			if (cards.length >= limit) break;
			if (studied.has(`${deck.id}:${word.id}`)) continue;
			cards.push({ deckId: deck.id, word, state: NEW_CARD, isNew: true });
		}
	}
	return cards;
}

export const load: PageServerLoad = async ({ params, locals: { supabase, claims } }) => {
	const verified = requireSignedIn(claims, params.lang);

	const { data: addedDecks, error: decksError } = await supabase
		.from('user_vocabulary_decks')
		.select('deck_id')
		.eq('user_id', verified.sub);

	if (decksError) {
		console.error('vocabulary train: failed to load added decks', decksError);
		return EMPTY_RESULT;
	}

	const deckIds = addedDecks.map((row) => row.deck_id as string);
	if (deckIds.length === 0) {
		return EMPTY_RESULT;
	}

	const now = new Date();
	const [counts, dueCards] = await Promise.all([
		countVocabularyProgress(supabase, verified.sub, deckIds, now),
		loadDueCards(supabase, verified.sub, deckIds, now, DUE_CARDS_PER_ROUND)
	]);

	// Only worth hunting for new words when the counts say there are some.
	const unseen = counts?.unseen ?? 0;
	const queuedNewCards =
		unseen > 0 ? await loadNewCards(supabase, verified.sub, deckIds, NEW_CARDS_PER_SESSION) : [];

	// Reviews first: a due card is already late and its interval keeps
	// stretching, while an unseen word loses nothing by waiting. The counts
	// describe the queue actually built; the held-back numbers are the rest,
	// and both come from counts rather than from lists.
	return {
		hasAddedDecks: true,
		queue: [...dueCards, ...queuedNewCards],
		newCount: queuedNewCards.length,
		dueCount: dueCards.length,
		newCardsHeldBack: Math.max(0, unseen - queuedNewCards.length),
		dueCardsHeldBack: Math.max(0, (counts?.due ?? 0) - dueCards.length)
	};
};

export const actions: Actions = {
	grade: async ({ request, params, locals: { supabase, claims } }) => {
		const verified = requireSignedIn(claims, params.lang);

		const formData = await request.formData();
		const deckId = String(formData.get('deckId') ?? '');
		const wordId = String(formData.get('wordId') ?? '');
		const gradeValue = String(formData.get('grade') ?? '');

		if (deckId === '' || wordId === '' || !isGrade(gradeValue)) {
			return fail(400, { errorCode: 'invalid_request' });
		}

		const { data: existing, error: fetchError } = await supabase
			.from('user_vocabulary_progress')
			.select('phase, step, interval_days, ease_factor, due_at, reps, lapses')
			.eq('user_id', verified.sub)
			.eq('deck_id', deckId)
			.eq('word_id', wordId)
			.maybeSingle();

		if (fetchError) {
			console.error('vocabulary train: failed to load current progress', fetchError);
			return fail(500, { errorCode: 'generic' });
		}

		const current = existing === null ? NEW_CARD : cardStateFromRow(existing);
		const next = gradeCard(current, gradeValue, new Date());

		const { error: upsertError } = await supabase.from('user_vocabulary_progress').upsert(
			{
				user_id: verified.sub,
				deck_id: deckId,
				word_id: wordId,
				...cardStateToRow(next),
				updated_at: new Date().toISOString()
			},
			{ onConflict: 'user_id,deck_id,word_id' }
		);

		if (upsertError) {
			console.error('vocabulary train: failed to save progress', upsertError);
			return fail(500, { errorCode: 'generic' });
		}

		return { success: true };
	}
};
