<!-- Decorative brand mark echoing the Armenian flag, muted for the warm
     palette. Always paired with a real translated wordmark (Conventions #1);
     aria-hidden and meaningless on its own. -->
<span class="flagmark" aria-hidden="true">
	<span class="stripe r"></span>
	<span class="stripe b"></span>
	<span class="stripe o"></span>
</span>

<style>
	.flagmark {
		display: flex;
		flex-direction: column;
		width: 1.6rem;
		height: 1.25rem;
		border-radius: var(--radius-sm);
		overflow: hidden;
		box-shadow: var(--shadow-sm);
		flex-shrink: 0;
	}

	.stripe {
		flex: 1;
	}

	/* The flag's red and blue are shared with the loading ornament
	   (NavigationProgress.svelte) via tokens.css, so the two can't drift. */
	.r {
		background: var(--color-flag-red);
	}

	.b {
		background: var(--color-flag-blue);
	}

	.o {
		background: var(--color-primary);
	}
</style>
