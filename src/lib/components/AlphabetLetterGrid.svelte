<script lang="ts">
	import type { AlphabetLetter } from '$lib/content/alphabet';
	import { LEVEL_MIN } from '$lib/alphabet/mastery';
	import { t } from '$lib/i18n/current';
	import {
		knownColdLabel,
		letterTileAriaLabel,
		notMetLabel,
		showLowercaseLabel,
		showUppercaseLabel
	} from '$lib/i18n/dictionaries/alphabetTrainer';

	interface Props {
		letters: readonly AlphabetLetter[];
		levels: Readonly<Record<string, number>>;
		caseDisplay: 'upper' | 'lower';
		onToggleCase: (value: 'upper' | 'lower') => void;
		onOpenLetter: (letterId: string) => void;
	}

	let { letters, levels, caseDisplay, onToggleCase, onOpenLetter }: Props = $props();

	function levelOf(letter: AlphabetLetter): number {
		return levels[letter.id] ?? LEVEL_MIN;
	}

	function pairLabel(letter: AlphabetLetter): string {
		return letter.uppercase === undefined
			? letter.lowercase
			: `${letter.uppercase} ${letter.lowercase}`;
	}

	function glyphFor(letter: AlphabetLetter): string {
		if (caseDisplay === 'lower') return letter.lowercase;
		return letter.uppercase ?? letter.lowercase;
	}

	// Levels 2 and 3 share a step, so the jump off level 0 into "you've started"
	// reads as gentler than every later level-up.
	const RAMP = [100, 200, 200, 300, 400, 500, 600, 700, 800, 900] as const;

	function tileBackground(level: number): string {
		// Not --color-neutral-200 — see DESIGN.md's Color section: that ramp
		// reads cool against this warm palette and is kept for real
		// neutral/informational meaning. -100 reads as blank, not as a hue.
		if (level === LEVEL_MIN) return 'var(--color-neutral-100)';
		return `var(--color-accent-2-${RAMP[level - 1]})`;
	}

	function tileColor(level: number): string {
		if (level === LEVEL_MIN) return 'var(--color-neutral-600)';
		return level <= 5 ? 'var(--color-accent-2-900)' : 'var(--color-accent-2-100)';
	}
</script>

<div class="case-toggle" role="group" aria-label={t(showUppercaseLabel)}>
	<button
		type="button"
		class="case-option"
		class:active={caseDisplay === 'upper'}
		lang="hy"
		aria-pressed={caseDisplay === 'upper'}
		aria-label={t(showUppercaseLabel)}
		onclick={() => onToggleCase('upper')}
	>
		Ա
	</button>
	<button
		type="button"
		class="case-option"
		class:active={caseDisplay === 'lower'}
		lang="hy"
		aria-pressed={caseDisplay === 'lower'}
		aria-label={t(showLowercaseLabel)}
		onclick={() => onToggleCase('lower')}
	>
		ա
	</button>
</div>

<div class="grid">
	{#each letters as letter (letter.id)}
		{@const level = levelOf(letter)}
		<button
			type="button"
			class="tile"
			lang="hy"
			style:background={tileBackground(level)}
			style:color={tileColor(level)}
			style:box-shadow={level === 10 ? '0 0 0 2px var(--color-accent-2-800)' : 'none'}
			aria-label={t(letterTileAriaLabel(pairLabel(letter), level))}
			onclick={() => onOpenLetter(letter.id)}
		>
			<span class="glyph">{glyphFor(letter)}</span>
			<span class="tr" aria-hidden="true">{t(letter.transliteration)}</span>
		</button>
	{/each}
</div>

<div class="level-legend">
	<div class="level-gradient" aria-hidden="true"></div>
	<div class="level-legend-labels">
		<span>{t(notMetLabel)}</span>
		<span>{t(knownColdLabel)}</span>
	</div>
</div>

<style>
	.case-toggle {
		display: flex;
		gap: var(--space-1);
		padding: var(--space-1);
		border-radius: var(--radius-pill);
		background: var(--color-surface);
	}

	.case-option {
		display: flex;
		width: 2.5rem;
		height: 2.25rem;
		align-items: center;
		justify-content: center;
		border: none;
		border-radius: var(--radius-pill);
		background: transparent;
		color: var(--color-text-secondary);
		font-family: var(--font-heading);
		font-weight: var(--font-heading-weight);
		font-size: 1.1rem;
		cursor: pointer;
		transition:
			background-color var(--transition-fast),
			color var(--transition-fast);
	}

	.case-option.active {
		background: var(--color-primary);
		color: var(--color-on-primary);
	}

	.grid {
		display: grid;
		width: 100%;
		grid-template-columns: repeat(auto-fill, minmax(3rem, 1fr));
		/* Grid items stretch to fill their track by default; `.tile`'s `max-width`
		   caps the tile, and this centres it in whatever width the track got. */
		justify-items: center;
		gap: var(--space-1);
	}

	.tile {
		display: flex;
		width: 100%;
		aspect-ratio: 1;
		/* A column can stretch wider than this, and a wider phone isn't a taller one,
		   so unbounded tile growth (and, via aspect-ratio, height) could push 6 rows
		   past the viewport. Caps that without changing the column count. */
		max-width: 3rem;
		min-width: var(--tap-target-min);
		flex-direction: column;
		align-items: center;
		justify-content: center;
		/* A few lowercase glyphs (ք, ց, ղ, ջ) have descenders that would otherwise
		   visually touch the transliteration line below. */
		gap: 3px;
		padding: 0;
		border: none;
		border-radius: var(--radius-md);
		cursor: pointer;
		/* brightness() darkens whichever of the 10 ramp tones is set, so no per-step
		   hover token has to be precomputed. */
		transition: filter var(--transition-fast);
	}

	.tile:hover {
		filter: brightness(0.95);
	}

	.glyph {
		font-family: var(--font-heading);
		font-weight: var(--font-heading-weight);
		font-size: clamp(1.0625rem, 4.1vw, 1.4rem);
		line-height: 1;
	}

	.tr {
		font-family: var(--font-family-body);
		font-size: 0.5625rem;
		line-height: 1;
		color: inherit;
		opacity: 0.72;
	}

	.level-legend {
		display: flex;
		width: 100%;
		flex-direction: column;
		gap: var(--space-1);
	}

	.level-gradient {
		height: 7px;
		border-radius: var(--radius-pill);
		/* stylelint-disable-next-line scale-unlimited/declaration-strict-value -- every stop below is already a var(--color-...) token; the lint plugin can't see inside linear-gradient() to verify that itself, it just flags the top-level value for not being a bare var(). */
		background: linear-gradient(
			90deg,
			var(--color-neutral-100),
			var(--color-accent-2-100),
			var(--color-accent-2-200),
			var(--color-accent-2-300),
			var(--color-accent-2-400),
			var(--color-accent-2-500),
			var(--color-accent-2-600),
			var(--color-accent-2-700),
			var(--color-accent-2-800),
			var(--color-accent-2-900)
		);
	}

	.level-legend-labels {
		display: flex;
		justify-content: space-between;
		font-size: 0.6875rem;
		color: var(--color-text-secondary);
	}
</style>
