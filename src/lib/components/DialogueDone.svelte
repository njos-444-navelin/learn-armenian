<script lang="ts">
	import type { Dialogue, DialogueSummary } from '$lib/content/dialogues/types';
	import { getLocale, t } from '$lib/i18n/current';
	import { withLocale, withLocaleDialogue } from '$lib/i18n/paths';
	import {
		backToDialoguesLabel,
		doneHeadingAriaLabel,
		linesHeardLabel,
		nextDialogueLabel,
		noTappedWordsMessage,
		playAgainLabel,
		tappedWordsHeading
	} from '$lib/i18n/dictionaries/dialogues';
	import Button from './Button.svelte';
	import type { TappedWord } from './DialoguePlayer.svelte';

	interface Props {
		dialogue: Dialogue;
		next: DialogueSummary | undefined;
		tapped: readonly TappedWord[];
		onReplay: () => void;
	}

	let { dialogue, next, tapped, onReplay }: Props = $props();
	let locale = $derived(getLocale());
</script>

<div class="done">
	<span class="check" role="img" aria-label={t(doneHeadingAriaLabel)}>
		<svg
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2.75"
			stroke-linecap="round"
			stroke-linejoin="round"
			aria-hidden="true"
			width="30"
			height="30"
		>
			<path d="M20 6 9 17l-5-5" />
		</svg>
	</span>

	<div class="copy">
		<h1 lang="hy">{dialogue.title}</h1>
		<p class="sub">{t(linesHeardLabel(dialogue.lines.length))}</p>
	</div>

	<section class="recap">
		<h2>{t(tappedWordsHeading)}</h2>
		{#if tapped.length === 0}
			<p class="none">{t(noTappedWordsMessage)}</p>
		{:else}
			<ul class="chips">
				{#each tapped as word (word.wordId)}
					<li class="chip">
						<span class="chip-armenian" lang="hy">{word.armenian}</span>
						<span class="chip-gloss">{word.gloss}</span>
					</li>
				{/each}
			</ul>
		{/if}
	</section>

	<div class="actions">
		{#if next !== undefined}
			<Button href={withLocaleDialogue(locale, next.id)} variant="primary">
				<span lang="hy">{t(nextDialogueLabel(next.title))}</span>
			</Button>
		{/if}
		<Button type="button" variant="secondary" onclick={onReplay}>{t(playAgainLabel)}</Button>
		<a class="back-link" href={withLocale(locale, '/learn/dialogues')}>{t(backToDialoguesLabel)}</a>
	</div>
</div>

<style>
	.done {
		display: flex;
		width: 100%;
		flex-direction: column;
		align-items: flex-start;
		gap: var(--space-4);
		text-align: left;
		animation: done-in 200ms ease both;
	}

	@keyframes done-in {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	.check {
		display: grid;
		place-content: center;
		width: 4.25rem;
		height: 4.25rem;
		border-radius: 50%;
		background: var(--color-accent-2-200);
		color: var(--color-accent-2-800);
	}

	.copy {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.sub {
		color: var(--color-text-secondary);
	}

	.recap {
		display: flex;
		width: 100%;
		flex-direction: column;
		gap: var(--space-3);
		padding: var(--space-5);
		border-radius: var(--radius-lg);
		background: var(--color-surface);
	}

	.recap h2 {
		font-family: var(--font-family-body);
		font-weight: 400;
		font-size: 0.7rem;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--color-accent-700);
	}

	.none {
		font-size: var(--font-size-sm);
		color: var(--color-text-secondary);
	}

	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.chip {
		display: flex;
		align-items: baseline;
		gap: 6px;
		padding: 4px 11px;
		border-radius: var(--radius-pill);
		background: var(--color-background);
		font-size: var(--font-size-sm);
	}

	.chip-armenian {
		font-family: var(--font-heading);
		font-weight: var(--font-heading-weight);
	}

	.chip-gloss {
		color: var(--color-text-secondary);
	}

	/* Stacked full-width buttons — align-items defaults to stretch, which is
	   what gives each <Button> the column's full width. */
	.actions {
		display: flex;
		width: 100%;
		flex-direction: column;
		gap: var(--space-2);
	}

	.back-link {
		align-self: center;
		min-height: var(--tap-target-min);
		display: inline-flex;
		align-items: center;
		padding: 0 var(--space-3);
		font-size: var(--font-size-sm);
	}
</style>
