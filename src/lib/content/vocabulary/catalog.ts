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
		title: { en: 'Greetings', ru: 'Приветствия' },
		description: {
			en: 'Hello, goodbye and how are you',
			ru: 'Здравствуйте, до свидания и как дела'
		},
		level: 'beginner',
		wordCount: 20,
		icon: 'hand'
	},
	{
		id: 'verbs-1',
		title: { en: 'Essential verbs (pt. 1)', ru: 'Основные глаголы (часть 1)' },
		description: {
			en: "The twenty verbs you'll use daily",
			ru: 'Двадцать глаголов на каждый день'
		},
		level: 'beginner',
		wordCount: 20,
		icon: 'zap'
	},
	{
		id: 'family',
		title: { en: 'Family', ru: 'Семья' },
		description: {
			en: 'Parents, siblings, and which side the uncle is on',
			ru: 'Родители, братья и сёстры — и с какой стороны дядя'
		},
		level: 'beginner',
		wordCount: 20,
		icon: 'people'
	},
	{
		id: 'pronouns',
		title: { en: 'Pronouns', ru: 'Местоимения' },
		description: {
			en: 'I, you, and the three distances of “this”',
			ru: 'Я, ты и три «дистанции» слова «это»'
		},
		level: 'beginner',
		wordCount: 13,
		icon: 'person'
	}
];
