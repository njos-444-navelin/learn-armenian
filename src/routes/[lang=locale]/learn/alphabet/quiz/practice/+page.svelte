<script lang="ts">
	import AlphabetQuiz from '$lib/components/AlphabetQuiz.svelte';
	import Button from '$lib/components/Button.svelte';
	import LetterList from '$lib/components/LetterList.svelte';
	import PageShell from '$lib/components/PageShell.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import { ALPHABET, type AlphabetLetter } from '$lib/content/alphabet';
	import { getLocale, t } from '$lib/i18n/current';
	import { withLocale } from '$lib/i18n/paths';
	import {
		backToStudyLabel,
		completionBody,
		completionHeading,
		restartLabel
	} from '$lib/i18n/dictionaries/alphabetQuiz';
	import {
		blockHeading,
		blockIntro,
		pageDescription,
		pageTitle,
		quizBlockLabel
	} from '$lib/i18n/dictionaries/alphabetQuizPractice';

	const BLOCK_SIZE = 5;

	function chunk(items: readonly AlphabetLetter[], size: number): AlphabetLetter[][] {
		const chunks: AlphabetLetter[][] = [];
		for (let i = 0; i < items.length; i += size) {
			chunks.push(items.slice(i, i + size));
		}
		return chunks;
	}

	const blocks = chunk(ALPHABET, BLOCK_SIZE);

	let locale = $derived(getLocale());
	let blockIndex = $state(0);
	let phase = $state<'intro' | 'quiz'>('intro');

	let currentBlock = $derived(blocks[blockIndex]);

	function startBlockQuiz(): void {
		phase = 'quiz';
	}

	function handleBlockComplete(): void {
		blockIndex += 1;
		phase = 'intro';
	}

	function restart(): void {
		blockIndex = 0;
		phase = 'intro';
	}
</script>

<Seo title={pageTitle} description={pageDescription} />

<PageShell>
	{#if currentBlock !== undefined}
		<h1>{t(blockHeading(blockIndex + 1, blocks.length))}</h1>

		{#if phase === 'intro'}
			<p class="intro">{t(blockIntro)}</p>
			<LetterList letters={currentBlock} />
			<Button variant="primary" onclick={startBlockQuiz}>
				{t(quizBlockLabel)}
			</Button>
		{:else}
			{#key blockIndex}
				<AlphabetQuiz letters={currentBlock} onComplete={handleBlockComplete} />
			{/key}
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
	.intro {
		color: var(--color-text-secondary);
		font-size: var(--font-size-lg);
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-3);
		justify-content: center;
	}
</style>
