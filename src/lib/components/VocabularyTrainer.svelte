<script lang="ts">
	import { untrack } from 'svelte';
	import { cubicOut } from 'svelte/easing';
	import { fade } from 'svelte/transition';
	import { enhance } from '$app/forms';
	import { invalidate } from '$app/navigation';
	import Button from './Button.svelte';
	import SpeakerButton from './SpeakerButton.svelte';
	import { fitText } from '$lib/actions/fitText';
	import { wordAudioSrc } from '$lib/content/vocabulary/audio';
	import type { TrainingCard } from '$lib/content/vocabulary/training';
	import { getLocale, t } from '$lib/i18n/current';
	import { withLocale } from '$lib/i18n/paths';
	import { registerLabels } from '$lib/i18n/dictionaries/vocabulary';
	import {
		allCaughtUpHeading,
		allCaughtUpMessage,
		backToLessonsLabel,
		flipButtonLabel,
		flipHint,
		gradeLabels,
		gradeSaveFailedMessage,
		intervalLabel,
		nextCardInLabel,
		todaysCountLabel
	} from '$lib/i18n/dictionaries/vocabularyTraining';
	import { pushToast } from '$lib/stores/toasts.svelte';
	import { gradeCard, isDue, isGrade, minutesUntilDue, previewGrades, type Grade } from '$lib/srs/scheduler';
	import type { SubmitFunction } from '@sveltejs/kit';

	interface Props {
		initialQueue: readonly TrainingCard[];
	}

	let { initialQueue }: Props = $props();

	// `initialQueue` is only ever meant to be read once, at mount — this
	// component owns advancing through it locally afterwards (see
	// AlphabetQuiz.svelte for the same pattern with its own `letters` prop).
	let activeQueue = $state<TrainingCard[]>(untrack(() => [...initialQueue]));
	// Cards graded this session that aren't due yet — a periodic check (see
	// the `$effect` below) moves each one into `activeQueue` the moment its
	// new due time arrives, so a short "Again"/"Hard" wait can resurface
	// without a page reload. Never a source of truth by itself: each grade
	// still round-trips to the server, which re-reads the DB row fresh and
	// persists the authoritative result — this array only mirrors what we
	// expect that result to be, purely to drive local resurfacing.
	let waiting = $state<TrainingCard[]>([]);
	let flipped = $state(false);
	// True once the translation has been shown for the *current* card —
	// unlike `flipped`, this doesn't reset when flipping back to the front,
	// so the grade buttons (and the "tap to reveal" hint) stay in whichever
	// state they reached on first reveal instead of toggling with the card.
	let revealed = $state(false);
	let now = $state(new Date());

	let locale = $derived(getLocale());
	let current = $derived(activeQueue[0]);
	let remainingNew = $derived(activeQueue.filter((card) => card.isNew).length);
	// Deliberately `activeQueue` only, not `+ waiting.length` — this should
	// read as "how many are in front of you right now", so it drops the
	// instant a due card is graded (even if that same card comes right back
	// via `waiting` a few minutes later, at which point it re-appears here
	// too). Summing both would leave the count unchanged across a
	// due-card→waiting move, which reads as if grading it did nothing.
	let remainingDue = $derived(activeQueue.length - remainingNew);
	let previews = $derived(current !== undefined ? previewGrades(current.state, now) : undefined);
	let soonestWaitMinutes = $derived(
		waiting.length > 0 ? Math.min(...waiting.map((card) => minutesUntilDue(card.state, now))) : 0
	);

	// Left-to-right: easiest (blue) to hardest (red) — see the product spec's
	// own ordering, which runs "very easily, okay, hardly, not at all".
	const GRADE_ORDER: readonly Grade[] = ['easy', 'good', 'hard', 'again'];
	const GRADE_EMOJI: Record<Grade, string> = { easy: '😄', good: '🙂', hard: '😕', again: '😵' };

	/** A new card slides in from the right with a slight clockwise tilt,
	 * fading in as it settles — deliberately distinct from the flip
	 * transform so a fresh card reads as a new card, not as the previous one
	 * un-flipping back to its front face. */
	function cardEnter(_node: Element, params: { duration?: number } = {}) {
		const duration = params.duration ?? 380;
		return {
			duration,
			easing: cubicOut,
			css: (t: number, u: number) =>
				`transform: translateX(${u * 100}%) rotate(${u * 10}deg); opacity: ${t};`
		};
	}

	function flip(): void {
		flipped = !flipped;
		if (flipped) revealed = true;
		now = new Date();
	}

	/** The card is a `div[role=button]`, not a native `<button>`, precisely so
	 * it can contain a real nested `<button>` (the speaker) — a `<button>`
	 * can't validly contain interactive content. That trades away the
	 * native element's built-in Enter/Space activation, so it's replicated
	 * here. */
	function handleCardKeydown(event: KeyboardEvent): void {
		if (event.key !== 'Enter' && event.key !== ' ') return;
		event.preventDefault();
		flip();
	}

	/** Moves any `waiting` card whose due time has arrived into `activeQueue`,
	 * soonest-due first, and refreshes `now` regardless (keeps the "next card
	 * in Xmin" countdown and the flipped card's interval previews live). */
	function tick(): void {
		const at = new Date();
		now = at;
		if (waiting.length === 0) return;
		const ready = waiting.filter((card) => isDue(card.state, at));
		if (ready.length === 0) return;
		ready.sort((a, b) => a.state.dueAt.getTime() - b.state.dueAt.getTime());
		waiting = waiting.filter((card) => !isDue(card.state, at));
		activeQueue = [...activeQueue, ...ready];
	}

	$effect(() => {
		const timer = setInterval(tick, 3000);
		return () => clearInterval(timer);
	});

	/**
	 * Optimistic by design — see Conventions §8's exception note. The queue
	 * advances immediately, before the `POST` even resolves: grading is a
	 * low-stakes, idempotent write (regrading the same word just upserts the
	 * same row again), so waiting on a round-trip for every single card
	 * would make a fast flashcard session feel like it's stalling on the
	 * network for no real benefit. A failed write surfaces as a toast
	 * instead of a spinner, and doesn't roll the UI back.
	 */
	function submitGrade(): SubmitFunction {
		return ({ submitter }) => {
			const value = submitter?.getAttribute('value') ?? '';
			const grade = isGrade(value) ? value : null;
			const gradedCard = current;
			const gradedAt = new Date();

			if (grade !== null && gradedCard !== undefined) {
				const next = gradeCard(gradedCard.state, grade, gradedAt);
				activeQueue = activeQueue.slice(1);
				flipped = false;
				revealed = false;
				// Only 'learning'/'relearning' cards run on short (minutes)
				// steps and can plausibly come back up this session. A card
				// that graduated to 'review' has an interval of at least a
				// day (see scheduler.ts) — it's done for today, so it's
				// dropped here rather than left in `waiting` forever, both
				// so it stops being polled and so it stops being counted as
				// part of today's remaining work below.
				if (next.phase !== 'review') {
					waiting = [...waiting, { ...gradedCard, state: next, isNew: false }];
				}
				tick();
			}

			return async ({ result }) => {
				if (result.type === 'failure' || result.type === 'error') {
					pushToast(gradeSaveFailedMessage, 'error');
				}
				// Deliberately not calling `update()` — all UI state is already
				// handled optimistically above, and the default
				// `invalidateAll()` would refetch the whole training queue from
				// the server mid-session for no benefit. Still refreshes the
				// account-menu practice badge specifically, so it's already
				// correct by the time the learner navigates away instead of
				// showing stale "words to practice" after they just cleared
				// them — see the `depends()` call this key matches in the
				// locale layout's load.
				await invalidate('vocabulary:practice-status');
			};
		};
	}
</script>

<p class="summary">{t(todaysCountLabel(remainingNew, remainingDue))}</p>

{#if current !== undefined}
	<div class="card-slot">
		<div class="card-clip">
			{#key `${current.deckId}:${current.word.id}`}
				<div
					class="card"
					class:flipped
					role="button"
					tabindex="0"
					onclick={flip}
					onkeydown={handleCardKeydown}
					aria-label={t(flipButtonLabel(flipped))}
					in:cardEnter
					out:fade={{ duration: 150 }}
				>
					<div class="card-inner">
						<div class="face front">
							<span class="word-row">
								<span class="word" lang="hy" use:fitText>{current.word.armenian}</span>
								<SpeakerButton src={wordAudioSrc(current.deckId, current.word.id)} />
							</span>
						</div>
						<div class="face back">
							<span class="word" use:fitText>{t(current.word.translation)}</span>
							{#if current.word.register !== undefined}
								<em class="register">{t(registerLabels[current.word.register])}</em>
							{/if}
							{#if current.word.note !== undefined}
								<p class="note">{t(current.word.note)}</p>
							{/if}
						</div>
					</div>
				</div>
			{/key}
		</div>
	</div>

	<p class="hint" aria-hidden={revealed}>{revealed ? '' : t(flipHint)}</p>

	<form method="POST" action="?/grade" use:enhance={submitGrade()} class="grades" class:revealed>
		<input type="hidden" name="deckId" value={current.deckId} />
		<input type="hidden" name="wordId" value={current.word.id} />
		{#each GRADE_ORDER as grade (grade)}
			<button
				type="submit"
				name="grade"
				value={grade}
				class="grade-button {grade}"
				disabled={!revealed}
				aria-hidden={!revealed}
				tabindex={revealed ? 0 : -1}
			>
				<span class="emoji" aria-hidden="true">{GRADE_EMOJI[grade]}</span>
				<span class="interval">
					{previews !== undefined ? t(intervalLabel(minutesUntilDue(previews[grade], now))) : ''}
				</span>
				<span class="sr-only">{t(gradeLabels[grade])}</span>
			</button>
		{/each}
	</form>
{:else if waiting.length > 0}
	<p aria-live="polite">{t(nextCardInLabel(soonestWaitMinutes))}</p>
{:else}
	<h2>{t(allCaughtUpHeading)}</h2>
	<p>{t(allCaughtUpMessage)}</p>
	<Button href={withLocale(locale, '/learn')} variant="primary">{t(backToLessonsLabel)}</Button>
{/if}

<style>
	.summary {
		color: var(--color-text-secondary);
		font-size: var(--font-size-sm);
	}

	h2 {
		margin: 0;
		font-size: var(--font-size-lg);
	}

	/* Gives the outgoing and incoming `.card` (see the `{#key}` block above)
	   a shared box to sit absolutely within, so the two overlap exactly
	   during the crossfade instead of stacking in normal flow and shoving
	   the hint/grade buttons below down for the transition's duration. */
	.card-slot {
		position: relative;
		width: 100%;
		max-width: 20rem;
		aspect-ratio: 3 / 4;
	}

	/* Clips the incoming card's slide-in (it starts a full card-width to the
	   right, per `cardEnter` below) so it wipes in from this box's own right
	   edge instead of the browser briefly growing the page's scrollable
	   width to fit it. Extends 1rem past `.card-slot` on every side — and
	   `.card` pulls back in by the same 1rem — purely so the card's resting
	   box-shadow still has room to render instead of being clipped flush
	   against its own edge. */
	.card-clip {
		position: absolute;
		inset: -1rem;
		overflow: hidden;
	}

	.card {
		position: absolute;
		inset: 1rem;
		perspective: 1200px;
		cursor: pointer;
	}

	.card-inner {
		position: relative;
		width: 100%;
		height: 100%;
		transition: transform 0.5s;
		transform-style: preserve-3d;
	}

	.card.flipped .card-inner {
		transform: rotateY(180deg);
	}

	.face {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--space-2);
		backface-visibility: hidden;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		background: var(--color-background);
		box-shadow: var(--shadow-md);
		padding: var(--space-5);
	}

	.face.back {
		transform: rotateY(180deg);
	}

	.word-row {
		display: flex;
		min-width: 0;
		max-width: 100%;
		align-items: center;
		justify-content: center;
		gap: var(--space-2);
	}

	.word-row .word {
		min-width: 0;
	}

	.word {
		display: inline-block;
		max-width: 100%;
		overflow: hidden;
		font-size: var(--font-size-xl);
		font-weight: 700;
		text-align: center;
		overflow-wrap: break-word;
	}

	.register {
		color: var(--color-text-secondary);
		font-size: var(--font-size-sm);
		font-style: italic;
	}

	.note {
		max-width: 100%;
		margin: 0;
		color: var(--color-text-secondary);
		font-size: var(--font-size-sm);
		text-align: center;
	}

	.hint {
		min-height: 1.5em;
		color: var(--color-text-secondary);
		font-size: var(--font-size-sm);
	}

	.grades {
		display: flex;
		width: 100%;
		max-width: 24rem;
		gap: var(--space-2);
	}

	.grade-button {
		display: flex;
		flex: 1 1 0;
		min-height: var(--tap-target-min);
		min-width: 0;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--space-1);
		border: none;
		border-radius: var(--radius-md);
		font-family: var(--font-family-sans);
		font-weight: 600;
		cursor: pointer;
		transition:
			background-color var(--transition-fast),
			opacity var(--transition-fast);
	}

	/* Reserves the row's height and position before the card is flipped, so
	   revealing the translation never shifts anything else on the page —
	   the buttons fade in and become interactive, they don't appear. */
	.grades:not(.revealed) .grade-button {
		visibility: hidden;
	}

	.grade-button:disabled {
		cursor: not-allowed;
	}

	.grades.revealed .grade-button:disabled {
		opacity: 0.6;
	}

	.emoji {
		font-size: var(--font-size-lg);
		line-height: 1;
	}

	.interval {
		font-size: var(--font-size-sm);
	}

	.grade-button.easy {
		background: var(--color-grade-easy);
		color: var(--color-on-grade-easy);
	}

	.grade-button.easy:hover:not(:disabled) {
		background: var(--color-grade-easy-hover);
	}

	.grade-button.good {
		background: var(--color-grade-good);
		color: var(--color-on-grade-good);
	}

	.grade-button.good:hover:not(:disabled) {
		background: var(--color-grade-good-hover);
	}

	.grade-button.hard {
		background: var(--color-grade-hard);
		color: var(--color-on-grade-hard);
	}

	.grade-button.hard:hover:not(:disabled) {
		background: var(--color-grade-hard-hover);
	}

	.grade-button.again {
		background: var(--color-grade-again);
		color: var(--color-on-grade-again);
	}

	.grade-button.again:hover:not(:disabled) {
		background: var(--color-grade-again-hover);
	}
</style>
