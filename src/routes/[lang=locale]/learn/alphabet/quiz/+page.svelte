<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import PageShell from '$lib/components/PageShell.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import { ALPHABET, type AlphabetLetter } from '$lib/content/alphabet';
	import { getLocale, t } from '$lib/i18n/current';
	import { withLocale } from '$lib/i18n/paths';
	import {
		backToStudyLabel,
		completionBody,
		completionHeading,
		correctAnswerHint,
		correctFeedback,
		heading,
		incorrectAnswerHint,
		incorrectFeedback,
		nextLabel,
		pageDescription,
		pageTitle,
		progressLabel,
		question,
		restartLabel
	} from '$lib/i18n/dictionaries/alphabetQuiz';

	let locale = $derived(getLocale());

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

	function buildOptions(letter: AlphabetLetter): AlphabetLetter[] {
		const distractors = shuffle(ALPHABET.filter((entry) => entry.id !== letter.id)).slice(0, 3);
		return shuffle([letter, ...distractors]);
	}

	let queue = $state<AlphabetLetter[]>(shuffle(ALPHABET));
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
	}

	function restart(): void {
		queue = shuffle(ALPHABET);
		masteredCount = 0;
		answerState = 'answering';
		selectedId = null;
	}

	function optionVariant(option: AlphabetLetter): 'secondary' | 'success' | 'error' {
		if (answerState === 'answering') return 'secondary';
		if (option.id === current?.id) return 'success';
		if (option.id === selectedId) return 'error';
		return 'secondary';
	}
</script>

<Seo title={pageTitle} description={pageDescription} />

<PageShell>
	{#if current !== undefined}
		<h1>{t(heading)}</h1>
		<p class="progress">{t(progressLabel(masteredCount, ALPHABET.length))}</p>

		<p class="letter-display" lang="hy">{current.uppercase} {current.lowercase}</p>

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
	{:else}
		<h1>{t(completionHeading)}</h1>
		<p>{t(completionBody)}</p>
		<div class="actions">
			<Button variant="primary" onclick={restart}>
				{t(restartLabel)}
			</Button>
			<Button href={withLocale(locale, '/learn/alphabet')} variant="secondary">
				{t(backToStudyLabel)}
			</Button>
		</div>
	{/if}
</PageShell>

<style>
	.progress {
		color: var(--color-text-secondary);
		font-size: var(--font-size-sm);
	}

	.letter-display {
		font-size: var(--font-size-display);
		font-weight: 700;
		line-height: 1;
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

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-3);
		justify-content: center;
	}
</style>
