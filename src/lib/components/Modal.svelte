<script lang="ts">
	import type { Snippet } from 'svelte';
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

	// `<dialog>` gives us a focus trap, Escape-to-close (as a native `close`
	// event, handled below), and a `::backdrop` for free — cheaper and more
	// robust than hand-rolling those for a truly modal (blocking) dialog.
	$effect(() => {
		dialogEl?.showModal();
	});

	function clickOutside(event: MouseEvent): void {
		if (dialogEl === undefined || event.target !== dialogEl) return;
		const rect = dialogEl.getBoundingClientRect();
		const insideContent =
			event.clientX >= rect.left &&
			event.clientX <= rect.right &&
			event.clientY >= rect.top &&
			event.clientY <= rect.bottom;
		if (!insideContent) onClose();
	}
</script>

<dialog bind:this={dialogEl} aria-labelledby={labelledBy} onclose={onClose} onclick={clickOutside}>
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
</dialog>

<style>
	dialog {
		width: min(90vw, 26rem);
		margin: auto;
		padding: var(--space-5);
		border: none;
		border-radius: var(--radius-lg);
		background: var(--color-background);
		box-shadow: var(--shadow-lg);
	}

	dialog::backdrop {
		background: var(--color-backdrop);
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
