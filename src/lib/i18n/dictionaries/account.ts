import type { Translated } from '../types';

export const pageTitle: Translated = {
	en: 'Account — Learn Armenian',
	ru: 'Аккаунт — Учи армянский'
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

export const magicLinkHint: Translated = {
	en: 'For an existing account only — use "Create account" above if you’re new.',
	ru: 'Только для существующего аккаунта — для нового используйте «Создать аккаунт» выше.'
};

export const magicLinkSent: Translated = {
	en: 'Check your email for a sign-in link.',
	ru: 'Проверьте почту — мы отправили ссылку для входа.'
};

export const signOutButton: Translated = { en: 'Sign out', ru: 'Выйти' };

export const signedInAs: Translated = { en: 'Signed in as', ru: 'Вы вошли как' };

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

/** Maps Supabase's stable `AuthError.code` to translated copy; unmapped
 * codes fall back to `genericAuthError`. Extend as new codes are hit in
 * practice (trigger each error once, check `error.code`). */
export const authErrorMessages: Record<string, Translated> = {
	invalid_credentials: invalidCredentialsError,
	user_already_exists: userAlreadyExistsError,
	email_address_invalid: emailAddressInvalidError,
	over_email_send_rate_limit: emailRateLimitError
};
