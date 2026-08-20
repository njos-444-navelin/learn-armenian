/**
 * "I can't listen right now" (the drill's audio-question skip) suggests
 * muting audio questions for a while, matching Duolingo's handling of the
 * same problem — tapping skip once doesn't necessarily mean "forever," but
 * repeatedly hitting a question you can't answer without sound is worse
 * than just not asking for a bit. Backed by localStorage (not sessionStorage)
 * since "for the next N minutes" is a real wall-clock duration meant to
 * survive closing the tab, not just the current session.
 *
 * No separate cleanup pass is needed: `isAudioMuted()` removes its own key
 * the moment it notices the mute period has lapsed. It's only actually
 * called when the drill's type round-robin lands on an 'audio' slot (see
 * AlphabetTrainer.svelte's buildQuestionFor), not on every question — but
 * that round-robin is deterministic (sound, audio, case, ...), so every
 * real practice session hits an 'audio' slot at least once, which is
 * enough that a stale key never lingers past the next session.
 */

const STORAGE_KEY = 'learn-armenian:audio-muted-until';

export function isAudioMuted(): boolean {
	const raw = localStorage.getItem(STORAGE_KEY);
	if (raw === null) return false;
	const mutedUntil = Number(raw);
	if (!Number.isFinite(mutedUntil) || Date.now() >= mutedUntil) {
		localStorage.removeItem(STORAGE_KEY);
		return false;
	}
	return true;
}

export function muteAudioQuestions(minutes: number): void {
	localStorage.setItem(STORAGE_KEY, String(Date.now() + minutes * 60_000));
}
