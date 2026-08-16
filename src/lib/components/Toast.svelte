<script lang="ts">
	import { fly, fade } from 'svelte/transition';
	import { t } from '$lib/i18n/current';
	import { toastState } from '$lib/stores/toasts.svelte';
</script>

<div class="stack" role="status" aria-live="polite">
	{#each toastState.items as toast (toast.id)}
		<p class="toast {toast.variant}" in:fly={{ y: -16, duration: 200 }} out:fade={{ duration: 150 }}>
			{t(toast.message)}
		</p>
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
		max-width: calc(100vw - 2 * var(--space-4));
	}

	.toast {
		margin: 0;
		padding: var(--space-3) var(--space-4);
		border-radius: var(--radius-md);
		box-shadow: var(--shadow-md);
		font-size: var(--font-size-sm);
		font-weight: 600;
		text-align: center;
	}

	.toast.error {
		background: var(--color-error);
		color: var(--color-on-error);
	}

	.toast.info {
		background: var(--color-secondary);
		color: var(--color-on-secondary);
	}
</style>
