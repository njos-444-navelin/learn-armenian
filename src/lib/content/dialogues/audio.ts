/**
 * Where a dialogue line's pre-generated clip lives: one file per line, named
 * by the line's 1-based position in the dialogue. A *line* is a unique
 * recording (two voices, sentence intonation), so it's stored per dialogue —
 * unlike the words a learner taps inside it, which play the shared library
 * clip via `words/audio.ts` and are never re-recorded per dialogue.
 *
 * How a dialogue's clips are generated (one whole-part read per speaker,
 * cut into lines) is in docs/DIALOGUES.md, "Line audio". A line whose file
 * is missing plays as a timed pause rather than an error — see
 * `$lib/dialogues/playback.svelte.ts` — so a dialogue can be exercised end
 * to end before its clips exist.
 */
export function lineAudioSrc(dialogueId: string, lineIndex: number): string {
	return `/audio/dialogues/${dialogueId}/${String(lineIndex + 1).padStart(2, '0')}.m4a`;
}
