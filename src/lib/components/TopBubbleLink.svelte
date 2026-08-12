<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		href: string;
		ariaLabel: string;
		side: 'left' | 'right';
		/** Forces a full page navigation instead of client-side routing — needed
		 * when the destination has a different `<html lang>` than the current
		 * page, since that attribute is only (re)stamped by the server. */
		fullReload?: boolean | undefined;
		children: Snippet;
	}

	let { href, ariaLabel, side, fullReload, children }: Props = $props();
</script>

<a
	class="bubble {side}"
	{href}
	aria-label={ariaLabel}
	data-sveltekit-reload={fullReload ? '' : undefined}
>
	{@render children()}
</a>

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
		text-decoration: none;
		color: var(--color-text-primary);
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
