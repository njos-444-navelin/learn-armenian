import type { Handle } from '@sveltejs/kit';
import { DEFAULT_LOCALE, isLocale } from '$lib/i18n/locale';

export const handle: Handle = async ({ event, resolve }) => {
	const rawLocale = event.params['lang'];
	const locale = rawLocale !== undefined && isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;

	return resolve(event, {
		transformPageChunk: ({ html }) => html.replace('%lang%', locale)
	});
};
