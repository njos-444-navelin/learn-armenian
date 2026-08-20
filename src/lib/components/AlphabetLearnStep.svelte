<script lang="ts">
	import type { AlphabetLetter } from '$lib/content/alphabet';
	import { letterAudioSrc } from '$lib/content/alphabetAudio';
	import type { Word } from '$lib/content/words/types';
	import { wordAudioSrc } from '$lib/content/words/audio';
	import { t } from '$lib/i18n/current';
	import {
		inWordLabel,
		learnNextLabel,
		learnPreviousLabel,
		learnSectionLabel,
		learnStartPracticingLabel,
		playPronunciationLabel,
		stepCounterLabel
	} from '$lib/i18n/dictionaries/alphabetTrainer';
	import FloatingActionBar from './FloatingActionBar.svelte';
	import SpeakerButton from './SpeakerButton.svelte';

	interface Props {
		letter: AlphabetLetter;
		words: readonly Word[];
		index: number;
		total: number;
		isLast: boolean;
		onPrev: () => void;
		onNext: () => void;
	}

	let { letter, words, index, total, isLast, onPrev, onNext }: Props = $props();

	let pair = $derived(letter.uppercase === undefined ? letter.lowercase : `${letter.uppercase} ${letter.lowercase}`);
</script>

<div class="header">
	<div class="header-row">
		<span class="section-label">{t(learnSectionLabel)}</span>
		<span class="counter">{t(stepCounterLabel(index + 1, total))}</span>
	</div>
	<div class="dots">
		{#each { length: total } as _, n (n)}
			<div class="dot" class:filled={n <= index}></div>
		{/each}
	</div>
</div>

<div class="stage">
	<div class="glyph-circle">
		<span lang="hy" class="glyph">{pair}</span>
	</div>
	<SpeakerButton src={letterAudioSrc(letter.id)} />
	<span class="sr-only">{t(playPronunciationLabel)}</span>

	<p class="voicing">{t(letter.voicing)}</p>

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
</div>

<FloatingActionBar bare>
	<div class="actions">
		<button type="button" class="prev" aria-label={t(learnPreviousLabel)} onclick={onPrev}>
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" width="20" height="20">
				<path d="m15 18-6-6 6-6" />
			</svg>
		</button>
		<button type="button" class="next" onclick={onNext}>
			{isLast ? t(learnStartPracticingLabel) : t(learnNextLabel)}
		</button>
	</div>
</FloatingActionBar>

<style>
	.header {
		display: flex;
		width: 100%;
		flex-direction: column;
		gap: var(--space-2);
	}

	.header-row {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		font-size: var(--font-size-sm);
	}

	.section-label {
		font-weight: 700;
		color: var(--color-text-secondary);
	}

	.counter {
		color: var(--color-text-secondary);
	}

	.dots {
		display: flex;
		gap: var(--space-1);
	}

	.dot {
		height: 5px;
		flex: 1;
		border-radius: var(--radius-pill);
		background: var(--color-neutral-300);
	}

	.dot.filled {
		background: var(--color-primary);
	}

	.stage {
		display: flex;
		width: 100%;
		flex-direction: column;
		align-items: center;
		gap: var(--space-3);
	}

	.glyph-circle {
		display: flex;
		width: clamp(9rem, 40vw, 11rem);
		aspect-ratio: 1;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		background: var(--color-surface);
	}

	.glyph {
		font-family: var(--font-heading);
		font-weight: 900;
		font-size: clamp(2.25rem, 10vw, 3.25rem);
		line-height: 1;
		color: var(--color-accent-800);
	}

	.voicing {
		/* A little extra on top of .stage's own flex `gap` — enough that this
		   text reads as its own paragraph next to the glyph/word-card either
		   side of it, not squeezed flush against both. */
		margin: var(--space-1) 0;
		max-width: 26rem;
		text-align: center;
		font-size: var(--font-size-lg);
		color: var(--color-text-primary);
	}

	.word-card {
		display: flex;
		width: 100%;
		max-width: 24rem;
		align-items: center;
		gap: var(--space-3);
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
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--color-text-secondary);
	}

	.word-armenian {
		font-family: var(--font-heading);
		font-weight: var(--font-heading-weight);
		font-size: 1.2rem;
	}

	.word-translation {
		font-size: var(--font-size-sm);
		color: var(--color-text-secondary);
	}

	.actions {
		display: flex;
		width: 100%;
		flex: 1;
		gap: var(--space-2);
	}

	.prev {
		display: flex;
		width: 4rem;
		min-height: var(--tap-target-min);
		flex: none;
		align-items: center;
		justify-content: center;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-pill);
		background: transparent;
		color: var(--color-text-primary);
		cursor: pointer;
		transition: background-color var(--transition-fast);
	}

	.prev:hover {
		background: var(--color-surface-hover);
	}

	.next {
		flex: 1;
		min-height: var(--tap-target-min);
		border: none;
		border-radius: var(--radius-pill);
		background: var(--color-primary);
		color: var(--color-on-primary);
		font-family: var(--font-heading);
		font-weight: var(--font-heading-weight);
		font-size: var(--font-size-md);
		box-shadow: var(--shadow-sm);
		cursor: pointer;
		transition: background-color var(--transition-fast);
	}

	.next:hover {
		background: var(--color-primary-hover);
	}
</style>
