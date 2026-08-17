<script lang="ts">
	import type { Snippet } from 'svelte';

	interface BaseProps {
		ariaLabel: string;
		side: 'left' | 'right';
		/** Shows a small notification dot on the button's top-right corner. */
		badge?: boolean;
		children: Snippet;
	}

	interface LinkProps extends BaseProps {
		href: string;
	}

	interface TriggerProps extends BaseProps {
		href?: undefined;
		onclick: () => void;
		ariaExpanded: boolean;
		ariaControls?: string | undefined;
	}

	type Props = LinkProps | TriggerProps;

	let { ariaLabel, side, badge = false, children, ...rest }: Props = $props();
</script>

{#if rest.href !== undefined}
	<a class="bubble {side}" href={rest.href} aria-label={ariaLabel}>
		{@render children()}
		{#if badge}
			<span class="badge-dot" aria-hidden="true"></span>
		{/if}
	</a>
{:else}
	<button
		type="button"
		class="bubble {side}"
		aria-label={ariaLabel}
		aria-haspopup="true"
		aria-expanded={rest.ariaExpanded}
		aria-controls={rest.ariaControls}
		onclick={rest.onclick}
	>
		{@render children()}
		{#if badge}
			<span class="badge-dot" aria-hidden="true"></span>
		{/if}
	</button>
{/if}

<style>
	.bubble {
		position: fixed;
		top: calc(var(--space-4) + env(safe-area-inset-top));
		display: flex;
		align-items: center;
		justify-content: center;
		width: var(--tap-target-min);
		height: var(--tap-target-min);
		border-radius: 50%;
		background: var(--color-background);
		border: 1px solid var(--color-border);
		box-shadow: var(--shadow-sm);
		font-size: var(--font-size-lg);
		font-family: inherit;
		text-decoration: none;
		color: var(--color-text-primary);
		cursor: pointer;
		z-index: 20;
	}

	.bubble:hover {
		background: var(--color-surface);
	}

	.left {
		left: calc(var(--space-4) + env(safe-area-inset-left));
	}

	.right {
		right: calc(var(--space-4) + env(safe-area-inset-right));
	}

	.badge-dot {
		position: absolute;
		/* Centers the dot on the ring itself at its top-right (45°) point —
		   for a circle of diameter --tap-target-min (2.75rem), that point
		   sits 0.1rem in from the button's outer edge on both axes. `top`/
		   `right` here are relative to the button's *padding* box though
		   (its border sits outside that), so the button's own 1px border
		   is subtracted back out to land exactly on the ring. */
		top: calc(0.1rem - 1px);
		right: calc(0.1rem - 1px);
		width: 0.6rem;
		height: 0.6rem;
		border-radius: 50%;
		background: var(--color-notification);
		border: 2px solid var(--color-background);
	}
</style>
