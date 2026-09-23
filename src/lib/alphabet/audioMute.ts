// localStorage, not sessionStorage: the mute is a wall-clock duration meant
// to outlive the tab. `isAudioMuted()` clears the key once it lapses, so no
// separate cleanup pass is needed.

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
