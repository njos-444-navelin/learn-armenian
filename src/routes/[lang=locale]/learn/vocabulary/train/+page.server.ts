import { fail } from '@sveltejs/kit';
import { VOCABULARY_CATALOG } from '$lib/content/vocabulary/catalog';
import { loadDeckWords } from '$lib/content/vocabulary/loadDeck';
import type { TrainingCard } from '$lib/content/vocabulary/training';
import { requireSignedIn } from '$lib/server/authGuard';
import { NEW_CARD, cardStateFromRow, cardStateToRow, gradeCard, isDue, isGrade } from '$lib/srs/scheduler';
import type { Actions, PageServerLoad } from './$types';

const EMPTY_RESULT = { hasAddedDecks: false, queue: [] as TrainingCard[], newCount: 0, dueCount: 0 };

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

	const decksWithWords = await Promise.all(
		deckIds.map(async (deckId) => {
			const deck = VOCABULARY_CATALOG.find((candidate) => candidate.id === deckId);
			if (deck === undefined) return undefined;
			const words = await loadDeckWords(deckId);
			return words === undefined ? undefined : { deckId, words };
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

	return {
		hasAddedDecks: true,
		queue: [...newCards, ...dueCards],
		newCount: newCards.length,
		dueCount: dueCards.length
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
