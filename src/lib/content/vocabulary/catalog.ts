import type { VocabularyDeck } from './types';

/**
 * The full list of vocabulary decks and their titles — safe to import
 * anywhere (topic list, SEO copy) since it carries no word data. Each
 * deck's actual words live in their own file under `decks/` and are loaded
 * lazily by `loadDeck.ts`, so browsing this catalog never pulls word data
 * into the bundle.
 */
export const VOCABULARY_CATALOG: readonly VocabularyDeck[] = [
	{
		id: 'greetings',
		title: { en: 'Greetings', ru: 'Приветствия' }
	}
];
