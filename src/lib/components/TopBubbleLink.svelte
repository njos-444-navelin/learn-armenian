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
		background: var(--color-surface);
		border: none;
		font-size: var(--font-size-lg);
		font-family: inherit;
		text-decoration: none;
		color: var(--color-text-primary);
		cursor: pointer;
		transition: background-color var(--transition-fast);
		z-index: 20;
	}

	.bubble:hover {
		background: var(--color-surface-hover);
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
		   the button has no border now, so its visual edge is exactly its
		   padding-box edge, which is what `top`/`right` are relative to. For
		   a circle of diameter --tap-target-min (2.75rem), that point sits
		   0.4rem in from the button's edge on both axes. `top`/`right`
		   position the dot's own edge, not its center, so they're offset
		   back by half the dot's size to keep that center fixed as the dot's
		   size changes — here that pushes them negative, letting the dot
		   overhang the ring slightly. */
		top: calc(0.4rem - 0.38125rem);
		right: calc(0.4rem - 0.38125rem);
		width: 0.7625rem;
		height: 0.7625rem;
		border-radius: 50%;
		background: var(--color-notification);
		border: 2px solid var(--color-surface);
	}
</style>
