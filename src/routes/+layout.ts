import { createBrowserClient, createServerClient, isBrowser } from '@supabase/ssr';
import { env } from '$env/dynamic/public';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ data, depends, fetch }) => {
	depends('supabase:auth');

	const url = env['PUBLIC_SUPABASE_URL'] ?? '';
	const key = env['PUBLIC_SUPABASE_ANON_KEY'] ?? '';

	const supabase = isBrowser()
		? createBrowserClient(url, key, { global: { fetch } })
		: createServerClient(url, key, {
				global: { fetch },
				cookies: { getAll: () => data.cookies }
			});

	const { data: claimsData, error } = await supabase.auth.getClaims();

	return { supabase, claims: error ? null : (claimsData?.claims ?? null) };
};
