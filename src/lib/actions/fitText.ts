import type { Action } from 'svelte/action';

/**
 * Shrinks an element's font-size just enough that its text fits on one line.
 * CSS has no selector for "this text is overflowing", and a character count
 * isn't reliable across scripts. Falls back to wrapping rather than clipping
 * if even the minimum doesn't fit.
 *
 * Expects the element to be inline-block or block with `max-width: 100%` and
 * `overflow: hidden`; this only toggles `white-space` and `font-size`.
 */
export const fitText: Action<HTMLElement, number | undefined> = (node, minPx = 16) => {
	let baseFontSize: number | undefined;

	function fit(): void {
		baseFontSize ??= parseFloat(getComputedStyle(node).fontSize);

		node.style.whiteSpace = 'nowrap';
		let fontSize = baseFontSize;
		node.style.fontSize = `${fontSize}px`;

		while (node.scrollWidth > node.clientWidth && fontSize > minPx) {
			fontSize -= 1;
			node.style.fontSize = `${fontSize}px`;
		}

		if (node.scrollWidth > node.clientWidth) {
			node.style.whiteSpace = 'normal';
		}
	}

	fit();

	// Observes the parent: observing `node` would fire on the very changes
	// `fit()` just made to it, risking a feedback loop.
	const target = node.parentElement ?? node;
	const resizeObserver = new ResizeObserver(fit);
	resizeObserver.observe(target);

	return {
		destroy() {
			resizeObserver.disconnect();
		}
	};
};
