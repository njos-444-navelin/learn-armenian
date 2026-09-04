<script lang="ts">
	import { page } from '$app/state';
	import FloatingActionBar from './FloatingActionBar.svelte';
	import { getLocale, t } from '$lib/i18n/current';
	import { withLocale } from '$lib/i18n/paths';
	import {
		nothingDueYetLabel,
		trainVocabularyMenuLabel,
		wordsToPracticeHint
	} from '$lib/i18n/dictionaries/vocabularyTraining';

	let locale = $derived(getLocale());
	// Reuses the same cheap boolean the account-menu badge already loads on
	// every page (see [lang=locale]/+layout.server.ts) rather than
	// re-computing an exact new/due count here — the training page itself is
	// the only place that needs (and pays for) that full breakdown.
	let hasWordsToPractice = $derived(page.data.hasWordsToPractice === true);
</script>

<FloatingActionBar bare>
	<a class="practice-button" href={withLocale(locale, '/learn/vocabulary/train')}>
		<span class="practice-text">
			<span class="practice-label">{t(trainVocabularyMenuLabel)}</span>
			<span class="practice-subtitle">
				{hasWordsToPractice ? t(wordsToPracticeHint) : t(nothingDueYetLabel)}
			</span>
		</span>
		<span class="practice-icon" aria-hidden="true">
			<svg
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2.75"
				stroke-linecap="round"
				stroke-linejoin="round"
				width="22"
				height="22"
			>
				<path d="M5 12h14" />
				<path d="m12 5 7 7-7 7" />
			</svg>
		</span>
	</a>
</FloatingActionBar>

<style>
	/* Same shape/motion as AlphabetTrainer.svelte's own practice button — see
	   docs/DESIGN.md's Motion section. Kept as separate markup/CSS rather
	   than sharing that component's implementation: this one is a plain
	   navigational link (no session-start logic to run first), while
	   AlphabetTrainer's is a <button> that builds a practice session before
	   navigating. */
	.practice-button {
		display: flex;
		flex: 1;
		align-items: center;
		gap: var(--space-3);
		min-height: var(--tap-target-min);
		padding: var(--space-3) var(--space-6);
		border-radius: var(--radius-pill);
		background: var(--color-primary);
		color: var(--color-on-primary);
		text-decoration: none;
		box-shadow: var(--shadow-md), 0 0 0 0 color-mix(in srgb, var(--color-primary) 35%, transparent);
		transition: background-color var(--transition-fast);
		animation: practice-pulse 2.6s ease-out infinite;
	}

	.practice-button:hover {
		background: var(--color-primary-hover);
	}

	@keyframes practice-pulse {
		0% {
			box-shadow: var(--shadow-md), 0 0 0 0 color-mix(in srgb, var(--color-primary) 35%, transparent);
		}
		40%,
		100% {
			box-shadow: var(--shadow-md), 0 0 0 14px color-mix(in srgb, var(--color-primary) 0%, transparent);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.practice-button {
			animation: none;
		}
	}

	.practice-text {
		display: flex;
		flex: 1;
		flex-direction: column;
		gap: 2px;
		text-align: left;
	}

	.practice-label {
		font-family: var(--font-heading);
		font-weight: var(--font-heading-weight);
		font-size: var(--font-size-lg);
	}

	.practice-subtitle {
		font-size: var(--font-size-sm);
		opacity: 0.8;
	}

	.practice-icon {
		display: flex;
		flex: none;
		align-items: center;
	}
</style>
