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

<!-- The bar is an ornament, not a line: a band of 4px "pixels" in the
     flag's colours, drawn once as an SVG pattern and revealed as the bar
     widens (the pattern is anchored at the left edge, so it never
     scrolls or shifts under the growing tip). Three rows:

       row 1  ██████████  solid --color-primary — the app's theme colour,
                          so on an Android PWA it continues the status
                          bar straight down into the page instead of
                          drawing a second, clashing line under it
       row 2   ▓▓▓  ░░░   stepped pendants, flag red and flag blue in
       row 3    ▓    ░    turn, hanging from the band like a carpet fringe

     One pendant per 20px (a 3-wide step over a 1-wide tip, a cell of
     air either side), so a 40px repeat holds one red and one blue. The
     stepped, chunky-pixel construction is a nod to the Artsakh flag's
     stair pattern; the motif itself is kept to two steps so it still
     reads at 4px cells on a phone. See DESIGN.md's Motion section. -->
<div class="bar" class:fast style="width: {width}%; opacity: {opacity}" aria-hidden="true">
	<svg class="ornament" height="12" preserveAspectRatio="none">
		<defs>
			<pattern id="nav-ornament" width="40" height="12" patternUnits="userSpaceOnUse">
				<rect class="band" x="0" y="0" width="40" height="4" />
				<rect class="red" x="4" y="4" width="12" height="4" />
				<rect class="red" x="8" y="8" width="4" height="4" />
				<rect class="blue" x="24" y="4" width="12" height="4" />
				<rect class="blue" x="28" y="8" width="4" height="4" />
			</pattern>
		</defs>
		<rect width="100%" height="12" fill="url(#nav-ornament)" />
	</svg>
</div>

<style>
	.bar {
		position: fixed;
		top: 0;
		left: 0;
		height: 12px;
		overflow: hidden;
		transition:
			width 4s cubic-bezier(0.1, 0.6, 0.4, 1),
			opacity 0.2s ease;
		z-index: var(--z-page-top);
		pointer-events: none;
	}

	.bar.fast {
		transition:
			width 0.2s ease-out,
			opacity 0.2s ease 0.2s;
	}

	.ornament {
		display: block;
		width: 100%;
	}

	.band {
		fill: var(--color-primary);
	}

	.red {
		fill: var(--color-flag-red);
	}

	.blue {
		fill: var(--color-flag-blue);
	}
</style>
