<script lang="ts">
	// Decorative only — the operation's pending state is announced via
	// `aria-busy`/`disabled` on whatever triggered it (see Button's `loading`
	// prop), not by this element itself, so it stays aria-hidden here.
</script>

<svg class="spinner" viewBox="0 0 24 24" fill="none" aria-hidden="true" width="1em" height="1em">
	<circle
		cx="12"
		cy="12"
		r="10"
		stroke="currentColor"
		stroke-width="3"
		stroke-linecap="round"
		stroke-dasharray="47 16"
	/>
</svg>

<style>
	.spinner {
		flex-shrink: 0;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
