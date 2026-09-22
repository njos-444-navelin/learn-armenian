import { fail } from '@sveltejs/kit';
import { VOCABULARY_CATALOG } from '$lib/content/vocabulary/catalog';
import { loadDeckWords } from '$lib/content/vocabulary/loadDeck';
import type { TrainingCard } from '$lib/content/vocabulary/training';
import { requireSignedIn } from '$lib/server/authGuard';
import { NEW_CARD, cardStateFromRow, cardStateToRow, gradeCard, isDue, isGrade } from '$lib/srs/scheduler';
import type { Actions, PageServerLoad } from './$types';

const EMPTY_RESULT = {
	hasAddedDecks: false,
	queue: [] as TrainingCard[],
	newCount: 0,
	dueCount: 0,
	newCardsHeldBack: 0
};

/**
 * How many never-studied words one session may introduce. Without a cap the
 * queue held every unseen word of every added deck — someone who adds five
 * decks at once queues ninety-odd new cards, and since new cards used to sit
 * ahead of the reviews (see the ordering of the returned `queue` below),
 * yesterday's due words were simply unreachable and the backlog only grew.
 * Roughly Anki's own default of twenty a day, but scoped to a session rather
 * than a day on purpose: reloading the page hands out another batch, which
 * reads as "keep going" rather than as a limit to work around, and it needs
 * neither a stored per-day counter nor a ruling on whose midnight ends the
 * day.
 */
const NEW_CARDS_PER_SESSION = 20;

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

	// Walked in catalog order rather than in whatever order the membership
	// rows came back in: now that only NEW_CARDS_PER_SESSION new words make
	// it into the queue, this decides *which* unseen words a learner meets
	// first, and the catalog's order is the course's intended progression —
	// someone who adds every deck at once should still meet the greetings
	// before the food.
	const addedDeckIds = new Set(deckIds);
	const decksWithWords = await Promise.all(
		VOCABULARY_CATALOG.filter((deck) => addedDeckIds.has(deck.id)).map(async (deck) => {
			const words = await loadDeckWords(deck.id);
			return words === undefined ? undefined : { deckId: deck.id, words };
		})
	);

	const { data: progressRows, error: progressError } = await supabase
		.from('user_vocabulary_progress')
		.select('deck_id, word_id, phase, step, interval_days, ease_factor, due_at, reps, lapses')
		.eq('user_id', verified.sub)
		.in('deck_id', deckIds);

	if (progressError) {
		console.error('vocabulary train: failed to load progress', progressError);
	}

	const progressByKey = new Map(
		(progressRows ?? []).map((row) => [`${row.deck_id}:${row.word_id}`, row])
	);

	const now = new Date();
	const newCards: TrainingCard[] = [];
	const dueCards: TrainingCard[] = [];

	for (const entry of decksWithWords) {
		if (entry === undefined) continue;
		for (const word of entry.words) {
			const row = progressByKey.get(`${entry.deckId}:${word.id}`);
			if (row === undefined) {
				newCards.push({ deckId: entry.deckId, word, state: NEW_CARD, isNew: true });
				continue;
			}
			const state = cardStateFromRow(row);
			if (isDue(state, now)) {
				dueCards.push({ deckId: entry.deckId, word, state, isNew: false });
			}
		}
	}

	dueCards.sort((a, b) => a.state.dueAt.getTime() - b.state.dueAt.getTime());
	const queuedNewCards = newCards.slice(0, NEW_CARDS_PER_SESSION);

	// Reviews first, new words after: a due card is already late, and its
	// interval keeps stretching for as long as it waits, whereas a word that
	// has never been studied loses nothing by being met ten minutes later.
	// The counts describe the queue that was actually built, not everything
	// that could have gone into it — `newCount` is what the learner will
	// meet this session, not how many unseen words their decks still hold.
	// `newCardsHeldBack` is the rest: what the cap kept back, which the
	// caught-up screen names so finishing a round reads as "there's more
	// whenever you want it" rather than as having exhausted the decks.
	return {
		hasAddedDecks: true,
		queue: [...dueCards, ...queuedNewCards],
		newCount: queuedNewCards.length,
		dueCount: dueCards.length,
		newCardsHeldBack: newCards.length - queuedNewCards.length
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
