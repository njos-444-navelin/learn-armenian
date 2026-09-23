import { brandName } from './common';
import { ruPluralForm } from '$lib/i18n/ruPlural';
import type { Translated } from '../types';
import type { Grade } from '$lib/srs/scheduler';

// --- Menu entry point ---

export const trainVocabularyMenuLabel: Translated = {
	en: 'Train vocabulary',
	ru: 'Тренировать слова'
};

/** Screen-reader text for the purely visual notification dot. */
export const wordsToPracticeHint: Translated = {
	en: 'Words are ready to practice',
	ru: 'Есть слова для практики'
};

/** The train button's subtitle when every added deck is caught up. */
export const nothingDueYetLabel: Translated = {
	en: 'Nothing due yet',
	ru: 'Пока нечего повторять'
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

/**
 * Both counts are capped per round, so `moreWaiting` frames them as a round
 * rather than as the learner's whole collection. Conventions §1.
 */
export function todaysCountLabel(
	dueCount: number,
	newCount: number,
	moreWaiting: boolean
): Translated {
	const en = `${dueCount} to review · ${newCount} new`;
	const ru = `${dueCount} на повторение · ${newCount} новых`;
	return moreWaiting ? { en: `This round: ${en}`, ru: `Этот раунд: ${ru}` } : { en, ru };
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

/** Escaped rather than a literal U+00A0, which is invisible in an editor and
 * doesn't survive a stray reformat. */
const NBSP = '\u00A0';

/** Months and years keep one decimal: a compounded interval loses too much to
 * whole-number rounding. Conventions §1. */
export function intervalLabel(minutes: number): Translated {
	if (minutes < 60) {
		const value = Math.max(1, minutes);
		return { en: `${value}${NBSP}min`, ru: `${value}${NBSP}мин` };
	}
	if (minutes < 60 * 24) {
		const value = Math.max(1, Math.round(minutes / 60));
		return { en: `${value}${NBSP}h`, ru: `${value}${NBSP}ч` };
	}
	const days = minutes / (60 * 24);
	if (days < 30) {
		const value = Math.max(1, Math.round(days));
		return { en: `${value}${NBSP}d`, ru: `${value}${NBSP}д` };
	}
	if (days < DAYS_PER_YEAR) {
		const value = (days / DAYS_PER_MONTH).toFixed(1);
		return { en: `${value}${NBSP}mo`, ru: `${value.replace('.', ',')}${NBSP}мес` };
	}
	const value = (days / DAYS_PER_YEAR).toFixed(1);
	return { en: `${value}${NBSP}y`, ru: `${value.replace('.', ',')}${NBSP}г` };
}

export const gradeLabels: Record<Grade, Translated> = {
	again: { en: 'Again', ru: 'Снова' },
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

/** Heads the countdown screen: nothing held back, a card or two still on a
 * short step (see `waiting` in VocabularyTrainer.svelte). */
export const nearlyThereHeading: Translated = {
	en: 'Nearly there',
	ru: 'Почти всё'
};

/** Shown while waiting for a just-graded card to resurface. Conventions §1. */
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

/** Footnote under `roundRemainingMessage` for cards this round put off.
 * Verbless so neither language agrees a verb with the count. */
export function stragglersReturnLabel(count: number, minutes: number): Translated {
	const interval = intervalLabel(minutes);
	const ruCards = ruPluralForm(count, [
		'отложенная карточка',
		'отложенные карточки',
		'отложенных карточек'
	]);
	return {
		en: `Plus ${count} card${count === 1 ? '' : 's'} you put off — back in about ${interval.en}.`,
		ru: `Плюс ${count} ${ruCards} — примерно через ${interval.ru}.`
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

/** Replaces `allCaughtUpHeading` when a cap held words back from the round. */
export const roundDoneHeading: Translated = {
	en: "That's this round done",
	ru: 'Раунд пройден'
};

/**
 * What the caps held back from this round. Verbless, and impersonal in
 * Russian, so neither language agrees a verb with the count. Conventions §1.
 */
export function roundRemainingMessage(dueCount: number, newCount: number): Translated {
	const en: string[] = [];
	const ru: string[] = [];
	if (dueCount > 0) {
		en.push(`${dueCount} review${dueCount === 1 ? '' : 's'}`);
		ru.push(`${dueCount} ${ruPluralForm(dueCount, ['повторение', 'повторения', 'повторений'])}`);
	}
	if (newCount > 0) {
		en.push(`${newCount} new word${newCount === 1 ? '' : 's'}`);
		ru.push(`${newCount} ${ruPluralForm(newCount, ['новое слово', 'новых слова', 'новых слов'])}`);
	}
	return {
		en: `${en.join(' and ')} still to go in your collection.`,
		ru: `В вашей коллекции осталось ещё ${ru.join(' и ')}.`
	};
}

export const nextRoundLabel: Translated = {
	en: 'Start the next round',
	ru: 'Следующий раунд'
};

export const nextRoundFailedMessage: Translated = {
	en: "Couldn't start the next round — check your connection",
	ru: 'Не удалось начать следующий раунд — проверьте соединение'
};

export const gradeSaveFailedMessage: Translated = {
	en: "Couldn't save that — check your connection",
	ru: 'Не удалось сохранить — проверьте соединение'
};
