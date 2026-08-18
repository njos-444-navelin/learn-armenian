<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import PageShell from '$lib/components/PageShell.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import { ALPHABET } from '$lib/content/alphabet';
	import {
		allModeDescription,
		allModeLabel,
		heading,
		pageDescription,
		pageTitle,
		practiceModeDescription,
		practiceModeLabel
	} from '$lib/i18n/dictionaries/alphabetQuizMode';
	import { getLocale, t } from '$lib/i18n/current';
	import { withLocale } from '$lib/i18n/paths';

	let locale = $derived(getLocale());
</script>

<Seo title={pageTitle} description={pageDescription} />

<PageShell>
	<h1>{t(heading)}</h1>

	<div class="mode-choice">
		<p class="mode-description">{t(practiceModeDescription)}</p>
		<Button href={withLocale(locale, '/learn/alphabet/quiz/practice')} variant="primary">
			{t(practiceModeLabel)}
		</Button>
	</div>

	<div class="mode-choice">
		<p class="mode-description">{t(allModeDescription(ALPHABET.length))}</p>
		<Button href={withLocale(locale, '/learn/alphabet/quiz/all')} variant="primary">
			{t(allModeLabel)}
		</Button>
	</div>
</PageShell>

<style>
	.mode-choice {
		display: flex;
		width: 100%;
		flex-direction: column;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-4);
		border-radius: var(--radius-lg);
		background: var(--color-surface);
	}

	.mode-description {
		color: var(--color-text-secondary);
	}
</style>
