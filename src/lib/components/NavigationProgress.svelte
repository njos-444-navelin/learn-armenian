<script lang="ts">
	import { navigating } from '$app/state';

	let width = $state(0);
	let opacity = $state(0);
	let fast = $state(false);

	// Waits before showing anything: most navigations here resolve well under
	// this delay, and a bar that flashes on every click reads as noise. Past it,
	// the bar trickles toward but never reaches completion, since there's no real
	// percentage to report. A superseding navigation reruns the effect and clears
	// the stale timeout.
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

<!-- A band of 4px "pixels" in the flag's colours, drawn once as an SVG
     pattern anchored at the left edge, so it never shifts under the growing
     tip. The ground is --color-primary, so on an Android PWA the band reads
     as the status bar's colour continuing into the page. Flag red (R) and
     blue (B) mesh as stepped teeth — the smallest form of the stair pattern
     on the Artsakh flag and in Armenian carpet borders — which is what makes
     it read as woven. One tile is 4 cells (16px); four tiles shown:

       RRR·RRR·RRR·RRR·
       ·R·B·R·B·R·B·R·B
       B·BBB·BBB·BBB·BB

     The rects below are generated from this grid — edit the grid first, then
     the rects to match. -->
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
