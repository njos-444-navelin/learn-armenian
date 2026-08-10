<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();
</script>

<main id="main">
	<div class="content">
		{@render children()}
	</div>
</main>

<style>
	main {
		display: flex;
		min-height: 100dvh;
		align-items: center;
		justify-content: center;
		/* Extra top clearance: the back/language bubbles are fixed at the top of
		   every locale page (see [lang=locale]/+layout.svelte) and would otherwise
		   overlap a page's heading. */
		padding: calc(var(--tap-target-min) + var(--space-4) * 2 + env(safe-area-inset-top)) calc(
				var(--space-4) + env(safe-area-inset-right)
			) calc(var(--space-6) + env(safe-area-inset-bottom))
			calc(var(--space-4) + env(safe-area-inset-left));
	}

	.content {
		display: flex;
		width: 100%;
		max-width: var(--measure);
		flex-direction: column;
		align-items: center;
		gap: var(--space-5);
		text-align: center;
	}
</style>
