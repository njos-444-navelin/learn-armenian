/**
 * Where a library word's pre-generated pronunciation clip lives — one flat
 * directory keyed by word id, so a word shared by several features (a
 * vocabulary deck, an alphabet example, a dialogue token) has exactly one
 * file. Served as a plain static asset, not from Supabase; see
 * docs/VOCABULARY_AUDIO.md for why, the encoding, and the exact pipeline
 * used to generate a clip for a newly added word.
 *
 * Deliberately derived from the id rather than stored as a field on `Word` —
 * one convention-based path keeps `entries.ts` from spelling out a URL per
 * word. Every library word must have a file at this path; there's no
 * "missing audio" fallback in the UI.
 */
export function wordAudioSrc(wordId: string): string {
	return `/audio/words/${wordId}.m4a`;
}
