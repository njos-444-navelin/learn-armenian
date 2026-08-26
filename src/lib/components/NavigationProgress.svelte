<script lang="ts">
	import { navigating } from '$app/state';

	let width = $state(0);
	let opacity = $state(0);
	let fast = $state(false);

	// Waits before showing anything — most navigations in this app (hover-
	// preloaded links, cached routes) resolve well under this delay, and a
	// bar that flashes on for every single click (e.g. repeatedly toggling
	// the language on the home screen) reads as noise, not progress. Only a
	// navigation that's still running once the delay elapses starts the
	// "trickle": filling slowly toward (but not reaching) completion, since
	// we have no real progress percentage to report. If a *new* navigation
	// supersedes this one before the delay fires, the effect reruns
	// (`navigating.to` is a fresh object) and the stale timeout is cleared
	// before it ever shows the bar.
	$effect(() => {
		if (navigating.to === null) return;
		const show = setTimeout(() => {
			fast = false;
			opacity = 1;
			width = 82;
		}, 150);
		return () => clearTimeout(show);
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
		/* stylelint-disable-next-line local/transition-includes-outline-color -- aria-hidden and pointer-events: none (see markup), never focusable. */
		transition:
			width 4s cubic-bezier(0.1, 0.6, 0.4, 1),
			opacity 0.2s ease;
		z-index: 100;
		pointer-events: none;
	}

	.bar.fast {
		/* stylelint-disable-next-line local/transition-includes-outline-color -- same as .bar above. */
		transition:
			width 0.2s ease-out,
			opacity 0.2s ease 0.2s;
	}
</style>
