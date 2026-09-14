<script lang="ts">
	import { enhance } from '$app/forms';
	import { untrack } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import { blurAfterClick } from '$lib/actions/blurAfterClick';
	import { lineAudioSrc } from '$lib/content/dialogues/audio';
	import { wordAudioSrc } from '$lib/content/words/audio';
	import type { Dialogue } from '$lib/content/dialogues/types';
	import { getWord } from '$lib/content/words/entries';
	import { DialoguePlayback } from '$lib/dialogues/playback.svelte';
	import { t } from '$lib/i18n/current';
	import { cancelLabel } from '$lib/i18n/dictionaries/common';
	import {
		alreadyDoneLabel,
		dialogueNumberLabel,
		lineCounterLabel,
		listenModeLabel,
		markDoneFailedMessage,
		markDoneLabel,
		modeAriaLabel,
		pauseAllLabel,
		playAllLabel,
		playAllShortLabel,
		readModeLabel,
		revealThenTapHint,
		tapWordHint,
		removeDoneFailedMessage,
		removeDoneHeading,
		removeDoneLabel,
		removeDoneMessage,
		stopLabel
	} from '$lib/i18n/dictionaries/dialogues';
	import { pushToast } from '$lib/stores/toasts.svelte';
	import type { SubmitFunction } from '@sveltejs/kit';
	import Button from './Button.svelte';
	import DialogueLineBubble from './DialogueLineBubble.svelte';
	import DialogueRuleCard from './DialogueRuleCard.svelte';
	import FloatingActionBar from './FloatingActionBar.svelte';
	import Modal from './Modal.svelte';

	/** A word the learner opened during the dialogue — collected for the done
	 * screen's recap. Keyed by library word, so tapping հացը and հա՞ցը counts
	 * `hats` once. */
	export interface TappedWord {
		wordId: string;
		armenian: string;
		gloss: string;
	}

	interface Props {
		dialogue: Dialogue;
		/** 1-based position in the catalog, for the "Dialogue 1" kicker. */
		number: number;
		/** Whether the learner has already marked this dialogue done. Flips
		 * the commit button from the soft "mark it done" into the solid
		 * "Already done", which offers to undo instead of re-marking. */
		completed: boolean;
		/** Bound so the route can replay the completion form after a
		 * signed-out learner comes back from signing in (see the route). */
		completeForm?: HTMLFormElement | undefined;
		onCompleted: (tapped: readonly TappedWord[]) => void;
	}

	let { dialogue, number, completed, completeForm = $bindable(undefined), onCompleted }: Props = $props();

	type Mode = 'listen' | 'read';
	let mode = $state<Mode>('listen');
	let revealed = new SvelteSet<number>();
	let translated = new SvelteSet<number>();
	/** The open word popover's line/token, or `null`. */
	let openToken = $state<{ line: number; token: number } | null>(null);
	let tapped = $state<TappedWord[]>([]);
	let completing = $state(false);
	let removing = $state(false);
	let showRemoveModal = $state(false);

	// Read once, at mount, on purpose: the route remounts this component
	// (via {#key}) whenever the dialogue changes, so playback never has to
	// follow a prop change — same pattern as VocabularyTrainer's queue.
	const playback = untrack(
		() => new DialoguePlayback(dialogue.lines.length, (index) => lineAudioSrc(dialogue.id, index))
	);
	// On the client, fetch every line's clip right away, and warm the clips
	// of the words a learner can tap — the line clips are what a tap has to
	// start instantly (see DialoguePlayback); the word clips just need to be
	// in the HTTP cache for SpeakerButton, so a low-priority fetch is enough.
	$effect(() => {
		playback.preload();
		const wordIds = new Set<string>();
		for (const line of dialogue.lines) for (const token of line.tokens) if (token.wordId !== undefined) wordIds.add(token.wordId);
		for (const wordId of wordIds) void fetch(wordAudioSrc(wordId), { priority: 'low' }).catch(() => undefined);
		return () => playback.destroy();
	});

	let lineCount = $derived(dialogue.lines.length);
	/** A line above the transcript says the words are tappable — nothing
	 * else on the page does, since tappable words carry no resting mark
	 * (see DialogueLineBubble). Which version depends on whether anything
	 * is readable yet; it never empties — clearing it on the first tap
	 * shifted the whole transcript right as the learner was reading a
	 * popover. */
	let wordHint = $derived(mode === 'read' || revealed.size > 0 ? tapWordHint : revealThenTapHint);
	let inProgress = $derived(playback.started);
	let progressPercent = $derived(inProgress ? ((playback.cursor + 1) / lineCount) * 100 : 0);

	function tapToken(lineIndex: number, tokenIndex: number): void {
		if (openToken?.line === lineIndex && openToken.token === tokenIndex) {
			openToken = null;
			return;
		}
		openToken = { line: lineIndex, token: tokenIndex };

		const token = dialogue.lines[lineIndex]?.tokens[tokenIndex];
		const word = token?.wordId === undefined ? undefined : getWord(token.wordId);
		if (token === undefined || word === undefined) return;
		if (tapped.some((entry) => entry.wordId === word.id)) return;
		tapped = [...tapped, { wordId: word.id, armenian: word.armenian, gloss: t(token.gloss ?? word.translation) }];
	}

	/** Closes the open popover on a click anywhere outside it or its word,
	 * and on Escape. Token buttons toggle themselves in `tapToken`, so a
	 * click on the open word is excluded here rather than closing and
	 * immediately re-opening. */
	function onWindowClick(event: MouseEvent): void {
		if (openToken === null) return;
		const target = event.target;
		if (target instanceof Element && target.closest('[data-popover-root], .token') !== null) return;
		openToken = null;
	}

	function onWindowKeydown(event: KeyboardEvent): void {
		if (event.key === 'Escape') openToken = null;
	}

	/** Listen re-blurs every line, including ones the learner revealed
	 * with the eye button — tapping it means "hide the text again", so
	 * it's a reset, not just a mode switch. */
	function setMode(next: Mode): void {
		mode = next;
		if (next === 'listen') {
			openToken = null;
			revealed.clear();
		}
	}

	const submitComplete: SubmitFunction = () => {
		completing = true;
		playback.stop();
		return async ({ update, result }) => {
			try {
				await update({ reset: false });
				if (result.type === 'success') {
					onCompleted(tapped);
				} else if (result.type !== 'redirect') {
					pushToast(markDoneFailedMessage, 'error');
				}
			} finally {
				completing = false;
			}
		};
	};

	// The route's `data.completed` is what actually flips the button back:
	// `update()` re-runs the page load, and the parent passes the fresh
	// value down. Closing the modal is the only local state to settle.
	const submitRemove: SubmitFunction = () => {
		removing = true;
		return async ({ update, result }) => {
			try {
				await update({ reset: false });
				if (result.type === 'success') {
					showRemoveModal = false;
				} else if (result.type !== 'redirect') {
					pushToast(removeDoneFailedMessage, 'error');
				}
			} finally {
				removing = false;
			}
		};
	};
</script>

<svelte:window onclick={onWindowClick} onkeydown={onWindowKeydown} />

<div class="player">
	<header class="head">
		<span class="kicker">{t(dialogueNumberLabel(number))}</span>
		<h1 lang="hy">{dialogue.title}</h1>
		<p class="subtitle">{t(dialogue.titleTranslation)}</p>
	</header>

	<DialogueRuleCard rule={dialogue.rule} />

	<p class="hint">{t(wordHint)}</p>

	<div class="lines">
		{#each dialogue.lines as line, lineIndex (lineIndex)}
			<DialogueLineBubble
				{line}
				side={line.speaker === 'dmitrii' ? 'end' : 'start'}
				shown={mode === 'read' || revealed.has(lineIndex)}
				playing={playback.playing === lineIndex}
				translationShown={translated.has(lineIndex)}
				openTokenIndex={openToken?.line === lineIndex ? openToken.token : null}
				onPlay={() => playback.playLine(lineIndex)}
				onReveal={() => revealed.add(lineIndex)}
				onToggleTranslation={() => (translated.has(lineIndex) ? translated.delete(lineIndex) : translated.add(lineIndex))}
				onTapToken={(tokenIndex) => tapToken(lineIndex, tokenIndex)}
			/>
		{/each}
	</div>

	<!-- Passed as Button's `icon`, not inline in its label, so the spinner
	     stands in for the checkmark while `complete` posts instead of
	     queueing up beside it (Conventions #15). No width/height: the
	     button's icon slot sizes it. -->
	{#snippet doneIcon()}
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
			<circle cx="12" cy="12" r="9.5" />
			<path d="m8 12.3 2.8 2.7L16.5 9" />
		</svg>
	{/snippet}

	<!-- One slot, two states. Not done: the soft sage commit button that
	     posts `complete` (and lifts — it's the screen's one commit action).
	     Done: the solid sage of the success state itself, no lift, and
	     tapping it offers to undo rather than re-marking; there's nothing
	     left to commit. -->
	<div class="complete">
		{#if completed}
			<Button type="button" variant="success" icon={doneIcon} onclick={() => (showRemoveModal = true)}>
				{t(alreadyDoneLabel)}
			</Button>
		{:else}
			<form method="POST" action="?/complete" use:enhance={submitComplete} bind:this={completeForm}>
				<Button type="submit" variant="success-soft" lift icon={doneIcon} loading={completing} disabled={completing}>
					{t(markDoneLabel)}
				</Button>
			</form>
		{/if}
	</div>

	<FloatingActionBar bare>
		<div class="player-bar">
			<span class="progress" style:width="{progressPercent}%" aria-hidden="true"></span>
			<div class="seg" role="radiogroup" aria-label={t(modeAriaLabel)}>
				<label class="seg-opt" class:checked={mode === 'listen'}>
					<!-- onclick, not onchange: a radio's change event doesn't fire when it's
					     already checked, and Listen has to reset revealed lines even when the
					     learner is already in Listen mode. Keyboard selection (arrows/Space)
					     dispatches click on radios too, so nothing is lost. -->
					<input type="radio" name="dialogue-mode" value="listen" checked={mode === 'listen'} onclick={() => setMode('listen')} />
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" width="14" height="14">
						<path d="M4 15v-3a8 8 0 0 1 16 0v3" />
						<path d="M4 15a2 2 0 0 1 2-2h1v6H6a2 2 0 0 1-2-2z" />
						<path d="M20 15a2 2 0 0 0-2-2h-1v6h1a2 2 0 0 0 2-2z" />
					</svg>
					<span class="seg-text">{t(listenModeLabel)}</span>
				</label>
				<label class="seg-opt" class:checked={mode === 'read'}>
					<input type="radio" name="dialogue-mode" value="read" checked={mode === 'read'} onchange={() => setMode('read')} />
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" width="14" height="14">
						<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
						<circle cx="12" cy="12" r="2.8" />
					</svg>
					<span class="seg-text">{t(readModeLabel)}</span>
				</label>
			</div>
			{#if inProgress}
				<button type="button" class="stop" aria-label={t(stopLabel)} onclick={() => playback.stop()} use:blurAfterClick>
					<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" width="14" height="14">
						<rect x="6" y="6" width="12" height="12" rx="2.5" />
					</svg>
				</button>
			{/if}
			<button
				type="button"
				class="play-all"
				aria-label={playback.auto ? t(pauseAllLabel) : t(playAllLabel)}
				onclick={() => playback.toggleAuto()}
				use:blurAfterClick
			>
				{#if playback.auto}
					<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" width="15" height="15">
						<rect x="6" y="5" width="4" height="14" rx="1.6" />
						<rect x="14" y="5" width="4" height="14" rx="1.6" />
					</svg>
				{:else}
					<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" width="15" height="15">
						<path d="M8 5.5a1 1 0 0 1 1.5-.87l9 6.37a1 1 0 0 1 0 1.74l-9 6.37A1 1 0 0 1 8 18.5z" />
					</svg>
				{/if}
				<span class="counter">
					{inProgress ? t(lineCounterLabel(playback.cursor + 1, lineCount)) : t(playAllShortLabel)}
				</span>
			</button>
		</div>
	</FloatingActionBar>
</div>

{#if showRemoveModal}
	<Modal labelledBy="remove-done-heading" onClose={() => (showRemoveModal = false)}>
		<h2 id="remove-done-heading">{t(removeDoneHeading)}</h2>
		<p>{t(removeDoneMessage(dialogue.titleTranslation))}</p>
		<div class="modal-actions">
			<Button variant="secondary" onclick={() => (showRemoveModal = false)}>
				{t(cancelLabel)}
			</Button>
			<form method="POST" action="?/uncomplete" use:enhance={submitRemove}>
				<Button type="submit" variant="error" loading={removing} disabled={removing}>
					{t(removeDoneLabel)}
				</Button>
			</form>
		</div>
	</Modal>
{/if}

<style>
	.player {
		display: flex;
		width: 100%;
		flex-direction: column;
		align-items: stretch;
		gap: var(--space-4);
	}

	.head {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		text-align: left;
	}

	.kicker {
		font-size: 0.7rem;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--color-accent-700);
	}

	.subtitle {
		color: var(--color-text-secondary);
	}

	.lines {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.complete {
		display: flex;
		justify-content: center;
		margin-top: var(--space-2);
	}

	/* Same quiet line as the trainer's "tap to reveal" hint. */
	.hint {
		margin: 0;
		font-size: var(--font-size-sm);
		color: var(--color-text-secondary);
		text-align: center;
	}

	.modal-actions {
		display: flex;
		width: 100%;
		gap: var(--space-2);
	}

	.modal-actions :global(form),
	.modal-actions :global(.button) {
		flex: 1;
	}

	/* The whole pill, not just its buttons, must take pointer events —
	   FloatingActionBar deliberately makes its own box inert (see its
	   comment), and the segmented control's labels aren't on its list of
	   real controls. Capped narrower than the (invisible, `bare`) bar
	   around it to line up with the chat column above. */
	.player-bar {
		position: relative;
		display: flex;
		width: 100%;
		max-width: 26rem;
		margin-inline: auto;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-2);
		border-radius: var(--radius-pill);
		background: var(--color-surface);
		box-shadow: var(--shadow-md);
		overflow: hidden;
		pointer-events: auto;
	}

	.progress {
		position: absolute;
		top: 0;
		left: 0;
		height: 3px;
		border-radius: var(--radius-pill);
		background: var(--color-primary);
		transition: width 320ms ease;
	}

	.seg {
		display: flex;
		flex: 1;
		min-width: 0;
		border-radius: var(--radius-pill);
		background: var(--color-background);
		overflow: hidden;
	}

	.seg-opt {
		display: flex;
		flex: 1;
		min-height: var(--tap-target-min);
		align-items: center;
		justify-content: center;
		gap: 5px;
		padding: 0 var(--space-2);
		border-radius: var(--radius-pill);
		font-size: var(--font-size-sm);
		white-space: nowrap;
		cursor: pointer;
		transition:
			background-color var(--transition-fast),
			color var(--transition-fast);
	}

	.seg-opt input {
		position: absolute;
		width: 0;
		height: 0;
		opacity: 0;
		pointer-events: none;
	}

	.seg-opt:not(.checked):hover {
		background: var(--color-background-hover);
	}

	/* Dark ink on the accent fill, never cream — see DESIGN.md on contrast. */
	.seg-opt.checked {
		background: var(--color-primary);
		color: var(--color-on-primary);
	}

	.seg-opt:has(input:focus-visible) {
		outline: 3px solid var(--color-focus-ring);
		outline-offset: -3px;
	}

	/* On a narrow phone (360 CSS px is common — a Fairphone 6, most
	   Android mid-rangers) the bar can't fit two labelled mode options, a
	   stop button and the play-all counter: the Russian labels alone need
	   ~200px and "Читать" was clipped mid-word. Below 420px the mode
	   options are icons only, a little larger, with the labels kept for
	   assistive tech (the same sr-only pattern as app.css). */
	@media (max-width: 420px) {
		.seg-opt {
			padding: 0 var(--space-3);
		}

		.seg-opt svg {
			width: 18px;
			height: 18px;
		}

		.seg-text {
			position: absolute;
			width: 1px;
			height: 1px;
			overflow: hidden;
			clip-path: inset(50%);
			white-space: nowrap;
		}
	}

	.stop,
	.play-all {
		display: flex;
		flex: none;
		align-items: center;
		justify-content: center;
		min-height: var(--tap-target-min);
		border: 1px solid transparent;
		border-radius: var(--radius-pill);
		cursor: pointer;
		transition:
			background-color var(--transition-fast),
			border-color var(--transition-fast);
	}

	.stop {
		width: var(--tap-target-min);
		padding: 0;
		border-color: var(--color-border);
		background: var(--color-background);
		color: var(--color-text-primary);
	}

	.stop:hover {
		background: var(--color-background-hover);
	}

	.play-all {
		gap: var(--space-2);
		padding: 0 var(--space-4);
		background: var(--color-primary);
		color: var(--color-on-primary);
		font-family: var(--font-heading);
		font-weight: var(--font-heading-weight);
		font-size: var(--font-size-sm);
		white-space: nowrap;
	}

	.play-all:hover {
		background: var(--color-primary-hover);
	}

	.counter {
		display: inline-block;
		min-width: 3.25rem;
		text-align: center;
		font-variant-numeric: tabular-nums;
	}
</style>
