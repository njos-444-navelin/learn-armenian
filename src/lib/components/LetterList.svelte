<script lang="ts">
	import type { AlphabetLetter } from '$lib/content/alphabet';
	import { t } from '$lib/i18n/current';

	interface Props {
		letters: readonly AlphabetLetter[];
	}

	let { letters }: Props = $props();
</script>

<ul class="letters">
	{#each letters as letter (letter.id)}
		<li>
			<span class="glyph-badge" lang="hy"
				>{letter.uppercase === undefined ? letter.lowercase : `${letter.uppercase} ${letter.lowercase}`}</span
			>
			<span class="voicing">{t(letter.voicing)}</span>
		</li>
	{/each}
</ul>

<style>
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
		padding: var(--space-2) var(--space-4);
		border-radius: var(--radius-lg);
		background: var(--color-surface);
	}

	.glyph-badge {
		display: inline-flex;
		flex-shrink: 0;
		align-items: center;
		justify-content: center;
		min-width: 3.5rem;
		height: 3.25rem;
		padding: 0 var(--space-2);
		border-radius: var(--radius-pill);
		background: var(--color-background);
		color: var(--color-accent-800);
		font-family: var(--font-heading);
		font-weight: var(--font-heading-weight);
		font-size: 1.25rem;
		white-space: nowrap;
	}

	.voicing {
		color: var(--color-text-secondary);
	}
</style>
