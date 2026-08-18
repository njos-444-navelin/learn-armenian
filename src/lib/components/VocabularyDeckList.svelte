<script lang="ts">
	import type { VocabularyDeck } from '$lib/content/vocabulary/types';
	import { addedBadgeLabel } from '$lib/i18n/dictionaries/vocabulary';
	import { getLocale, t } from '$lib/i18n/current';
	import { withLocale } from '$lib/i18n/paths';

	interface Props {
		decks: readonly VocabularyDeck[];
		addedDeckIds: ReadonlySet<string>;
	}

	let { decks, addedDeckIds }: Props = $props();
	let locale = $derived(getLocale());
</script>

<ul class="decks">
	{#each decks as deck (deck.id)}
		{@const added = addedDeckIds.has(deck.id)}
		<li>
			<a class="deck" href={withLocale(locale, `/learn/vocabulary/${deck.id}`)}>
				<span class="title">{t(deck.title)}</span>
				{#if added}
					<span class="badge">{t(addedBadgeLabel)}</span>
				{/if}
			</a>
		</li>
	{/each}
</ul>

<style>
	.decks {
		display: flex;
		width: 100%;
		flex-direction: column;
		gap: var(--space-2);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.deck {
		display: flex;
		min-height: var(--tap-target-min);
		align-items: center;
		justify-content: space-between;
		gap: var(--space-3);
		padding: var(--space-3) var(--space-4);
		border: 1.5px solid transparent;
		border-radius: var(--radius-lg);
		background: var(--color-surface);
		text-decoration: none;
		color: var(--color-text-primary);
		font-family: var(--font-heading);
		font-weight: var(--font-heading-weight);
		transition: border-color var(--transition-fast);
	}

	.deck:hover {
		border-color: var(--color-primary);
	}

	.title {
		text-align: start;
	}

	.badge {
		flex-shrink: 0;
		padding: var(--space-1) var(--space-3);
		border-radius: var(--radius-pill);
		background: var(--color-success);
		color: var(--color-on-success);
		font-family: var(--font-family-body);
		font-size: var(--font-size-sm);
		font-weight: 600;
	}
</style>
