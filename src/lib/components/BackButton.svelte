<script lang="ts">
	import { page } from '$app/state';
	import TopBubbleLink from './TopBubbleLink.svelte';
	import { back, closeLabel } from '$lib/i18n/dictionaries/common';
	import { getLocale, t } from '$lib/i18n/current';
	import { parentPath, resolveRuntimePath, withoutLocale } from '$lib/i18n/paths';
	import { topLeftActionState } from '$lib/stores/topLeftAction.svelte';

	let locale = $derived(getLocale());
	let pathname = $derived(withoutLocale(page.url.pathname));
	let parent = $derived(parentPath(pathname));
	let signedIn = $derived(page.data.claims !== null);
	/** "Back" from `/learn` would round-trip: a signed-in user landing on `/` is
	 * bounced straight to `/learn` once they have a saved locale preference. */
	let backBounces = $derived(signedIn && pathname === '/learn');
	let backHref = $derived(
		parent !== undefined && !backBounces ? resolveRuntimePath(locale, parent) : undefined
	);
</script>

{#if topLeftActionState.onClose !== null}
	<TopBubbleLink onclick={topLeftActionState.onClose} ariaLabel={t(closeLabel)} side="left">
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
			<path d="M6 6l12 12M18 6L6 18" />
		</svg>
	</TopBubbleLink>
{:else if backHref !== undefined}
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
