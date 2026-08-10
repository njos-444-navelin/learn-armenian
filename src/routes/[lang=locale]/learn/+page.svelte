<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import PageShell from '$lib/components/PageShell.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import { getLocale, t } from '$lib/i18n/current';
	import { withLocale } from '$lib/i18n/paths';
	import {
		alphabetTrainerLabel,
		heading,
		menuAriaLabel,
		moreToComeLabel,
		pageDescription,
		pageTitle
	} from '$lib/i18n/dictionaries/learn';

	let locale = $derived(getLocale());
</script>

<Seo title={pageTitle} description={pageDescription} />

<PageShell>
	<h1>{t(heading)}</h1>

	<nav aria-label={t(menuAriaLabel)}>
		<Button href={withLocale(locale, '/learn/alphabet')} variant="primary">
			{t(alphabetTrainerLabel)}
		</Button>
		<Button variant="secondary" disabled>
			{t(moreToComeLabel)}
		</Button>
	</nav>
</PageShell>

<style>
	nav {
		display: flex;
		width: 100%;
		flex-direction: column;
		align-items: stretch;
		gap: var(--space-3);
	}
</style>
