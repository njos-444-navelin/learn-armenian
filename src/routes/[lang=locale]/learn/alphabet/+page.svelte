<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import FloatingActionBar from '$lib/components/FloatingActionBar.svelte';
	import LetterList from '$lib/components/LetterList.svelte';
	import PageShell from '$lib/components/PageShell.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import { ALPHABET } from '$lib/content/alphabet';
	import { getLocale, t } from '$lib/i18n/current';
	import { withLocale } from '$lib/i18n/paths';
	import {
		aspirationTip,
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

	<LetterList letters={ALPHABET} />

	<FloatingActionBar>
		<Button href={withLocale(locale, '/learn/alphabet/quiz')} variant="primary">
			{t(startQuizLabel)}
		</Button>
	</FloatingActionBar>
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
</style>
