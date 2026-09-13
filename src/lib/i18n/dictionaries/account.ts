import { brandName } from './common';
import { ruWordForm } from '../ruPlural';
import type { Translated } from '../types';

export const pageTitle: Translated = {
	en: `Account — ${brandName}`,
	ru: `Аккаунт — ${brandName}`
};

export const pageDescription: Translated = {
	en: 'Sign in or create an account to save your progress.',
	ru: 'Войдите или создайте аккаунт, чтобы сохранять прогресс.'
};

export const emailLabel: Translated = { en: 'Email', ru: 'Эл. почта' };

export const passwordLabel: Translated = { en: 'Password', ru: 'Пароль' };

export const signInButton: Translated = { en: 'Sign in', ru: 'Войти' };

export const signUpButton: Translated = { en: 'Create account', ru: 'Создать аккаунт' };

export const magicLinkButton: Translated = {
	en: 'Email me a sign-in link',
	ru: 'Прислать ссылку для входа'
};

export const magicLinkPageTitle: Translated = {
	en: `Email a sign-in link — ${brandName}`,
	ru: `Ссылка для входа — ${brandName}`
};

export const magicLinkPageDescription: Translated = {
	en: 'Get a one-time link emailed to you to sign in without a password.',
	ru: 'Получите одноразовую ссылку на почту для входа без пароля.'
};

export const magicLinkHint: Translated = {
	en: 'This only works for an existing account.',
	ru: 'Это работает только для существующего аккаунта.'
};

export const signInSubheading: Translated = {
	en: 'Sign in to save your progress.',
	ru: 'Войдите, чтобы сохранить свой прогресс.'
};

export const orDivider: Translated = { en: 'or', ru: 'или' };

export const registerPrompt: Translated = { en: 'New here?', ru: 'Впервые здесь?' };

export const hasAccountPrompt: Translated = {
	en: 'Already have an account?',
	ru: 'Уже есть аккаунт?'
};

export const registerPageTitle: Translated = {
	en: `Create account — ${brandName}`,
	ru: `Создать аккаунт — ${brandName}`
};

export const registerPageDescription: Translated = {
	en: 'Create an account to save your progress.',
	ru: 'Создайте аккаунт, чтобы сохранять прогресс.'
};

export const magicLinkSent: Translated = {
	en: 'Check your email for a sign-in link.',
	ru: 'Проверьте почту — мы отправили ссылку для входа.'
};

export const signOutButton: Translated = { en: 'Sign out', ru: 'Выйти' };

export const signedInAs: Translated = { en: 'Signed in as', ru: 'Вы вошли как' };

// Signed-in dashboard
export const myProgressHeading: Translated = { en: 'My progress', ru: 'Мой прогресс' };

export const alphabetCardLabel: Translated = { en: 'Alphabet', ru: 'Алфавит' };

/** Dynamic — see Conventions §1. */
export function alphabetMasteryLabel(percent: number): Translated {
	return { en: `${percent}% mastered`, ru: `Освоено ${percent}%` };
}

export const vocabularyCardLabel: Translated = { en: 'Vocabulary', ru: 'Словарь' };

/** Dynamic — see Conventions §1. */
export function collectionCountLabel(count: number): Translated {
	return {
		en: `${count} ${count === 1 ? 'word' : 'words'} in your collection`,
		ru: `${count} ${ruWordForm(count)} в коллекции`
	};
}

/** Dynamic — see Conventions §1. Ru phrasing matches `todaysCountLabel` in
 * `dictionaries/vocabularyTraining.ts`, which sidesteps declining "слово" by
 * count the same way. */
export function dueNowLabel(count: number): Translated {
	return { en: `${count} due now`, ru: `${count} на повторение` };
}

export const allCaughtUpLabel: Translated = { en: 'All caught up', ru: 'Всё повторено' };

export const dialoguesCardLabel: Translated = { en: 'Dialogues', ru: 'Диалоги' };

/** Dynamic — see Conventions §1. "1 of 3 completed". */
export function dialoguesCompletedLabel(completed: number, total: number): Translated {
	return { en: `${completed} of ${total} completed`, ru: `Пройдено ${completed} из ${total}` };
}

export const progressListAriaLabel: Translated = { en: 'Progress by lesson', ru: 'Прогресс по урокам' };

export const accountSettingsHeading: Translated = { en: 'Account settings', ru: 'Настройки аккаунта' };

export const authErrorGeneric: Translated = {
	en: 'That sign-in link is invalid or has expired. Please try again.',
	ru: 'Ссылка для входа недействительна или истекла. Попробуйте ещё раз.'
};

export const genericAuthError: Translated = {
	en: 'Something went wrong. Please try again.',
	ru: 'Что-то пошло не так. Попробуйте ещё раз.'
};

export const invalidCredentialsError: Translated = {
	en: 'Incorrect email or password.',
	ru: 'Неверный email или пароль.'
};

export const userAlreadyExistsError: Translated = {
	en: 'An account with this email already exists.',
	ru: 'Аккаунт с таким email уже существует.'
};

export const emailAddressInvalidError: Translated = {
	en: 'That email address looks invalid.',
	ru: 'Похоже, этот email недействителен.'
};

export const emailRateLimitError: Translated = {
	en: 'Too many emails sent — please wait a bit before trying again.',
	ru: 'Слишком много писем отправлено — подождите немного и попробуйте снова.'
};

export const samePasswordError: Translated = {
	en: 'Your new password must be different from your current one.',
	ru: 'Новый пароль должен отличаться от текущего.'
};

export const weakPasswordError: Translated = {
	en: 'That password is too weak — use at least 6 characters.',
	ru: 'Пароль слишком слабый. Используйте не менее 6 символов.'
};

export const emailExistsError: Translated = {
	en: 'That email address is already in use by another account.',
	ru: 'Этот email уже используется другим аккаунтом.'
};

export const overRequestRateLimitError: Translated = {
	en: 'Too many attempts — please wait a bit before trying again.',
	ru: 'Слишком много попыток — подождите немного и попробуйте снова.'
};

/** Maps Supabase's stable `AuthError.code` to translated copy; unmapped
 * codes fall back to `genericAuthError`. Extend as new codes are hit in
 * practice (trigger each error once, check `error.code`). */
export const authErrorMessages: Record<string, Translated> = {
	invalid_credentials: invalidCredentialsError,
	user_already_exists: userAlreadyExistsError,
	email_address_invalid: emailAddressInvalidError,
	over_email_send_rate_limit: emailRateLimitError,
	same_password: samePasswordError,
	weak_password: weakPasswordError,
	email_exists: emailExistsError,
	over_request_rate_limit: overRequestRateLimitError
};

// Change password
export const changePasswordPageTitle: Translated = {
	en: `Change password — ${brandName}`,
	ru: `Изменить пароль — ${brandName}`
};

export const changePasswordPageDescription: Translated = {
	en: 'Change your account password.',
	ru: 'Измените пароль своего аккаунта.'
};

export const changePasswordButton: Translated = { en: 'Change password', ru: 'Изменить пароль' };

export const currentPasswordLabel: Translated = { en: 'Current password', ru: 'Текущий пароль' };

export const newPasswordLabel: Translated = { en: 'New password', ru: 'Новый пароль' };

export const changePasswordSuccess: Translated = {
	en: 'Your password has been changed.',
	ru: 'Пароль успешно изменён.'
};

// Change email
export const changeEmailPageTitle: Translated = {
	en: `Change email — ${brandName}`,
	ru: `Изменить email — ${brandName}`
};

export const changeEmailPageDescription: Translated = {
	en: "Change your account's email address.",
	ru: 'Измените email своего аккаунта.'
};

export const changeEmailButton: Translated = { en: 'Change email', ru: 'Изменить email' };

export const newEmailLabel: Translated = { en: 'New email', ru: 'Новый email' };

export const changeEmailSuccess: Translated = {
	en: "Check both your old and new email address — we've sent a confirmation link to each. The change won't take effect until you confirm from both.",
	ru: 'Проверьте старый и новый адреса почты — на оба отправлена ссылка для подтверждения. Изменение вступит в силу только после подтверждения с обоих адресов.'
};

export const sameEmailError: Translated = {
	en: "That's already your current email address.",
	ru: 'Это уже текущий email Вашего аккаунта.'
};

// Delete account
export const deletePageTitle: Translated = {
	en: `Delete account — ${brandName}`,
	ru: `Удалить аккаунт — ${brandName}`
};

export const deletePageDescription: Translated = {
	en: 'Permanently delete your account.',
	ru: 'Безвозвратно удалите свой аккаунт.'
};

export const deleteAccountButton: Translated = { en: 'Delete account', ru: 'Удалить аккаунт' };

export const deleteWarning: Translated = {
	en: 'This permanently deletes your account and all associated data. This cannot be undone.',
	ru: 'Это действие безвозвратно удалит Ваш аккаунт и все связанные данные. Отменить это будет невозможно.'
};

export const deleteConfirmEmailLabel: Translated = {
	en: 'Type your email to confirm',
	ru: 'Введите свой email для подтверждения'
};

export const emailMismatchError: Translated = {
	en: "That doesn't match your account's email.",
	ru: 'Введённый email не совпадает с email Вашего аккаунта.'
};

export const backToAccount: Translated = { en: 'Back to account', ru: 'Назад к аккаунту' };
