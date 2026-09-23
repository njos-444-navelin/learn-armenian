import { fail, redirect } from '@sveltejs/kit';
import { isSafeInternalPath } from '$lib/i18n/paths';
import { ALPHABET } from '$lib/content/alphabet';
import { LEVEL_MAX } from '$lib/alphabet/mastery';
import { DIALOGUE_CATALOG } from '$lib/content/dialogues/catalog';
import { countVocabularyProgress } from '$lib/server/vocabularyCounts';
import type { Actions, PageServerLoad } from './$types';

/**
 * Stats for the signed-in dashboard's progress cards.
 *
 * The vocabulary half is the same three integers the locale layout asks for
 * (`vocabularyCounts.ts`); neither fetches progress rows.
 *
 * The alphabet and dialogue queries below stay row-based: they're bounded by
 * content (39 letters, a handful of dialogues) rather than by how much the
 * learner has done, and the alphabet one needs each letter's level.
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

	// "Due" here means everything waiting, new words included; the trainer
	// splits the same total into reviews and new rather than reporting another.
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

		// Back to whatever gated action redirected them here (see
		// requireSignedIn()'s `resume`), but only to a validated internal path:
		// `next` arrives in the query string and is user-editable.
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
