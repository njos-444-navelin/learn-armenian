<script lang="ts">
	import { fullVoicing, type AlphabetLetter } from '$lib/content/alphabet';
	import { letterAudioSrc } from '$lib/content/alphabetAudio';
	import type { Word } from '$lib/content/words/types';
	import { wordAudioSrc } from '$lib/content/words/audio';
	import { t } from '$lib/i18n/current';
	import {
		inWordLabel,
		learnNextLabel,
		learnPreviousLabel,
		learnSectionLabel,
		learnStartPracticingLabel,
		playPronunciationLabel
	} from '$lib/i18n/dictionaries/alphabetTrainer';
	import AlphabetProgressHeader, { type DotState } from './AlphabetProgressHeader.svelte';
	import Button from './Button.svelte';
	import FloatingActionBar from './FloatingActionBar.svelte';
	import SpeakerButton from './SpeakerButton.svelte';

	interface Props {
		letter: AlphabetLetter;
		words: readonly Word[];
		index: number;
		total: number;
		isLast: boolean;
		onPrev: () => void;
		onNext: () => void;
	}

	let { letter, words, index, total, isLast, onPrev, onNext }: Props = $props();

	let pair = $derived(letter.uppercase === undefined ? letter.lowercase : `${letter.uppercase} ${letter.lowercase}`);

	// No "already done" vs. "currently on" distinction here (unlike the
	// drill's own dots) — every letter up to and including this one is
	// just 'current', which reads as one steadily-growing filled bar.
	let dotStates = $derived<readonly DotState[]>(
		Array.from({ length: total }, (_, n) => (n <= index ? 'current' : 'empty'))
	);
</script>

<div class="learn-step">
	<AlphabetProgressHeader sectionLabel={learnSectionLabel} {index} {total} {dotStates} />

	<div class="stage-wrap">
		<div class="stage">
			<div class="glyph-row">
				<div class="glyph-circle">
					<span lang="hy" class="glyph">{pair}</span>
				</div>
				<SpeakerButton src={letterAudioSrc(letter.id)} />
				<span class="sr-only">{t(playPronunciationLabel)}</span>
			</div>

			<p class="voicing">{t(fullVoicing(letter))}</p>

			{#each words as word (word.id)}
				<div class="word-card">
					<div class="word-text">
						<span class="word-label">{t(inWordLabel)}</span>
						<span lang="hy" class="word-armenian">{word.armenian}</span>
						<span class="word-translation">{t(word.translation)}</span>
					</div>
					<SpeakerButton src={wordAudioSrc(word.id)} />
				</div>
			{/each}
		</div>
	</div>

	<FloatingActionBar bare>
		<div class="actions">
			<button type="button" class="prev" aria-label={t(learnPreviousLabel)} onclick={onPrev}>
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" width="20" height="20">
					<path d="m15 18-6-6 6-6" />
				</svg>
			</button>
			<Button type="button" variant="primary" onclick={onNext}>
				{isLast ? t(learnStartPracticingLabel) : t(learnNextLabel)}
			</Button>
		</div>
	</FloatingActionBar>
</div>

<style>
	/* PageShell centers its content as a single block, height and all — so
	   with just a header + stage stacked in normal flow, this step's total
	   height (which varies letter to letter: the voicing text and word
	   count both do) changed where that whole block started, and the
	   header moved right along with it. Forcing this wrapper to always
	   claim the full height PageShell would otherwise center it within
	   gives the header a fixed starting position regardless of what's
	   below it — see PageShell.svelte's `--page-content-min-height` for
	   where this number comes from. `<FloatingActionBar>` moved inside
	   this wrapper (rather than sitting alongside it) so its own
	   dynamically-measured bottom spacer (see FloatingActionBar.svelte) is
	   one of *this* flex column's children too — `.stage-wrap`'s `flex: 1`
	   then absorbs whatever's actually left after it, instead of this
	   component trying to predict that spacer's height itself, which —
	   unlike every other number here — isn't a static token to begin with. */
	.learn-step {
		display: flex;
		width: 100%;
		min-height: var(--page-content-min-height);
		flex-direction: column;
		align-items: center;
		gap: var(--space-5);
	}

	.stage-wrap {
		display: flex;
		width: 100%;
		flex: 1;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}

	.stage {
		display: flex;
		width: 100%;
		flex-direction: column;
		align-items: center;
		gap: var(--space-3);
	}

	.glyph-row {
		display: grid;
		/* Two equal 1fr tracks flank the circle — the left one stays empty,
		   the right one holds the speaker button left-aligned against the
		   circle. Since both flanks get the same share of the leftover
		   width regardless of the speaker's own size, the circle itself
		   ends up centered on the row rather than the row's *content*
		   (circle + speaker together) being centered, which would push the
		   circle off-center to make room for the speaker beside it. */
		width: 100%;
		grid-template-columns: 1fr auto 1fr;
		align-items: center;
		gap: var(--space-4);
	}

	.glyph-row :global(.speaker) {
		grid-column: 3;
		justify-self: start;
		flex-shrink: 0;
		width: 3.5rem;
		height: 3.5rem;
		background: var(--color-surface);
	}

	.glyph-circle {
		display: flex;
		grid-column: 2;
		width: clamp(9rem, 40vw, 11rem);
		aspect-ratio: 1;
		flex-shrink: 0;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		background: var(--color-surface);
	}

	/* On a short viewport, this circle (plus the header, voicing text, word
	   card, and fixed footer around it) can outgrow the space available —
	   same mechanism as the letter grid's tiles growing unbounded with
	   width (see AlphabetLetterGrid.svelte), just the height axis here. */
	@media (max-height: 700px) {
		.glyph-circle {
			width: clamp(7rem, 34vw, 9rem);
		}
	}

	.glyph {
		font-family: var(--font-heading);
		font-weight: 900;
		font-size: clamp(2.25rem, 10vw, 3.25rem);
		line-height: 1;
		color: var(--color-accent-800);
	}

	.voicing {
		/* A little extra on top of .stage's own flex `gap` — enough that this
		   text reads as its own paragraph next to the glyph/word-card either
		   side of it, not squeezed flush against both. */
		margin: var(--space-1) 0;
		max-width: 26rem;
		text-align: center;
		font-size: var(--font-size-lg);
		color: var(--color-text-primary);
	}

	.word-card {
		display: flex;
		width: 100%;
		max-width: 24rem;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-5);
		border-radius: var(--radius-lg);
		background: var(--color-surface);
		text-align: left;
	}

	.word-text {
		display: flex;
		min-width: 0;
		flex: 1;
		flex-direction: column;
		gap: 2px;
	}

	.word-label {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--color-text-secondary);
	}

	.word-armenian {
		font-family: var(--font-heading);
		font-weight: var(--font-heading-weight);
		font-size: 1.2rem;
	}

	.word-translation {
		font-size: var(--font-size-sm);
		color: var(--color-text-secondary);
	}

	.actions {
		display: flex;
		width: 100%;
		flex: 1;
		gap: var(--space-2);
	}

	/* Not <Button>: a circular icon-only control, structurally unlike
	   Button.svelte's pill shape, and used in exactly this one place — not
	   worth a shared abstraction (see CONVENTIONS.md #3). Opaque, not
	   transparent — this bar is fixed-position and sits on top of whatever
	   content is behind it, which stopped being purely theoretical once a
	   screen with more than usual content (two word cards) genuinely could
	   still overflow a short viewport despite .learn-step's own sizing (see
	   that class's comment). A transparent button let that overflowing
	   content show straight through it; this background matches the page's
	   own so it just blends in normally everywhere else. */
	.prev {
		display: flex;
		width: var(--tap-target-min);
		height: var(--tap-target-min);
		flex: none;
		align-self: center;
		align-items: center;
		justify-content: center;
		border: 1px solid var(--color-border);
		border-radius: 50%;
		background: var(--color-background);
		color: var(--color-text-primary);
		cursor: pointer;
		transition:
			background-color var(--transition-fast),
			outline-color var(--transition-fast);
	}

	.prev:hover {
		background: var(--color-background-hover);
	}
</style>
