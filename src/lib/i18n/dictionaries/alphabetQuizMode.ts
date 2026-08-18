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

/** Dynamic — see Conventions §1 on why interpolated text is a function, not a literal. */
export function allModeDescription(letterCount: number): Translated {
	return {
		en: `Get quizzed on all ${letterCount} letters at once.`,
		ru: `Проверьте себя сразу на всех ${letterCount} буквах.`
	};
}
