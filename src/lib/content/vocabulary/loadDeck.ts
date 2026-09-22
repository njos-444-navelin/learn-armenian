import { getWord } from '$lib/content/words/entries';
import type { Word } from '$lib/content/words/types';
import { VOCABULARY_CATALOG } from './catalog';

interface DeckModule {
	WORD_IDS: readonly string[];
}

/**
 * One lazy import per deck file, keyed by deck id. A deck file is only a
 * list of ids into the shared word library, so what's split per deck here
 * is the *selection*, not word data — the library itself is one shared
 * module (see the comment atop `words/entries.ts`). The glob still earns its
 * keep as the single place a deck id turns into a file, so a deck the
 * catalog names but no file backs surfaces as `undefined` here, not as an
 * import error somewhere else.
 */
const deckModules = import.meta.glob<DeckModule>('./decks/*.ts');

/**
 * The deck's words, in the deck's own order — or `undefined` for a deck id
 * with no file. Throws for a deck that references a word id the library
 * doesn't have: that's a content bug (a typo in `decks/<id>.ts`, or a word
 * removed from `entries.ts` while still listed), and it should fail loudly
 * on the first page that loads the deck, not render a silently shorter list.
 */
export async function loadDeckWords(deckId: string): Promise<readonly Word[] | undefined> {
	const wordIds = await loadDeckWordIds(deckId);
	if (wordIds === undefined) {
		return undefined;
	}
	return wordIds.map((id) => {
		const word = getWord(id);
		if (word === undefined) {
			throw new Error(`vocabulary deck "${deckId}" references unknown word id "${id}"`);
		}
		return word;
	});
}

/**
 * The deck's word ids, in the deck's own order — what `loadDeckWords()`
 * resolves, before the resolving. For the callers that need to know *how
 * many* words a deck holds, or *which ids*, without paying for a `Word`
 * object per id (see `server/vocabularyCounts.ts`, where a deck's size is
 * one half of every new-word count).
 *
 * Throws when the catalog's `wordCount` disagrees with the file, the same
 * way `loadDialogue()` checks its `lineCount` — Conventions §10 says that
 * number is maintained by hand, and those counts now do arithmetic with it
 * rather than only printing it on a card. A drifted number would promise
 * new words that don't exist, which surfaces as an empty round rather than
 * as anything a learner could make sense of.
 */
export async function loadDeckWordIds(deckId: string): Promise<readonly string[] | undefined> {
	const importModule = deckModules[`./decks/${deckId}.ts`];
	if (importModule === undefined) {
		return undefined;
	}
	const module = await importModule();
	const deck = VOCABULARY_CATALOG.find((candidate) => candidate.id === deckId);
	if (deck !== undefined && module.WORD_IDS.length !== deck.wordCount) {
		throw new Error(
			`vocabulary deck "${deckId}": catalog says ${deck.wordCount} words, file has ${module.WORD_IDS.length}`
		);
	}
	return module.WORD_IDS;
}

/** Total words across the given decks. Free of the database entirely — a
 * sum over the deck files' own id lists, which are code. */
export async function countDeckWords(deckIds: readonly string[]): Promise<number> {
	const sizes = await Promise.all(
		deckIds.map(async (deckId) => (await loadDeckWordIds(deckId))?.length ?? 0)
	);
	return sizes.reduce((sum, size) => sum + size, 0);
}
