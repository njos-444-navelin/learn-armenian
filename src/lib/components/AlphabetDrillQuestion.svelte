<script lang="ts">
	import { fade } from 'svelte/transition';
	import { browser } from '$app/environment';
	import { applyAction, enhance } from '$app/forms';
	import { blurAfterClick } from '$lib/actions/blurAfterClick';
	import type { AlphabetLetter } from '$lib/content/alphabet';
	import { letterAudioSrc } from '$lib/content/alphabetAudio';
	import { muteAudioQuestions } from '$lib/alphabet/audioMute';
	import type { DrillQuestion } from '$lib/alphabet/drillQuestion';
	import { t } from '$lib/i18n/current';
	import {
		answerSaveFailedMessage,
		audioReplayHint,
		audioSkipLabel,
		correctAnswerHint,
		correctFeedbackLabel,
		drillSectionLabel,
		incorrectAnswerHint,
		incorrectFeedbackLabel,
		muteAudioLabel,
		nextLabel,
		questionAudioLabel,
		questionCaseToLowerLabel,
		questionCaseToUpperLabel,
		questionSoundLabel,
		skippedFeedbackLabel
	} from '$lib/i18n/dictionaries/alphabetTrainer';
	import { pushToast } from '$lib/stores/toasts.svelte';
	import AlphabetProgressHeader, { type DotState } from './AlphabetProgressHeader.svelte';
	import Button from './Button.svelte';
	import FloatingActionBar from './FloatingActionBar.svelte';
	import type { SubmitFunction } from '@sveltejs/kit';

	interface Props {
		question: DrillQuestion;
		allLetters: readonly AlphabetLetter[];
		index: number;
		total: number;
		onAnswered: (letterId: string, correct: boolean) => void;
		onNext: () => void;
	}

	let { question, allLetters, index, total, onAnswered, onNext }: Props = $props();

	let picked = $state<string | null>(null);
	let audioEl: HTMLAudioElement | undefined = $state();

	// Computed once, not reactive: a transition's params are read when it's
	// created. Same pattern as AlphabetTrainer.svelte's screen fade.
	const cardFadeMs = browser && window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 150;

	function letterFor(id: string): AlphabetLetter | undefined {
		return allLetters.find((entry) => entry.id === id);
	}

	function pairLabel(letter: AlphabetLetter): string {
		return letter.uppercase === undefined ? letter.lowercase : `${letter.uppercase} ${letter.lowercase}`;
	}

	let promptText = $derived(
		question.type === 'sound'
			? questionSoundLabel
			: question.type === 'audio'
				? questionAudioLabel
				: question.caseDirection === 'lowerToUpper'
					? questionCaseToUpperLabel
					: questionCaseToLowerLabel
	);

	// Unlike the learn step's dots, these distinguish "already answered" from
	// "the question you're on" — drill questions have a right/wrong outcome.
	let dotStates = $derived<readonly DotState[]>(
		Array.from({ length: total }, (_, n) => (n < index ? 'filled' : n === index ? 'current' : 'empty'))
	);

	/** For `case`, the glyph shown in the stage — the *opposite* form of
	 * whatever the options ask the learner to identify. */
	let stageGlyph = $derived.by(() => {
		if (question.type !== 'case') return pairLabel(question.letter);
		if (question.caseDirection === 'lowerToUpper') return question.letter.lowercase;
		return question.letter.uppercase ?? question.letter.lowercase;
	});

	function optionGlyph(letter: AlphabetLetter): string {
		if (question.type !== 'case') return pairLabel(letter);
		if (question.caseDirection === 'lowerToUpper') return letter.uppercase ?? letter.lowercase;
		return letter.lowercase;
	}

	function playAudio(): void {
		if (audioEl === undefined) return;
		audioEl.currentTime = 0;
		void audioEl.play().catch(() => {});
	}

	// An 'audio' question can't be answered without hearing the clip, so it
	// plays on sight rather than making that the learner's first action. The
	// component remounts per question (see the `{#key}` in AlphabetTrainer),
	// so a mount-time effect is enough. Getting here always follows a click,
	// which keeps it inside the autoplay-permission window; playAudio()
	// swallows the rejection if a browser blocks it anyway.
	$effect(() => {
		if (question.type === 'audio') playAudio();
	});

	const AUDIO_MUTE_MINUTES = 15;

	function skip(): void {
		if (picked !== null) return;
		picked = 'skipped';
	}

	/** Only fires if the learner actually taps the mute suggestion — skipping
	 * on its own never mutes anything. */
	function muteAndContinue(): void {
		muteAudioQuestions(AUDIO_MUTE_MINUTES);
		onNext();
	}

	function submitAnswer(): SubmitFunction {
		return ({ submitter }) => {
			const chosenId = submitter?.getAttribute('value') ?? null;
			if (chosenId === null || picked !== null) return;
			const correct = chosenId === question.letter.id;
			picked = chosenId;
			onAnswered(question.letter.id, correct);

			return async ({ result }) => {
				if (result.type === 'redirect') {
					await applyAction(result);
					return;
				}
				if (result.type === 'failure' || result.type === 'error') {
					pushToast(answerSaveFailedMessage, 'error');
				}
			};
		};
	}
</script>

<div class="drill-step">
	<AlphabetProgressHeader sectionLabel={drillSectionLabel} {index} {total} {dotStates} />

	<div class="content-wrap">
		<div class="stage">
	<p class="prompt">{t(promptText)}</p>

	{#if question.type === 'audio'}
		<button type="button" class="audio-button" onclick={playAudio} use:blurAfterClick>
			<svg viewBox="0 0 24 24" fill="none" aria-hidden="true" width="40" height="40">
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
			<span class="audio-hint">{t(audioReplayHint)}</span>
		</button>
		<!-- preload="auto", unlike SpeakerButton's "none": this clip is certain
		     to be needed, since the question can't be answered without it. -->
		<audio bind:this={audioEl} src={letterAudioSrc(question.letter.id)} preload="auto"></audio>
	{:else}
		<div class="glyph-circle">
			<span lang="hy" class="glyph">{stageGlyph}</span>
		</div>
	{/if}
		</div>

		<form method="POST" action="?/answer" use:enhance={submitAnswer()} class="options" class:glyph-options={question.type !== 'sound'}>
	<input type="hidden" name="letterId" value={question.letter.id} />
	{#each question.optionIds as optionId (optionId)}
		{@const optionLetter = letterFor(optionId)}
		{@const isCorrect = optionId === question.letter.id}
		{@const isPicked = optionId === picked}
		{#if optionLetter !== undefined}
			<button
				type="submit"
				name="chosenId"
				value={optionId}
				disabled={picked !== null}
				class="option"
				class:reveal-correct={picked !== null && isCorrect}
				class:reveal-incorrect={picked !== null && isPicked && !isCorrect}
			>
				{#if question.type === 'sound'}
					<span class="option-text">{t(optionLetter.voicingLabel)}</span>
				{:else}
					<span lang="hy" class="option-glyph">{optionGlyph(optionLetter)}</span>
				{/if}
				{#if picked !== null && isCorrect}
					<span class="sr-only">{t(correctAnswerHint)}</span>
				{:else if picked !== null && isPicked && !isCorrect}
					<span class="sr-only">{t(incorrectAnswerHint)}</span>
				{/if}
			</button>
		{/if}
	{/each}
		</form>
	</div>

	<FloatingActionBar bare>
		<div class="footer">
			{#if picked === 'skipped'}
				<div class="footer-card" in:fade={{ duration: cardFadeMs }}>
					<p class="feedback" aria-live="polite">{t(skippedFeedbackLabel)}</p>
					<div class="skip-actions">
						<button type="button" class="mute" onclick={muteAndContinue}>{t(muteAudioLabel(AUDIO_MUTE_MINUTES))}</button>
						<Button type="button" variant="primary" onclick={onNext}>{t(nextLabel)}</Button>
					</div>
				</div>
			{:else if picked !== null}
				<div class="footer-card" in:fade={{ duration: cardFadeMs }}>
					<p class="feedback" aria-live="polite">
						{picked === question.letter.id ? t(correctFeedbackLabel) : t(incorrectFeedbackLabel)}
					</p>
					<Button type="button" variant="primary" onclick={onNext}>{t(nextLabel)}</Button>
				</div>
			{:else if question.type === 'audio'}
				<button type="button" class="skip" onclick={skip}>{t(audioSkipLabel)}</button>
			{/if}
		</div>
	</FloatingActionBar>
</div>

<style>
	/* Claims the full height PageShell would otherwise centre it within, so the
	   header gets a fixed starting position and `.content-wrap`'s `flex: 1`
	   centres the stage in what's left above the footer. Without it, content
	   height varying question to question moved the block while the fixed footer
	   stayed put, leaving a gap of page background between them.
	   `<FloatingActionBar>` must live inside this wrapper so its measured bottom
	   spacer is one of this column's children — same as AlphabetLearnStep. */
	.drill-step {
		display: flex;
		width: 100%;
		min-height: var(--page-content-min-height);
		flex-direction: column;
		align-items: center;
		gap: var(--space-5);
	}

	/* flex-end on a phone: a question with less content than the tallest left
	   slack on both sides when centred, and the slack below read as a gap before
	   the floating footer. Bottom-aligning moves it under the header, where
	   nothing sits next to it. On a tall viewport the slack scales with
	   `--page-content-min-height` and bottom-aligning instead reads as content
	   sinking down a mostly-empty page, so centre again past the same breakpoint
	   AlphabetLetterSheet.svelte uses. */
	.content-wrap {
		display: flex;
		width: 100%;
		flex: 1;
		flex-direction: column;
		align-items: center;
		justify-content: flex-end;
		gap: var(--space-5);
	}

	@media (min-width: 768px) {
		.content-wrap {
			justify-content: center;
		}
	}

	.stage {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-3);
	}

	.prompt {
		margin: 0;
		text-align: center;
		font-size: var(--font-size-md);
		color: var(--color-text-secondary);
	}

	.glyph-circle {
		display: flex;
		width: clamp(8rem, 36vw, 10rem);
		aspect-ratio: 1;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		background: var(--color-surface);
	}

	/* On a short viewport this circle plus the chrome around it outgrows the
	   space available well before the width looks cramped. */
	@media (max-height: 700px) {
		.glyph-circle,
		.audio-button {
			width: clamp(6.5rem, 32vw, 8.5rem);
		}
	}

	.glyph {
		font-family: var(--font-heading);
		font-weight: 900;
		font-size: clamp(2rem, 9vw, 3rem);
		line-height: 1;
		color: var(--color-accent-800);
	}

	.audio-button {
		display: flex;
		width: clamp(8rem, 36vw, 10rem);
		aspect-ratio: 1;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--space-2);
		border: none;
		border-radius: 50%;
		background: var(--color-surface);
		color: var(--color-accent-800);
		cursor: pointer;
		transition: background-color var(--transition-fast);
	}

	.audio-button:hover {
		background: var(--color-surface-hover);
	}

	.audio-hint {
		font-size: var(--font-size-sm);
		color: var(--color-text-secondary);
	}

	.options {
		display: grid;
		width: 100%;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-2);
	}

	.option {
		display: flex;
		min-height: 4.75rem;
		align-items: center;
		justify-content: center;
		gap: var(--space-2);
		padding: var(--space-5);
		border: 1px solid var(--color-border-soft);
		border-radius: var(--radius-lg);
		background: var(--color-surface);
		color: var(--color-text-primary);
		cursor: pointer;
		transition:
			background-color var(--transition-fast),
			border-color var(--transition-fast),
			opacity var(--transition-fast);
	}

	.options.glyph-options .option {
		min-height: 4.25rem;
	}

	.option:disabled {
		cursor: default;
	}

	.option:not(:disabled):hover {
		background: var(--color-surface-hover);
	}

	.option-text {
		font-size: var(--font-size-sm);
		line-height: 1.25;
	}

	.option-glyph {
		font-family: var(--font-heading);
		font-weight: 700;
		font-size: 1.4rem;
		/* A glyph pair never wraps, so the inherited 1.5 was adding height for
		   nothing; shorter options leave more clearance before the footer. */
		line-height: 1.1;
	}

	.option.reveal-correct {
		border-color: var(--color-accent-2-500);
		background: var(--color-accent-2-200);
		color: var(--color-accent-2-800);
	}

	.option.reveal-incorrect {
		border-color: var(--color-error);
		background: var(--color-error-surface);
		color: var(--color-on-error-surface);
	}

	.option:disabled:not(.reveal-correct):not(.reveal-incorrect) {
		opacity: 0.6;
	}

	/* A constant height across all four footer states, so nothing above shifts
	   when an answer is picked. 8.25rem is the tallest real state (feedback at
	   two lines, its button and the card's padding), measured not guessed. */
	.footer {
		display: flex;
		width: 100%;
		flex: 1;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 8.25rem;
	}

	/* Only the states with feedback text get a card; the bare skip button and
	   the pre-pick states don't. Doubles as the backing this fixed bar needs,
	   since a short viewport can scroll the options grid up underneath it. */
	.footer-card {
		display: flex;
		width: 100%;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--space-2);
		padding: var(--space-3);
		border: 1px solid var(--color-border-soft);
		border-radius: var(--radius-lg);
		background: var(--color-background-translucent-soft);
		box-shadow: var(--shadow-sm);
	}

	.feedback {
		margin: 0;
		font-weight: 700;
		text-align: center;
	}

	/* .footer-card centres its children rather than stretching them, so the lone
	   Next button — the only one directly under it — needs an explicit width. */
	.footer-card > :global(.button) {
		width: 100%;
	}

	/* A button, not a link: it acts rather than navigates. Sized to its own text
	   rather than the row, but min-height stays at --tap-target-min — looking
	   smaller is a padding choice, not a smaller tap target. Not <Button>: its
	   translucent background and single use are its own (Conventions #3). */
	.skip {
		min-height: var(--tap-target-min);
		padding: 0 var(--space-4);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-pill);
		background: var(--color-background-translucent);
		color: var(--color-text-secondary);
		font-size: var(--font-size-sm);
		cursor: pointer;
		transition: background-color var(--transition-fast);
	}

	.skip:hover {
		background: var(--color-background-hover);
	}

	.skip-actions {
		display: flex;
		width: 100%;
		gap: var(--space-2);
	}

	/* Not <Button variant="secondary" opaque>: "Mute for 15 min" is real content
	   in a half-width slot and needs the smaller font-size below, which Button
	   has no variant for. Opaque because this footer is fixed-position and
	   shouldn't let scrolled-up content show through. */
	.mute {
		flex: 1;
		min-height: var(--tap-target-min);
		padding: 0 var(--space-4);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-pill);
		background: var(--color-background);
		color: var(--color-text-primary);
		font-family: var(--font-heading);
		font-weight: var(--font-heading-weight);
		font-size: var(--font-size-sm);
		cursor: pointer;
		transition: background-color var(--transition-fast);
	}

	.mute:hover {
		background: var(--color-background-hover);
	}
</style>
