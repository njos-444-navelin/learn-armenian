<script lang="ts">
	import SpeakerButton from './SpeakerButton.svelte';
	import { wordAudioSrc } from '$lib/content/vocabulary/audio';
	import type { VocabularyWord } from '$lib/content/vocabulary/types';
	import { registerLabels } from '$lib/i18n/dictionaries/vocabulary';
	import { t } from '$lib/i18n/current';

	interface Props {
		deckId: string;
		words: readonly VocabularyWord[];
	}

	let { deckId, words }: Props = $props();
</script>

<ul class="words">
	{#each words as word (word.id)}
		<li>
			<div class="row">
				<span class="armenian-group">
					<span class="armenian" lang="hy">{word.armenian}</span>
					<SpeakerButton src={wordAudioSrc(deckId, word.id)} />
				</span>
				<span class="translation">
					{t(word.translation)}
					{#if word.register !== undefined}
						<em class="register">{t(registerLabels[word.register])}</em>
					{/if}
				</span>
			</div>
			{#if word.note !== undefined}
				<p class="note">{t(word.note)}</p>
			{/if}
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
		padding: var(--space-3) var(--space-4);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
	}

	.row {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: var(--space-3);
	}

	.armenian-group {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
	}

	.armenian {
		font-size: var(--font-size-lg);
		font-weight: 700;
	}

	.translation {
		color: var(--color-text-secondary);
	}

	.register {
		margin-inline-start: var(--space-1);
		color: var(--color-text-secondary);
		font-size: var(--font-size-sm);
		font-style: italic;
	}

	.note {
		margin: var(--space-1) 0 0;
		color: var(--color-text-secondary);
		font-size: var(--font-size-sm);
	}
</style>
