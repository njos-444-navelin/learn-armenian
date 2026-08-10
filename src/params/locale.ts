import type { ParamMatcher } from '@sveltejs/kit';
import { LOCALES, type Locale } from '$lib/i18n/locale';

export const match = ((param: string): param is Locale =>
	(LOCALES as readonly string[]).includes(param)) satisfies ParamMatcher;
