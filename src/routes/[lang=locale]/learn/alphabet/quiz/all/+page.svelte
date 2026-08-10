<script lang="ts">
	import AlphabetQuiz from '$lib/components/AlphabetQuiz.svelte';
	import Button from '$lib/components/Button.svelte';
	import PageShell from '$lib/components/PageShell.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import { ALPHABET } from '$lib/content/alphabet';
	import { getLocale, t } from '$lib/i18n/current';
	import { withLocale } from '$lib/i18n/paths';
	import {
		backToStudyLabel,
		completionBody,
		completionHeading,
		restartLabel
	} from '$lib/i18n/dictionaries/alphabetQuiz';
	import { heading, pageDescription, pageTitle } from '$lib/i18n/dictionaries/alphabetQuizAll';

	let locale = $derived(getLocale());
	let isDone = $state(false);
	let restartToken = $state(0);

	function handleComplete(): void {
		isDone = true;
	}

	function restart(): void {
		isDone = false;
		restartToken += 1;
	}
</script>

<Seo title={pageTitle} description={pageDescription} />

<PageShell>
	{#if isDone}
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
	{:else}
		<h1>{t(heading)}</h1>
		{#key restartToken}
			<AlphabetQuiz letters={ALPHABET} onComplete={handleComplete} />
		{/key}
	{/if}
</PageShell>

<style>
	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-3);
		justify-content: center;
	}
</style>
