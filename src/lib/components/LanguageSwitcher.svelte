<script lang="ts">
	import { page } from '$app/state';
	import TopBubbleLink from './TopBubbleLink.svelte';
	import { LOCALE_FLAGS, LOCALES } from '$lib/i18n/locale';
	import { getLocale, t } from '$lib/i18n/current';
	import { switchToLanguageLabel } from '$lib/i18n/dictionaries/common';
	import { withLocale, withoutLocale } from '$lib/i18n/paths';

	let currentLocale = $derived(getLocale());
	let otherLocale = $derived(LOCALES.find((locale) => locale !== currentLocale));
	let targetHref = $derived(
		otherLocale !== undefined ? withLocale(otherLocale, withoutLocale(page.url.pathname)) : undefined
	);
</script>

{#if otherLocale !== undefined && targetHref !== undefined}
	<TopBubbleLink
		href={targetHref}
		ariaLabel={t(switchToLanguageLabel[otherLocale])}
		side="right"
		fullReload
	>
		<span aria-hidden="true">{LOCALE_FLAGS[otherLocale]}</span>
	</TopBubbleLink>
{/if}
