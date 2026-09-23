<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		/** Drops the bar's own border, background and shadow, leaving the fixed
		 * positioning and safe-area spacing — for a child that brings its own. */
		bare?: boolean | undefined;
		children: Snippet;
	}

	let { bare = false, children }: Props = $props();

	// A single-row guess for the first paint, corrected the instant the real bar
	// mounts and reports its height.
	let barHeight = $state(72);
</script>

<div class="bar" class:bare bind:clientHeight={barHeight}>
	{@render children()}
</div>

<!-- Reserves room so the fixed bar never overlaps the content before it. -->
<div class="spacer" style="height: {barHeight + 24}px" aria-hidden="true"></div>

<style>
	.bar {
		position: fixed;
		left: var(--space-4);
		right: var(--space-4);
		bottom: calc(var(--space-4) + env(safe-area-inset-bottom));
		max-width: var(--measure);
		margin-inline: auto;
		display: flex;
		gap: var(--space-2);
		padding: var(--space-2);
		background: var(--color-background);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-sm);
		z-index: var(--z-floating-bar);
		/* The bar is fixed and can overlap scrollable content behind it, and a
		   `bare` caller's content doesn't always fill its box. Only the actual
		   controls inside should take clicks. */
		pointer-events: none;
	}

	.bar :global(form),
	.bar :global(.button),
	.bar :global(button),
	.bar :global(a) {
		pointer-events: auto;
	}

	.bar :global(form),
	.bar :global(.button) {
		flex: 1;
	}

	.bar.bare {
		padding: 0;
		border: none;
		background: none;
		box-shadow: none;
	}

	.spacer {
		width: 100%;
	}
</style>
