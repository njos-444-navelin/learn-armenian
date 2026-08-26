<script lang="ts">
	import { page } from '$app/state';
	import { DEFAULT_LOCALE, LOCALES } from '$lib/i18n/locale';
	import { t } from '$lib/i18n/current';
	import { resolveRuntimePath, withoutLocale } from '$lib/i18n/paths';
	import type { Translated } from '$lib/i18n/types';

	interface Props {
		title: Translated;
		description: Translated;
	}

	let { title, description }: Props = $props();

	let path = $derived(withoutLocale(page.url.pathname));
	let canonicalHref = $derived(page.url.origin + page.url.pathname);
</script>

<svelte:head>
	<title>{t(title)}</title>
	<meta name="description" content={t(description)} />
	<link rel="canonical" href={canonicalHref} />
	{#each LOCALES as locale (locale)}
		<link
			rel="alternate"
			hreflang={locale}
			href={page.url.origin + resolveRuntimePath(locale, path)}
		/>
	{/each}
	<link
		rel="alternate"
		hreflang="x-default"
		href={page.url.origin + resolveRuntimePath(DEFAULT_LOCALE, path)}
	/>
</svelte:head>
