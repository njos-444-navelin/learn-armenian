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
		top: calc(var(--space-4) + env(safe-area-inset-top) + var(--tap-target-min) + var(--space-2));
		left: 50%;
		z-index: var(--z-toast);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-2);
		transform: translateX(-50%);
		/* An explicit width, not just max-width: with `left: 50%` and no `right`, a
		   shrink-to-fit box resolves against half the viewport, which silently made
		   the toast half as wide as intended. */
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
		/* Plain CSS keyframes rather than a Svelte transition, which never actually
		   played here (no animation ever ran, keyed or unkeyed, cause unpinned). A
		   CSS animation plays the instant the element is inserted. */
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
