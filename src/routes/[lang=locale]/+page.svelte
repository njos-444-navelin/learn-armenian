<script lang="ts">
	import { page } from '$app/state';
	import Button from '$lib/components/Button.svelte';
	import PageShell from '$lib/components/PageShell.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import { LOCALE_FLAGS, LOCALES } from '$lib/i18n/locale';
	import { getLocale, t } from '$lib/i18n/current';
	import { withLocale } from '$lib/i18n/paths';
	import { persistPreferredLocale } from '$lib/i18n/persistPreferredLocale';
	import { languageNames, startLearning } from '$lib/i18n/dictionaries/common';
	import { hasAccountPrompt, signInButton } from '$lib/i18n/dictionaries/account';
	import {
		heading,
		languageHint,
		languagePickerLabel,
		pageDescription,
		pageTitle,
		subheading
	} from '$lib/i18n/dictionaries/home';

	let locale = $derived(getLocale());
	let signedIn = $derived(page.data.claims !== null);
	let signInHref = $derived(withLocale(locale, '/account'));
</script>

<Seo title={pageTitle} description={pageDescription} />

<PageShell>
	<div class="hero-mark" aria-hidden="true"><span class="am">Ա</span></div>
	<h1>{t(heading)}</h1>
	<p class="subheading">{t(subheading)}</p>

	<nav class="lang-list" aria-label={t(languagePickerLabel)}>
		{#each LOCALES as option (option)}
			<a
				class="lang-card"
				class:current={option === locale}
				href={withLocale(option, '/')}
				aria-current={option === locale ? 'page' : undefined}
				onclick={signedIn ? () => persistPreferredLocale(option) : undefined}
			>
				<span class="lang-flag" aria-hidden="true">{LOCALE_FLAGS[option]}</span>
				<span class="lang-copy">
					<span class="lang-name">{t(languageNames[option])}</span>
					<span class="lang-hint">{t(languageHint[option])}</span>
				</span>
			</a>
		{/each}
	</nav>

	<Button
		href={withLocale(locale, '/learn')}
		variant="primary"
		onclick={signedIn ? () => persistPreferredLocale(locale) : undefined}
	>
		{t(startLearning)}
		<svg
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2.75"
			stroke-linecap="round"
			stroke-linejoin="round"
			aria-hidden="true"
			width="16"
			height="16"
		>
			<path d="M5 12h14" />
			<path d="m12 5 7 7-7 7" />
		</svg>
	</Button>

	{#if !signedIn}
		<p class="signin-prompt">
			{t(hasAccountPrompt)}
			<a href={signInHref}>{t(signInButton)}</a>
		</p>
	{/if}
</PageShell>

<style>
	.hero-mark {
		display: grid;
		place-content: center;
		width: 5.5rem;
		height: 5.5rem;
		border-radius: 50%;
		background: var(--color-surface);
	}

	.hero-mark .am {
		font-family: var(--font-heading);
		font-size: 2.5rem;
		color: var(--color-accent-700);
	}

	.subheading {
		color: var(--color-text-secondary);
		font-size: var(--font-size-lg);
	}

	.lang-list {
		display: flex;
		width: 100%;
		max-width: 24rem;
		flex-direction: column;
		gap: var(--space-3);
	}

	.lang-card {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-3) var(--space-4);
		border-radius: var(--radius-lg);
		background: var(--color-surface);
		border: 1.5px solid transparent;
		text-decoration: none;
		color: var(--color-text-primary);
		text-align: left;
		transition:
			border-color var(--transition-fast),
			background-color var(--transition-fast),
			outline-color var(--transition-fast);
	}

	.lang-card:hover:not(.current) {
		background: var(--color-surface-hover);
	}

	.lang-card.current {
		border-color: var(--color-primary);
		cursor: default;
	}

	.lang-flag {
		display: grid;
		flex-shrink: 0;
		place-content: center;
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 50%;
		background: var(--color-background);
		font-size: 1.2rem;
	}

	.lang-copy {
		display: flex;
		min-width: 0;
		flex-direction: column;
	}

	.lang-name {
		font-family: var(--font-heading);
		font-weight: var(--font-heading-weight);
		font-size: 1.1rem;
	}

	.lang-hint {
		color: var(--color-text-secondary);
		font-size: var(--font-size-sm);
	}

	.signin-prompt {
		font-size: var(--font-size-sm);
		color: var(--color-text-secondary);
	}
</style>
