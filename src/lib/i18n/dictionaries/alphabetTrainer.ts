import { brandName } from './common';
import type { Translated } from '../types';

export const pageTitle: Translated = {
	en: `${brandName} — alphabet`,
	ru: `${brandName} — алфавит`
};

export const pageDescription: Translated = {
	en: 'Browse every letter of the Armenian alphabet, or practice to build up your mastery of each one.',
	ru: 'Просмотрите все буквы армянского алфавита или потренируйтесь, чтобы освоить каждую из них.'
};

export const heading: Translated = {
	en: 'The Armenian alphabet',
	ru: 'Армянский алфавит'
};

export const showUppercaseLabel: Translated = {
	en: 'Show uppercase letters',
	ru: 'Показать заглавные буквы'
};

export const showLowercaseLabel: Translated = {
	en: 'Show lowercase letters',
	ru: 'Показать строчные буквы'
};

/** aria-label for a grid tile — color alone (the mastery ramp) can't carry
 * this for screen-reader users. */
export function letterTileAriaLabel(pair: string, level: number): Translated {
	return {
		en: `${pair}, level ${level} of 10`,
		ru: `${pair}, уровень ${level} из 10`
	};
}

export const notMetLabel: Translated = {
	en: 'not met',
	ru: 'не встречалась'
};

export const knownColdLabel: Translated = {
	en: 'known cold',
	ru: 'знаю наизусть'
};

export const practiceLabel: Translated = {
	en: 'Practice',
	ru: 'Практика'
};

export function practiceSubtitleNew(count: number): Translated {
	const letters = count === 1 ? 'letter' : 'letters';
	return {
		en: `${count} new ${letters}, then your weakest`,
		ru: `${count} новых букв, затем самые слабые`
	};
}

export function practiceSubtitleWeakest(count: number): Translated {
	const letters = count === 1 ? 'letter' : 'letters';
	return {
		en: `${count} ${letters}, lowest levels first`,
		ru: `${count} букв, начиная с самых слабых`
	};
}

export const practiceSignInHint: Translated = {
	en: 'Sign in to start practicing',
	ru: 'Войдите, чтобы начать практику'
};

export const inWordLabel: Translated = {
	en: 'In a word',
	ru: 'В слове'
};

export const playPronunciationLabel: Translated = {
	en: 'Play pronunciation',
	ru: 'Воспроизвести произношение'
};

export const learnSectionLabel: Translated = {
	en: 'New letters',
	ru: 'Новые буквы'
};

export function stepCounterLabel(current: number, total: number): Translated {
	return {
		en: `${current} of ${total}`,
		ru: `${current} из ${total}`
	};
}

export const learnPreviousLabel: Translated = {
	en: 'Previous letter',
	ru: 'Предыдущая буква'
};

export const learnNextLabel: Translated = {
	en: 'Next letter',
	ru: 'Следующая буква'
};

export const learnStartPracticingLabel: Translated = {
	en: 'Start practising',
	ru: 'Начать практику'
};

export const drillSectionLabel: Translated = {
	en: 'Practice',
	ru: 'Практика'
};

export const questionSoundLabel: Translated = {
	en: 'Which sound?',
	ru: 'Какой звук?'
};

export const questionAudioLabel: Translated = {
	en: 'Which letter did you hear?',
	ru: 'Какую букву Вы услышали?'
};

export const questionCaseToLowerLabel: Translated = {
	en: 'Its small form?',
	ru: 'Как выглядит строчная форма?'
};

export const questionCaseToUpperLabel: Translated = {
	en: 'Its capital form?',
	ru: 'Как выглядит заглавная форма?'
};

export const audioReplayHint: Translated = {
	en: 'Tap to replay',
	ru: 'Нажмите, чтобы прослушать снова'
};

export const audioSkipLabel: Translated = {
	en: "I can't listen right now",
	ru: 'Сейчас не могу прослушать'
};

export const correctFeedbackLabel: Translated = {
	en: 'Correct!',
	ru: 'Правильно!'
};

export const incorrectFeedbackLabel: Translated = {
	en: 'Not quite — the correct answer is highlighted above.',
	ru: 'Не совсем — правильный ответ выделен выше.'
};

export const skippedFeedbackLabel: Translated = {
	en: 'No worries — want to mute audio questions for a bit?',
	ru: 'Ничего страшного — отключить аудио-вопросы на время?'
};

/** `minutes` should match whatever's actually passed to `muteAudioQuestions()`
 * at the call site — kept as a parameter rather than hardcoded so the copy
 * can't silently drift out of sync with the real mute duration. */
export function muteAudioLabel(minutes: number): Translated {
	return {
		en: `Mute for ${minutes} min`,
		ru: `Отключить на ${minutes} мин`
	};
}

export const correctAnswerHint: Translated = {
	en: '(correct answer)',
	ru: '(правильный ответ)'
};

export const incorrectAnswerHint: Translated = {
	en: '(your answer, incorrect)',
	ru: '(Ваш ответ, неверно)'
};

export const nextLabel: Translated = {
	en: 'Next',
	ru: 'Далее'
};

export const answerSaveFailedMessage: Translated = {
	en: "Couldn't save your progress on that letter — it'll be tried again next time it comes up.",
	ru: 'Не удалось сохранить прогресс по этой букве — попробуем снова, когда она встретится в следующий раз.'
};

export function summaryHeading(upCount: number): Translated {
	if (upCount === 0) {
		return { en: 'Nothing moved up this time', ru: 'На этот раз ничего не улучшилось' };
	}
	const letters = upCount === 1 ? 'letter' : 'letters';
	return {
		en: `${upCount} ${letters} went up`,
		ru: `${upCount} букв поднялись на уровень`
	};
}

export function summaryNote(downCount: number): Translated {
	if (downCount === 0) {
		return {
			en: 'Nothing slipped. The lowest levels come back first next time.',
			ru: 'Ничего не снизилось. В следующий раз начнём с самых слабых букв.'
		};
	}
	const letters = downCount === 1 ? 'letter' : 'letters';
	return {
		en: `${downCount} ${letters} slipped a level — those come back first next time.`,
		ru: `${downCount} букв опустились на уровень — начнём с них в следующий раз.`
	};
}

export function levelBadgeLabel(level: number): Translated {
	return { en: `Level ${level}`, ru: `Уровень ${level}` };
}

export const backToAlphabetLabel: Translated = {
	en: 'Back to the alphabet',
	ru: 'Назад к алфавиту'
};

export const practiceAgainLabel: Translated = {
	en: 'Practice again',
	ru: 'Практиковать снова'
};

export const closeSheetLabel: Translated = {
	en: 'Close',
	ru: 'Закрыть'
};
