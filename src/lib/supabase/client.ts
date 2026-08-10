import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/public';

const supabaseUrl = env['PUBLIC_SUPABASE_URL'];
const supabaseAnonKey = env['PUBLIC_SUPABASE_ANON_KEY'];

/**
 * The Supabase client backing this app's data and auth. `null` until
 * `PUBLIC_SUPABASE_URL` / `PUBLIC_SUPABASE_ANON_KEY` are configured, so the
 * app can build and deploy before real credentials exist.
 */
export const supabase: SupabaseClient | null =
	supabaseUrl !== undefined && supabaseAnonKey !== undefined
		? createClient(supabaseUrl, supabaseAnonKey)
		: null;
