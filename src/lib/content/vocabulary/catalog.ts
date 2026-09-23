import type { VocabularyDeck } from './types';

/**
 * Deck titles and metadata, safe to import anywhere since it carries no word
 * data — each deck's words are loaded lazily by `loadDeck.ts`.
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
		id: 'pronouns',
		title: { en: 'Pronouns', ru: 'Местоимения' },
		description: {
			en: 'I, you, and the three distances of “this”',
			ru: 'Я, ты и три «дистанции» слова «это»'
		},
		level: 'beginner',
		wordCount: 13,
		icon: 'person'
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
		id: 'food',
		title: { en: 'Food', ru: 'Еда' },
		description: {
			en: 'Bread, milk, meat and other things on the shopping list',
			ru: 'Хлеб, молоко, мясо и другие покупки'
		},
		level: 'beginner',
		wordCount: 20,
		icon: 'basket'
	}
];
