<script lang="ts">
	import type { Snippet } from 'svelte';
	import Spinner from './Spinner.svelte';

	type Variant = 'primary' | 'secondary' | 'success' | 'error';

	interface BaseProps {
		variant?: Variant | undefined;
		/** Pulses a glow around the button — reserved for rare, high-stakes
		 * confirm actions (e.g. delete account). Pair with variant="error". */
		glow?: boolean | undefined;
		children: Snippet;
	}

	interface LinkProps extends BaseProps {
		href: string;
		ariaCurrent?: 'page' | undefined;
		/** Fires alongside the browser's normal navigation — doesn't (and
		 * can't) block or cancel it. For side effects that should happen
		 * "on the way out", like the fire-and-forget writes in
		 * persistPreferredLocale.ts, not for anything the click should wait
		 * on. */
		onclick?: (() => void) | undefined;
	}

	interface ActionProps extends BaseProps {
		href?: undefined;
		type?: 'button' | 'submit' | undefined;
		disabled?: boolean | undefined;
		/** Shows a spinner and forces `disabled` — see Conventions #8. Set this
		 * whenever the button's `onclick`/form action is in flight; never leave
		 * an async action with no visible pending state. */
		loading?: boolean | undefined;
		onclick?: (() => void) | undefined;
	}

	type Props = LinkProps | ActionProps;

	let { variant = 'primary', children, ...rest }: Props = $props();
</script>

{#if rest.href !== undefined}
	<a
		class="button {variant}"
		class:glow={rest.glow}
		href={rest.href}
		aria-current={rest.ariaCurrent}
		onclick={rest.onclick}
	>
		{@render children()}
	</a>
{:else}
	<button
		class="button {variant}"
		class:glow={rest.glow}
		type={rest.type ?? 'button'}
		disabled={rest.disabled || rest.loading}
		aria-busy={rest.loading ? 'true' : undefined}
		onclick={rest.onclick}
	>
		{#if rest.loading}
			<Spinner />
		{/if}
		{@render children()}
	</button>
{/if}

<style>
	.button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-2);
		min-height: var(--tap-target-min);
		min-width: var(--tap-target-min);
		padding: var(--space-3) var(--space-5);
		border-radius: var(--radius-pill);
		border: 1px solid transparent;
		font-family: var(--font-heading);
		font-weight: var(--font-heading-weight);
		font-size: var(--font-size-md);
		text-decoration: none;
		cursor: pointer;
		transition:
			background-color var(--transition-fast),
			border-color var(--transition-fast);
	}

	.button:disabled {
		cursor: not-allowed;
		opacity: 0.6;
	}

	.primary {
		position: relative;
		background: var(--color-primary);
		color: var(--color-on-primary);
		box-shadow: var(--shadow-sm);
		transition:
			background-color var(--transition-fast),
			border-color var(--transition-fast),
			box-shadow var(--transition-fast),
			transform var(--transition-fast);
	}

	/* Extends the hoverable area past the bottom edge by more than the hover
	 * lift (2px), so a cursor approaching from below stays "inside" once the
	 * button rises — without this, the edge retreats out from under the
	 * cursor and hover/lift oscillates. Moves with the button since it's a
	 * transformed descendant, so the buffer travels with the lift. */
	.primary::after {
		content: '';
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		height: 6px;
	}

	.primary:hover:not(:disabled) {
		background: var(--color-primary-hover);
		box-shadow: var(--shadow-md);
		transform: translateY(-2px);
	}

	.primary:active:not(:disabled) {
		box-shadow: var(--shadow-sm);
		transform: translateY(0);
	}

	.primary:disabled {
		box-shadow: none;
		transform: none;
	}

	@media (prefers-reduced-motion: reduce) {
		.primary:hover:not(:disabled) {
			transform: none;
		}
	}

	.secondary {
		background: var(--color-secondary);
		color: var(--color-on-secondary);
		border-color: var(--color-border);
	}

	.secondary:hover:not(:disabled) {
		background: var(--color-secondary-hover);
	}

	.success {
		background: var(--color-success);
		color: var(--color-on-success);
	}

	.success:hover:not(:disabled) {
		background: var(--color-success-hover);
	}

	.error {
		background: var(--color-error);
		color: var(--color-on-error);
	}

	.error:hover:not(:disabled) {
		background: var(--color-error-hover);
	}

	.button[aria-current='page'] {
		border-color: var(--color-primary);
	}

	.glow {
		animation: button-glow-pulse 1.6s ease-in-out infinite;
	}

	@keyframes button-glow-pulse {
		0%,
		100% {
			box-shadow: 0 0 0 0 var(--color-error-glow);
		}
		50% {
			box-shadow: 0 0 16px 6px var(--color-error-glow);
		}
	}
</style>
