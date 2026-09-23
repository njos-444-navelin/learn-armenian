import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { createServerClient } from '@supabase/ssr';
import { env } from '$env/dynamic/public';
import { DEFAULT_LOCALE, isLocale } from '$lib/i18n/locale';

const localeHandle: Handle = async ({ event, resolve }) => {
	const rawLocale = event.params['lang'];
	const locale = rawLocale !== undefined && isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;

	return resolve(event, {
		transformPageChunk: ({ html }) => html.replace('%lang%', locale)
	});
};

const supabaseHandle: Handle = async ({ event, resolve }) => {
	event.locals.supabase = createServerClient(
		env['PUBLIC_SUPABASE_URL'] ?? '',
		env['PUBLIC_SUPABASE_ANON_KEY'] ?? '',
		{
			cookies: {
				getAll: () => event.cookies.getAll(),
				setAll: (cookiesToSet, headers) => {
					cookiesToSet.forEach(({ name, value, options }) => {
						event.cookies.set(name, value, { ...options, path: '/' });
					});
					// @supabase/ssr can invoke this more than once per request, each time
					// resupplying the same headers, but `event.setHeaders` throws on a
					// repeated header name. Safe to ignore: SvelteKit already sends its
					// own `Cache-Control: private, no-store` on action/data responses.
					if (Object.keys(headers).length > 0) {
						try {
							event.setHeaders(headers);
						} catch {
							// already set this request — see comment above
						}
					}
				}
			}
		}
	);

	return resolve(event, {
		filterSerializedResponseHeaders: (name) =>
			name === 'content-range' || name === 'x-supabase-api-version'
	});
};

const authClaimsHandle: Handle = async ({ event, resolve }) => {
	const { data } = await event.locals.supabase.auth.getClaims();
	event.locals.claims = data?.claims ?? null;
	return resolve(event);
};

export const handle = sequence(localeHandle, supabaseHandle, authClaimsHandle);
