<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import Button from '$lib/components/Button.svelte';
	import PageShell from '$lib/components/PageShell.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import VocabularyTrainer from '$lib/components/VocabularyTrainer.svelte';
	import { getLocale, t } from '$lib/i18n/current';
	import { withLocale } from '$lib/i18n/paths';
	import {
		browseTopicsLabel,
		heading,
		nextRoundFailedMessage,
		noDecksAddedHeading,
		noDecksAddedMessage,
		pageDescription,
		pageTitle
	} from '$lib/i18n/dictionaries/vocabularyTraining';
	import { pushToast } from '$lib/stores/toasts.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let locale = $derived(getLocale());

	// The trainer reads `initialQueue` once at mount, so a freshly loaded
	// `data.queue` doesn't reach a mounted one; bumping `round` remounts it and
	// hands the next round over. Both live here because they have to survive
	// that remount — which is why the pending state is passed back down.
	let round = $state(0);
	let nextRoundPending = $state(false);

	async function startNextRound(): Promise<void> {
		nextRoundPending = true;
		try {
			await invalidateAll();
			round += 1;
		} catch {
			pushToast(nextRoundFailedMessage, 'error');
		} finally {
			nextRoundPending = false;
		}
	}
</script>

<Seo title={pageTitle} description={pageDescription} />

<PageShell>
	<h1>{t(heading)}</h1>

	{#if data.hasAddedDecks}
		{#key round}
			<VocabularyTrainer
				initialQueue={data.queue}
				newCardsHeldBack={data.newCardsHeldBack}
				dueCardsHeldBack={data.dueCardsHeldBack}
				onNextRound={startNextRound}
				{nextRoundPending}
			/>
		{/key}
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
