import { getWord } from '$lib/content/words/entries';
import type { Word } from '$lib/content/words/types';
import { VOCABULARY_CATALOG } from './catalog';

interface DeckModule {
	WORD_IDS: readonly string[];
}

/**
 * One lazy import per deck file. A deck file is only a list of ids into the
 * shared word library, so what's split per deck is the selection, not the word
 * data. The glob is also the single place a deck id turns into a file, so a
 * deck the catalog names but no file backs surfaces as `undefined` here.
 */
const deckModules = import.meta.glob<DeckModule>('./decks/*.ts');

/**
 * The deck's words in its own order, or `undefined` for a deck id with no
 * file. Throws for an id the library doesn't have: that's a content bug, and
 * it should fail loudly rather than render a silently shorter list.
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
 * The ids `loadDeckWords()` resolves, for callers that need how many or which
 * without paying for a `Word` per id (see `server/vocabularyCounts.ts`).
 *
 * Throws when the catalog's `wordCount` disagrees with the file, like
 * `loadDialogue()`'s `lineCount` check: that number is maintained by hand
 * (Conventions §10) and the counts now do arithmetic with it, so a drifted
 * one promises new words that don't exist.
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

/** Summed from the deck files' own id lists; touches no database. */
export async function countDeckWords(deckIds: readonly string[]): Promise<number> {
	const sizes = await Promise.all(
		deckIds.map(async (deckId) => (await loadDeckWordIds(deckId))?.length ?? 0)
	);
	return sizes.reduce((sum, size) => sum + size, 0);
}
