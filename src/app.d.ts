/// <reference types="vite-plugin-pwa/client" />
/// <reference types="vite-plugin-pwa/info" />

import type { JwtPayload, SupabaseClient } from '@supabase/supabase-js';

// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			supabase: SupabaseClient;
			claims: JwtPayload | null;
		}
		interface PageData {
			claims: JwtPayload | null;
			hasWordsToPractice?: boolean;
			alphabetMasteryPercent?: number;
			vocabularyWordCount?: number;
			vocabularyDueCount?: number;
			dialoguesCompletedCount?: number;
			dialoguesTotalCount?: number;
		}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
