<script lang="ts">
	import PageShell from '$lib/components/PageShell.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import VocabularyDeckList from '$lib/components/VocabularyDeckList.svelte';
	import { t } from '$lib/i18n/current';
	import {
		decksMenuAriaLabel,
		heading,
		pageDescription,
		pageTitle
	} from '$lib/i18n/dictionaries/vocabulary';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let addedDeckIds = $derived(new Set(data.addedDeckIds));
</script>

<Seo title={pageTitle} description={pageDescription} />

<PageShell>
	<h1>{t(heading)}</h1>

	<nav aria-label={t(decksMenuAriaLabel)}>
		<VocabularyDeckList decks={data.decks} {addedDeckIds} />
	</nav>
</PageShell>

<style>
	nav {
		display: flex;
		width: 100%;
		flex-direction: column;
		gap: var(--space-5);
	}
</style>
