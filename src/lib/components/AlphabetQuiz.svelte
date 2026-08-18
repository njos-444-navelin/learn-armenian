<script lang="ts">
	import { untrack } from 'svelte';
	import Button from './Button.svelte';
	import { ALPHABET, type AlphabetLetter } from '$lib/content/alphabet';
	import { t } from '$lib/i18n/current';
	import {
		correctAnswerHint,
		correctFeedback,
		incorrectAnswerHint,
		incorrectFeedback,
		nextLabel,
		progressLabel,
		question
	} from '$lib/i18n/dictionaries/alphabetQuiz';

	interface Props {
		/** The pool of letters this quiz run covers — the whole alphabet, or a practice-mode block. */
		letters: readonly AlphabetLetter[];
		/** Fires exactly once, when every letter in `letters` has been answered correctly at least once. */
		onComplete: () => void;
	}

	let { letters, onComplete }: Props = $props();

	function shuffle<T>(items: readonly T[]): T[] {
		const copy = [...items];
		for (let i = copy.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			const a = copy[i];
			const b = copy[j];
			if (a === undefined || b === undefined) continue;
			copy[i] = b;
			copy[j] = a;
		}
		return copy;
	}

	/** Distractors come from this quiz's own pool first (keeps a practice block self-contained); the
	 * full alphabet only backfills when the pool itself is too small to offer 3 distractors. */
	function buildOptions(letter: AlphabetLetter): AlphabetLetter[] {
		const withinPool = shuffle(letters.filter((entry) => entry.id !== letter.id));
		const usedIds = new Set([letter.id, ...withinPool.map((entry) => entry.id)]);
		const fallback = shuffle(ALPHABET.filter((entry) => !usedIds.has(entry.id)));
		const distractors = [...withinPool, ...fallback].slice(0, 3);
		return shuffle([letter, ...distractors]);
	}

	// `letters` is only ever meant to be read once, at mount — a parent that wants a fresh
	// run (a new practice block, a restart) remounts via {#key}, it doesn't mutate the prop.
	let queue = $state<AlphabetLetter[]>(untrack(() => shuffle(letters)));
	let masteredCount = $state(0);
	let answerState = $state<'answering' | 'correct' | 'incorrect'>('answering');
	let selectedId = $state<string | null>(null);

	let current = $derived(queue[0]);
	let options = $derived(current !== undefined ? buildOptions(current) : []);

	function handleAnswer(letterId: string): void {
		if (answerState !== 'answering' || current === undefined) return;
		selectedId = letterId;
		answerState = letterId === current.id ? 'correct' : 'incorrect';
	}

	function nextQuestion(): void {
		if (current === undefined) return;
		if (answerState === 'correct') {
			masteredCount += 1;
			queue = queue.slice(1);
		} else if (answerState === 'incorrect') {
			const missed = current;
			const rest = queue.slice(1);
			const insertAt = Math.min(rest.length, 3 + Math.floor(Math.random() * 4));
			queue = [...rest.slice(0, insertAt), missed, ...rest.slice(insertAt)];
		}
		answerState = 'answering';
		selectedId = null;
		if (queue.length === 0) {
			onComplete();
		}
	}

	function optionVariant(option: AlphabetLetter): 'secondary' | 'success' | 'error' {
		if (answerState === 'answering') return 'secondary';
		if (option.id === current?.id) return 'success';
		if (option.id === selectedId) return 'error';
		return 'secondary';
	}
</script>

{#if current !== undefined}
	<p class="progress">{t(progressLabel(masteredCount, letters.length))}</p>

	<div class="letter-stage">
		<p class="letter-display" lang="hy"
			>{current.uppercase === undefined
				? current.lowercase
				: `${current.uppercase} ${current.lowercase}`}</p
		>
	</div>

	<p class="question">{t(question)}</p>

	<div class="options">
		{#each options as option (option.id)}
			{@const variant = optionVariant(option)}
			<Button {variant} disabled={answerState !== 'answering'} onclick={() => handleAnswer(option.id)}>
				{t(option.voicing)}
				{#if variant === 'success'}
					<span aria-hidden="true">✓</span>
					<span class="sr-only">{t(correctAnswerHint)}</span>
				{:else if variant === 'error'}
					<span aria-hidden="true">✗</span>
					<span class="sr-only">{t(incorrectAnswerHint)}</span>
				{/if}
			</Button>
		{/each}
	</div>

	{#if answerState !== 'answering'}
		<p class="feedback" aria-live="polite">
			{answerState === 'correct' ? t(correctFeedback) : t(incorrectFeedback)}
		</p>
		<Button variant="primary" onclick={nextQuestion}>
			{t(nextLabel)}
		</Button>
	{/if}
{/if}

<style>
	.progress {
		color: var(--color-text-secondary);
		font-size: var(--font-size-sm);
	}

	.letter-stage {
		display: flex;
		width: clamp(9rem, 42vw, 13rem);
		aspect-ratio: 1;
		align-items: center;
		justify-content: center;
		padding: var(--space-4);
		border-radius: 50%;
		background: var(--color-surface);
		box-sizing: border-box;
	}

	.letter-display {
		margin: 0;
		font-family: var(--font-heading);
		font-weight: var(--font-heading-weight);
		font-size: clamp(2.25rem, 10vw, 4rem);
		line-height: 1;
		color: var(--color-accent-800);
		text-align: center;
	}

	.question {
		color: var(--color-text-secondary);
		font-size: var(--font-size-lg);
	}

	.options {
		display: flex;
		width: 100%;
		flex-direction: column;
		align-items: stretch;
		gap: var(--space-3);
	}

	.feedback {
		font-weight: 600;
	}
</style>
