import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env as publicEnv } from '$env/dynamic/public';
import { env as privateEnv } from '$env/dynamic/private';

/**
 * Lazily creates an admin client authenticated via the `service_role`
 * secret (bypasses RLS) — only ever call this inside the delete-account
 * action. Living under `src/lib/server/` makes it a build-time guarantee
 * that this can't be imported into client-reachable code.
 *
 * Deliberately NOT wired into hooks.server.ts like the anon key: a
 * missing/misconfigured service-role key should only break delete-account,
 * not every route on the site.
 */
export function getSupabaseAdmin(): SupabaseClient {
	const url = publicEnv['PUBLIC_SUPABASE_URL'];
	const serviceRoleKey = privateEnv['SUPABASE_SERVICE_ROLE_KEY'];
	if (!url || !serviceRoleKey) {
		throw new Error('Missing PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
	}
	return createClient(url, serviceRoleKey, {
		auth: { autoRefreshToken: false, persistSession: false }
	});
}
