<script lang="ts">
	import { navigating } from '$app/state';

	let width = $state(0);
	let opacity = $state(0);
	let fast = $state(false);

	// Starts the moment a navigation begins, filling slowly toward (but not
	// reaching) completion — a classic "trickle" loading bar, since we have
	// no real progress percentage to report.
	$effect(() => {
		if (navigating.to === null) return;
		fast = false;
		opacity = 1;
		width = 82;
	});

	// Once the navigation resolves, snaps the rest of the way to 100%
	// quickly, then fades out and resets — ready for the next navigation.
	$effect(() => {
		if (navigating.to !== null || width === 0) return;
		fast = true;
		width = 100;
		const fadeOut = setTimeout(() => (opacity = 0), 200);
		const reset = setTimeout(() => {
			width = 0;
			fast = false;
		}, 400);
		return () => {
			clearTimeout(fadeOut);
			clearTimeout(reset);
		};
	});
</script>

<div class="bar" class:fast style="width: {width}%; opacity: {opacity}" aria-hidden="true"></div>

<style>
	.bar {
		position: fixed;
		top: 0;
		left: 0;
		height: 3px;
		background: var(--color-primary);
		transition:
			width 4s cubic-bezier(0.1, 0.6, 0.4, 1),
			opacity 0.2s ease;
		z-index: 100;
		pointer-events: none;
	}

	.bar.fast {
		transition:
			width 0.2s ease-out,
			opacity 0.2s ease 0.2s;
	}
</style>
