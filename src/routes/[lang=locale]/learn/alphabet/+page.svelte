<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import LetterList from '$lib/components/LetterList.svelte';
	import PageShell from '$lib/components/PageShell.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import { ALPHABET } from '$lib/content/alphabet';
	import { getLocale, t } from '$lib/i18n/current';
	import { withLocale } from '$lib/i18n/paths';
	import {
		aspirationTip,
		backToMenuLabel,
		heading,
		intro,
		pageDescription,
		pageTitle,
		startQuizLabel
	} from '$lib/i18n/dictionaries/alphabetStudy';

	let locale = $derived(getLocale());
	// Reasonable single-row guess for the first paint; corrected the instant the
	// real bar mounts and reports its height, so the spacer below is never a guess.
	let barHeight = $state(72);
</script>

<Seo title={pageTitle} description={pageDescription} />

<PageShell>
	<h1>{t(heading)}</h1>
	<p class="intro">{t(intro)}</p>
	<p class="tip">{t(aspirationTip)}</p>

	<div class="quick-actions" bind:clientHeight={barHeight}>
		<Button href={withLocale(locale, '/learn/alphabet/quiz')} variant="primary">
			{t(startQuizLabel)}
		</Button>
		<Button href={withLocale(locale, '/learn')} variant="secondary">
			{t(backToMenuLabel)}
		</Button>
	</div>

	<LetterList letters={ALPHABET} />

	<div class="bottom-spacer" style="height: {barHeight + 24}px" aria-hidden="true"></div>
</PageShell>

<style>
	.intro {
		color: var(--color-text-secondary);
		font-size: var(--font-size-lg);
	}

	.tip {
		color: var(--color-text-secondary);
		font-size: var(--font-size-sm);
		padding: var(--space-3) var(--space-4);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface);
	}

	.quick-actions {
		position: fixed;
		left: var(--space-4);
		right: var(--space-4);
		bottom: calc(var(--space-4) + env(safe-area-inset-bottom));
		max-width: var(--measure);
		margin-inline: auto;
		display: flex;
		gap: var(--space-2);
		padding: var(--space-2);
		background: var(--color-background);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-sm);
		z-index: 10;
	}

	.quick-actions :global(.button) {
		flex: 1;
	}

	.bottom-spacer {
		width: 100%;
	}
</style>
