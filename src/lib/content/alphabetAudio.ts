/**
 * Where a letter's phoneme clip lives — same pipeline and encoding as
 * `words/audio.ts`, and derived from the id for the same reason. Every letter
 * must have a file here; the UI has no missing-audio fallback.
 */
export function letterAudioSrc(letterId: string): string {
	return `/audio/alphabet/${letterId}.m4a`;
}
