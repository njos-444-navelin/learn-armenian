import { fail, redirect } from '@sveltejs/kit';
import { isSafeInternalPath } from '$lib/i18n/paths';
import { ALPHABET } from '$lib/content/alphabet';
import { LEVEL_MAX } from '$lib/alphabet/mastery';
import { DIALOGUE_CATALOG } from '$lib/content/dialogues/catalog';
import { countVocabularyProgress } from '$lib/server/vocabularyCounts';
import type { Actions, PageServerLoad } from './$types';

/**
 * Stats for the signed-in dashboard's progress cards: alphabet mastery (the
 * learner's 0-10 drill level per letter, averaged across the whole
 * alphabet), the vocabulary collection's size split into a total and a
 * waiting-right-now count, and how many of the catalog's dialogues are
 * completed.
 *
 * The vocabulary half is the same three integers the locale layout asks for
 * (see `vocabularyCounts.ts`) — this page just needs their values rather
 * than only whether any of them is above zero. Neither one fetches progress
 * rows any more.
 *
 * The alphabet and dialogue queries below stay row-based on purpose: those
 * are bounded by *content* (39 letters, a handful of dialogues) rather than
 * by how much the learner has done, so they can't grow the way vocabulary
 * can — and the alphabet one needs each letter's level, not a tally.
 */
export const load: PageServerLoad = async ({ locals: { supabase, claims } }) => {
	const dialoguesTotalCount = DIALOGUE_CATALOG.length;
	const empty = {
		alphabetMasteryPercent: 0,
		vocabularyWordCount: 0,
		vocabularyDueCount: 0,
		dialoguesCompletedCount: 0,
		dialoguesTotalCount
	};
	if (claims === null) {
		return empty;
	}

	const { data: alphabetRows, error: alphabetError } = await supabase
		.from('user_alphabet_progress')
		.select('letter_id, level')
		.eq('user_id', claims.sub);

	let alphabetMasteryPercent = 0;
	if (alphabetError) {
		console.error('account: failed to load alphabet progress', alphabetError);
	} else {
		const levelByLetterId = new Map(
			alphabetRows.map((row) => [row.letter_id as string, row.level as number])
		);
		const totalLevel = ALPHABET.reduce(
			(sum, letter) => sum + (levelByLetterId.get(letter.id) ?? 0),
			0
		);
		alphabetMasteryPercent = Math.round((totalLevel / (ALPHABET.length * LEVEL_MAX)) * 100);
	}

	// Only dialogues still in the catalog count, so a row left behind by a
	// removed dialogue can't push "completed" past "total".
	const { data: dialogueRows, error: dialoguesError } = await supabase
		.from('user_dialogue_progress')
		.select('dialogue_id')
		.eq('user_id', claims.sub);

	let dialoguesCompletedCount = 0;
	if (dialoguesError) {
		console.error('account: failed to load dialogue progress', dialoguesError);
	} else {
		dialoguesCompletedCount = dialogueRows.filter((row) =>
			DIALOGUE_CATALOG.some((dialogue) => dialogue.id === row.dialogue_id)
		).length;
	}

	const partial = { ...empty, alphabetMasteryPercent, dialoguesCompletedCount };

	const { data: addedDecks, error: decksError } = await supabase
		.from('user_vocabulary_decks')
		.select('deck_id')
		.eq('user_id', claims.sub);

	if (decksError) {
		console.error('account: failed to load added decks', decksError);
		return partial;
	}

	const deckIds = addedDecks.map((row) => row.deck_id as string);
	const counts = await countVocabularyProgress(supabase, claims.sub, deckIds, new Date());
	if (counts === undefined) {
		return partial;
	}

	// The dashboard's "due" has always meant everything waiting, new words
	// included — a learner reading "63 words" then meets 20 new and 43
	// reviews in the trainer, which splits the same total into its two
	// halves rather than reporting a different one.
	return {
		...partial,
		vocabularyWordCount: counts.total,
		vocabularyDueCount: counts.due + counts.unseen
	};
};

export const actions: Actions = {
	login: async ({ request, url, locals: { supabase } }) => {
		const formData = await request.formData();
		const email = String(formData.get('email') ?? '');
		const password = String(formData.get('password') ?? '');
		const { error } = await supabase.auth.signInWithPassword({ email, password });
		if (error) return fail(400, { action: 'login' as const, email, errorCode: error.code });

		// Sends the visitor back to whatever gated action redirected them here
		// (see requireSignedIn()'s `resume` option) instead of stranding them
		// on the account page — but only to a validated internal path; `next`
		// arrives via the query string, so it's user-editable and must never
		// be trusted as an unchecked redirect target.
		const next = url.searchParams.get('next');
		if (next !== null && isSafeInternalPath(next)) {
			redirect(303, next);
		}

		return { action: 'login' as const, success: true };
	},

	logout: async ({ locals: { supabase } }) => {
		await supabase.auth.signOut();
		return { action: 'logout' as const, success: true };
	}
};
