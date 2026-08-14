<script lang="ts">
	import type { Snippet } from 'svelte';

	interface BaseProps {
		ariaLabel: string;
		side: 'left' | 'right';
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

	let { ariaLabel, side, children, ...rest }: Props = $props();
</script>

{#if rest.href !== undefined}
	<a class="bubble {side}" href={rest.href} aria-label={ariaLabel}>
		{@render children()}
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
</style>
