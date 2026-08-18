<script lang="ts">
	import { page } from '$app/state';
	import TopBubbleLink from './TopBubbleLink.svelte';
	import { back } from '$lib/i18n/dictionaries/common';
	import { getLocale, t } from '$lib/i18n/current';
	import { parentPath, withLocale, withoutLocale } from '$lib/i18n/paths';

	let locale = $derived(getLocale());
	let pathname = $derived(withoutLocale(page.url.pathname));
	let parent = $derived(parentPath(pathname));
	let signedIn = $derived(page.data.claims !== null);
	/**
	 * A signed-in user landing on `/` gets bounced straight back to
	 * `/learn` (see `[lang=locale]/+page.server.ts`) once they have a
	 * saved locale preference — which, in practice, is true by the time
	 * they've reached `/learn` at all. So "back" from `/learn` would just
	 * round-trip to the same page with no visible effect; hide it instead.
	 */
	let backBounces = $derived(signedIn && pathname === '/learn');
	let backHref = $derived(
		parent !== undefined && !backBounces ? withLocale(locale, parent) : undefined
	);
</script>

{#if backHref !== undefined}
	<TopBubbleLink href={backHref} ariaLabel={t(back)} side="left">
		<svg
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2.75"
			stroke-linecap="round"
			stroke-linejoin="round"
			aria-hidden="true"
			width="18"
			height="18"
		>
			<path d="m15 18-6-6 6-6" />
		</svg>
	</TopBubbleLink>
{/if}
