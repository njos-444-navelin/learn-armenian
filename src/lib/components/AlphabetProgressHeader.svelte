<script lang="ts">
	import { t } from '$lib/i18n/current';
	import { stepCounterLabel } from '$lib/i18n/dictionaries/alphabetTrainer';
	import type { Translated } from '$lib/i18n/types';

	/** 'filled' and 'current' are deliberately two different colors (see
	 * .dot.filled/.dot.current below) — a caller with no "already done vs.
	 * currently on" distinction to make (the learn step) just never emits
	 * 'filled', using 'current' alone for every dot up to and including the
	 * active one. A caller that does have that distinction (the drill,
	 * where "done" and "the question you're on" are genuinely different
	 * states) uses all three. */
	export type DotState = 'filled' | 'current' | 'empty';

	interface Props {
		sectionLabel: Translated;
		index: number;
		total: number;
		dotStates: readonly DotState[];
	}

	let { sectionLabel, index, total, dotStates }: Props = $props();
</script>

<div class="header">
	<div class="header-row">
		<span class="section-label">{t(sectionLabel)}</span>
		<span class="counter">{t(stepCounterLabel(index + 1, total))}</span>
	</div>
	<div class="dots">
		{#each dotStates as state, n (n)}
			<div class="dot" class:filled={state === 'filled'} class:current={state === 'current'}></div>
		{/each}
	</div>
</div>

<style>
	.header {
		display: flex;
		width: 100%;
		flex-direction: column;
		gap: var(--space-2);
	}

	.header-row {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		font-size: var(--font-size-sm);
	}

	.section-label {
		font-weight: 700;
		color: var(--color-text-secondary);
	}

	.counter {
		color: var(--color-text-secondary);
	}

	.dots {
		display: flex;
		gap: var(--space-1);
	}

	.dot {
		height: 5px;
		flex: 1;
		border-radius: var(--radius-pill);
		background: var(--color-neutral-300);
	}

	.dot.filled {
		background: var(--color-accent-2-500);
	}

	.dot.current {
		background: var(--color-primary);
	}
</style>
