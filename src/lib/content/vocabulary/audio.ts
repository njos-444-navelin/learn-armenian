/**
 * Where a word's pre-generated pronunciation clip lives. Served as a plain
 * static asset (`static/audio/vocabulary/`), not fetched from Supabase — see
 * docs/VOCABULARY_AUDIO.md for why, and for the exact pipeline used to
 * generate one of these for a newly added word.
 *
 * Deliberately derived from `deckId`/`wordId` rather than stored as a field
 * on `VocabularyWord` — one convention-based path keeps every deck file from
 * having to spell out a URL per word. Every vocabulary word must have a file
 * at this path; there's no "missing audio" fallback in the UI.
 */
export function wordAudioSrc(deckId: string, wordId: string): string {
	return `/audio/vocabulary/${deckId}/${wordId}.m4a`;
}
