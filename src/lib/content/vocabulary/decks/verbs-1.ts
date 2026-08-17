import type { VocabularyWord } from '../types';

/**
 * Loaded lazily by `loadDeck.ts` — never import this file directly from a
 * component, or its words end up in every page's bundle instead of only
 * the deck page that needs them.
 */
export const WORDS: readonly VocabularyWord[] = [
	{ id: 'aprel', armenian: 'Ապրել', translation: { en: 'To live', ru: 'Жить' } },
	{
		id: 'khaghal',
		armenian: 'Խաղալ',
		translation: { en: 'To play (a game)', ru: 'Играть (в игру)' }
	},
	{
		id: 'gnal',
		armenian: 'Գնալ',
		translation: { en: 'To walk', ru: 'Идти' },
		note: {
			en: 'Not to be confused with Գնել ("to buy") — differs by one letter.',
			ru: 'Не путать с Գնել («покупать») — отличается на одну букву.'
		}
	},
	{ id: 'sovorel', armenian: 'Սովորել', translation: { en: 'To study', ru: 'Учиться' } },
	{ id: 'ashkhatel', armenian: 'Աշխատել', translation: { en: 'To work', ru: 'Работать' } },
	{ id: 'sirel', armenian: 'Սիրել', translation: { en: 'To love', ru: 'Любить' } },
	{ id: 'uzel', armenian: 'Ուզել', translation: { en: 'To want', ru: 'Хотеть' } },
	{ id: 'utel', armenian: 'Ուտել', translation: { en: 'To eat', ru: 'Кушать' } },
	{ id: 'kardal', armenian: 'Կարդալ', translation: { en: 'To read', ru: 'Читать' } },
	{ id: 'grel', armenian: 'Գրել', translation: { en: 'To write', ru: 'Писать' } },
	{
		id: 'gnel',
		armenian: 'Գնել',
		translation: { en: 'To buy', ru: 'Покупать' },
		note: {
			en: 'Not to be confused with Գնալ ("to walk") — differs by one letter.',
			ru: 'Не путать с Գնալ («идти») — отличается на одну букву.'
		}
	},
	{ id: 'haskanal', armenian: 'Հասկանալ', translation: { en: 'To understand', ru: 'Понимать' } },
	{ id: 'asel', armenian: 'Ասել', translation: { en: 'To say', ru: 'Говорить' } },
	{ id: 'khosel', armenian: 'Խոսել', translation: { en: 'To speak', ru: 'Разговаривать' } },
	{ id: 'lsel', armenian: 'Լսել', translation: { en: 'To listen', ru: 'Слушать' } },
	{ id: 'nayel', armenian: 'Նայել', translation: { en: 'To watch', ru: 'Смотреть' } },
	{ id: 'tesnel', armenian: 'Տեսնել', translation: { en: 'To see', ru: 'Видеть' } },
	{ id: 'anel', armenian: 'Անել', translation: { en: 'To do', ru: 'Делать' } },
	{ id: 'linel', armenian: 'Լինել', translation: { en: 'To be', ru: 'Быть' } },
	{ id: 'khndrel', armenian: 'Խնդրել', translation: { en: 'To ask for', ru: 'Просить' } }
];
