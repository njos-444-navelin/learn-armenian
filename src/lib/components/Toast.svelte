<script lang="ts">
	import { t } from '$lib/i18n/current';
	import { dismissToast, removeToast, toastState } from '$lib/stores/toasts.svelte';

	/** Only remove on the *exit* animation's end — `.toast`'s own entrance
	 * animation also fires `animationend`, but `toast.closing` is still false
	 * at that point, so this only acts on the close, never the open. */
	function handleAnimationEnd(toastId: number, closing: boolean): void {
		if (closing) removeToast(toastId);
	}
</script>

<div class="stack" role="status" aria-live="polite">
	{#each toastState.items as toast (toast.id)}
		{#if toast.onClick}
			<button
				type="button"
				class="toast {toast.variant} actionable"
				class:closing={toast.closing}
				onanimationend={() => handleAnimationEnd(toast.id, toast.closing)}
				onclick={() => {
					toast.onClick?.();
					dismissToast(toast.id);
				}}
			>
				{t(toast.message)}
			</button>
		{:else}
			<p
				class="toast {toast.variant}"
				class:closing={toast.closing}
				onanimationend={() => handleAnimationEnd(toast.id, toast.closing)}
			>
				{t(toast.message)}
			</p>
		{/if}
	{/each}
</div>

<style>
	.stack {
		position: fixed;
		top: calc(
			var(--space-4) + env(safe-area-inset-top) + var(--tap-target-min) + var(--space-2)
		);
		left: 50%;
		z-index: 50;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-2);
		transform: translateX(-50%);
		/* An explicit width, not just max-width — `left: 50%` with no `right`
		   makes a shrink-to-fit box's available-space reference only "50% to
		   the containing block's edge" (half the viewport), not the full
		   width this max-width implies. That silently produced a toast about
		   half as wide as intended, wrapping long messages far narrower than
		   the room actually available, worst on narrow (mobile) viewports
		   where half the width is a real constraint rather than a rounding
		   error. An explicit `width` sidesteps that shrink-to-fit resolution
		   entirely. */
		width: calc(100vw - 2 * var(--space-4));
		max-width: var(--measure);
	}

	.toast {
		width: 100%;
		margin: 0;
		padding: var(--space-3) var(--space-4);
		border: none;
		border-radius: var(--radius-md);
		box-shadow: var(--shadow-md);
		font-size: var(--font-size-sm);
		font-family: inherit;
		font-weight: 600;
		text-align: center;
		/* Plain CSS keyframes, not a Svelte `in:`/`out:` transition — this
		   list previously used svelte/transition's `fly`, which never
		   actually played (confirmed by inspecting computed style/inline
		   style/Animation objects directly: no animation ever ran, on this
		   or a completely fresh dev server, keyed or unkeyed, fade or fly —
		   the cause wasn't pinned down, so rather than keep guessing this
		   sidesteps Svelte's transition engine entirely for something
		   directly verifiable). A CSS animation plays automatically the
		   instant an element with one is inserted — no JS orchestration
		   needed for the entrance at all. */
		animation: toast-in 200ms ease-out both;
	}

	.toast.closing {
		/* Overrides the entrance animation above by name, not by adding a
		   second one — a closing toast should only ever run one animation
		   at a time. */
		animation: toast-out 150ms ease-in both;
	}

	@keyframes toast-in {
		from {
			opacity: 0;
			transform: translateY(-16px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@keyframes toast-out {
		from {
			opacity: 1;
			transform: translateY(0);
		}
		to {
			opacity: 0;
			transform: translateY(16px);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.toast,
		.toast.closing {
			/* dismissToast() itself bypasses the animation-driven removal
			   path under reduced motion (see toasts.svelte.ts) — this alone
			   would otherwise leave a "closing" toast stuck forever waiting
			   for an animationend that a disabled animation never fires. */
			animation: none;
		}
	}

	.toast.actionable {
		cursor: pointer;
	}

	.toast.error {
		background: var(--color-error-surface);
		color: var(--color-on-error-surface);
	}

	.toast.info {
		background: var(--color-toast-info);
		color: var(--color-on-toast-info);
	}
</style>
