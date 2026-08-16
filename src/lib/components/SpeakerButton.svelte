<script lang="ts">
	import { t } from '$lib/i18n/current';
	import { playPronunciationLabel } from '$lib/i18n/dictionaries/vocabulary';

	interface Props {
		src: string;
	}

	let { src }: Props = $props();

	let audio: HTMLAudioElement | undefined = $state();

	/** `stopPropagation` is load-bearing: this button always sits inside a
	 * larger clickable card/row (the flip card, a word-list row), and must
	 * never trigger that ancestor's own click handler. */
	function play(event: MouseEvent): void {
		event.stopPropagation();
		if (audio === undefined) return;
		audio.currentTime = 0;
		// A failed play() (slow network, a blocked autoplay-adjacent policy)
		// has no useful recovery for the user beyond "tap it again" — not
		// worth a toast for a single word's pronunciation clip.
		void audio.play().catch(() => {});
	}
</script>

<button type="button" class="speaker" onclick={play} aria-label={t(playPronunciationLabel)}>
	<svg viewBox="0 0 24 24" fill="none" aria-hidden="true" width="20" height="20">
		<path
			d="M4 9.5v5h3.5L12 18V6L7.5 9.5H4Z"
			fill="currentColor"
			stroke="currentColor"
			stroke-width="1.5"
			stroke-linejoin="round"
		/>
		<path d="M16 9a4.5 4.5 0 0 1 0 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
		<path d="M18.5 6.5a8 8 0 0 1 0 11" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
	</svg>
</button>
<audio bind:this={audio} {src} preload="none"></audio>

<style>
	.speaker {
		display: inline-flex;
		flex-shrink: 0;
		align-items: center;
		justify-content: center;
		width: var(--tap-target-min);
		height: var(--tap-target-min);
		border: none;
		border-radius: var(--radius-md);
		background: none;
		color: var(--color-text-secondary);
		cursor: pointer;
		transition:
			background-color var(--transition-fast),
			color var(--transition-fast);
	}

	.speaker:hover {
		background: var(--color-surface);
		color: var(--color-text-primary);
	}
</style>
