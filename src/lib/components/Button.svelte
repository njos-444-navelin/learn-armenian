<script lang="ts">
	import type { Snippet } from 'svelte';

	type Variant = 'primary' | 'secondary' | 'success' | 'error';

	interface BaseProps {
		variant?: Variant | undefined;
		children: Snippet;
	}

	interface LinkProps extends BaseProps {
		href: string;
		ariaCurrent?: 'page' | undefined;
		/** Forces a full page navigation instead of client-side routing — needed
		 * when the destination has a different `<html lang>` than the current
		 * page, since that attribute is only (re)stamped by the server. */
		reload?: boolean | undefined;
	}

	interface ActionProps extends BaseProps {
		href?: undefined;
		type?: 'button' | 'submit' | undefined;
		formaction?: string | undefined;
		disabled?: boolean | undefined;
		onclick?: (() => void) | undefined;
	}

	type Props = LinkProps | ActionProps;

	let { variant = 'primary', children, ...rest }: Props = $props();
</script>

{#if rest.href !== undefined}
	<a
		class="button {variant}"
		href={rest.href}
		aria-current={rest.ariaCurrent}
		data-sveltekit-reload={rest.reload ? '' : undefined}
	>
		{@render children()}
	</a>
{:else}
	<button
		class="button {variant}"
		type={rest.type ?? 'button'}
		formaction={rest.formaction}
		disabled={rest.disabled}
		onclick={rest.onclick}
	>
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
		border-radius: var(--radius-md);
		border: 1px solid transparent;
		font-family: var(--font-family-sans);
		font-size: var(--font-size-md);
		font-weight: 600;
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
		background: var(--color-primary);
		color: var(--color-on-primary);
	}

	.primary:hover:not(:disabled) {
		background: var(--color-primary-hover);
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
</style>
