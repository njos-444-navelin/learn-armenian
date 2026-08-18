import type { Translated } from '../types';

/** Not a `Translated` — the app's name is a proper noun and isn't
 * translated (same reasoning as `LOCALE_FLAGS` in `locale.ts` and
 * `supportEmail` in `dictionaries/contact.ts`), so this is the same
 * literal string in every locale. See Conventions §1. */
export const brandName = 'Learn Armenian';

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

export const switchLanguage: Translated = {
	en: 'Switch language',
	ru: 'Сменить язык'
};

export const account: Translated = {
	en: 'Account',
	ru: 'Личный кабинет'
};

export const closeLabel: Translated = {
	en: 'Close',
	ru: 'Закрыть'
};

export const cancelLabel: Translated = {
	en: 'Cancel',
	ru: 'Отмена'
};

export const preferredLocaleSaveFailedMessage: Translated = {
	en: "Couldn't save your language preference — try switching again later.",
	ru: 'Не удалось сохранить Ваш выбор языка — попробуйте переключить его снова позже.'
};

export const newVersionAvailableMessage: Translated = {
	en: 'A new version is available — tap to reload.',
	ru: 'Доступна новая версия — нажмите, чтобы обновить.'
};
