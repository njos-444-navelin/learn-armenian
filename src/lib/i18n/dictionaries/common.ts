import type { Translated } from '../types';

export const brandName: Translated = {
	en: 'Learn Armenian',
	ru: 'Учи армянский'
};

export const skipToContent: Translated = {
	en: 'Skip to main content',
	ru: 'Перейти к основному содержимому'
};

export const languageNames: Record<'en' | 'ru', Translated> = {
	en: { en: 'English', ru: 'Английский' },
	ru: { en: 'Russian', ru: 'Русский' }
};

export const startLearning: Translated = {
	en: 'Start learning',
	ru: 'Начать обучение'
};

export const back: Translated = {
	en: 'Back',
	ru: 'Назад'
};

export const continueLabel: Translated = {
	en: 'Continue',
	ru: 'Продолжить'
};

export const switchToLanguageLabel: Record<'en' | 'ru', Translated> = {
	en: {
		en: 'Switch to English',
		ru: 'Переключить на английский'
	},
	ru: {
		en: 'Switch to Russian',
		ru: 'Переключить на русский'
	}
};
