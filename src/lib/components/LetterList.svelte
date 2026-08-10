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
			<span class="glyphs" lang="hy">{letter.uppercase} {letter.lowercase}</span>
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
		padding: var(--space-3) var(--space-4);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
	}

	.glyphs {
		flex-shrink: 0;
		min-width: 4rem;
		font-size: var(--font-size-xl);
		font-weight: 700;
		white-space: nowrap;
	}

	.voicing {
		color: var(--color-text-secondary);
	}
</style>
