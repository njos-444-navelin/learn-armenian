<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { ResolvedPathname } from '$app/types';
	import Spinner from './Spinner.svelte';

	type Variant = 'primary' | 'secondary' | 'success' | 'error';
	type Size = 'md' | 'sm';
	/** Every in-app href is a resolve()-wrapped ResolvedPathname (see
	 * Conventions #5); the one exception today is contact/+page.svelte's
	 * `mailto:` link, so that's the only non-internal scheme allowed here —
	 * widen this union if a future Button needs another (`tel:`, an external
	 * `https:` link, ...). */
	type Href = ResolvedPathname | `mailto:${string}`;

	interface BaseProps {
		variant?: Variant | undefined;
		/** Defaults to the standard size. `"sm"` trims padding and font size
		 * for a lower-emphasis action that doesn't need full visual weight
		 * (e.g. delete account) — it still keeps the same min-height as the
		 * standard size, since --tap-target-min is an accessibility floor
		 * (Conventions §6), not a size to shrink below. */
		size?: Size | undefined;
		/** Pulses a glow around the button — reserved for rare, high-stakes
		 * confirm actions (e.g. delete account). Pair with variant="error". */
		glow?: boolean | undefined;
		/** variant="secondary" only — swaps its deliberately transparent
		 * background (see DESIGN.md) for an opaque one. For a secondary button
		 * that sits over content it must fully occlude, e.g. inside a fixed
		 * FloatingActionBar. Text/border colors are unaffected since
		 * --color-on-secondary already equals --color-text-primary. */
		opaque?: boolean | undefined;
		children: Snippet;
	}

	interface LinkProps extends BaseProps {
		href: Href;
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

	let { variant = 'primary', size = 'md', children, ...rest }: Props = $props();
</script>

{#if rest.href !== undefined}
	<!-- eslint-disable svelte/no-navigation-without-resolve -- `rest.href` is Href (ResolvedPathname | mailto:...) here, narrowed by the {#if rest.href !== undefined} above (LinkProps is the only Props member with a non-undefined href) — confirmed by svelte-check, which reports no error here. eslint-plugin-svelte's type-aware check doesn't replicate that narrowing for a rest-destructured union prop; re-binding it via {@const} didn't help either. -->
	<a
		class="button {variant}"
		class:sm={size === 'sm'}
		class:glow={rest.glow}
		class:opaque={rest.opaque}
		href={rest.href}
		aria-current={rest.ariaCurrent}
		onclick={rest.onclick}
	>
		{@render children()}
	</a>
	<!-- eslint-enable svelte/no-navigation-without-resolve -->
{:else}
	<button
		class="button {variant}"
		class:sm={size === 'sm'}
		class:glow={rest.glow}
		class:opaque={rest.opaque}
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
		/* outline-color is included here (not left to the global `*` rule in
		   app.css) because this rule's own `transition` shorthand would
		   otherwise fully replace it for any button/link — a later
		   `transition` declaration doesn't merge with an earlier one, it
		   overrides the whole list. Every other `transition` list in this
		   file needs the same treatment for the same reason. */
		transition:
			background-color var(--transition-fast),
			border-color var(--transition-fast),
			outline-color var(--transition-fast);
	}

	.button:disabled {
		cursor: not-allowed;
		opacity: 0.6;
	}

	/* min-height/min-width stay at --tap-target-min — see the `size` prop's
	   doc comment above; only padding/font-size shrink. */
	.sm {
		padding: var(--space-2) var(--space-4);
		font-size: var(--font-size-sm);
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
			transform var(--transition-fast),
			outline-color var(--transition-fast);
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

	/* --color-on-secondary already equals --color-text-primary (see
	 * tokens.css), so only the background needs swapping here. */
	.secondary.opaque {
		background: var(--color-background);
	}

	.secondary.opaque:hover:not(:disabled) {
		background: var(--color-background-hover);
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
