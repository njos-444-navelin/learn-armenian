<script lang="ts">
	import { page } from '$app/state';
	import TopBubbleLink from './TopBubbleLink.svelte';
	import { LOCALE_FLAGS, LOCALES } from '$lib/i18n/locale';
	import { getLocale, t } from '$lib/i18n/current';
	import { withLocale, withoutLocale } from '$lib/i18n/paths';
	import { persistPreferredLocale } from '$lib/i18n/persistPreferredLocale';
	import {
		account,
		switchLanguage,
		switchToLanguageLabel,
		userMenuLabel
	} from '$lib/i18n/dictionaries/common';
	import {
		trainVocabularyMenuLabel,
		wordsToPracticeHint
	} from '$lib/i18n/dictionaries/vocabularyTraining';

	let open = $state(false);

	let currentLocale = $derived(getLocale());
	let otherLocale = $derived(LOCALES.find((locale) => locale !== currentLocale));
	let switchHref = $derived(
		otherLocale !== undefined
			? withLocale(otherLocale, withoutLocale(page.url.pathname))
			: undefined
	);
	let accountHref = $derived(withLocale(currentLocale, '/account'));
	let trainVocabularyHref = $derived(withLocale(currentLocale, '/learn/vocabulary/train'));
	let signedIn = $derived(page.data.claims !== null);
	let hasWordsToPractice = $derived(signedIn && page.data.hasWordsToPractice === true);
	let userMenuAriaLabel = $derived(
		hasWordsToPractice ? `${t(userMenuLabel)}: ${t(wordsToPracticeHint)}` : t(userMenuLabel)
	);

	function close() {
		open = false;
	}
</script>

<TopBubbleLink
	ariaLabel={userMenuAriaLabel}
	side="right"
	badge={hasWordsToPractice}
	onclick={() => (open = !open)}
	ariaExpanded={open}
	ariaControls="user-menu-panel"
>
	{#if signedIn}
		<svg
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
			aria-hidden="true"
			width="20"
			height="20"
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
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
			aria-hidden="true"
			width="20"
			height="20"
		>
			<path d="M11 3H5a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h6" />
			<path d="M15 12h8" />
			<path d="M19 8l4 4-4 4" />
		</svg>
	{/if}
</TopBubbleLink>

{#if open}
	<div class="backdrop" onclick={close} aria-hidden="true"></div>
	<div class="panel" id="user-menu-panel">
		{#if otherLocale !== undefined && switchHref !== undefined}
			<a
				href={switchHref}
				aria-label={t(switchToLanguageLabel[otherLocale])}
				onclick={signedIn ? () => persistPreferredLocale(otherLocale) : undefined}
			>
				{t(switchLanguage)}
				<span aria-hidden="true">{LOCALE_FLAGS[currentLocale]}/{LOCALE_FLAGS[otherLocale]}</span>
			</a>
		{/if}
		{#if signedIn}
			<a href={trainVocabularyHref} onclick={close}>
				<span class="label">
					{t(trainVocabularyMenuLabel)}
					{#if hasWordsToPractice}
						<span class="badge-dot" aria-hidden="true"></span>
					{/if}
				</span>
				{#if hasWordsToPractice}
					<span class="sr-only">{t(wordsToPracticeHint)}</span>
				{/if}
			</a>
		{/if}
		<a href={accountHref} onclick={close}>{t(account)}</a>
	</div>
{/if}

<svelte:window
	onkeydown={(event) => {
		if (open && event.key === 'Escape') close();
	}}
/>

<style>
	.backdrop {
		position: fixed;
		inset: 0;
		z-index: 25;
	}

	.panel {
		position: fixed;
		top: calc(
			var(--space-4) + env(safe-area-inset-top) + var(--tap-target-min) + var(--space-2)
		);
		right: calc(var(--space-4) + env(safe-area-inset-right));
		z-index: 30;
		display: flex;
		flex-direction: column;
		min-width: 12rem;
		max-width: calc(100vw - 2 * var(--space-4));
		background: var(--color-background);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		box-shadow: var(--shadow-md);
		overflow: hidden;
	}

	.panel a {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		min-height: var(--tap-target-min);
		padding: var(--space-3) var(--space-4);
		color: var(--color-text-primary);
		text-decoration: none;
	}

	.panel a:hover {
		background: var(--color-surface);
	}

	.label {
		position: relative;
	}

	.badge-dot {
		position: absolute;
		top: 0.075rem;
		right: -0.75rem;
		width: 0.375rem;
		height: 0.375rem;
		border-radius: 50%;
		background: var(--color-notification);
	}
</style>
