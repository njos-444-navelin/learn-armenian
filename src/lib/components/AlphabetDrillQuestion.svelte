<script lang="ts">
	import { fade } from 'svelte/transition';
	import { browser } from '$app/environment';
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

	// Same reduced-motion-aware pattern as AlphabetTrainer.svelte's own
	// screen fade — computed once (not reactive), since a transition's
	// params are read when it's created, not on every re-render.
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

	// Unlike the learn step's own dots, this one does distinguish "already
	// answered" from "the question you're on" — a real distinction here,
	// since drill questions (unlike learn steps) have a right/wrong outcome
	// worth showing at a glance.
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

	// An 'audio' question is unanswerable without hearing the clip — the
	// learner would have to tap play before they could do anything else
	// anyway, so play it the instant the question appears instead of
	// making that the first required action. This component remounts
	// fresh for every question (see the `{#key drillIndex}` wrapper in
	// AlphabetTrainer.svelte), so a plain mount-time effect is enough;
	// nothing here needs to re-fire mid-question. Reaching this screen
	// always follows a click (Practice, Next, a drill answer), which is
	// what keeps this within the browsers' autoplay-permission window —
	// playAudio()'s own `.catch(() => {})` still covers the rare case
	// where a browser blocks it anyway.
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
		<!-- Unlike a word's audio elsewhere in the app (SpeakerButton.svelte,
		     preload="none"), an 'audio' drill question is guaranteed to need
		     this clip — the learner can't answer without hearing it — so
		     there's no "maybe never needed" case to stay lazy for. -->
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
	/* Same fix, same reason, as AlphabetLearnStep.svelte's .learn-step: left
	   as plain siblings, this screen's total content height (which varies
	   question to question — the options grid's text wraps differently
	   letter to letter) changed where PageShell's own centering put the
	   whole block, while the footer stayed genuinely fixed-position below
	   it — the mismatch between those two showed up as a gap of visible
	   page background between the last option row and the floating footer
	   whenever this question's content was shorter than the tallest one.
	   Forcing this wrapper to always claim the full height PageShell would
	   otherwise center it within fixes both at once: the header gets a
	   fixed starting position, and .content-wrap's `flex: 1` centers the
	   actual stage+options content in whatever's left above the footer,
	   instead of the footer floating wherever the outer centering happened
	   to land. `<FloatingActionBar>` has to live inside this wrapper too,
	   for the same reason it does in AlphabetLearnStep.svelte's own
	   .learn-step: its dynamically-measured bottom spacer needs to be one
	   of *this* flex column's children for `.content-wrap`'s `flex: 1` to
	   correctly absorb only what's actually left over, rather than this
	   component trying to predict that spacer's height itself. */
	.drill-step {
		display: flex;
		width: 100%;
		min-height: var(--page-content-min-height);
		flex-direction: column;
		align-items: center;
		gap: var(--space-5);
	}

	/* flex-end, not center, on a mobile-sized viewport: a question with
	   less content than the tallest case (an 'audio' question has no
	   options-text to wrap, a 'sound' question's voicing labels are
	   short) left slack on both sides of this block when centered — and
	   the slack *below* it directly read as "too much space before the
	   floating footer," since that's the one edge sitting right next to
	   something else visible. Bottom-aligning moves that same slack above
	   the stage instead, right under the header, where there's nothing
	   else nearby for a gap to look wrong against. That reasoning flips on
	   a tall desktop viewport, though: `--page-content-min-height` scales
	   with the real viewport height, so the *amount* of slack scales with
	   it too, and bottom-aligning a much bigger pile of slack no longer
	   reads as "a bit snug near the footer" — it reads as the content
	   sinking to the bottom of a mostly-empty page. Past the same
	   min-width breakpoint AlphabetLetterSheet.svelte already uses for
	   "wide enough to stop treating this like a phone," go back to
	   ordinary centering. */
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

	/* Same reasoning as AlphabetLearnStep.svelte's own glyph circle: on a
	   short viewport, this circle plus the header/prompt/options/footer
	   around it can outgrow the space available before the width alone
	   would ever look cramped. */
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
		transition:
			background-color var(--transition-fast),
			outline-color var(--transition-fast);
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
			opacity var(--transition-fast),
			outline-color var(--transition-fast);
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
		/* Tight on purpose, same reasoning as .option-text's own 1.25 — a
		   glyph pair never wraps, so there's no second line to give
		   breathing room to, and the inherited body line-height (1.5) was
		   adding real height to every option for nothing. Together with the
		   smaller font-size, this keeps the whole grid shorter, leaving
		   more clearance before the floating skip button below it. */
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

	/* Always reserves the same height regardless of which of the four
	   states below is showing (nothing yet, the bare skip button, or the
	   card) — that's what actually keeps this fixed bar's own height
	   constant so nothing above it shifts when an answer is picked, not
	   the card itself (see .footer-card): a card rendered around *nothing*
	   for the pre-pick states was its own bug — an empty floating box with
	   no content in it. 8.25rem matches the tallest real state (the
	   .footer-card case: feedback text at up to 2 lines, its button, and
	   the card's own padding), measured directly rather than guessed. */
	.footer {
		display: flex;
		width: 100%;
		flex: 1;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 8.25rem;
	}

	/* The card only wraps a state that actually has feedback text to
	   frame — the standalone skip button doesn't need one ("just the
	   button itself more than suffices"), and there's deliberately no
	   card at all for the pre-pick states with nothing to show yet. Still
	   doubles as the anti-overlap backing this bar needs in general: it's
	   fixed-position, sitting on top of the options grid above it, and a
	   short viewport can genuinely scroll that grid up underneath it. */
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

	/* .footer-card centers its children instead of stretching them
	   (align-items: center, unlike AlphabetSessionSummary.svelte's own
	   .actions), so the lone Next button here — the only :global(.button)
	   sitting directly under .footer-card, as opposed to one nested inside
	   .skip-actions below — needs its width set explicitly. */
	.footer-card > :global(.button) {
		width: 100%;
	}

	/* A real (if secondary-looking) button, not a link — it performs an
	   action, it doesn't navigate anywhere. Deliberately smaller than the
	   Next button or .mute: no min-width, no flex stretch, so it stays
	   sized to its own text instead of spanning the row. min-height stays
	   at --tap-target-min regardless — "smaller-looking" is a
	   padding/width choice, not a smaller tap target. Not <Button>: its
	   translucent background and single-consumer use are both genuinely
	   its own (see CONVENTIONS.md #3). */
	.skip {
		min-height: var(--tap-target-min);
		padding: 0 var(--space-4);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-pill);
		background: var(--color-background-translucent);
		color: var(--color-text-secondary);
		font-size: var(--font-size-sm);
		cursor: pointer;
		transition:
			background-color var(--transition-fast),
			outline-color var(--transition-fast);
	}

	.skip:hover {
		background: var(--color-background-hover);
	}

	.skip-actions {
		display: flex;
		width: 100%;
		gap: var(--space-2);
	}

	/* Not <Button variant="secondary" opaque>: this sits beside a
	   full-size Next in a half-width flex:1 slot, and "Mute for 15 min" /
	   "Отключить на 15 мин" is real content, not a short label — it needs
	   the smaller font-size below to keep fitting there. Button.svelte has
	   no size variant, and one isn't worth adding for this single case.
	   Opaque, not transparent, for the same reason as .feedback and
	   AlphabetLearnStep.svelte's .prev: this footer is fixed-position, and
	   this button sitting on top of scrolled-up content shouldn't let it
	   show through. */
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
		transition:
			background-color var(--transition-fast),
			outline-color var(--transition-fast);
	}

	.mute:hover {
		background: var(--color-background-hover);
	}
</style>
