<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { ResolvedPathname } from '$app/types';
	import { blurAfterClick } from '$lib/actions/blurAfterClick';
	import Spinner from './Spinner.svelte';

	/** `success-soft` is the tinted, low-emphasis sibling of `success` — for a
	 * button that leads to a success state rather than announcing one (see
	 * --color-success-soft in tokens.css). */
	type Variant = 'primary' | 'secondary' | 'success' | 'success-soft' | 'error';
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
		/** Gives a non-primary button the primary's hover physicality — the
		 * slight rise and deeper shadow (see DESIGN.md's Motion section). For
		 * the one commit action on a screen when it isn't a primary button,
		 * e.g. the dialogue player's "mark it done". Primary always lifts. */
		lift?: boolean | undefined;
		/** variant="secondary" only — swaps its deliberately transparent
		 * background (see DESIGN.md) for an opaque one. For a secondary button
		 * that sits over content it must fully occlude, e.g. inside a fixed
		 * FloatingActionBar. Text/border colors are unaffected since
		 * --color-on-secondary already equals --color-text-primary. */
		opaque?: boolean | undefined;
		/** A leading icon, rendered inside a fixed-size slot ahead of the
		 * label. When the button is `loading`, the spinner takes the icon's
		 * place *in that same slot* rather than appearing beside it, and
		 * because the slot's box never changes size the label doesn't move
		 * — see Conventions #15. Pass an inline SVG with no width/height
		 * of its own; the slot sizes it. */
		icon?: Snippet | undefined;
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
		 * an async action with no visible pending state. With an `icon`, the
		 * spinner replaces the icon in its slot; without one it floats just
		 * left of the label, in room the label reserves on both sides for
		 * it — so pass this prop (even as `false`) only on a button that can
		 * actually load; an `undefined` value means "never loads" and skips
		 * the reservation. Either way the label never moves — see
		 * Conventions #15. */
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
			     loading. Swapping what's *inside* a box of fixed size is what
			     keeps the label from shifting (Conventions #15). -->
			<span class="icon-slot" aria-hidden="true">
				{#if rest.loading}
					<Spinner />
				{:else}
					{@render icon()}
				{/if}
			</span>
		{/if}
		<!-- The label is wrapped so an iconless button's spinner has something
		     to hang off: it's absolutely positioned at this span's left edge,
		     inside room the span reserves on both sides (`reserve`), so the
		     label keeps the exact centred position it had at rest and the
		     spinner is always the button's own padding clear of the border
		     (Conventions #15). -->
		<span class="label" class:reserve={icon === undefined && rest.loading !== undefined}>
			{#if icon === undefined && rest.loading}
				<span class="spinner-float"><Spinner /></span>
			{/if}
			{@render children()}
		</span>
	</button>
{/if}

<style>
	/* --spinner-gap: how far an iconless button's floating spinner sits from
	   the label — the same --space-2 the icon slot is spaced by, so the
	   spinner lands exactly where a leading icon would. */
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

	/* The leading icon's box. Fixed in both dimensions and never shrinking,
	   so whatever is inside it — the icon, or the spinner standing in for
	   it — takes up exactly the same room and the label stays put. Sized in
	   em so it follows the `sm` size's smaller type. Content fills the box
	   rather than carrying its own width/height, which is what guarantees
	   the icon and the spinner render at the same size. */
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

	/* min-height/min-width stay at --tap-target-min — see the `size` prop's
	   doc comment above; only padding/font-size shrink, and the spinner gap
	   shrinks with them. */
	.sm {
		--spinner-gap: var(--space-1);

		padding: var(--space-2) var(--space-4);
		font-size: var(--font-size-sm);
	}

	.label {
		position: relative;
	}

	/* An iconless button that can load reserves the spinner's room — its
	   size plus the gap — on BOTH sides of the label, permanently. Symmetric
	   so the text stays centred; permanent so nothing changes when the
	   spinner arrives. The spinner then sits at the label box's own left
	   edge, which on a short label is right beside the text and on a label
	   that fills the button is still the button's full horizontal padding
	   clear of the border — it never lands in the padding or against the
	   pill's cap. The cost is ~25px more width per side on such buttons at
	   rest; the full-width forms don't show it, and the modal confirms are
	   flex: 1 beside their Cancel, so they share the width evenly either
	   way. Reserving only on the left would centre the text off-axis. */
	.label.reserve {
		padding-inline: calc(1em + var(--spinner-gap));
	}

	/* Out of flow, so it adds no width; vertically centred on the label, so
	   a two-line label gets it midway between the lines. */
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

	/* The hover/press physicality — always on the primary variant, opt-in
	   via the `lift` prop for another variant that carries the screen's one
	   commit action. Kept as its own class so the two can't drift apart. */
	.lift {
		position: relative;
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
