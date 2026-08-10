import type { Translated } from '../types';

/**
 * Copy shared by every quiz mode (mode-selection's destinations, both the
 * "entire alphabet" and "practice" pages) — the in-progress quiz UI and the
 * "you matched every letter [in this pool]" completion screen. Each mode
 * page owns its own `pageTitle`/`pageDescription`/`heading` instead, since
 * those genuinely differ per route.
 */

export const question: Translated = {
	en: 'What sound does this letter make?',
	ru: 'Какой звук издаёт эта буква?'
};

export const nextLabel: Translated = {
	en: 'Next',
	ru: 'Далее'
};

export const restartLabel: Translated = {
	en: 'Practice again',
	ru: 'Повторить снова'
};

export const backToStudyLabel: Translated = {
	en: 'Back to alphabet',
	ru: 'Назад к алфавиту'
};

export const correctAnswerHint: Translated = {
	en: '(correct answer)',
	ru: '(правильный ответ)'
};

export const incorrectAnswerHint: Translated = {
	en: '(your answer, incorrect)',
	ru: '(ваш ответ, неверно)'
};

export const correctFeedback: Translated = {
	en: 'Correct!',
	ru: 'Правильно!'
};

export const incorrectFeedback: Translated = {
	en: 'Not quite — see the correct answer above.',
	ru: 'Не совсем — правильный ответ выше.'
};

export const completionHeading: Translated = {
	en: "You've matched every letter!",
	ru: 'Вы прошли все буквы!'
};

export const completionBody: Translated = {
	en: 'Great work learning the Armenian alphabet. Practice again any time to keep it fresh.',
	ru: 'Отличная работа с армянским алфавитом. Повторяйте в любое время, чтобы не забыть.'
};

export function progressLabel(mastered: number, total: number): Translated {
	return {
		en: `${mastered} / ${total} letters mastered`,
		ru: `${mastered} из ${total} букв освоено`
	};
}
