import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env as publicEnv } from '$env/dynamic/public';
import { env as privateEnv } from '$env/dynamic/private';

/**
 * Lazily creates an admin client authenticated via the `service_role` secret,
 * which bypasses RLS — only ever call it in the delete-account action. Living
 * under `src/lib/server/` guarantees it can't reach client code.
 *
 * Deliberately not wired into hooks.server.ts like the anon key: a missing
 * service-role key should break delete-account, not every route.
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
