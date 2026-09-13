import type { Action } from 'svelte/action';

/**
 * Marks a horizontally scrolling row with `data-cue-start` / `data-cue-end`
 * while there is hidden content on that side, so the element's own CSS can
 * fade the edge that's cut off (see the account dashboard's progress row).
 * The cue is information, not decoration: neither attribute is set when
 * everything fits, only the end one when the row sits at its start, only
 * the start one when it's scrolled to the end. Re-measured on scroll and
 * whenever the row or its content resizes, so a tile appearing later or a
 * window resize that makes everything fit is picked up without a reload.
 *
 * Runs against the node itself when it is the scroll container, or the
 * first child otherwise — the attributes always land on `node`, which is
 * where the overlay pseudo-elements have to live (a pseudo-element on the
 * scroller itself would scroll away with the content).
 */
export const scrollEdgeCues: Action<HTMLElement> = (node) => {
	const scroller =
		getComputedStyle(node).overflowX === 'auto' || getComputedStyle(node).overflowX === 'scroll'
			? node
			: (node.firstElementChild as HTMLElement | null);
	if (scroller === null) return;

	function update(): void {
		if (scroller === null) return;
		const { scrollLeft, clientWidth, scrollWidth } = scroller;
		// 1px of slack: subpixel layouts report scrollWidth a fraction over
		// clientWidth even when nothing is actually hidden.
		node.toggleAttribute('data-cue-start', scrollLeft > 1);
		node.toggleAttribute('data-cue-end', scrollLeft + clientWidth < scrollWidth - 1);
	}

	scroller.addEventListener('scroll', update, { passive: true });
	const observer = new ResizeObserver(update);
	observer.observe(scroller);
	for (const child of scroller.children) observer.observe(child);
	update();

	return {
		destroy() {
			scroller.removeEventListener('scroll', update);
			observer.disconnect();
		}
	};
};
