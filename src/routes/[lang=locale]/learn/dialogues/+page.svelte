<script lang="ts">
	import PageShell from '$lib/components/PageShell.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import { getLocale, t } from '$lib/i18n/current';
	import { withLocaleDialogue } from '$lib/i18n/paths';
	import {
		completedBadgeLabel,
		dialogueMetaLabel,
		heading,
		intro,
		listAriaLabel,
		moreOnTheWayLabel,
		pageDescription,
		pageTitle
	} from '$lib/i18n/dictionaries/dialogues';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let locale = $derived(getLocale());
	let completedIds = $derived(new Set(data.completedIds));
</script>

<Seo title={pageTitle} description={pageDescription} />

<PageShell>
	<div class="head">
		<h1>{t(heading)}</h1>
		<p class="intro">{t(intro)}</p>
	</div>

	<nav class="list" aria-label={t(listAriaLabel)}>
		<ul>
			{#each data.dialogues as dialogue, index (dialogue.id)}
				{@const done = completedIds.has(dialogue.id)}
				<li>
					<a class="card" href={withLocaleDialogue(locale, dialogue.id)}>
						<span class="number">
							{index + 1}
							{#if done}
								<span class="done-mark" role="img" aria-label={t(completedBadgeLabel)}>
									<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" width="13" height="13">
										<path d="M20 6 9 17l-5-5" />
									</svg>
								</span>
							{/if}
						</span>
						<span class="info">
							<span class="title">{t(dialogue.titleTranslation)}</span>
							<span class="title-hy" lang="hy">{dialogue.title}</span>
							<span class="meta">{t(dialogueMetaLabel(dialogue.durationMinutes, dialogue.ruleLabel))}</span>
						</span>
					</a>
				</li>
			{/each}
		</ul>
		<p class="more">{t(moreOnTheWayLabel)}</p>
	</nav>
</PageShell>

<style>
	.head {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-2);
	}

	.intro {
		max-width: 30ch;
		color: var(--color-text-secondary);
	}

	.list {
		display: flex;
		width: 100%;
		max-width: 26rem;
		flex-direction: column;
		gap: var(--space-3);
	}

	ul {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.card {
		display: flex;
		align-items: center;
		gap: var(--space-4);
		padding: var(--space-4);
		border-radius: var(--radius-lg);
		background: var(--color-surface);
		color: var(--color-text-primary);
		text-decoration: none;
		text-align: left;
		transition: background-color var(--transition-fast);
	}

	.card:hover {
		background: var(--color-surface-hover);
	}

	.number {
		position: relative;
		display: grid;
		flex: none;
		place-content: center;
		width: 3.25rem;
		height: 3.25rem;
		border-radius: 50%;
		background: var(--color-background);
		color: var(--color-accent-700);
		font-family: var(--font-heading);
		font-weight: var(--font-heading-weight);
		font-size: 1.05rem;
	}

	.done-mark {
		position: absolute;
		right: -2px;
		bottom: -2px;
		display: grid;
		place-content: center;
		width: 1.375rem;
		height: 1.375rem;
		border-radius: 50%;
		background: var(--color-success);
		color: var(--color-on-success);
	}

	.info {
		display: flex;
		min-width: 0;
		flex: 1;
		flex-direction: column;
		gap: 0.15rem;
	}

	.title {
		font-family: var(--font-heading);
		font-weight: var(--font-heading-weight);
		font-size: 1.15rem;
	}

	.title-hy {
		font-size: var(--font-size-sm);
		color: var(--color-text-secondary);
	}

	.meta {
		align-self: flex-start;
		margin-top: var(--space-1);
		font-size: 0.75rem;
		color: var(--color-text-secondary);
	}

	.more {
		margin: var(--space-2) 0 0;
		color: var(--color-text-secondary);
		font-size: var(--font-size-sm);
		text-align: center;
	}
</style>
