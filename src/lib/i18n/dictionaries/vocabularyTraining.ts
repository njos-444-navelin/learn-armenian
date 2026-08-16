import { brandName } from './common';
import type { Translated } from '../types';
import type { Grade } from '$lib/srs/scheduler';

// --- Menu entry point ---

export const trainVocabularyMenuLabel: Translated = {
	en: 'Train vocabulary',
	ru: 'Тренировать слова'
};

// --- Training page (/learn/vocabulary/train) ---

export const pageTitle: Translated = {
	en: `${brandName} — train vocabulary`,
	ru: `${brandName} — тренировка слов`
};

export const pageDescription: Translated = {
	en: 'Practice the words in your vocabulary collection with spaced repetition.',
	ru: 'Практикуйте слова из своей коллекции с интервальным повторением.'
};

export const heading: Translated = {
	en: 'Train vocabulary',
	ru: 'Тренировка слов'
};

/** Dynamic — see Conventions §1 on why interpolated text is a function, not a literal. */
export function todaysCountLabel(newCount: number, dueCount: number): Translated {
	return {
		en: `${newCount} new · ${dueCount} due for review`,
		ru: `${newCount} новых · ${dueCount} на повторение`
	};
}

export const flipHint: Translated = {
	en: 'Tap the card to reveal the translation',
	ru: 'Нажмите на карточку, чтобы увидеть перевод'
};

export function flipButtonLabel(flipped: boolean): Translated {
	return flipped
		? { en: 'Show the Armenian word', ru: 'Показать армянское слово' }
		: { en: 'Show the translation', ru: 'Показать перевод' };
}

const DAYS_PER_MONTH = 30.44; // 365.25 / 12 — matches Anki's own approximation
const DAYS_PER_YEAR = 365.25;

/** Whole minutes until a grade's resulting review — shown on that grade's
 * button. Dynamic/interpolated, see Conventions §1. Months/years get one
 * decimal place (e.g. "2.3mo"), same as Anki's own reviewer — a card
 * reviewed successfully many times keeps compounding its interval well
 * past a year, where a whole-number rounding would lose too much
 * precision to be useful. */
export function intervalLabel(minutes: number): Translated {
	if (minutes < 60) {
		const value = Math.max(1, minutes);
		return { en: `${value}min`, ru: `${value}мин` };
	}
	if (minutes < 60 * 24) {
		const value = Math.max(1, Math.round(minutes / 60));
		return { en: `${value}h`, ru: `${value}ч` };
	}
	const days = minutes / (60 * 24);
	if (days < 30) {
		const value = Math.max(1, Math.round(days));
		return { en: `${value}d`, ru: `${value}д` };
	}
	if (days < DAYS_PER_YEAR) {
		const value = (days / DAYS_PER_MONTH).toFixed(1);
		return { en: `${value}mo`, ru: `${value.replace('.', ',')}мес` };
	}
	const value = (days / DAYS_PER_YEAR).toFixed(1);
	return { en: `${value}y`, ru: `${value.replace('.', ',')}г` };
}

/** Full grade name — visually hidden on the button itself (which shows only
 * an emoji + interval, see Conventions §1 on decorative glyphs needing a
 * real translated label alongside them), read by screen readers. */
export const gradeLabels: Record<Grade, Translated> = {
	again: { en: 'Again', ru: 'Не помню' },
	hard: { en: 'Hard', ru: 'Трудно' },
	good: { en: 'Good', ru: 'Хорошо' },
	easy: { en: 'Easy', ru: 'Легко' }
};

export const noDecksAddedHeading: Translated = {
	en: 'Nothing to train yet',
	ru: 'Пока нечего тренировать'
};

export const noDecksAddedMessage: Translated = {
	en: "You haven't added any vocabulary topics to your collection yet.",
	ru: 'Вы ещё не добавили ни одной темы в свою коллекцию.'
};

export const browseTopicsLabel: Translated = {
	en: 'Browse topics',
	ru: 'Выбрать темы'
};

/** Shown between finishing today's visible queue and a just-graded card
 * resurfacing on its own (see `waiting` in VocabularyTrainer.svelte).
 * Dynamic/interpolated, see Conventions §1. */
export function nextCardInLabel(minutes: number): Translated {
	if (minutes <= 0) {
		return { en: 'Next card coming right up…', ru: 'Следующая карточка уже совсем скоро…' };
	}
	const interval = intervalLabel(minutes);
	return {
		en: `Next card in about ${interval.en}`,
		ru: `Следующая карточка примерно через ${interval.ru}`
	};
}

export const allCaughtUpHeading: Translated = {
	en: "You're all caught up",
	ru: 'Вы всё повторили'
};

export const allCaughtUpMessage: Translated = {
	en: 'Nothing is due for practice right now — check back later.',
	ru: 'Сейчас нечего повторять — загляните позже.'
};

export const backToLessonsLabel: Translated = {
	en: 'Back to lessons',
	ru: 'К урокам'
};

export const gradeSaveFailedMessage: Translated = {
	en: "Couldn't save that — check your connection",
	ru: 'Не удалось сохранить — проверьте соединение'
};
