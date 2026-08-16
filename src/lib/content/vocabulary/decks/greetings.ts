import type { VocabularyWord } from '../types';

/**
 * Loaded lazily by `loadDeck.ts` — never import this file directly from a
 * component, or its words end up in every page's bundle instead of only
 * the deck page that needs them.
 */
export const WORDS: readonly VocabularyWord[] = [
	{ id: 'barev', armenian: 'Բարև', translation: { en: 'Hi', ru: 'Привет' } },
	{ id: 'bari', armenian: 'Բարի', translation: { en: 'Kind', ru: 'Добрый' } },
	{ id: 'dzez', armenian: 'Ձեզ', translation: { en: 'To you', ru: 'Вам' } },
	{ id: 'luys', armenian: 'Լույս', translation: { en: 'Light', ru: 'Свет' } },
	{ id: 'aravot', armenian: 'Առավոտ', translation: { en: 'Morning', ru: 'Утро' } },
	{ id: 'or', armenian: 'Օր', translation: { en: 'Day', ru: 'День' } },
	{
		id: 'irikun',
		armenian: 'Իրիկուն',
		translation: { en: 'Evening', ru: 'Вечер' },
		register: 'informal'
	},
	{ id: 'gisher', armenian: 'Գիշեր', translation: { en: 'Night', ru: 'Ночь' } },
	{ id: 'ush', armenian: 'Ուշ', translation: { en: 'Late', ru: 'Поздно' } },
	{ id: 'hajogh', armenian: 'Հաջող', translation: { en: 'Bye!', ru: 'Пока!' } },
	{
		id: 'hajoghutyun',
		armenian: 'Հաջողություն',
		translation: { en: 'Good luck', ru: 'Удачи' }
	},
	{
		id: 'tstesutyun',
		armenian: 'Ցտեսություն',
		translation: { en: 'Goodbye', ru: 'До свидания' }
	},
	{
		id: 'shnorhakalutyun',
		armenian: 'Շնորհակալություն',
		translation: { en: 'Thanks', ru: 'Спасибо' }
	},
	{
		id: 'apres',
		armenian: 'Ապրես',
		translation: { en: 'Live', ru: 'Живи' },
		register: 'informal',
		note: {
			en: 'Imperative mood — literally "Do live!"',
			ru: 'Повелительное наклонение — буквально «живи!»'
		}
	},
	{
		id: 'aprek',
		armenian: 'Ապրեք',
		translation: { en: 'Live', ru: 'Живите' },
		register: 'formal',
		note: {
			en: 'Imperative mood, formal/plural — literally "Do live!"',
			ru: 'Повелительное наклонение, форма «Вы» — буквально «живите!»'
		}
	},
	{ id: 'vonts', armenian: 'Ոնց', translation: { en: 'How?', ru: 'Как?' }, register: 'informal' },
	{
		id: 'inchpes',
		armenian: 'Ինչպես',
		translation: { en: 'How?', ru: 'Как?' },
		register: 'formal'
	},
	{ id: 'lav', armenian: 'Լավ', translation: { en: 'Good', ru: 'Хорошо' } },
	{ id: 'vat', armenian: 'Վատ', translation: { en: 'Bad', ru: 'Плохо' } },
	{ id: 'normal', armenian: 'Նորմալ', translation: { en: 'Normal', ru: 'Нормально' } }
];
