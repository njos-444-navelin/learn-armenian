<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cubicOut } from 'svelte/easing';
	import { fade, type TransitionConfig } from 'svelte/transition';
	import { browser } from '$app/environment';
	import { t } from '$lib/i18n/current';
	import { closeLabel } from '$lib/i18n/dictionaries/common';

	interface Props {
		/** id of the element (usually the modal's own heading) that labels it for assistive tech. */
		labelledBy: string;
		onClose: () => void;
		children: Snippet;
	}

	let { labelledBy, onClose, children }: Props = $props();
	let dialogEl: HTMLDialogElement | undefined = $state();

	// `<dialog>` gives us a focus trap, Escape-to-close (as a native `cancel`
	// event, handled below) and the top layer for free.
	$effect(() => {
		dialogEl?.showModal();
	});

	/**
	 * Enforced here so a caller can't opt out. Two transitions because they
	 * animate different things: the `<dialog>` itself is the tinted backdrop and
	 * fades, while the panel inside it also rises and grows. Svelte transitions
	 * rather than CSS animations, since callers mount a Modal in an `{#if}` and
	 * only a directive keeps the outgoing node around to animate out.
	 */
	const reducedMotion = browser && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	const FADE_IN_MS = 170;
	const FADE_OUT_MS = 130;
	function pop(
		_node: Element,
		{ duration, easing }: { duration: number; easing: (t: number) => number }
	): TransitionConfig {
		if (reducedMotion) return { duration: 0 };
		return {
			duration,
			easing,
			css: (t, u) => `transform: translateY(${u * 8}px) scale(${1 - u * 0.03});`
		};
	}

	/**
	 * Escape fires `cancel`, which would close the dialog natively and hide it
	 * before the outro can play. Routed through `onClose` instead, so the
	 * caller's `{#if}` unmounts it through the transition.
	 */
	function onCancel(event: Event): void {
		event.preventDefault();
		onClose();
	}

	/** The dialog element itself is the backdrop, so a click that lands on
	 * it (rather than on something inside the panel) is a click outside. */
	function clickOutside(event: MouseEvent): void {
		if (event.target === dialogEl) onClose();
	}
</script>

<dialog
	bind:this={dialogEl}
	aria-labelledby={labelledBy}
	oncancel={onCancel}
	onclick={clickOutside}
	in:fade={{ duration: FADE_IN_MS, easing: cubicOut }}
	out:fade={{ duration: FADE_OUT_MS, easing: cubicOut }}
>
	<div
		class="panel"
		in:pop={{ duration: FADE_IN_MS, easing: cubicOut }}
		out:pop={{ duration: FADE_OUT_MS, easing: cubicOut }}
	>
		<button type="button" class="close" onclick={onClose} aria-label={t(closeLabel)}>
			<svg viewBox="0 0 24 24" fill="none" aria-hidden="true" width="20" height="20">
				<path
					d="M6 6l12 12M18 6L6 18"
					stroke="currentColor"
					stroke-width="2.75"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
			</svg>
		</button>
		<div class="content">
			{@render children()}
		</div>
	</div>
</dialog>

<style>
	/* The <dialog> carries the backdrop tint itself rather than using
	   ::backdrop, which a Svelte transition can't drive — this way the tint and
	   the panel fade as one. `[open]` keeps the UA's display:none for the
	   instant between mount and showModal(). */
	dialog[open] {
		display: grid;
		place-items: center;
		inset: 0;
		width: auto;
		height: auto;
		max-width: none;
		max-height: none;
		margin: 0;
		padding: var(--space-4);
		border: none;
		background: var(--color-backdrop);
	}

	dialog::backdrop {
		background: transparent;
	}

	.panel {
		position: relative;
		width: min(90vw, 26rem);
		max-height: 100%;
		overflow-y: auto;
		padding: var(--space-5);
		border-radius: var(--radius-lg);
		background: var(--color-background);
		box-shadow: var(--shadow-lg);
	}

	.close {
		position: absolute;
		top: var(--space-3);
		right: var(--space-3);
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: var(--tap-target-min);
		min-height: var(--tap-target-min);
		padding: 0;
		border: none;
		border-radius: var(--radius-pill);
		background: none;
		color: var(--color-text-secondary);
		cursor: pointer;
	}

	.close:hover {
		background: var(--color-surface);
	}

	.content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-4);
		padding-top: var(--space-3);
		text-align: center;
	}
</style>
