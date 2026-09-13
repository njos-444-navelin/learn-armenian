<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		/** Drops the bar's own border/background/shadow, leaving just the fixed
		 * positioning and safe-area spacing — for a child (e.g. a button with its
		 * own pill background and shadow) that shouldn't sit inside a second
		 * visible container. */
		bare?: boolean | undefined;
		children: Snippet;
	}

	let { bare = false, children }: Props = $props();

	// Reasonable single-row guess for the first paint; corrected the instant
	// the real bar mounts and reports its height, so the spacer below is
	// never a guess. See learn/alphabet/+page.svelte for the same pattern.
	let barHeight = $state(72);
</script>

<div class="bar" class:bare bind:clientHeight={barHeight}>
	{@render children()}
</div>

<!-- Placed wherever this component sits in the page (typically last, after
     the scrollable content) — reserves room so the fixed bar above never
     overlaps whatever comes before it. -->
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
		/* This bar is fixed and can end up overlapping scrollable content
		   behind it on a short viewport (a `bare` caller's actual content
		   doesn't always fill its full reserved box — a small centered
		   button leaves real dead space around it, and some states have no
		   content at all). Only an actual button/link/form inside should
		   ever be clickable; the bar's own box — including any such gap —
		   must never swallow a click meant for whatever's behind it. */
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
