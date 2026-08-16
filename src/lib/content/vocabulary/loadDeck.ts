import type { VocabularyWord } from './types';

interface DeckModule {
	WORDS: readonly VocabularyWord[];
}

/**
 * One lazy import per deck file — Vite splits each into its own chunk, so
 * opening a deck only ever downloads that deck's words, never every deck
 * in the catalog.
 */
const deckModules = import.meta.glob<DeckModule>('./decks/*.ts');

export async function loadDeckWords(deckId: string): Promise<readonly VocabularyWord[] | undefined> {
	const importModule = deckModules[`./decks/${deckId}.ts`];
	if (importModule === undefined) {
		return undefined;
	}
	const module = await importModule();
	return module.WORDS;
}
