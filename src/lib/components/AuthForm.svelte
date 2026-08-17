<script lang="ts">
	import { enhance } from '$app/forms';
	import type { Snippet } from 'svelte';
	import type { SubmitFunction } from '@sveltejs/kit';

	interface Props {
		action: string;
		submit: SubmitFunction;
		children: Snippet;
	}

	let { action, submit, children }: Props = $props();
</script>

<form method="POST" {action} use:enhance={submit}>
	{@render children()}
</form>

<style>
	form {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		width: 100%;
		max-width: 20rem;
	}
</style>
