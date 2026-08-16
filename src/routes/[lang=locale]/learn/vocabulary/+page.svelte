<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import FloatingActionBar from '$lib/components/FloatingActionBar.svelte';
	import PageShell from '$lib/components/PageShell.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import VocabularyDeckList from '$lib/components/VocabularyDeckList.svelte';
	import { getLocale, t } from '$lib/i18n/current';
	import { withLocale } from '$lib/i18n/paths';
	import {
		catalogGrowingMessage,
		decksMenuAriaLabel,
		heading,
		pageDescription,
		pageTitle
	} from '$lib/i18n/dictionaries/vocabulary';
	import { trainVocabularyMenuLabel } from '$lib/i18n/dictionaries/vocabularyTraining';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let addedDeckIds = $derived(new Set(data.addedDeckIds));
	let locale = $derived(getLocale());
</script>

<Seo title={pageTitle} description={pageDescription} />

<PageShell>
	<h1>{t(heading)}</h1>

	<nav aria-label={t(decksMenuAriaLabel)}>
		<VocabularyDeckList decks={data.decks} {addedDeckIds} />
	</nav>

	<p class="catalog-note">{t(catalogGrowingMessage)}</p>

	{#if addedDeckIds.size > 0}
		<FloatingActionBar>
			<Button href={withLocale(locale, '/learn/vocabulary/train')} variant="primary">
				{t(trainVocabularyMenuLabel)}
			</Button>
		</FloatingActionBar>
	{/if}
</PageShell>

<style>
	nav {
		display: flex;
		width: 100%;
	}

	.catalog-note {
		margin: 0;
		color: var(--color-text-secondary);
		font-size: var(--font-size-sm);
	}
</style>
