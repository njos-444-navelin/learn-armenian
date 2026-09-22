import { brandName } from './common';
import { ruPluralForm } from '$lib/i18n/ruPlural';
import type { Translated } from '../types';
import type { Grade } from '$lib/srs/scheduler';

// --- Menu entry point ---

export const trainVocabularyMenuLabel: Translated = {
	en: 'Train vocabulary',
	ru: 'Тренировать слова'
};

/** Announced by screen readers alongside the (purely visual) notification
 * dot shown when the learner has words due for review or never-studied
 * words waiting in a deck they've added — see the `hasWordsToPractice`
 * check in the locale layout's server load. */
export const wordsToPracticeHint: Translated = {
	en: 'Words are ready to practice',
	ru: 'Есть слова для практики'
};

/** Shown as the floating "Train vocabulary" button's subtitle (see
 * `VocabularyTrainCta.svelte`) when `wordsToPracticeHint` doesn't apply —
 * i.e. every added deck is fully caught up right now. */
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
 * What's in front of the learner, in the order the queue serves it:
 * reviews, then new words. Dynamic/interpolated, see Conventions §1.
 *
 * `moreWaiting` names it as a round, and only when it is one. Both numbers
 * are capped (see DUE_CARDS_PER_ROUND and NEW_CARDS_PER_SESSION in the
 * training page's server load), so a learner with a backlog sees a smaller
 * figure here than the "N due now" badge on their profile, which counts
 * their whole collection — the framing is what keeps those two honest
 * numbers from reading as a contradiction, and it's the same word the
 * end-of-round screen uses when it offers the next one.
 *
 * With nothing held back there's no gap to explain and no next round to
 * reach: that learner finishes to "you're all caught up" and never meets a
 * second one, so naming this one would introduce a thing that doesn't
 * happen to them. Fixed for the session either way — what's held back is
 * decided when the round is built, so this can't switch wording partway
 * through.
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

/** Whole minutes until a grade's resulting review — shown on that grade's
 * button. Dynamic/interpolated, see Conventions §1. Months/years get one
 * decimal place (e.g. "2.3 mo"), same as Anki's own reviewer — a card
 * reviewed successfully many times keeps compounding its interval well
 * past a year, where a whole-number rounding would lose too much
 * precision to be useful. */
export function intervalLabel(minutes: number): Translated {
	if (minutes < 60) {
		const value = Math.max(1, minutes);
		return { en: `${value} min`, ru: `${value} мин` };
	}
	if (minutes < 60 * 24) {
		const value = Math.max(1, Math.round(minutes / 60));
		return { en: `${value} h`, ru: `${value} ч` };
	}
	const days = minutes / (60 * 24);
	if (days < 30) {
		const value = Math.max(1, Math.round(days));
		return { en: `${value} d`, ru: `${value} д` };
	}
	if (days < DAYS_PER_YEAR) {
		const value = (days / DAYS_PER_MONTH).toFixed(1);
		return { en: `${value} mo`, ru: `${value.replace('.', ',')} мес` };
	}
	const value = (days / DAYS_PER_YEAR).toFixed(1);
	return { en: `${value} y`, ru: `${value.replace('.', ',')} г` };
}

/** Full grade name — shown as the primary label on each grade button
 * (with the resulting review interval below it), see VocabularyTrainer.svelte. */
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

/** Replaces `allCaughtUpHeading` when the session's new-card cap (see
 * NEW_CARDS_PER_SESSION in the training page's server load) kept words
 * back — the reviews really are all caught up, but "all caught up" on its
 * own would read as "your decks are finished" to someone who still has
 * eighty unseen words waiting. */
export const roundDoneHeading: Translated = {
	en: "That's this round done",
	ru: 'Раунд пройден'
};

/**
 * What both caps held back from this round — reviews, never-studied words,
 * or some of each (the screen only shows this when at least one of them is
 * above zero). Dynamic/interpolated, see Conventions §1; Russian declines
 * both nouns, see ruPlural.ts.
 *
 * Phrased without a verb on purpose — "60 reviews and 3 new words still to
 * go", not "…are still waiting" — so neither language has to agree a verb
 * with a count that might be one, three or nine hundred. Russian's
 * «осталось» is impersonal here for the same reason. Says only what is
 * left: the button beneath it (`nextRoundLabel`) is what offers to start on
 * them, so this doesn't repeat the invitation.
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

/** Deliberately carries no number, unlike the message above it: the next
 * round is whatever is left when it's capped again, which is fewer than a
 * full round once the collection runs low. */
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
