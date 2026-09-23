<script lang="ts">
	import { cubicOut } from 'svelte/easing';
	import type { TransitionConfig } from 'svelte/transition';
	import { browser } from '$app/environment';
	import type { DialogueToken } from '$lib/content/dialogues/types';
	import { wordAudioSrc } from '$lib/content/words/audio';
	import type { Word } from '$lib/content/words/types';
	import { t, tPartial } from '$lib/i18n/current';
	import { wordBaseFormLabel, wordHereLabel } from '$lib/i18n/dictionaries/dialogues';
	import { registerLabels } from '$lib/i18n/dictionaries/vocabulary';
	import SpeakerButton from './SpeakerButton.svelte';

	interface Props {
		token: DialogueToken;
		/** The library word `token.wordId` resolves to — the popover's base
		 * form, fallback translation/note, and the one clip it plays. */
		word: Word;
	}

	let { token, word }: Props = $props();

	let gloss = $derived(token.gloss ?? word.translation);

	/** Punctuation and intonation marks stripped, lowercased, և expanded (the
	 * library capitalizes it as Եվ). */
	function bare(text: string): string {
		return text.replace(/[։,.?!՞՛՜]/g, '').replace(/և/g, 'եվ').toLowerCase();
	}
	/** True when the token *is* the dictionary form (Ես, Այս, հաց), so the
	 * "from …" framing would only restate the word. */
	let isBaseForm = $derived(bare(token.text) === bare(word.armenian));
	/** The library translation is worth a second line only when the
	 * in-context gloss says something different ("the bread" vs "Bread"). */
	let showTranslation = $derived(!isBaseForm || t(word.translation).toLowerCase() !== t(gloss).toLowerCase());

	/**
	 * A Svelte transition rather than the CSS `animation` used elsewhere (see
	 * DESIGN.md) because this sits in an `{#if}`: only a transition directive
	 * keeps the outgoing node around long enough to animate out.
	 */
	const reducedMotion = browser && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	function pop(_node: Element, { duration }: { duration: number }): TransitionConfig {
		return {
			duration: reducedMotion ? 0 : duration,
			easing: cubicOut,
			css: (t) => `opacity: ${t}; transform: translateY(${(t - 1) * 4}px);`
		};
	}

	/** Viewport margin the popover keeps clear of, in px. */
	const EDGE_PX = 12;
	let root = $state<HTMLElement | undefined>(undefined);
	// Hangs off its word's left edge, then slides just far enough to stay in the
	// viewport — a word can sit anywhere on a wrapped line. Measured on mount,
	// which is per open, since the popover is re-created per tap.
	let shiftPx = $state(0);
	$effect(() => {
		if (root === undefined) return;
		const rect = root.getBoundingClientRect();
		const overflowRight = rect.right - (window.innerWidth - EDGE_PX);
		let shift = overflowRight > 0 ? -overflowRight : 0;
		if (rect.left + shift < EDGE_PX) shift = EDGE_PX - rect.left;
		shiftPx = Math.round(shift);
	});
</script>

<!-- data-popover-root lets the player's outside-click handler recognise a
     click inside as "keep it open" without stopPropagation gymnastics. -->
<span
	class="popover"
	data-popover-root
	bind:this={root}
	style:margin-left="{shiftPx}px"
	in:pop={{ duration: 170 }}
	out:pop={{ duration: 140 }}
>
	<!-- Order is the general rule first, the exception after: the gloss for this
	     line, then the dictionary entry (base form, library translation, the clip
	     — which says the base form — and the global comment), then the token's
	     own "Here:" remark. -->
	<span class="gloss">{t(gloss)}</span>
	<span class="entry">
		<span class="base">
			{#if !isBaseForm}
				<span class="base-label">{t(wordBaseFormLabel)}</span>
			{/if}
			<span class="base-word" lang="hy">{word.armenian}</span>
			{#if showTranslation}
				<span class="base-translation">{t(word.translation)}</span>
			{/if}
			{#if word.register !== undefined}
				<!-- Same italic "fml."/"inf." marker as the vocabulary word list. -->
				<em class="base-register">{t(registerLabels[word.register])}</em>
			{/if}
			<SpeakerButton src={wordAudioSrc(word.id)} />
		</span>
		<!-- The comment may exist in one language only (`PartiallyTranslated`);
		     nothing shows in the other. -->
		{#if tPartial(word.global) !== undefined}
			<span class="entry-note">{tPartial(word.global)}</span>
		{/if}
		<!-- No `word.cardOnly` here on purpose: the tapped line is the usage, so a
		     comment about some other phrase the word lives in is noise. If this line
		     is that phrase, the token's `here` says so. -->
		{#if token.here !== undefined}
			<!-- Same grey as the global comment: the italic label is marker enough,
			     and darker text read as undue emphasis. -->
			<span class="here"><em class="here-label">{t(wordHereLabel)}</em> {t(token.here)}</span>
		{/if}
	</span>
</span>

<style>
	.popover {
		position: absolute;
		top: calc(100% + 8px);
		left: calc(var(--space-2) * -1);
		z-index: var(--z-popover);
		display: flex;
		width: max-content;
		max-width: min(16rem, calc(100vw - 2 * var(--space-4)));
		flex-direction: column;
		gap: var(--space-2);
		padding: var(--space-3) var(--space-4);
		border-radius: var(--radius-lg);
		background: var(--color-background);
		box-shadow: var(--shadow-lg);
		font-size: var(--font-size-md);
		line-height: 1.4;
		text-align: left;
	}

	.gloss {
		font-family: var(--font-heading);
		font-weight: var(--font-heading-weight);
		font-size: var(--font-size-lg);
		line-height: 1.25;
	}

	.here {
		font-size: var(--font-size-sm);
		color: var(--color-text-secondary);
	}

	.here-label {
		font-style: italic;
	}

	/* Secondary colour throughout, so the entry reads as reference material
	   rather than commentary on the line above. */
	.entry {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		padding-top: var(--space-2);
		border-top: 1px solid var(--color-border);
	}

	.base {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-2);
		font-size: var(--font-size-sm);
	}

	/* Takes the row's right edge and pulls into the popover's padding, so the row
	   stays compact without shrinking the tap target. */
	.base :global(.speaker) {
		margin: calc(var(--space-2) * -1) calc(var(--space-2) * -1) calc(var(--space-2) * -1) auto;
	}

	.base-label,
	.base-translation,
	.base-register,
	.entry-note {
		color: var(--color-text-secondary);
	}

	.base-register {
		font-style: italic;
	}

	.base-word {
		font-family: var(--font-heading);
		font-weight: var(--font-heading-weight);
		font-size: var(--font-size-md);
	}

	.entry-note {
		font-size: var(--font-size-sm);
	}
</style>
