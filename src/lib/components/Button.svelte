<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { ResolvedPathname } from '$app/types';
	import { blurAfterClick } from '$lib/actions/blurAfterClick';
	import Spinner from './Spinner.svelte';

	/**
	 * A `loading` button's label never moves — not a pixel, with or without an
	 * icon, however long the label. A pending state should read as the same
	 * button, now busy. Handled here rather than trusted to each call site,
	 * because it's twice per click on every async button in the app.
	 *
	 * With an icon: the spinner replaces it inside a fixed `1.125em` slot, which
	 * is why the icon goes through the `icon` prop (one in the children sits
	 * *after* the spinner) and carries no width/height of its own.
	 *
	 * Without one: the label reserves the spinner's room on both sides,
	 * permanently, and the spinner is absolutely positioned into it, taking no
	 * layout space. Symmetric so the text stays centred, permanent so nothing
	 * moves when the spinner arrives. A spinner that looks like it's touching the
	 * button's edge means something removed that reservation — fix that, don't
	 * nudge the spinner, whose position is derived from the label's.
	 */

	/** `success-soft` is the tinted, low-emphasis sibling of `success`: a button
	 * that leads to a success state rather than announcing one. */
	type Variant = 'primary' | 'secondary' | 'success' | 'success-soft' | 'error';
	type Size = 'md' | 'sm';
	/** Every in-app href is a resolve()-wrapped ResolvedPathname (Conventions
	 * #5); `mailto:` is the one exception in use. Widen if another is needed. */
	type Href = ResolvedPathname | `mailto:${string}`;

	interface BaseProps {
		variant?: Variant | undefined;
		/** `"sm"` trims padding and font size but keeps --tap-target-min, which is
		 * an accessibility floor (Conventions §6), not a size to shrink below. */
		size?: Size | undefined;
		/** Pulses a glow — for rare, high-stakes confirms. Pair with variant="error". */
		glow?: boolean | undefined;
		/** Gives a non-primary button the primary's hover lift (DESIGN.md, Motion),
		 * for a screen's one commit action. Primary always lifts. */
		lift?: boolean | undefined;
		/** variant="secondary" only — swaps its transparent background for an opaque
		 * one, for a secondary button that must occlude what it sits over. */
		opaque?: boolean | undefined;
		/** A leading icon. Pass an inline SVG with no width/height — the slot sizes
		 * it, and the spinner stands in for it while `loading`. */
		icon?: Snippet | undefined;
		children: Snippet;
	}

	interface LinkProps extends BaseProps {
		href: Href;
		ariaCurrent?: 'page' | undefined;
		/** Fires alongside the browser's navigation and can't block it — for
		 * fire-and-forget side effects on the way out. */
		onclick?: (() => void) | undefined;
	}

	interface ActionProps extends BaseProps {
		href?: undefined;
		type?: 'button' | 'submit' | undefined;
		disabled?: boolean | undefined;
		/** Shows a spinner and forces `disabled` — see Conventions #8. Pass it (even
		 * as `false`) only on a button that can actually load: `undefined` means
		 * "never loads" and skips the room an iconless button reserves. */
		loading?: boolean | undefined;
		onclick?: (() => void) | undefined;
	}

	type Props = LinkProps | ActionProps;

	let { variant = 'primary', size = 'md', icon, children, ...rest }: Props = $props();
	let shouldLift = $derived(variant === 'primary' || rest.lift === true);
</script>

{#if rest.href !== undefined}
	<!-- eslint-disable svelte/no-navigation-without-resolve -- `rest.href` is Href (ResolvedPathname | mailto:...) here, narrowed by the {#if rest.href !== undefined} above (LinkProps is the only Props member with a non-undefined href) — confirmed by svelte-check, which reports no error here. eslint-plugin-svelte's type-aware check doesn't replicate that narrowing for a rest-destructured union prop; re-binding it via {@const} didn't help either. -->
	<a
		class="button {variant}"
		class:sm={size === 'sm'}
		class:glow={rest.glow}
		class:opaque={rest.opaque}
		class:lift={shouldLift}
		href={rest.href}
		aria-current={rest.ariaCurrent}
		onclick={rest.onclick}
		use:blurAfterClick
	>
		{#if icon !== undefined}
			<span class="icon-slot" aria-hidden="true">{@render icon()}</span>
		{/if}
		{@render children()}
	</a>
	<!-- eslint-enable svelte/no-navigation-without-resolve -->
{:else}
	<button
		class="button {variant}"
		class:sm={size === 'sm'}
		class:glow={rest.glow}
		class:opaque={rest.opaque}
		class:lift={shouldLift}
		type={rest.type ?? 'button'}
		disabled={rest.disabled || rest.loading}
		aria-busy={rest.loading ? 'true' : undefined}
		onclick={rest.onclick}
		use:blurAfterClick
	>
		{#if icon !== undefined}
			<!-- One slot, two occupants: the icon at rest, the spinner while
			     loading. A box of fixed size is what keeps the label from
			     shifting. -->
			<span class="icon-slot" aria-hidden="true">
				{#if rest.loading}
					<Spinner />
				{:else}
					{@render icon()}
				{/if}
			</span>
		{/if}
		<!-- Wrapped so an iconless button's spinner has something to hang off:
		     it's positioned at this span's left edge, inside the room `reserve`
		     keeps on both sides. -->
		<span class="label" class:reserve={icon === undefined && rest.loading !== undefined}>
			{#if icon === undefined && rest.loading}
				<span class="spinner-float"><Spinner /></span>
			{/if}
			{@render children()}
		</span>
	</button>
{/if}

<style>
	/* --spinner-gap: how far an iconless button's floating spinner sits from the
	   label — the same --space-2 the icon slot uses, so it lands where a leading
	   icon would. */
	.button {
		--spinner-gap: var(--space-2);

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

	/* Fixed in both dimensions and never shrinking, so the icon and the spinner
	   standing in for it take up exactly the same room. Sized in em so it
	   follows the `sm` size's smaller type. */
	.icon-slot {
		display: inline-grid;
		flex-shrink: 0;
		place-items: center;
		width: 1.125em;
		height: 1.125em;
	}

	.icon-slot :global(svg) {
		width: 100%;
		height: 100%;
	}

	/* min-height/min-width stay at --tap-target-min — see the `size` prop. */
	.sm {
		--spinner-gap: var(--space-1);

		padding: var(--space-2) var(--space-4);
		font-size: var(--font-size-sm);
	}

	.label {
		position: relative;
	}

	/* Reserves the spinner's room on both sides of the label, permanently:
	   symmetric so the text stays centred, permanent so nothing moves when the
	   spinner arrives. */
	.label.reserve {
		padding-inline: calc(1em + var(--spinner-gap));
	}

	/* Out of flow, so it adds no width; vertically centred, so a two-line label
	   gets it midway between the lines. */
	.spinner-float {
		position: absolute;
		top: 50%;
		left: 0;
		display: flex;
		translate: 0 -50%;
	}

	.primary {
		background: var(--color-primary);
		color: var(--color-on-primary);
	}

	.primary:hover:not(:disabled) {
		background: var(--color-primary-hover);
	}

	/* Its own class so the primary variant and the `lift` prop can't drift. */
	.lift {
		position: relative;
		box-shadow: var(--shadow-sm);
		transition:
			background-color var(--transition-fast),
			border-color var(--transition-fast),
			box-shadow var(--transition-fast),
			transform var(--transition-fast);
	}

	/* Extends the hoverable area past the bottom edge by more than the 2px lift,
	 * so the edge doesn't retreat out from under an approaching cursor and
	 * oscillate. Transformed descendant, so it travels with the lift. */
	.lift::after {
		content: '';
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		height: 6px;
	}

	.lift:hover:not(:disabled) {
		box-shadow: var(--shadow-md);
		transform: translateY(-2px);
	}

	.lift:active:not(:disabled) {
		box-shadow: var(--shadow-sm);
		transform: translateY(0);
	}

	.lift:disabled {
		box-shadow: none;
		transform: none;
	}

	@media (prefers-reduced-motion: reduce) {
		.lift:hover:not(:disabled) {
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

	/* --color-on-secondary already equals --color-text-primary, so only the
	 * background needs swapping. */
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

	.success-soft {
		background: var(--color-success-soft);
		color: var(--color-on-success-soft);
	}

	.success-soft:hover:not(:disabled) {
		background: var(--color-success-soft-hover);
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
