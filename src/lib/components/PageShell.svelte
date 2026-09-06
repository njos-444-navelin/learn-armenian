<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();
</script>

<main id="main">
	<div class="content">
		{@render children()}
	</div>
</main>

<style>
	main {
		display: flex;
		min-height: 100dvh;
		align-items: center;
		justify-content: center;
		/* A page-wide safety net for anything that deliberately slides in
		   from off to one side (see VocabularyTrainer.svelte's flashcard
		   entrance) — clips at this element's own edge, which on every page
		   using PageShell is effectively the real viewport edge, so a slide
		   can travel however far it needs to for the effect to read clearly
		   without ever growing the page's own scrollable width. No page
		   currently relies on visible horizontal overflow from within
		   `<main>`, so this has no other effect. */
		overflow-x: hidden;
		/* Extra top clearance: the back/language bubbles are fixed at the top of
		   every locale page (see [lang=locale]/+layout.svelte) and would otherwise
		   overlap a page's heading. */
		padding: calc(var(--tap-target-min) + var(--space-4) * 2 + env(safe-area-inset-top)) calc(
				var(--space-4) + env(safe-area-inset-right)
			) calc(var(--space-6) + env(safe-area-inset-bottom))
			calc(var(--space-4) + env(safe-area-inset-left));
		/* For a screen that needs to defeat this element's own centering —
		   forcing itself to always fill the full height this would
		   otherwise center it within, so a fixed header inside it gets a
		   constant position instead of moving with however tall that
		   screen's own content happens to be (see AlphabetLearnStep.svelte's
		   .learn-step and AlphabetDrillQuestion.svelte's .drill-step).
		   Mirrors this padding's own top/bottom terms exactly; defined once
		   here, not re-derived at each call site, so the two can't drift
		   out of sync with each other. */
		--page-content-min-height: calc(
			100dvh - (var(--tap-target-min) + var(--space-4) * 2 + env(safe-area-inset-top)) -
				(var(--space-6) + env(safe-area-inset-bottom))
		);
	}

	.content {
		display: flex;
		width: 100%;
		max-width: var(--measure);
		flex-direction: column;
		align-items: center;
		gap: var(--space-5);
		text-align: center;
	}
</style>
