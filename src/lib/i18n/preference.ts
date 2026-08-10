import { browser } from '$app/environment';
import { isLocale, type Locale } from './locale';

const STORAGE_KEY = 'learn-armenian:locale';

/**
 * Where the learner's chosen locale lives while there's no account to attach
 * it to. Once accounts exist, an authenticated user's preference should come
 * from Supabase instead of localStorage — swap the body of these two
 * functions then (fetch/persist against the backend), keeping the same
 * signatures so every caller (the layout effect, the language switcher)
 * keeps working unchanged.
 */
export function getStoredLocale(): Locale | null {
	if (!browser) return null;
	const value = localStorage.getItem(STORAGE_KEY);
	return value !== null && isLocale(value) ? value : null;
}

export function setStoredLocale(locale: Locale): void {
	if (!browser) return;
	localStorage.setItem(STORAGE_KEY, locale);
}
