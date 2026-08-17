<script lang="ts">
	interface Props {
		message: string;
	}

	let { message }: Props = $props();
</script>

<p class="error" role="alert">{message}</p>

<style>
	.error {
		color: var(--color-error);
		font-size: var(--font-size-sm);
	}
</style>
