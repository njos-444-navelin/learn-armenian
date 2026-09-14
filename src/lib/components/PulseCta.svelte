<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { ResolvedPathname } from '$app/types';
	import Spinner from './Spinner.svelte';

	/**
	 * The one attention-grabbing call to action a screen gets: a full-width
	 * primary pill that pings outward once every couple of seconds, with a
	 * heading-weight label (and an optional one-line subtitle) on the left
	 * and an icon on the right — the alphabet trainer's "Practice", the
	 * vocabulary "Train vocabulary" link, a deck's "Add to my collection".
	 * Meant to sit inside `<FloatingActionBar bare>`; see DESIGN.md's Motion
	 * section for the pulse and the reasoning.
	 */
	interface BaseProps {
		/** Already translated — pass `t(label)`, not the dictionary entry. */
		label: string;
		subtitle?: string | undefined;
		/** Trailing icon, an inline SVG with no width/height of its own — the
		 * slot sizes it. Defaults to the "go" arrow, which is what a CTA that
		 * navigates gets (DESIGN.md's Icons section); pass something else for
		 * an in-place action, e.g. the plus on "Add to my collection". */
		icon?: Snippet | undefined;
	}

	interface LinkProps extends BaseProps {
		href: ResolvedPathname;
	}

	interface ActionProps extends BaseProps {
		href?: undefined;
		type?: 'button' | 'submit' | undefined;
		onclick?: (() => void) | undefined;
		/** Shows a spinner in place of the icon and disables the button —
		 * Conventions #8 and #15: the spinner takes the icon's slot, so the
		 * label doesn't move, and the pulse pauses while busy. */
		loading?: boolean | undefined;
	}

	type Props = LinkProps | ActionProps;

	let { label, subtitle, icon, ...rest }: Props = $props();
</script>

{#snippet content(loading: boolean)}
	<span class="text">
		<span class="label">{label}</span>
		{#if subtitle !== undefined}
			<span class="subtitle">{subtitle}</span>
		{/if}
	</span>
	<!-- A fixed-size box whatever is in it: the icon, or the spinner
	     standing in for it (Conventions #15). -->
	<span class="icon-slot" aria-hidden="true">
		{#if loading}
			<Spinner />
		{:else if icon !== undefined}
			{@render icon()}
		{:else}
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.75" stroke-linecap="round" stroke-linejoin="round">
				<path d="M5 12h14" />
				<path d="m12 5 7 7-7 7" />
			</svg>
		{/if}
	</span>
{/snippet}

{#if rest.href !== undefined}
	<!-- eslint-disable svelte/no-navigation-without-resolve -- `rest.href` is a ResolvedPathname, narrowed by the {#if} above; the plugin doesn't follow that narrowing through a rest-destructured union prop (same as Button.svelte). -->
	<a class="cta" href={rest.href}>
		{@render content(false)}
	</a>
	<!-- eslint-enable svelte/no-navigation-without-resolve -->
{:else}
	<button
		class="cta"
		type={rest.type ?? 'button'}
		disabled={rest.loading}
		aria-busy={rest.loading ? 'true' : undefined}
		onclick={rest.onclick}
	>
		{@render content(rest.loading === true)}
	</button>
{/if}

<style>
	.cta {
		display: flex;
		flex: 1;
		width: 100%;
		align-items: center;
		gap: var(--space-3);
		min-height: var(--tap-target-min);
		padding: var(--space-3) var(--space-6);
		border: none;
		border-radius: var(--radius-pill);
		background: var(--color-primary);
		color: var(--color-on-primary);
		font: inherit;
		text-decoration: none;
		cursor: pointer;
		box-shadow: var(--shadow-md), 0 0 0 0 color-mix(in srgb, var(--color-primary) 35%, transparent);
		transition: background-color var(--transition-fast);
		animation: cta-pulse 2.6s ease-out infinite;
	}

	.cta:hover:not(:disabled) {
		background: var(--color-primary-hover);
	}

	/* Busy: the spinner is the signal now, so the pulse stops rather than
	   keep asking for a tap it can't take. */
	.cta:disabled {
		cursor: not-allowed;
		opacity: 0.6;
		animation: none;
	}

	/* Pings outward once, then holds still for the rest of the cycle rather
	   than breathing in and out continuously — a single attention pulse that
	   repeats every couple of seconds, not a constant throb. */
	@keyframes cta-pulse {
		0% {
			box-shadow: var(--shadow-md), 0 0 0 0 color-mix(in srgb, var(--color-primary) 35%, transparent);
		}
		40%,
		100% {
			box-shadow: var(--shadow-md), 0 0 0 14px color-mix(in srgb, var(--color-primary) 0%, transparent);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.cta {
			animation: none;
		}
	}

	.text {
		display: flex;
		flex: 1;
		min-width: 0;
		flex-direction: column;
		gap: 2px;
		text-align: left;
	}

	.label {
		font-family: var(--font-heading);
		font-weight: var(--font-heading-weight);
		font-size: var(--font-size-lg);
	}

	.subtitle {
		font-size: var(--font-size-sm);
		opacity: 0.8;
	}

	.icon-slot {
		display: inline-grid;
		flex: none;
		place-items: center;
		width: 1.375rem;
		height: 1.375rem;
	}

	.icon-slot :global(svg) {
		width: 100%;
		height: 100%;
	}
</style>
