import { brandName } from './common';
import type { Translated } from '../types';

export const pageTitle: Translated = {
	en: `${brandName} — choose a quiz mode`,
	ru: `${brandName} — выберите режим проверки`
};

export const pageDescription: Translated = {
	en: "Choose how you'd like to be quizzed on the Armenian alphabet.",
	ru: 'Выберите, как Вы хотите проверить свои знания армянского алфавита.'
};

export const heading: Translated = {
	en: 'Choose a quiz mode',
	ru: 'Выберите режим проверки'
};

export const practiceModeLabel: Translated = {
	en: 'Practice mode',
	ru: 'Режим тренировки'
};

export const practiceModeDescription: Translated = {
	en: 'Learn a few letters at a time, then get quizzed on just those before moving on to the next few.',
	ru: 'Изучайте по несколько букв за раз, затем проверяйте только их, прежде чем переходить к следующим.'
};

export const allModeLabel: Translated = {
	en: 'Entire alphabet',
	ru: 'Весь алфавит'
};

export const allModeDescription: Translated = {
	en: 'Get quizzed on all 38 letters at once.',
	ru: 'Проверьте себя сразу на всех 38 буквах.'
};
