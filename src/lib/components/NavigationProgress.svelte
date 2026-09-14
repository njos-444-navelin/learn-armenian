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
     scrolls or shifts under the growing tip).

     The ground is --color-primary, the app's theme colour, so on an
     Android PWA the band reads as the status bar's colour continuing
     down into the page, with the motif set *in* that field — not as a
     second line drawn under it. On the ground, in flag red (R) and flag
     blue (B), meshed teeth: stepped pendants (3 cells over 1) hanging
     from the top in red, and the same shape rising from the bottom in
     blue, interleaved so each tip sits between the other row's teeth.
     One tile is 4 cells (16px); four tiles shown:

       RRR·RRR·RRR·RRR·
       ·R·B·R·B·R·B·R·B
       B·BBB·BBB·BBB·BB

     The stepped tooth is the smallest form of the stair pattern on the
     Artsakh flag and in Armenian carpet borders; meshing two rows of
     them is what makes the band read as woven rather than as things
     hanging off a string (an earlier version with one row of pendants
     and air between them looked like a garland). The rects below are
     generated from this grid — edit the grid in this comment first,
     then the rects to match. See DESIGN.md's Motion section. -->
<div class="bar" class:fast style="width: {width}%; opacity: {opacity}" aria-hidden="true">
	<svg class="ornament" height="12" preserveAspectRatio="none">
		<defs>
			<pattern id="nav-ornament" width="16" height="12" patternUnits="userSpaceOnUse">
				<rect class="ground" x="0" y="0" width="16" height="12" />
				<rect class="red" x="0" y="0" width="12" height="4" />
				<rect class="red" x="4" y="4" width="4" height="4" />
				<rect class="blue" x="12" y="4" width="4" height="4" />
				<rect class="blue" x="0" y="8" width="4" height="4" />
				<rect class="blue" x="8" y="8" width="8" height="4" />
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

	.ground {
		fill: var(--color-primary);
	}

	.red {
		fill: var(--color-flag-red);
	}

	.blue {
		fill: var(--color-flag-blue);
	}
</style>
