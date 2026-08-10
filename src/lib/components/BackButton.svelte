<script lang="ts">
	import { page } from '$app/state';
	import TopBubbleLink from './TopBubbleLink.svelte';
	import { back } from '$lib/i18n/dictionaries/common';
	import { getLocale, t } from '$lib/i18n/current';
	import { parentPath, withLocale, withoutLocale } from '$lib/i18n/paths';

	let locale = $derived(getLocale());
	let parent = $derived(parentPath(withoutLocale(page.url.pathname)));
	let backHref = $derived(parent !== undefined ? withLocale(locale, parent) : undefined);
</script>

{#if backHref !== undefined}
	<TopBubbleLink href={backHref} ariaLabel={t(back)} side="left">
		<span aria-hidden="true">←</span>
	</TopBubbleLink>
{/if}
