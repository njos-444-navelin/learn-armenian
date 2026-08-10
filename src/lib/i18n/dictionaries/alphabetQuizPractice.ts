import type { Translated } from '../types';

export const pageTitle: Translated = {
	en: 'Learn Armenian — practice mode',
	ru: 'Учи армянский — режим тренировки'
};

export const pageDescription: Translated = {
	en: 'Learn and quiz yourself on the Armenian alphabet a few letters at a time.',
	ru: 'Изучай и проверяй себя на армянском алфавите по несколько букв за раз.'
};

export const blockIntro: Translated = {
	en: 'Study these letters, then quiz yourself on them.',
	ru: 'Изучи эти буквы, а затем проверь себя на них.'
};

export const quizBlockLabel: Translated = {
	en: 'Quiz me on these',
	ru: 'Проверить меня'
};

export function blockHeading(current: number, total: number): Translated {
	return {
		en: `Block ${current} of ${total}`,
		ru: `Блок ${current} из ${total}`
	};
}
