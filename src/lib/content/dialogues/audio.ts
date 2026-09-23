/**
 * Where a dialogue line's clip lives: one file per line, named by its 1-based
 * position. A line is a unique recording, so it's stored per dialogue, unlike
 * the words inside it, which play the shared library clip.
 *
 * A line whose file is missing plays as a timed pause rather than an error
 * (see `$lib/dialogues/playback.svelte.ts`). Generation is covered in
 * docs/DIALOGUES.md, "Line audio".
 */
export function lineAudioSrc(dialogueId: string, lineIndex: number): string {
	return `/audio/dialogues/${dialogueId}/${String(lineIndex + 1).padStart(2, '0')}.m4a`;
}
