<script lang="ts">
	import Flagmark from '$lib/components/Flagmark.svelte';
	import PageShell from '$lib/components/PageShell.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import { brandName } from '$lib/i18n/dictionaries/common';
	import { getLocale, t } from '$lib/i18n/current';
	import { withLocale } from '$lib/i18n/paths';
	import {
		alphabetTrainerHint,
		alphabetTrainerLabel,
		heading,
		menuAriaLabel,
		moreToComeLabel,
		pageDescription,
		pageTitle,
		vocabularyTrainerHint,
		vocabularyTrainerLabel
	} from '$lib/i18n/dictionaries/learn';

	let locale = $derived(getLocale());
</script>

<Seo title={pageTitle} description={pageDescription} />

<PageShell>
	<div class="brand">
		<Flagmark />
		<span class="wordmark">{brandName}</span>
	</div>

	<h1>{t(heading)}</h1>

	<nav class="hub" aria-label={t(menuAriaLabel)}>
		<a class="hub-card acc" href={withLocale(locale, '/learn/alphabet')}>
			<span class="hub-icon">
				<svg
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2.75"
					stroke-linecap="round"
					stroke-linejoin="round"
					aria-hidden="true"
					width="24"
					height="24"
				>
					<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
					<path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
				</svg>
			</span>
			<span class="hub-copy">
				<span class="hub-title">{t(alphabetTrainerLabel)}</span>
				<span class="hub-sub">{t(alphabetTrainerHint)}</span>
			</span>
		</a>

		<a class="hub-card acc2" href={withLocale(locale, '/learn/vocabulary')}>
			<span class="hub-icon">
				<svg
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2.75"
					stroke-linecap="round"
					stroke-linejoin="round"
					aria-hidden="true"
					width="24"
					height="24"
				>
					<rect x="3" y="4" width="18" height="14" rx="2" />
					<path d="M3 9h18" />
				</svg>
			</span>
			<span class="hub-copy">
				<span class="hub-title">{t(vocabularyTrainerLabel)}</span>
				<span class="hub-sub">{t(vocabularyTrainerHint)}</span>
			</span>
		</a>

		<p class="more-note">{t(moreToComeLabel)}</p>
	</nav>
</PageShell>

<style>
	.brand {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.wordmark {
		font-family: var(--font-heading);
		font-weight: var(--font-heading-weight);
		font-size: 1.05rem;
	}

	.hub {
		display: flex;
		width: 100%;
		max-width: 26rem;
		flex-direction: column;
		gap: var(--space-3);
	}

	.hub-card {
		display: flex;
		align-items: center;
		gap: var(--space-4);
		width: 100%;
		padding: var(--space-4);
		border: none;
		border-radius: var(--radius-lg);
		background: var(--color-surface);
		color: var(--color-text-primary);
		text-decoration: none;
		text-align: left;
		font-family: var(--font-family-body);
		cursor: pointer;
	}

	.more-note {
		margin: var(--space-2) 0 0;
		color: var(--color-text-secondary);
		font-size: var(--font-size-sm);
		text-align: center;
	}

	.hub-icon {
		display: grid;
		flex-shrink: 0;
		place-content: center;
		width: 3.25rem;
		height: 3.25rem;
		border-radius: 50%;
		background: var(--color-background);
		color: var(--color-accent-700);
	}

	.hub-card.acc2 .hub-icon {
		color: var(--color-accent-2-700);
	}

	.hub-copy {
		display: flex;
		min-width: 0;
		flex-direction: column;
		gap: 0.15rem;
	}

	.hub-title {
		font-family: var(--font-heading);
		font-weight: var(--font-heading-weight);
		font-size: 1.15rem;
	}

	.hub-sub {
		font-size: var(--font-size-sm);
		color: var(--color-text-secondary);
	}
</style>
