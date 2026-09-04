<script lang="ts">
	import { fullVoicing, type AlphabetLetter } from '$lib/content/alphabet';
	import { letterAudioSrc } from '$lib/content/alphabetAudio';
	import type { Word } from '$lib/content/words/types';
	import { wordAudioSrc } from '$lib/content/words/audio';
	import { t } from '$lib/i18n/current';
	import { closeSheetLabel, inWordLabel, playPronunciationLabel } from '$lib/i18n/dictionaries/alphabetTrainer';
	import SpeakerButton from './SpeakerButton.svelte';

	interface Props {
		letter: AlphabetLetter;
		words: readonly Word[];
		onClose: () => void;
	}

	let { letter, words, onClose }: Props = $props();
	let dialogEl: HTMLDialogElement | undefined = $state();
	// True while the close animation is playing — `onClose` (which unmounts
	// this component) doesn't fire until the animation finishes and actually
	// calls `dialogEl.close()`, so the exit gets to play instead of the
	// component vanishing instantly.
	let closing = $state(false);

	// Same rationale as Modal.svelte: a native <dialog> gives a focus trap,
	// Escape-to-close and a ::backdrop for free.
	$effect(() => {
		dialogEl?.showModal();
	});

	function requestClose(): void {
		if (closing) return;
		// Reduced-motion: skip straight to closing rather than starting an
		// animation whose end event this component is waiting on to actually
		// close — with the animation disabled below, that event would never
		// fire and the dialog would be stuck open.
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
			dialogEl?.close();
			return;
		}
		closing = true;
	}

	/** Escape fires `cancel` and would otherwise close the dialog immediately,
	 * skipping the exit animation — intercept it and run the same animated
	 * close path as the backdrop/button instead. */
	function handleCancel(event: Event): void {
		event.preventDefault();
		requestClose();
	}

	function handleAnimationEnd(event: AnimationEvent): void {
		if (!closing || event.target !== dialogEl) return;
		dialogEl?.close();
	}

	function clickOutside(event: MouseEvent): void {
		if (dialogEl === undefined || event.target !== dialogEl) return;
		requestClose();
	}

	let pair = $derived(letter.uppercase === undefined ? letter.lowercase : `${letter.uppercase} ${letter.lowercase}`);
</script>

<dialog
	bind:this={dialogEl}
	class="sheet"
	class:closing
	aria-labelledby="alphabet-sheet-glyph"
	onclose={onClose}
	oncancel={handleCancel}
	onclick={clickOutside}
	onanimationend={handleAnimationEnd}
>
	<button type="button" class="cross" onclick={requestClose} aria-label={t(closeSheetLabel)}>
		<svg viewBox="0 0 24 24" fill="none" aria-hidden="true" width="20" height="20">
			<path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.75" stroke-linecap="round" stroke-linejoin="round" />
		</svg>
	</button>

	<div class="glyph-row">
		<span id="alphabet-sheet-glyph" lang="hy" class="glyph">{pair}</span>
		<div class="glyph-play">
			<SpeakerButton src={letterAudioSrc(letter.id)} />
			<span class="sr-only">{t(playPronunciationLabel)}</span>
		</div>
	</div>

	<p class="voicing">{t(fullVoicing(letter))}</p>

	{#each words as word (word.id)}
		<div class="word-card">
			<div class="word-text">
				<span class="word-label">{t(inWordLabel)}</span>
				<span lang="hy" class="word-armenian">{word.armenian}</span>
				<span class="word-translation">{t(word.translation)}</span>
			</div>
			<SpeakerButton src={wordAudioSrc(word.id)} />
		</div>
	{/each}
</dialog>

<style>
	.sheet {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		top: auto;
		width: 100%;
		max-width: var(--measure);
		margin: 0 auto;
		padding: var(--space-4) var(--space-4) calc(var(--space-5) + env(safe-area-inset-bottom));
		border: none;
		border-radius: var(--radius-lg) var(--radius-lg) 0 0;
		background: var(--color-background);
		box-shadow: var(--shadow-lg);
		animation: sheet-up 130ms ease-out both;
	}

	.sheet.closing {
		animation: sheet-down 110ms ease-in both;
	}

	.sheet::backdrop {
		background: var(--color-backdrop);
		animation: backdrop-in 130ms ease-out both;
	}

	.sheet.closing::backdrop {
		animation: backdrop-out 110ms ease-in both;
	}

	@keyframes sheet-up {
		from {
			transform: translateY(100%);
		}
		to {
			transform: translateY(0);
		}
	}

	@keyframes sheet-down {
		from {
			transform: translateY(0);
		}
		to {
			transform: translateY(100%);
		}
	}

	@keyframes backdrop-in {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@keyframes backdrop-out {
		from {
			opacity: 1;
		}
		to {
			opacity: 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.sheet,
		.sheet::backdrop {
			animation: none;
		}
	}

	/* Past phone width, an edge-anchored sheet reads oddly on a page that has
	   plenty of room either side — present it as a centered modal instead,
	   with a corner-anchored close affordance replacing the drag-handle
	   metaphor (which only ever meant something on a touch sheet). */
	@media (min-width: 768px) {
		.sheet {
			top: 0;
			bottom: 0;
			left: 0;
			right: 0;
			margin: auto;
			width: min(90vw, 30rem);
			max-height: 85vh;
			overflow-y: auto;
			border-radius: var(--radius-lg);
			padding: var(--space-5);
			animation: modal-in 200ms ease-out both;
		}

		.sheet.closing {
			animation: modal-out 160ms ease-in both;
		}
	}

	@keyframes modal-in {
		from {
			opacity: 0;
			transform: scale(0.95);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}

	@keyframes modal-out {
		from {
			opacity: 1;
			transform: scale(1);
		}
		to {
			opacity: 0;
			transform: scale(0.95);
		}
	}

	.cross {
		display: flex;
		position: absolute;
		top: var(--space-3);
		right: var(--space-3);
		align-items: center;
		justify-content: center;
		min-width: var(--tap-target-min);
		min-height: var(--tap-target-min);
		padding: 0;
		border: none;
		border-radius: var(--radius-pill);
		background: none;
		color: var(--color-text-secondary);
		cursor: pointer;
		transition: background-color var(--transition-fast);
	}

	.cross:hover {
		background: var(--color-surface-hover);
	}

	.glyph-row {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-4);
	}

	.glyph {
		font-family: var(--font-heading);
		font-weight: 900;
		font-size: clamp(2.5rem, 12vw, 3.5rem);
		line-height: 1;
		color: var(--color-accent-800);
	}

	.glyph-play :global(.speaker) {
		width: 3.5rem;
		height: 3.5rem;
		background: var(--color-surface);
	}

	.voicing {
		margin: var(--space-4) 0;
		text-align: center;
		font-size: var(--font-size-lg);
		color: var(--color-text-primary);
	}

	.word-card {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		margin-top: var(--space-3);
		padding: var(--space-5);
		border-radius: var(--radius-lg);
		background: var(--color-surface);
		text-align: left;
	}

	.word-text {
		display: flex;
		min-width: 0;
		flex: 1;
		flex-direction: column;
		gap: 2px;
	}

	.word-label {
		font-size: var(--font-size-sm);
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--color-text-secondary);
	}

	.word-armenian {
		font-family: var(--font-heading);
		font-weight: var(--font-heading-weight);
		font-size: 1.35rem;
	}

	.word-translation {
		font-size: var(--font-size-sm);
		color: var(--color-text-secondary);
	}

</style>
