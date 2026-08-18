import { brandName } from './common';
import type { Translated } from '../types';

export const pageTitle: Translated = {
	en: `${brandName} — choose your language`,
	ru: `${brandName} — выберите язык`
};

export const pageDescription: Translated = {
	en: 'Learn Armenian from English or Russian. Pick the language you already know to get started.',
	ru: 'Изучайте армянский язык с русского или английского. Выберите свой язык, чтобы начать.'
};

export const heading: Translated = {
	en: brandName,
	ru: brandName
};

export const subheading: Translated = {
	en: 'Which language would you like to learn from?',
	ru: 'С какого языка Вы хотите учиться?'
};

export const languagePickerLabel: Translated = {
	en: 'Choose your language',
	ru: 'Выберите язык'
};

export const languageHint: Record<'en' | 'ru', Translated> = {
	en: {
		en: 'Learn Armenian from English',
		ru: 'Учить армянский с английского'
	},
	ru: {
		en: 'Learn Armenian from Russian',
		ru: 'Учить армянский с русского'
	}
};
