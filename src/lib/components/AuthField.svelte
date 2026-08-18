<script lang="ts">
	import { t } from '$lib/i18n/current';
	import type { Translated } from '$lib/i18n/types';

	interface Props {
		label: Translated;
		type: 'email' | 'password';
		name: string;
		autocomplete: 'email' | 'current-password' | 'new-password';
		value?: string | undefined;
		minlength?: number | undefined;
	}

	let { label, type, name, autocomplete, value, minlength }: Props = $props();
</script>

<label>
	{t(label)}
	<input {type} {name} required {autocomplete} value={value ?? ''} {minlength} />
</label>

<style>
	label {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		font-size: var(--font-size-sm);
		color: var(--color-text-secondary);
		text-align: left;
	}

	input {
		min-height: var(--tap-target-min);
		padding: var(--space-2) var(--space-4);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-pill);
		font-size: var(--font-size-md);
		font-family: var(--font-family-body);
		background: var(--color-surface);
		color: var(--color-text-primary);
		caret-color: var(--color-primary);
	}

	input:focus-visible {
		border-color: var(--color-primary);
	}
</style>
