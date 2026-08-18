<script lang="ts">
	import { page } from '$app/state';
	import TopBubbleLink from './TopBubbleLink.svelte';
	import { getLocale, t } from '$lib/i18n/current';
	import { withLocale } from '$lib/i18n/paths';
	import { account } from '$lib/i18n/dictionaries/common';
	import { wordsToPracticeHint } from '$lib/i18n/dictionaries/vocabularyTraining';

	let currentLocale = $derived(getLocale());
	let accountHref = $derived(withLocale(currentLocale, '/account'));
	let trainVocabularyHref = $derived(withLocale(currentLocale, '/learn/vocabulary/train'));
	let signedIn = $derived(page.data.claims !== null);
	/**
	 * Suppressed on the training page itself — the badge exists to point
	 * someone toward that page, so it has nothing left to say once they're
	 * already there. Scoped to this one signal rather than "hide the badge
	 * on this page" in general: a future notification reason unrelated to
	 * training (see `page.data.hasWordsToPractice`'s doc comment) should
	 * still show here.
	 */
	let onTrainPage = $derived(page.url.pathname === trainVocabularyHref);
	let onAccountPage = $derived(page.url.pathname === accountHref);
	let hasWordsToPractice = $derived(
		signedIn && page.data.hasWordsToPractice === true && !onTrainPage
	);
	let accountLinkAriaLabel = $derived(
		hasWordsToPractice ? `${t(account)}: ${t(wordsToPracticeHint)}` : t(account)
	);
</script>

{#if !onAccountPage}
	<TopBubbleLink ariaLabel={accountLinkAriaLabel} side="right" badge={hasWordsToPractice} href={accountHref}>
		{#if signedIn}
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
				<circle cx="12" cy="12" r="10" />
				<circle cx="12" cy="10" r="3" />
				<path d="M6.5 19a6 6 0 0 1 11 0" />
			</svg>
		{:else}
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
				<path d="M11 3H5a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h6" />
				<path d="M15 12h8" />
				<path d="M19 8l4 4-4 4" />
			</svg>
		{/if}
	</TopBubbleLink>
{/if}
