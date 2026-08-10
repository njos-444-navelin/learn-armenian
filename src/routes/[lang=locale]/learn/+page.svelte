<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import PageShell from '$lib/components/PageShell.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import { getLocale, t } from '$lib/i18n/current';
	import { withLocale } from '$lib/i18n/paths';
	import { back } from '$lib/i18n/dictionaries/common';
	import { body, heading, pageDescription, pageTitle } from '$lib/i18n/dictionaries/learn';

	let locale = $derived(getLocale());
</script>

<Seo title={pageTitle} description={pageDescription} />

<PageShell>
	<h1>{t(heading)}</h1>
	<p class="body">{t(body)}</p>

	<Button href={withLocale(locale, '/')} variant="secondary">
		{t(back)}
	</Button>
</PageShell>

<style>
	.body {
		color: var(--color-text-secondary);
		font-size: var(--font-size-lg);
	}
</style>
