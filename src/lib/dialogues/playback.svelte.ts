/**
 * Line-by-line playback for the dialogue player: one `<audio>` element per
 * line, plus a "play all" mode that walks from the cursor to the end.
 *
 * `preload()` fetches every clip up front (client only — `Audio` doesn't exist
 * in SSR) so a tap starts the sound at once. One element per line rather than
 * a swapped `src`, which would discard the buffered data.
 *
 * A line whose clip isn't generated yet 404s and plays as a silent line of
 * fixed length, so play-all still walks the dialogue.
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
	/** The line play-all is on, or would resume from. `stop()` rewinds it. */
	cursor = $state(0);
	/** True from the first line played until `stop()` or the end. `cursor > 0`
	 * can't stand in for it: playing line 1 alone leaves the cursor at 0. */
	started = $state(false);

	private readonly lineCount: number;
	private readonly srcFor: (index: number) => string;
	private readonly audios: (HTMLAudioElement | undefined)[];
	private current: HTMLAudioElement | undefined;
	private timer: ReturnType<typeof setTimeout> | undefined;
	/** Bumped on every start/stop so a stale `ended`/timer from a previous
	 * play can't advance the cursor after the user has moved on. */
	private generation = 0;

	constructor(lineCount: number, srcFor: (index: number) => string) {
		this.lineCount = lineCount;
		this.srcFor = srcFor;
		this.audios = new Array<HTMLAudioElement | undefined>(lineCount).fill(undefined);
	}

	/** Fetches every line's clip now. Client only; safe to call more than once. */
	preload(): void {
		for (let index = 0; index < this.lineCount; index++) this.ensureAudio(index);
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
		for (const audio of this.audios) audio?.removeAttribute('src');
		this.audios.fill(undefined);
		this.current = undefined;
	}

	private start(index: number): void {
		this.silence();
		const generation = ++this.generation;
		this.playing = index;
		this.cursor = index;
		this.started = true;

		const audio = this.ensureAudio(index);
		this.current = audio;
		const finish = (): void => {
			if (generation !== this.generation) return;
			this.onLineEnded();
		};
		audio.onended = finish;
		// A missing or undecodable file: pretend the line lasted MISSING_CLIP_MS.
		// `onerror` covers a 404, the play() catch below a rejected play().
		audio.onerror = () => {
			if (generation !== this.generation) return;
			this.timer = setTimeout(finish, MISSING_CLIP_MS);
		};
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
		if (this.current !== undefined) {
			this.current.onended = null;
			this.current.onerror = null;
			this.current.pause();
		}
		this.playing = null;
	}

	private ensureAudio(index: number): HTMLAudioElement {
		let audio = this.audios[index];
		if (audio === undefined) {
			audio = new Audio(this.srcFor(index));
			audio.preload = 'auto';
			this.audios[index] = audio;
		}
		return audio;
	}
}
