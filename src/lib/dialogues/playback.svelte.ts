/**
 * Line-by-line playback for the dialogue player: one `<audio>` element,
 * one line at a time, with an optional "play all" mode that walks the
 * dialogue from the cursor to the end. Reactive (`$state`) so the player
 * component renders straight from it; owns nothing about the DOM beyond the
 * audio element it creates lazily on first play.
 *
 * Until a dialogue's line clips are generated (see docs/DIALOGUES.md), a
 * line's file 404s. Rather than stall "play all" on the first missing file,
 * a load error is treated as a silent line of fixed length — the flow still
 * walks every line, highlighting each in turn, so the whole player can be
 * exercised end to end before audio exists. This is the same "no missing
 * audio state, fail silently" rule as `SpeakerButton.svelte`, just with the
 * auto-advance kept working. Nothing in the UI reports the difference, so
 * a missing clip is caught by listening (or by checking `static/`), not by
 * the app.
 */

/** How long a line with no clip "plays" for — long enough to read it. */
const MISSING_CLIP_MS = 1600;
/** Breath between two lines in play-all mode. */
const GAP_MS = 450;

export class DialoguePlayback {
	/** Index of the line currently playing, or `null` when silent. */
	playing = $state<number | null>(null);
	/** True while play-all is walking the dialogue (including between lines). */
	auto = $state(false);
	/** The line play-all is on, or would resume from. Stays where playback
	 * last stopped so pause/resume picks up in place; `stop()` rewinds it. */
	cursor = $state(0);
	/** True from the first line played (alone or via play-all) until
	 * `stop()` or the end of the dialogue. `cursor > 0` can't stand in for
	 * this: playing line 1 on its own leaves the cursor at 0, and the bar
	 * would stay in its resting layout for that one line only. */
	started = $state(false);

	private readonly lineCount: number;
	private readonly srcFor: (index: number) => string;
	private audio: HTMLAudioElement | undefined;
	private timer: ReturnType<typeof setTimeout> | undefined;
	/** Bumped on every start/stop so a stale `ended`/timer from a previous
	 * play can't advance the cursor after the user has moved on. */
	private generation = 0;

	constructor(lineCount: number, srcFor: (index: number) => string) {
		this.lineCount = lineCount;
		this.srcFor = srcFor;
	}

	/** Plays one line on its own — cancels play-all if it was running. */
	playLine(index: number): void {
		this.auto = false;
		this.cursor = index;
		this.start(index);
	}

	/** Starts play-all from the cursor, or pauses it in place. */
	toggleAuto(): void {
		if (this.auto) {
			this.auto = false;
			this.silence();
			return;
		}
		this.auto = true;
		this.start(this.cursor);
	}

	/** Silences everything and rewinds to the first line. */
	stop(): void {
		this.auto = false;
		this.silence();
		this.cursor = 0;
		this.started = false;
	}

	/** Call from the owning component's teardown. */
	destroy(): void {
		this.silence();
		this.audio?.removeAttribute('src');
		this.audio = undefined;
	}

	private start(index: number): void {
		this.silence();
		const generation = ++this.generation;
		this.playing = index;
		this.cursor = index;
		this.started = true;

		const audio = this.ensureAudio();
		const finish = (): void => {
			if (generation !== this.generation) return;
			this.onLineEnded();
		};
		audio.onended = finish;
		// A missing/undecodable file: pretend the line lasted MISSING_CLIP_MS
		// (see the module comment). `onerror` covers a 404; the play() catch
		// below covers a rejected play() for the same reason.
		audio.onerror = () => {
			if (generation !== this.generation) return;
			this.timer = setTimeout(finish, MISSING_CLIP_MS);
		};
		audio.src = this.srcFor(index);
		audio.currentTime = 0;
		void audio.play().catch(() => {
			if (generation !== this.generation || this.timer !== undefined) return;
			this.timer = setTimeout(finish, MISSING_CLIP_MS);
		});
	}

	private onLineEnded(): void {
		this.playing = null;
		if (!this.auto) return;
		const next = this.cursor + 1;
		if (next >= this.lineCount) {
			this.auto = false;
			this.cursor = 0;
			this.started = false;
			return;
		}
		const generation = this.generation;
		this.timer = setTimeout(() => {
			if (generation !== this.generation || !this.auto) return;
			this.start(next);
		}, GAP_MS);
	}

	/** Stops the current clip and any pending advance, without touching `auto`/`cursor`. */
	private silence(): void {
		this.generation++;
		if (this.timer !== undefined) {
			clearTimeout(this.timer);
			this.timer = undefined;
		}
		if (this.audio !== undefined) {
			this.audio.onended = null;
			this.audio.onerror = null;
			this.audio.pause();
		}
		this.playing = null;
	}

	private ensureAudio(): HTMLAudioElement {
		if (this.audio === undefined) {
			this.audio = new Audio();
			this.audio.preload = 'auto';
		}
		return this.audio;
	}
}
