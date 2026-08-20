import type { Word } from './types';

/**
 * Flat, cross-feature word registry — id -> Word. Currently populated by the
 * alphabet trainer's example words; the future Dialogues feature and a
 * searchable dictionary will draw from the same ids. Not code-split (unlike
 * `vocabulary/decks/*.ts`) — at this scale (dozens of entries) there's no
 * per-consumer download cost worth optimizing for.
 *
 * Deliberately does NOT include the words already in
 * `src/lib/content/vocabulary/decks/*.ts` — folding vocabulary decks into
 * this registry (decks becoming "curated lists of word ids" instead of
 * embedding word data) is a real, larger refactor, explicitly deferred, not
 * attempted here. Some duplication is expected and fine — e.g. Ուշ/`ush`
 * below is also `verbs-1`'s own entry, with its own separately-generated
 * audio file — nothing cross-references between the two registries.
 */
export const WORDS: readonly Word[] = [
	{ id: 'ayo', armenian: 'Այո', translation: { en: 'Yes', ru: 'Да' } },
	{ id: 'barev', armenian: 'Բարև', translation: { en: 'Hi', ru: 'Привет' } },
	{ id: 'gisher', armenian: 'Գիշեր', translation: { en: 'Night', ru: 'Ночь' } },
	{ id: 'dur', armenian: 'Դուռ', translation: { en: 'Door', ru: 'Дверь' } },
	// Ե is mid-word "eh" here — see `yech`'s exampleWordIds ordering.
	{ id: 'dzez', armenian: 'Ձեզ', translation: { en: 'To you', ru: 'Вам' } },
	// Ե is word-initial "yeh" here, the second half of the yech/Ե pair above.
	{ id: 'yereko', armenian: 'Երեկո', translation: { en: 'Evening', ru: 'Вечер' } },
	{ id: 'zang', armenian: 'Զանգ', translation: { en: 'Call', ru: 'Звонок' } },
	{ id: 'ej', armenian: 'Էջ', translation: { en: 'Page', ru: 'Страница' } },
	{ id: 'ynker', armenian: 'Ընկեր', translation: { en: 'Friend', ru: 'Друг' } },
	{ id: 'tey', armenian: 'Թեյ', translation: { en: 'Tea', ru: 'Чай' } },
	{ id: 'zham', armenian: 'Ժամ', translation: { en: 'Hour', ru: 'Час' } },
	{ id: 'im', armenian: 'Իմ', translation: { en: 'My', ru: 'Мой' } },
	{ id: 'luys', armenian: 'Լույս', translation: { en: 'Light', ru: 'Свет' } },
	{ id: 'xaghal', armenian: 'Խաղալ', translation: { en: 'To play', ru: 'Играть' } },
	{ id: 'tsaghik', armenian: 'Ծաղիկ', translation: { en: 'Flower', ru: 'Цветок' } },
	{ id: 'katu', armenian: 'Կատու', translation: { en: 'Cat', ru: 'Кот' } },
	{ id: 'hats', armenian: 'Հաց', translation: { en: 'Bread', ru: 'Хлеб' } },
	{ id: 'dzuk', armenian: 'Ձուկ', translation: { en: 'Fish', ru: 'Рыба' } },
	{ id: 'aghjik', armenian: 'Աղջիկ', translation: { en: 'Girl', ru: 'Девочка' } },
	{ id: 'chash', armenian: 'Ճաշ', translation: { en: 'Meal', ru: 'Обед' } },
	{ id: 'mayr', armenian: 'Մայր', translation: { en: 'Mother', ru: 'Мать' } },
	{ id: 'yot', armenian: 'Յոթ', translation: { en: 'Seven', ru: 'Семь' } },
	{ id: 'nor', armenian: 'Նոր', translation: { en: 'New', ru: 'Новый' } },
	{ id: 'shun', armenian: 'Շուն', translation: { en: 'Dog', ru: 'Собака' } },
	// Ո is mid-word plain "o" here — see `vo`'s exampleWordIds ordering.
	{ id: 'mot', armenian: 'Մոտ', translation: { en: 'Near', ru: 'Рядом' } },
	// Ո is word-initial "vo" here, the second half of the vo/Ո pair above —
	// same word VOCABULARY_AUDIO.md itself uses to document the ElevenLabs
	// "Ո"->"Վ" prompt-respelling workaround.
	{ id: 'vonts', armenian: 'Ոնց', translation: { en: 'How?', ru: 'Как?' }, register: 'informal' },
	{ id: 'chors', armenian: 'Չորս', translation: { en: 'Four', ru: 'Четыре' } },
	{ id: 'panir', armenian: 'Պանիր', translation: { en: 'Cheese', ru: 'Сыр' } },
	{ id: 'jur', armenian: 'Ջուր', translation: { en: 'Water', ru: 'Вода' } },
	// Was "Ռուս" ("a Russian person"), chosen to sidestep the loanword-stress
	// ambiguity "Ռադիո" had — but the TTS voice consistently generated
	// "Ռուսական" ("Russian", adjective, e.g. "Russian cuisine") instead, no
	// matter how the prompt was adjusted. Renamed to match what's actually
	// spoken rather than keep fighting the model — same principle as the
	// kov->mot swap above, but the fix this time is "adopt the word the
	// audio already says" instead of "pick a different word from scratch".
	{ id: 'rusakan', armenian: 'Ռուսական', translation: { en: 'Russian', ru: 'Русский' } },
	{ id: 'seghan', armenian: 'Սեղան', translation: { en: 'Table', ru: 'Стол' } },
	{ id: 'vat', armenian: 'Վատ', translation: { en: 'Bad', ru: 'Плохой' } },
	{ id: 'tun', armenian: 'Տուն', translation: { en: 'House', ru: 'Дом' } },
	{ id: 'sirel', armenian: 'Սիրել', translation: { en: 'To love', ru: 'Любить' } },
	{ id: 'tsurt', armenian: 'Ցուրտ', translation: { en: 'Cold', ru: 'Холодно' } },
	// Ու as a digraph is already correct as literally spelled — no ElevenLabs
	// respelling needed (see docs/VOCABULARY_AUDIO.md's own worked example).
	{ id: 'ush', armenian: 'Ուշ', translation: { en: 'Late', ru: 'Поздно' } },
	{ id: 'pogh', armenian: 'Փող', translation: { en: 'Money', ru: 'Деньги' } },
	{ id: 'kuyr', armenian: 'Քույր', translation: { en: 'Sister', ru: 'Сестра' } },
	{ id: 'or', armenian: 'Օր', translation: { en: 'Day', ru: 'День' } },
	{ id: 'film', armenian: 'Ֆիլմ', translation: { en: 'Film', ru: 'Фильм' } },
	// Capital city name — a natural, already-capitalized way to show և
	// mid-word, sidestepping the ligature's own missing-uppercase quirk
	// (see AlphabetLetter's `yev` entry) rather than forcing one.
	{ id: 'yerevan', armenian: 'Երևան', translation: { en: 'Yerevan', ru: 'Ереван' } }
];

export function getWord(id: string): Word | undefined {
	return WORDS.find((word) => word.id === id);
}
