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
		dialoguesHint,
		dialoguesLabel,
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
					<g transform="translate(0, 2)">
						<path d="M6.5 4V13.5A5 5 0 0 0 16.5 13.5V4" />
						<path d="M16.3 13.5Q19.7 13.7 19.6 15.9V18.2" />
					</g>
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
					<rect x="3" y="5.4" width="12.5" height="15.4" rx="4" />
					<path d="M6.8 13.2h4.9" />
					<path d="M7 5.4A4 4 0 0 1 11 1.4h4.5a4 4 0 0 1 4 4V13a4 4 0 0 1-4 4" />
				</svg>
			</span>
			<span class="hub-copy">
				<span class="hub-title">{t(vocabularyTrainerLabel)}</span>
				<span class="hub-sub">{t(vocabularyTrainerHint)}</span>
			</span>
		</a>

		<a class="hub-card acc" href={withLocale(locale, '/learn/dialogues')}>
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
					<path
						d="M4 16.5V8a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v4.5a4 4 0 0 1-4 4H9.5L5.5 20a1 1 0 0 1-1.5-.9z"
					/>
					<path d="M8.5 8.3h7M8.5 12.2h4" />
				</svg>
			</span>
			<span class="hub-copy">
				<span class="hub-title">{t(dialoguesLabel)}</span>
				<span class="hub-sub">{t(dialoguesHint)}</span>
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
		transition: background-color var(--transition-fast);
	}

	.hub-card:hover {
		background: var(--color-surface-hover);
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
