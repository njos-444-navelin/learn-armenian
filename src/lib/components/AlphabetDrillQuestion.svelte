<script lang="ts">
	import { applyAction, enhance } from '$app/forms';
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
		skippedFeedbackLabel,
		stepCounterLabel
	} from '$lib/i18n/dictionaries/alphabetTrainer';
	import { pushToast } from '$lib/stores/toasts.svelte';
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

	let picked = $state<string | 'skipped' | null>(null);
	let audioEl: HTMLAudioElement | undefined = $state();

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

<div class="header">
	<div class="header-row">
		<span class="section-label">{t(drillSectionLabel)}</span>
		<span class="counter">{t(stepCounterLabel(index + 1, total))}</span>
	</div>
	<div class="dots">
		{#each { length: total } as _, n (n)}
			<div class="dot" class:filled={n < index} class:current={n === index}></div>
		{/each}
	</div>
</div>

<div class="stage">
	<p class="prompt">{t(promptText)}</p>

	{#if question.type === 'audio'}
		<button type="button" class="audio-button" onclick={playAudio}>
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
		<audio bind:this={audioEl} src={letterAudioSrc(question.letter.id)} preload="none"></audio>
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
					<span class="option-text">{t(optionLetter.voicing)}</span>
				{:else}
					<span lang="hy" class="option-glyph">{optionGlyph(optionLetter)}</span>
				{/if}
				{#if picked !== null && isCorrect}
					<span class="mark" aria-hidden="true">✓</span>
					<span class="sr-only">{t(correctAnswerHint)}</span>
				{:else if picked !== null && isPicked && !isCorrect}
					<span class="mark" aria-hidden="true">✗</span>
					<span class="sr-only">{t(incorrectAnswerHint)}</span>
				{/if}
			</button>
		{/if}
	{/each}
</form>

<FloatingActionBar bare>
	<div class="footer">
		{#if picked === 'skipped'}
			<p class="feedback" aria-live="polite">{t(skippedFeedbackLabel)}</p>
			<div class="skip-actions">
				<button type="button" class="mute" onclick={muteAndContinue}>{t(muteAudioLabel(AUDIO_MUTE_MINUTES))}</button>
				<button type="button" class="next" onclick={onNext}>{t(nextLabel)}</button>
			</div>
		{:else if picked !== null}
			<p class="feedback" aria-live="polite">
				{picked === question.letter.id ? t(correctFeedbackLabel) : t(incorrectFeedbackLabel)}
			</p>
			<button type="button" class="next" onclick={onNext}>{t(nextLabel)}</button>
		{:else if question.type === 'audio'}
			<button type="button" class="skip" onclick={skip}>{t(audioSkipLabel)}</button>
		{/if}
	</div>
</FloatingActionBar>

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
		position: relative;
		min-height: 4.75rem;
		align-items: center;
		justify-content: center;
		gap: var(--space-2);
		padding: var(--space-5);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		background: var(--color-surface);
		color: var(--color-text-primary);
		cursor: pointer;
		transition: background-color var(--transition-fast), border-color var(--transition-fast), opacity var(--transition-fast);
	}

	/* Absolutely positioned rather than an inline flex sibling next to the
	   text/glyph — an inline mark competes with wrapped `.option-text` for
	   row width, and can push it onto an extra line the instant it appears,
	   growing the option's height on reveal. Since the whole screen sits in
	   a vertically-centered column, that growth visibly shifted everything
	   above the options grid too, not just the grid itself. An overlay mark
	   never changes the button's own content flow, so revealing it can't
	   resize anything. */
	.mark {
		position: absolute;
		top: var(--space-2);
		right: var(--space-2);
		font-size: var(--font-size-sm);
		line-height: 1;
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
		font-size: 1.6rem;
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

	.footer {
		display: flex;
		width: 100%;
		flex: 1;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--space-2);
		/* Matches the tallest state (feedback text + Next button) even when
		   showing a shorter one (the skip button) or nothing at all (a
		   non-audio question before it's answered) — keeps this fixed bar's
		   own height constant across all three states, so nothing above it
		   shifts when an answer is picked. The feedback text (e.g. "Not
		   quite — the correct answer is highlighted above.") routinely wraps
		   to 2 lines at phone widths, measured at ~6.3rem total with the
		   button and gap — 5rem undershot that and let the bar (and the
		   spacer below the whole screen's vertically-centered content) still
		   grow when a wrong answer revealed the 2-line case. */
		min-height: 6.5rem;
	}

	.feedback {
		margin: 0;
		font-weight: 700;
		text-align: center;
	}

	.next {
		width: 100%;
		min-height: var(--tap-target-min);
		border: none;
		border-radius: var(--radius-pill);
		background: var(--color-primary);
		color: var(--color-on-primary);
		font-family: var(--font-heading);
		font-weight: var(--font-heading-weight);
		font-size: var(--font-size-md);
		box-shadow: var(--shadow-sm);
		cursor: pointer;
		transition: background-color var(--transition-fast);
	}

	.next:hover {
		background: var(--color-primary-hover);
	}

	.skip {
		border: none;
		background: transparent;
		color: var(--color-text-secondary);
		font-size: var(--font-size-sm);
		text-decoration: underline;
		text-underline-offset: 3px;
		cursor: pointer;
	}

	.skip-actions {
		display: flex;
		width: 100%;
		gap: var(--space-2);
	}

	.skip-actions .next {
		width: auto;
		flex: 1;
	}

	.mute {
		flex: 1;
		min-height: var(--tap-target-min);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-pill);
		background: transparent;
		color: var(--color-text-primary);
		font-family: var(--font-heading);
		font-weight: var(--font-heading-weight);
		font-size: var(--font-size-sm);
		cursor: pointer;
		transition: background-color var(--transition-fast);
	}

	.mute:hover {
		background: var(--color-surface-hover);
	}
</style>
