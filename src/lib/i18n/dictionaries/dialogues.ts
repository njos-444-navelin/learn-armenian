import { brandName } from './common';
import { ruPluralForm } from '../ruPlural';
import type { Translated } from '../types';

// --- Dialogue list page (/learn/dialogues) ---

export const pageTitle: Translated = {
	en: `${brandName} — dialogues`,
	ru: `${brandName} — диалоги`
};

export const pageDescription: Translated = {
	en: 'Short everyday conversations in Armenian — listen first, read second, tap any word to look it up.',
	ru: 'Короткие бытовые диалоги на армянском — сначала слушайте, потом читайте, нажимайте на любое слово, чтобы посмотреть его значение.'
};

export const heading: Translated = { en: 'Dialogues', ru: 'Диалоги' };

export const intro: Translated = {
	en: 'Try listening first, then reading. Every dialogue carries one short rule.',
	ru: 'Советуем сначала послушать, затем прочитать. В каждом диалоге — одно короткое правило.'
};

export const listAriaLabel: Translated = { en: 'Dialogues', ru: 'Диалоги' };

/** Dynamic — see Conventions §1. The "2 min · այս · այդ · այն" chip on a
 * list card. `ruleLabel` is Armenian and identical in every locale. */
export function dialogueMetaLabel(durationMinutes: number, ruleLabel: string): Translated {
	return {
		en: `${durationMinutes} min · ${ruleLabel}`,
		ru: `${durationMinutes} мин · ${ruleLabel}`
	};
}

export const completedBadgeLabel: Translated = { en: 'Completed', ru: 'Пройден' };

export const moreOnTheWayLabel: Translated = {
	en: 'More dialogues on the way.',
	ru: 'Новые диалоги уже в процессе.'
};

// --- Player page (/learn/dialogues/[dialogueId]) ---

export function playerPageTitle(titleTranslation: Translated): Translated {
	return {
		en: `${brandName} — ${titleTranslation.en}`,
		ru: `${brandName} — ${titleTranslation.ru}`
	};
}

export function playerPageDescription(titleTranslation: Translated): Translated {
	return {
		en: `Listen to "${titleTranslation.en}" line by line, then read along and tap any word.`,
		ru: `Прослушайте диалог «${titleTranslation.ru}» реплика за репликой, затем читайте и нажимайте на любое слово.`
	};
}

/** Dynamic — see Conventions §1. The kicker above the title: "Dialogue 1". */
export function dialogueNumberLabel(number: number): Translated {
	return { en: `Dialogue ${number}`, ru: `Диалог ${number}` };
}

export const showRuleLabel: Translated = { en: 'Read', ru: 'Читать' };

export const hideRuleLabel: Translated = { en: 'Hide', ru: 'Скрыть' };

export const listenModeLabel: Translated = { en: 'Listen', ru: 'Слушать' };

export const readModeLabel: Translated = { en: 'Read', ru: 'Читать' };

export const modeAriaLabel: Translated = { en: 'Mode', ru: 'Режим' };

export const playLineLabel: Translated = { en: 'Play this line', ru: 'Прослушать реплику' };

export const revealLineLabel: Translated = { en: 'Show the text', ru: 'Показать текст' };

export const showTranslationLabel: Translated = {
	en: 'Show translation',
	ru: 'Показать перевод'
};

export const hideTranslationLabel: Translated = {
	en: 'Hide translation',
	ru: 'Скрыть перевод'
};

export const playWordLabel: Translated = { en: 'Play word', ru: 'Прослушать слово' };

/** The one-line hint above the lines until the learner opens a first word —
 * nothing else on the page says the words are tappable. Two versions,
 * because in Listen mode the words are blurred and can't be tapped yet. */
export const revealThenTapHint: Translated = {
	en: 'Reveal a line with the eye button, or switch to Read — then tap any word to see what it means.',
	ru: 'Откройте реплику кнопкой с глазом или перейдите в «Читать» — и нажимайте на любое слово, чтобы узнать, что оно значит.'
};

export const tapWordHint: Translated = {
	en: 'Tap any word to see what it means.',
	ru: 'Нажмите на любое слово, чтобы узнать, что оно значит.'
};

export const wordBaseFormLabel: Translated = { en: 'from', ru: 'от' };

/** Labels a token's own remark under the library word's general note. */
export const wordHereLabel: Translated = { en: 'Here:', ru: 'Здесь:' };

export const playAllLabel: Translated = {
	en: 'Play the whole dialogue',
	ru: 'Воспроизвести весь диалог'
};

export const pauseAllLabel: Translated = { en: 'Pause the dialogue', ru: 'Приостановить диалог' };

export const playAllShortLabel: Translated = { en: 'Play all', ru: 'Всё' };

/** Dynamic — see Conventions §1. The "3 / 11" counter in the play-all button. */
export function lineCounterLabel(current: number, total: number): Translated {
	return { en: `${current} / ${total}`, ru: `${current} / ${total}` };
}

export const stopLabel: Translated = { en: 'Stop and rewind', ru: 'Остановить и перемотать' };

export const markDoneLabel: Translated = {
	en: 'That’s a wrap — mark it done',
	ru: 'Готово — отметить пройденным'
};

export const markDoneFailedMessage: Translated = {
	en: "Couldn't save your progress — check your connection and try again",
	ru: 'Не удалось сохранить прогресс — проверьте соединение и попробуйте снова'
};

/** What the commit button says once the dialogue is already in the
 * learner's done list — tapping it opens the "remove from done" confirm
 * below rather than marking it done a second time. */
export const alreadyDoneLabel: Translated = {
	en: 'Already done',
	ru: 'Уже пройден'
};

// --- "Remove from done" confirm (opened from the "Already done" button) ---

export const removeDoneHeading: Translated = {
	en: 'Mark as not done?',
	ru: 'Снять отметку?'
};

/** Dynamic — see Conventions §1 on why interpolated text is a function, not a literal. */
export function removeDoneMessage(titleTranslation: Translated): Translated {
	return {
		en: `You've already finished "${titleTranslation.en}". Do you want to take it off your done list?`,
		ru: `Диалог «${titleTranslation.ru}» уже пройден. Убрать его из списка пройденных?`
	};
}

/** Short on purpose — it shares a row with "Cancel" in a phone-width
 * modal, and the heading/message above already say what's being removed. */
export const removeDoneLabel: Translated = {
	en: 'Remove',
	ru: 'Убрать'
};

export const removeDoneFailedMessage: Translated = {
	en: "Couldn't update your progress — check your connection and try again",
	ru: 'Не удалось обновить прогресс — проверьте соединение и попробуйте снова'
};

// --- Done screen ---

export const doneHeadingAriaLabel: Translated = { en: 'Completed', ru: 'Пройден' };

/** Dynamic — see Conventions §1. */
export function linesHeardLabel(count: number): Translated {
	return {
		en: `${count} ${count === 1 ? 'line' : 'lines'} heard.`,
		ru: `${count} ${ruPluralForm(count, ['реплика', 'реплики', 'реплик'])} прослушано.`
	};
}

export const tappedWordsHeading: Translated = { en: 'Words you tapped', ru: 'Слова, которые Вы открыли' };

export const noTappedWordsMessage: Translated = {
	en: 'You went through without opening a single word. Respect.',
	ru: 'Вы прошли диалог, не открыв ни одного слова. Уважение.'
};

/** Dynamic — see Conventions §1. */
export function nextDialogueLabel(title: string): Translated {
	return { en: `Next: ${title}`, ru: `Дальше: ${title}` };
}

export const playAgainLabel: Translated = { en: 'Play this one again', ru: 'Пройти ещё раз' };

export const backToDialoguesLabel: Translated = {
	en: 'Back to all dialogues',
	ru: 'Ко всем диалогам'
};
