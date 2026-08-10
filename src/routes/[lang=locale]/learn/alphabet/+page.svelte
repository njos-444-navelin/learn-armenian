<script lang="ts">
	import Button from '$lib/components/Button.svelte';
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

	<ul class="letters">
		{#each ALPHABET as letter (letter.id)}
			<li>
				<span class="glyphs" lang="hy">{letter.uppercase} {letter.lowercase}</span>
				<span class="voicing">{t(letter.voicing)}</span>
			</li>
		{/each}
	</ul>

	<div class="actions">
		<Button href={withLocale(locale, '/learn/alphabet/quiz')} variant="primary">
			{t(startQuizLabel)}
		</Button>
		<Button href={withLocale(locale, '/learn')} variant="secondary">
			{t(backToMenuLabel)}
		</Button>
	</div>
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

	.letters {
		display: flex;
		width: 100%;
		flex-direction: column;
		gap: var(--space-2);
		margin: 0;
		padding: 0;
		list-style: none;
		text-align: left;
	}

	.letters li {
		display: flex;
		align-items: center;
		gap: var(--space-4);
		padding: var(--space-3) var(--space-4);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
	}

	.glyphs {
		flex-shrink: 0;
		width: 4rem;
		font-size: var(--font-size-xl);
		font-weight: 700;
	}

	.voicing {
		color: var(--color-text-secondary);
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-3);
		justify-content: center;
	}
</style>
