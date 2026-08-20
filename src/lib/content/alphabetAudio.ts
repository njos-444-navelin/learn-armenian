/**
 * Where a letter's pre-generated phoneme clip lives. Served as a plain
 * static asset (`static/audio/alphabet/`), same pipeline and encoding as
 * `vocabulary/audio.ts` — see docs/VOCABULARY_AUDIO.md.
 *
 * Deliberately derived from `letterId` rather than stored as a field on
 * `AlphabetLetter` — one convention-based path, same reasoning as
 * `wordAudioSrc()`. Every letter must have a file at this path; there's no
 * "missing audio" fallback in the UI.
 */
export function letterAudioSrc(letterId: string): string {
	return `/audio/alphabet/${letterId}.m4a`;
}
