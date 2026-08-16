<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import PageShell from '$lib/components/PageShell.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import VocabularyTrainer from '$lib/components/VocabularyTrainer.svelte';
	import { getLocale, t } from '$lib/i18n/current';
	import { withLocale } from '$lib/i18n/paths';
	import {
		browseTopicsLabel,
		heading,
		noDecksAddedHeading,
		noDecksAddedMessage,
		pageDescription,
		pageTitle
	} from '$lib/i18n/dictionaries/vocabularyTraining';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let locale = $derived(getLocale());
</script>

<Seo title={pageTitle} description={pageDescription} />

<PageShell>
	<h1>{t(heading)}</h1>

	{#if data.hasAddedDecks}
		<VocabularyTrainer initialQueue={data.queue} />
	{:else}
		<h2>{t(noDecksAddedHeading)}</h2>
		<p>{t(noDecksAddedMessage)}</p>
		<Button href={withLocale(locale, '/learn/vocabulary')} variant="primary">
			{t(browseTopicsLabel)}
		</Button>
	{/if}
</PageShell>

<style>
	h2 {
		margin: 0;
		font-size: var(--font-size-lg);
	}
</style>
