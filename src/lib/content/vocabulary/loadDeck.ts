import { getWord } from '$lib/content/words/entries';
import type { Word } from '$lib/content/words/types';

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
	const importModule = deckModules[`./decks/${deckId}.ts`];
	if (importModule === undefined) {
		return undefined;
	}
	const module = await importModule();
	return module.WORD_IDS.map((id) => {
		const word = getWord(id);
		if (word === undefined) {
			throw new Error(`vocabulary deck "${deckId}" references unknown word id "${id}"`);
		}
		return word;
	});
}
