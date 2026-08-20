/**
 * Where a word's pre-generated pronunciation clip lives. Flat, not
 * deck-scoped — this registry isn't organized into decks — but otherwise the
 * same static-asset pipeline and encoding as `vocabulary/audio.ts`; see
 * docs/VOCABULARY_AUDIO.md. No "missing audio" fallback.
 */
export function wordAudioSrc(wordId: string): string {
	return `/audio/words/${wordId}.m4a`;
}
