import { brandName } from './common';
import type { Translated } from '../types';

export const pageTitle: Translated = {
	en: `${brandName} — practice mode`,
	ru: `${brandName} — режим тренировки`
};

export const pageDescription: Translated = {
	en: 'Learn and quiz yourself on the Armenian alphabet a few letters at a time.',
	ru: 'Изучайте и проверяйте себя на армянском алфавите по несколько букв за раз.'
};

export const blockIntro: Translated = {
	en: 'Study these letters, then quiz yourself on them.',
	ru: 'Изучите эти буквы, а затем проверьте себя на них.'
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
