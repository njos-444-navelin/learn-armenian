/**
 * Where a library word's pronunciation clip lives: one flat directory keyed by
 * word id, so a word shared by several features has exactly one file. Derived
 * from the id rather than stored on `Word`, so `entries.ts` spells out no URLs.
 * Every library word must have a file here; the UI has no missing-audio
 * fallback. See docs/VOCABULARY_AUDIO.md for the pipeline.
 */
export function wordAudioSrc(wordId: string): string {
	return `/audio/words/${wordId}.m4a`;
}
