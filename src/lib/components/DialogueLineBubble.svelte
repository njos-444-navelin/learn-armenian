<script lang="ts">
	import { blurAfterClick } from '$lib/actions/blurAfterClick';
	import { CHARACTERS } from '$lib/content/dialogues/characters';
	import type { DialogueLine } from '$lib/content/dialogues/types';
	import { getWord } from '$lib/content/words/entries';
	import { t } from '$lib/i18n/current';
	import {
		hideTranslationLabel,
		playLineLabel,
		revealLineLabel,
		showTranslationLabel
	} from '$lib/i18n/dictionaries/dialogues';
	import CharacterAvatar from './CharacterAvatar.svelte';
	import DialogueWordPopover from './DialogueWordPopover.svelte';

	interface Props {
		line: DialogueLine;
		/** `end` puts the bubble on the right with its avatar outside it, like
		 * the learner's own side of a chat; `start` mirrors that. Which
		 * character gets which side is the player's call, not the line's. */
		side: 'start' | 'end';
		/** Whether the Armenian text is readable (read mode, or revealed). */
		shown: boolean;
		playing: boolean;
		translationShown: boolean;
		/** Index of this line's open word popover, or `null`. */
		openTokenIndex: number | null;
		onPlay: () => void;
		onReveal: () => void;
		onToggleTranslation: () => void;
		onTapToken: (tokenIndex: number) => void;
	}

	let {
		line,
		side,
		shown,
		playing,
		translationShown,
		openTokenIndex,
		onPlay,
		onReveal,
		onToggleTranslation,
		onTapToken
	}: Props = $props();

	let character = $derived(CHARACTERS[line.speaker]);
	let translationOpen = $derived(shown && translationShown);
</script>

<div class="row {side}">
	<CharacterAvatar {character} />
	<div class="stack">
		<div class="bubble" class:playing class:own={side === 'end'}>
			<button type="button" class="play" class:active={playing} aria-label={t(playLineLabel)} onclick={onPlay} use:blurAfterClick>
				{#if playing}
					<span class="wave" aria-hidden="true">
						<span></span><span></span><span></span><span></span>
					</span>
				{:else}
					<svg viewBox="0 0 24 24" fill="none" aria-hidden="true" width="19" height="19">
						<path
							d="M4 9.5v5h3.5L12 18V6L7.5 9.5H4Z"
							fill="currentColor"
							stroke="currentColor"
							stroke-width="1.5"
							stroke-linejoin="round"
						/>
						<path d="M16 9a4.5 4.5 0 0 1 0 6" stroke="currentColor" stroke-width="2.75" stroke-linecap="round" />
						<path d="M18.5 6.5a8 8 0 0 1 0 11" stroke="currentColor" stroke-width="2.75" stroke-linecap="round" />
					</svg>
				{/if}
			</button>

			<div class="text-column">
				<!-- Blurred, not removed, while hidden: the bubble keeps its real
				     size so revealing a line never reflows the ones around it.
				     aria-hidden + disabled tokens keep it genuinely hidden from
				     assistive tech and the keyboard, not just visually. -->
				<div class="text" class:hidden={!shown} lang="hy" aria-hidden={!shown}>
					{#each line.tokens as token, tokenIndex (tokenIndex)}
						{@const word = token.wordId === undefined ? undefined : getWord(token.wordId)}
						<span class="token-wrap">
							{#if word === undefined}
								<span class="token plain">{token.text}</span>
							{:else}
								<button
									type="button"
									class="token"
									class:open={openTokenIndex === tokenIndex}
									disabled={!shown}
									aria-expanded={openTokenIndex === tokenIndex}
									onclick={() => onTapToken(tokenIndex)}
									use:blurAfterClick
								>
									{token.text}
								</button>
								{#if openTokenIndex === tokenIndex}
									<DialogueWordPopover {token} {word} />
								{/if}
							{/if}
						</span>
					{/each}
				</div>
				<!-- Always rendered so its height can transition both ways, same
				     pattern as DialogueRuleCard's body; `inert` keeps the hidden
				     translation out of the accessibility tree. -->
				<div class="translation" class:open={translationOpen} inert={!translationOpen}>
					<span class="translation-text">{t(line.translation)}</span>
				</div>
			</div>

			<div class="side-actions">
				{#if !shown}
					<button type="button" class="mini" aria-label={t(revealLineLabel)} onclick={onReveal} use:blurAfterClick>
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" width="16" height="16">
							<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
							<circle cx="12" cy="12" r="3" />
						</svg>
					</button>
				{:else}
					<button
						type="button"
						class="mini"
						class:active={translationShown}
						aria-label={translationShown ? t(hideTranslationLabel) : t(showTranslationLabel)}
						aria-pressed={translationShown}
						onclick={onToggleTranslation}
						use:blurAfterClick
					>
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" width="16" height="16">
							<path d="m5 8 6 6" />
							<path d="m4 14 6-6 2-3" />
							<path d="M2 5h12" />
							<path d="M7 2h1" />
							<path d="m22 22-5-10-5 10" />
							<path d="M14 18h6" />
						</svg>
					</button>
				{/if}
			</div>
		</div>
	</div>
</div>

<style>
	.row {
		display: flex;
		width: 100%;
		align-items: flex-end;
		gap: var(--space-2);
	}

	.row.end {
		flex-direction: row-reverse;
	}

	.row :global(.avatar) {
		margin-bottom: 3px;
	}

	/* No visible speaker name above the bubble — the avatar and the two
	   bubble fills already tell the speakers apart, and the avatar's
	   aria-label names the speaker for assistive tech. */
	.stack {
		display: flex;
		max-width: 86%;
		min-width: 0;
		flex-direction: column;
		align-items: flex-start;
	}

	.end .stack {
		align-items: flex-end;
	}

	/* The two speakers get two fills — the plain surface for Tereza, the
	   lightest accent tint for Dmitrii's "own side" bubbles — the way a
	   chat tells the two parties apart. A tint on a bubble-sized element,
	   never a hero-sized one, so it stays within DESIGN.md's "tinted
	   backgrounds for small elements" allowance. */
	.bubble {
		display: flex;
		align-items: center;
		gap: var(--space-1);
		padding: var(--space-2) var(--space-3) var(--space-2) var(--space-1);
		border: 1px solid transparent;
		border-radius: var(--radius-md);
		background: var(--color-surface);
		transition: border-color var(--transition-fast);
	}

	.bubble.own {
		background: var(--color-accent-100);
	}

	/* The primary-colour border means "selected" app-wide (DESIGN.md) —
	   here it marks the line currently playing, the one thing selected. */
	.bubble.playing {
		border-color: var(--color-primary);
	}

	.play,
	.mini {
		display: flex;
		flex: none;
		align-items: center;
		justify-content: center;
		padding: 0;
		border: none;
		border-radius: var(--radius-pill);
		background: none;
		color: var(--color-text-secondary);
		cursor: pointer;
		transition:
			background-color var(--transition-fast),
			color var(--transition-fast);
	}

	.play {
		width: 2.5rem;
		height: 2.5rem;
	}

	.play:hover,
	.mini:hover {
		background: var(--color-background-hover);
		color: var(--color-text-primary);
	}

	.play.active,
	.mini.active {
		color: var(--color-accent-700);
	}

	.wave {
		display: flex;
		height: 18px;
		align-items: center;
		gap: 2px;
	}

	.wave span {
		width: 3px;
		height: 100%;
		border-radius: 2px;
		background: currentColor;
		animation: wave 620ms ease-in-out infinite;
	}

	.wave span:nth-child(2) {
		animation-delay: 120ms;
	}

	.wave span:nth-child(3) {
		animation-delay: 240ms;
	}

	.wave span:nth-child(4) {
		animation-delay: 360ms;
	}

	@keyframes wave {
		0%,
		100% {
			transform: scaleY(0.35);
		}
		50% {
			transform: scaleY(1);
		}
	}

	/* app.css's reduced-motion rule already collapses the animation to a
	   single frame; this just makes the resting shape deliberate rather
	   than whatever frame it happened to stop on. */
	@media (prefers-reduced-motion: reduce) {
		.wave span {
			animation: none;
			transform: scaleY(0.6);
		}
	}

	.text-column {
		display: flex;
		min-width: 0;
		flex-direction: column;
	}

	.text {
		display: flex;
		flex-wrap: wrap;
		gap: 0 5px;
		font-size: 1.2rem;
		line-height: 1.65;
		transition: filter 220ms ease;
	}

	.text.hidden {
		filter: blur(6px);
		pointer-events: none;
		user-select: none;
	}

	.token-wrap {
		position: relative;
		display: inline-block;
	}

	/* No resting mark on a tappable word — the text reads as plain prose.
	   (A dotted underline was tried and dropped: it added noise without
	   telling the learner anything they don't learn from the first tap, and
	   as a border-bottom it also curved around the corner radius in
	   Chromium.) Hover gets the ink wash; the open word gets the wash plus
	   a primary underline as its "selected" marker — text-decoration, not
	   border-bottom, so it follows the glyphs and stays straight. */
	.token {
		padding: 0 4px;
		margin: 0 -3px;
		border: none;
		border-radius: var(--radius-sm);
		background: transparent;
		color: inherit;
		font: inherit;
		text-decoration: none;
		text-decoration-thickness: 1px;
		text-underline-offset: 0.2em;
		cursor: pointer;
		transition: background-color var(--transition-fast);
	}

	.token.plain {
		cursor: default;
	}

	/* Ink washes, not tints — see the --color-word-* tokens. The open word
	   goes one step deeper and keeps its primary underline as the real
	   "selected" marker. */
	.token:not(.plain):hover:not(:disabled) {
		background: var(--color-word-hover);
	}

	.token.open {
		text-decoration: underline solid var(--color-primary);
		background: var(--color-word-open);
	}

	/* Native 0 -> auto height transition, with the text fading in a beat
	   behind the growth — see DialogueRuleCard.svelte's .body for the full
	   note on `interpolate-size` and its fallback. */
	.translation {
		height: 0;
		/* A column flex item's min-height defaults to `auto` (its content
		   size), which would silently win over the `height: 0` above and
		   leave the collapsed box its full height. */
		min-height: 0;
		overflow: hidden;
		interpolate-size: allow-keywords;
		transition: height 200ms ease;
	}

	.translation.open {
		height: auto;
	}

	.translation-text {
		display: block;
		padding-top: var(--space-1);
		font-size: var(--font-size-sm);
		color: var(--color-text-secondary);
		opacity: 0;
		transition: opacity 140ms ease;
	}

	.translation.open .translation-text {
		opacity: 1;
		transition: opacity 180ms ease 70ms;
	}

	.side-actions {
		display: flex;
		flex-direction: column;
		align-self: stretch;
		justify-content: center;
		gap: 2px;
	}

	/* Below --tap-target-min on purpose: two of these stack inside a bubble
	   whose own height a single line of text sets, and the bubble's edges
	   around them are inert. The 44px floor (Conventions §6) applies to the
	   line's main affordances — the play button and the words themselves. */
	.mini {
		width: 2rem;
		height: 2rem;
	}
</style>
