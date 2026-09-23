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
		/* A safety net for anything that deliberately slides in from off to one
		   side (see VocabularyTrainer.svelte's flashcard entrance): clips at this
		   element's edge, which is effectively the viewport edge, so a slide can
		   travel as far as it needs without growing the page's scrollable width. */
		overflow-x: hidden;
		/* Extra top clearance: the back/language bubbles are fixed at the top of
		   every locale page (see [lang=locale]/+layout.svelte) and would otherwise
		   overlap a page's heading. */
		padding: calc(var(--tap-target-min) + var(--space-4) * 2 + env(safe-area-inset-top))
			calc(var(--space-4) + env(safe-area-inset-right))
			calc(var(--space-6) + env(safe-area-inset-bottom))
			calc(var(--space-4) + env(safe-area-inset-left));
		/* For a screen that needs to defeat this element's centring, so a fixed
		   header inside it keeps a constant position (see AlphabetLearnStep.svelte's
		   .learn-step). Mirrors this padding's own terms, defined once here so the
		   two can't drift apart. */
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
