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
</script>

<Seo title={pageTitle} description={pageDescription} />

<PageShell>
	<h1>{t(heading)}</h1>
	<p class="intro">{t(intro)}</p>
	<p class="tip">{t(aspirationTip)}</p>

	<div class="quick-actions">
		<Button href={withLocale(locale, '/learn/alphabet/quiz')} variant="primary">
			{t(startQuizLabel)}
		</Button>
		<Button href={withLocale(locale, '/learn')} variant="secondary">
			{t(backToMenuLabel)}
		</Button>
	</div>

	<LetterList letters={ALPHABET} />

	<div class="bottom-spacer" aria-hidden="true"></div>
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
		left: 50%;
		bottom: calc(var(--space-4) + env(safe-area-inset-bottom));
		transform: translateX(-50%);
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: var(--space-2);
		max-width: calc(100vw - var(--space-4) * 2);
		padding: var(--space-2);
		background: var(--color-background);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-sm);
		z-index: 10;
	}

	.bottom-spacer {
		width: 100%;
		height: 5rem;
	}
</style>
