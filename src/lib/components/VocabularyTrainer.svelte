<script lang="ts">
	import { untrack } from 'svelte';
	import { cubicOut } from 'svelte/easing';
	import { fade } from 'svelte/transition';
	import { enhance } from '$app/forms';
	import { invalidate } from '$app/navigation';
	import { blurAfterClick } from '$lib/actions/blurAfterClick';
	import Button from './Button.svelte';
	import SpeakerButton from './SpeakerButton.svelte';
	import { fitText } from '$lib/actions/fitText';
	import { wordAudioSrc } from '$lib/content/words/audio';
	import type { TrainingCard } from '$lib/content/vocabulary/training';
	import { getLocale, t, tPartial } from '$lib/i18n/current';
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
		nearlyThereHeading,
		nextCardInLabel,
		nextRoundLabel,
		roundDoneHeading,
		roundRemainingMessage,
		stragglersReturnLabel,
		todaysCountLabel
	} from '$lib/i18n/dictionaries/vocabularyTraining';
	import { pushToast } from '$lib/stores/toasts.svelte';
	import { gradeCard, isDue, isGrade, minutesUntilDue, previewGrades, type Grade } from '$lib/srs/scheduler';
	import type { SubmitFunction } from '@sveltejs/kit';

	interface Props {
		initialQueue: readonly TrainingCard[];
		/** What this round's two caps kept out of `initialQueue`, so the caught-up
		 * screen can say "that round's done, here's what's left". */
		newCardsHeldBack: number;
		dueCardsHeldBack: number;
		/** Fetches the next round. The page owns this because delivering the new
		 * queue means remounting this component — see the `{#key}` it sits in. */
		onNextRound: () => void;
		nextRoundPending: boolean;
	}

	let {
		initialQueue,
		newCardsHeldBack,
		dueCardsHeldBack,
		onNextRound,
		nextRoundPending
	}: Props = $props();

	// Read once at mount; this component owns advancing through it afterwards.
	let activeQueue = $state<TrainingCard[]>(untrack(() => [...initialQueue]));
	// Cards graded this session that aren't due yet; the `$effect` below moves
	// each one back into `activeQueue` when its due time arrives. Mirrors what
	// we expect the server to persist, never a source of truth.
	let waiting = $state<TrainingCard[]>([]);
	let flipped = $state(false);
	// Sticky, unlike `flipped`: the grade buttons stay as they were on first
	// reveal instead of toggling with the card.
	let revealed = $state(false);
	let now = $state(new Date());

	let locale = $derived(getLocale());
	let current = $derived(activeQueue[0]);
	let remainingNew = $derived(activeQueue.filter((card) => card.isNew).length);
	// `activeQueue` only: the count should drop the instant a card is graded.
	let remainingDue = $derived(activeQueue.length - remainingNew);
	// See `todaysCountLabel`, which only calls it a round when there's another.
	let moreWaiting = $derived(dueCardsHeldBack > 0 || newCardsHeldBack > 0);
	let previews = $derived(current !== undefined ? previewGrades(current.state, now) : undefined);
	let soonestWaitMinutes = $derived(
		waiting.length > 0 ? Math.min(...waiting.map((card) => minutesUntilDue(card.state, now))) : 0
	);

	// Hardest to easiest, the standard SRS reviewer order.
	const GRADE_ORDER: readonly Grade[] = ['again', 'hard', 'good', 'easy'];

	/** Slides in from the right with a slight tilt, deliberately distinct from
	 * the flip transform so a fresh card doesn't read as the previous one
	 * un-flipping. A percentage, so it scales with the card. */
	function cardEnter(_node: Element, params: { duration?: number } = {}) {
		const duration = params.duration ?? 380;
		return {
			duration,
			easing: cubicOut,
			css: (t: number, u: number) => `transform: translateX(${u * 60}%) rotate(${u * 10}deg); opacity: ${t};`
		};
	}

	function flip(): void {
		flipped = !flipped;
		if (flipped) revealed = true;
		now = new Date();
	}

	/** The card is a `div[role=button]` so it can contain the speaker `<button>`,
	 * which a real `<button>` may not — hence the hand-rolled activation. */
	function handleCardKeydown(event: KeyboardEvent): void {
		if (event.key !== 'Enter' && event.key !== ' ') return;
		event.preventDefault();
		flip();
	}

	/** Moves due `waiting` cards into `activeQueue`, and refreshes `now` either
	 * way to keep the countdown and the interval previews live. */
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
	 * Optimistic by design — see Conventions §8's exception note. Grading is a
	 * low-stakes idempotent write, so a failure surfaces as a toast rather than
	 * blocking the queue or rolling the UI back.
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
				// Only learning/relearning cards run on short steps and can come
				// back this session; a graduated one is a day out (scheduler.ts).
				if (next.phase !== 'review') {
					waiting = [...waiting, { ...gradedCard, state: next, isNew: false }];
				}
				tick();
			}

			return async ({ result }) => {
				if (result.type === 'failure' || result.type === 'error') {
					pushToast(gradeSaveFailedMessage, 'error');
				}
				// Deliberately no `update()`: the UI is handled optimistically above,
				// and `invalidateAll()` would refetch the whole queue mid-session.
				// Only the practice badge is refreshed — see the matching
				// `depends()` in the locale layout's load.
				await invalidate('vocabulary:practice-status');
			};
		};
	}
</script>

{#if current !== undefined}
	<!-- Only while cards are in hand: on the end-of-round screens this could
	     only ever say "0 new · 0 due", right above a message naming the words
	     still waiting. -->
	<p class="summary">{t(todaysCountLabel(remainingDue, remainingNew, moreWaiting))}</p>

	<div class="trainer">
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
						use:blurAfterClick
					>
						<div class="card-inner">
							<div class="face front">
								<span class="word-row">
									<span class="word" lang="hy" use:fitText>{current.word.armenian}</span>
									<SpeakerButton src={wordAudioSrc(current.word.id)} />
								</span>
							</div>
							<div class="face back">
								<!-- Gated on `revealed` so there's nothing readable to flash if the
								     compositing race described on `.card-inner` paints this face
								     unrotated. `revealed` flips in the same tick as `flipped`, so a real
								     flip is still immediate. -->
								{#if revealed}
									<span class="word" use:fitText>{t(current.word.translation)}</span>
									{#if current.word.register !== undefined}
										<em class="register">{t(registerLabels[current.word.register])}</em>
									{/if}
									<!-- Either comment may exist in one language only. -->
									{@const global = tPartial(current.word.global)}
									{#if global !== undefined}
										<p class="note">{global}</p>
									{/if}
									{@const cardOnly = tPartial(current.word.cardOnly)}
									{#if cardOnly !== undefined}
										<p class="note">{cardOnly}</p>
									{/if}
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
					<span class="g-label">{t(gradeLabels[grade])}</span>
					<span class="interval">
						{previews !== undefined ? t(intervalLabel(minutesUntilDue(previews[grade], now))) : ''}
					</span>
				</button>
			{/each}
		</form>
	</div>
{:else if moreWaiting}
	<!-- Ahead of the `waiting` branch on purpose: otherwise a round that put
	     cards on a ten-minute step leaves the next round unreachable behind a
	     bare countdown. -->
	<h2>{t(roundDoneHeading)}</h2>
	<p>{t(roundRemainingMessage(dueCardsHeldBack, newCardsHeldBack))}</p>
	{#if waiting.length > 0}
		<!-- A footnote: the stragglers are no longer the only thing on offer. -->
		<p class="stragglers" aria-live="polite">
			{t(stragglersReturnLabel(waiting.length, soonestWaitMinutes))}
		</p>
	{/if}
	<div class="actions">
		<Button variant="primary" loading={nextRoundPending} onclick={onNextRound}>
			{t(nextRoundLabel)}
		</Button>
		<Button href={withLocale(locale, '/learn')} variant="secondary">{t(backToLessonsLabel)}</Button>
	</div>
{:else if waiting.length > 0}
	<!-- Nothing held back, so the countdown is the whole screen. Still carries
	     a way out — otherwise there's nothing to do for up to ten minutes. -->
	<h2>{t(nearlyThereHeading)}</h2>
	<p aria-live="polite">{t(nextCardInLabel(soonestWaitMinutes))}</p>
	<Button href={withLocale(locale, '/learn')} variant="secondary">{t(backToLessonsLabel)}</Button>
{:else}
	<h2>{t(allCaughtUpHeading)}</h2>
	<p>{t(allCaughtUpMessage)}</p>
	<Button href={withLocale(locale, '/learn')} variant="primary">{t(backToLessonsLabel)}</Button>
{/if}

<style>
	/* Centred rather than stretched, so the pair reads as one block of actions
	   inside PageShell's much airier page-wide gap. */
	.actions {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-2);
	}

	/* A footnote under the round's remaining count, not a heading of its own. */
	.summary,
	.stragglers {
		color: var(--color-text-secondary);
		font-size: var(--font-size-sm);
	}

	h2 {
		margin: 0;
		font-size: var(--font-size-lg);
	}

	/* Tighter than PageShell's default gap: the card runs tall, and with a
	   phone's address bar expanded the default left the grade buttons clipped
	   under it. Scoped here rather than shrinking the shared gap. */
	.trainer {
		display: flex;
		width: 100%;
		flex-direction: column;
		align-items: center;
		gap: var(--space-3);
	}

	/* A shared box for the outgoing and incoming `.card` to sit absolutely
	   within, so they overlap during the crossfade instead of shoving the rest
	   of the stack down. Its max-width is the main lever for keeping the whole
	   card+hint+buttons stack above a phone's address bar. */
	.card-slot {
		position: relative;
		width: 100%;
		max-width: 17rem;
		aspect-ratio: 3 / 4;
	}

	/* Bounds the incoming card's slide-in. Extends 1rem past `.card-slot` on
	   three sides to give the resting box-shadow room, and 11rem on the right
	   to cover `cardEnter()`'s slide. `.card`'s inset must mirror these numbers
	   exactly — see its comment. */
	.card-clip {
		position: absolute;
		inset: -1rem -11rem -1rem -1rem;
		overflow: hidden;
	}

	.card {
		position: absolute;
		/* Must cancel out `.card-clip`'s asymmetric inset side for side, since
		   that's the positioning ancestor — otherwise the resting card itself is
		   stretched, not just its animation's clip region. Mirror any change to
		   `.card-clip` here. */
		inset: 1rem 11rem 1rem 1rem;
		/* Prefixed consistently across this 3D stack: the unprefixed properties
		   alone didn't stop the first-paint mirrored-face flash. */
		-webkit-perspective: 1200px;
		perspective: 1200px;
		cursor: pointer;
	}

	.card-inner {
		position: relative;
		width: 100%;
		height: 100%;
		transition: transform 0.5s;
		-webkit-transform-style: preserve-3d;
		transform-style: preserve-3d;
		/* Own compositing layer, or WebKit/Blink can briefly paint the mirrored
		   back face on a freshly mounted card. Not reliable on its own — gating
		   the back face's content on `revealed` is what actually fixes that — but
		   it's what makes the flip itself composite smoothly. */
		transform: translateZ(0);
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
		-webkit-backface-visibility: hidden;
		backface-visibility: hidden;
		border-radius: var(--radius-lg);
		background: var(--color-surface);
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
		/* Safe on both faces: the Armenian front falls through to Noto Serif
		   Armenian, the companion face to --font-heading's Noto Serif, so the flip
		   stays typographically coherent. */
		font-family: var(--font-heading);
		font-weight: var(--font-heading-weight);
		font-size: var(--font-size-xl);
		text-align: center;
		overflow-wrap: break-word;
	}

	.register {
		color: var(--color-text-secondary);
		font-size: var(--font-size-sm);
		font-style: italic;
	}

	/* A footnote to the translation, not a second answer: a step smaller and
	   in secondary ink, which can't go paler (see --font-size-xs in
	   tokens.css). */
	.note {
		max-width: 100%;
		margin: var(--space-2) 0 0;
		color: var(--color-text-secondary);
		font-size: var(--font-size-xs);
		line-height: 1.4;
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
		padding: var(--space-3) 0;
		border: none;
		border-radius: var(--radius-md);
		font-family: var(--font-heading);
		font-weight: var(--font-heading-weight);
		cursor: pointer;
		transition:
			background-color var(--transition-fast),
			opacity var(--transition-fast);
	}

	/* Reserves the row's height before the flip, so revealing the translation
	   never shifts the page — the buttons fade in, they don't appear. */
	.grades:not(.revealed) .grade-button {
		visibility: hidden;
	}

	.grade-button:disabled {
		cursor: not-allowed;
	}

	.grades.revealed .grade-button:disabled {
		opacity: 0.6;
	}

	.g-label {
		font-size: var(--font-size-sm);
		line-height: 1.2;
	}

	.interval {
		font-family: var(--font-family-body);
		font-size: 0.75rem;
		opacity: 0.75;
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
