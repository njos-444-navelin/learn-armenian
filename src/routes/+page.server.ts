import { redirect } from '@sveltejs/kit';
import { resolveAcceptLanguage } from '$lib/i18n/negotiate';
import { withLocale } from '$lib/i18n/paths';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ request }) => {
	const locale = resolveAcceptLanguage(request.headers.get('accept-language'));
	redirect(307, withLocale(locale, '/'));
};
