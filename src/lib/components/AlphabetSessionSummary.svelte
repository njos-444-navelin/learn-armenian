<script lang="ts">
	import type { AlphabetLetter } from '$lib/content/alphabet';
	import { LEVEL_MAX } from '$lib/alphabet/mastery';
	import { t } from '$lib/i18n/current';
	import {
		backToAlphabetLabel,
		levelBadgeLabel,
		practiceAgainLabel,
		summaryHeading,
		summaryNote
	} from '$lib/i18n/dictionaries/alphabetTrainer';
	import Button from './Button.svelte';
	import FloatingActionBar from './FloatingActionBar.svelte';

	export interface SummaryRow {
		letter: AlphabetLetter;
		before: number;
		after: number;
	}

	interface Props {
		rows: readonly SummaryRow[];
		onBackHome: () => void;
		onPracticeAgain: () => void;
	}

	let { rows, onBackHome, onPracticeAgain }: Props = $props();

	let upCount = $derived(rows.filter((row) => row.after > row.before).length);
	let downCount = $derived(rows.filter((row) => row.after < row.before).length);

	function pairLabel(letter: AlphabetLetter): string {
		return letter.uppercase === undefined ? letter.lowercase : `${letter.uppercase} ${letter.lowercase}`;
	}
</script>

<h1>{t(summaryHeading(upCount))}</h1>

<ul class="rows">
	{#each rows as row (row.letter.id)}
		{@const gained = row.after > row.before}
		<li class="row">
			<span lang="hy" class="pair">{pairLabel(row.letter)}</span>
			<div class="pips">
				{#each { length: LEVEL_MAX } as _, n (n)}
					<div class="pip" class:filled={n < row.after}></div>
				{/each}
			</div>
			<span class="badge" class:up={gained} class:down={!gained}>{t(levelBadgeLabel(row.after))}</span>
		</li>
	{/each}
</ul>

<p class="note">{t(summaryNote(downCount))}</p>

<FloatingActionBar bare>
	<div class="actions">
		<Button type="button" variant="primary" onclick={onBackHome}>{t(backToAlphabetLabel)}</Button>
		<Button type="button" variant="secondary" opaque onclick={onPracticeAgain}>{t(practiceAgainLabel)}</Button>
	</div>
</FloatingActionBar>

<style>
	h1 {
		margin: 0;
	}

	.rows {
		display: flex;
		width: 100%;
		flex-direction: column;
		gap: var(--space-2);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.row {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-3) var(--space-4);
		border-radius: var(--radius-lg);
		background: var(--color-surface);
	}

	.pair {
		flex: none;
		font-family: var(--font-heading);
		font-weight: var(--font-heading-weight);
		font-size: 1.3rem;
		color: var(--color-accent-800);
	}

	.pips {
		display: flex;
		flex: 1;
		gap: 2px;
	}

	.pip {
		height: 6px;
		flex: 1;
		border-radius: var(--radius-pill);
		background: var(--color-neutral-300);
	}

	.pip.filled {
		background: var(--color-accent-2-500);
	}

	.badge {
		flex: none;
		padding: 4px var(--space-2);
		border-radius: var(--radius-pill);
		font-size: 0.75rem;
		white-space: nowrap;
	}

	.badge.up {
		background: var(--color-accent-2-200);
		color: var(--color-accent-2-800);
	}

	.badge.down {
		background: var(--color-error-surface);
		color: var(--color-on-error-surface);
	}

	.note {
		margin: 0;
		color: var(--color-text-secondary);
	}

	/* No align-items set — the default `stretch` is what makes each
	   <Button> below span the row's full width; unlike a row-direction
	   flex parent, `flex: 1` (from FloatingActionBar's `.bar
	   :global(.button)` rule) grows main-axis (vertical) size here, not
	   width, so stretch is doing the actual work. */
	.actions {
		display: flex;
		width: 100%;
		flex-direction: column;
		gap: var(--space-2);
	}
</style>
