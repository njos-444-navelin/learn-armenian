<script lang="ts">
	import SpeakerButton from './SpeakerButton.svelte';
	import { wordAudioSrc } from '$lib/content/words/audio';
	import type { Word } from '$lib/content/words/types';
	import { registerLabels } from '$lib/i18n/dictionaries/vocabulary';
	import { t } from '$lib/i18n/current';

	interface Props {
		words: readonly Word[];
	}

	let { words }: Props = $props();
</script>

<ul class="words">
	{#each words as word (word.id)}
		<li>
			<div class="info">
				<div class="row">
					<span class="armenian" lang="hy">{word.armenian}</span>
					<span class="translation">{t(word.translation)}</span>
					{#if word.register !== undefined}
						<em class="register">{t(registerLabels[word.register])}</em>
					{/if}
				</div>
				{#if word.note !== undefined}
					<p class="note">{t(word.note)}</p>
				{/if}
			</div>
			<SpeakerButton src={wordAudioSrc(word.id)} />
		</li>
	{/each}
</ul>

<style>
	.words {
		display: flex;
		width: 100%;
		flex-direction: column;
		gap: var(--space-2);
		margin: 0;
		padding: 0;
		list-style: none;
		text-align: left;
	}

	.words li {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		/* Tighter on the trailing edge, where the speaker button already
		   supplies its own padding — see docs/DESIGN.md's padding-vs-radius
		   note for why the leading edge (no button to share space with)
		   still needs the full var(--space-4). */
		padding: var(--space-3) var(--space-3) var(--space-3) var(--space-4);
		border-radius: var(--radius-lg);
		background: var(--color-surface);
	}

	.info {
		display: flex;
		min-width: 0;
		flex: 1;
		flex-direction: column;
		gap: 0.1rem;
	}

	.row {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: var(--space-2);
	}

	.armenian {
		font-size: var(--font-size-lg);
		font-weight: 700;
	}

	.translation {
		color: var(--color-text-secondary);
	}

	.register {
		color: var(--color-text-secondary);
		font-size: var(--font-size-sm);
		font-style: italic;
	}

	.note {
		margin: 0;
		color: var(--color-text-secondary);
		font-size: var(--font-size-sm);
	}
</style>
