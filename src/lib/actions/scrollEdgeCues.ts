import type { Action } from 'svelte/action';

/**
 * Marks a horizontally scrolling row with `data-cue-start` / `data-cue-end`
 * while content is hidden on that side, so the element's CSS can fade the cut
 * edge. Re-measured on scroll and on resize of the row or its content.
 *
 * Runs against the node itself when it is the scroll container, or its first
 * child otherwise; the attributes always land on `node`, since a
 * pseudo-element on the scroller would scroll away with the content.
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
