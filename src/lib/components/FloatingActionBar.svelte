<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();

	// Reasonable single-row guess for the first paint; corrected the instant
	// the real bar mounts and reports its height, so the spacer below is
	// never a guess. See learn/alphabet/+page.svelte for the same pattern.
	let barHeight = $state(72);
</script>

<div class="bar" bind:clientHeight={barHeight}>
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
		z-index: 10;
	}

	.bar :global(form),
	.bar :global(.button) {
		flex: 1;
	}

	.spacer {
		width: 100%;
	}
</style>
