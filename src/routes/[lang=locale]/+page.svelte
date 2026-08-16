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
	import {
		heading,
		languagePickerLabel,
		pageDescription,
		pageTitle,
		subheading
	} from '$lib/i18n/dictionaries/home';

	let locale = $derived(getLocale());
	let signedIn = $derived(page.data.claims !== null);
</script>

<Seo title={pageTitle} description={pageDescription} />

<PageShell>
	<h1>{t(heading)}</h1>
	<p class="subheading">{t(subheading)}</p>

	<nav aria-label={t(languagePickerLabel)}>
		{#each LOCALES as option (option)}
			<Button
				href={withLocale(option, '/')}
				variant={option === locale ? 'primary' : 'secondary'}
				ariaCurrent={option === locale ? 'page' : undefined}
				onclick={signedIn ? () => persistPreferredLocale(option) : undefined}
			>
				<span aria-hidden="true">{LOCALE_FLAGS[option]}</span>
				{t(languageNames[option])}
			</Button>
		{/each}
	</nav>

	<Button
		href={withLocale(locale, '/learn')}
		variant="primary"
		onclick={signedIn ? () => persistPreferredLocale(locale) : undefined}
	>
		{t(startLearning)}
	</Button>
</PageShell>

<style>
	.subheading {
		color: var(--color-text-secondary);
		font-size: var(--font-size-lg);
	}

	nav {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-3);
		justify-content: center;
	}
</style>
