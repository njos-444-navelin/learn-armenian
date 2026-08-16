import type { Action } from 'svelte/action';

/**
 * Shrinks an element's font-size, in place, just enough that its text fits
 * on one line within its own current width — CSS alone can't do this
 * (there's no selector for "this text is overflowing its box"), and a
 * character-count heuristic isn't reliable either, since glyph widths vary
 * a lot by script (Armenian words of the same length as an English one
 * routinely render wider). Falls back to letting the text wrap, rather
 * than clip, if even the minimum size doesn't fit — never hides part of
 * the word.
 *
 * Expects the element to already be `display: inline-block` (or block)
 * with `max-width: 100%` and `overflow: hidden` in CSS — this action only
 * ever toggles `white-space` and `font-size`, it doesn't size the box.
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

	// Observes the parent, not `node` itself — observing `node` would also
	// fire on the font-size/white-space changes `fit()` just made to it,
	// which resize it too, risking a feedback loop.
	const target = node.parentElement ?? node;
	const resizeObserver = new ResizeObserver(fit);
	resizeObserver.observe(target);

	return {
		destroy() {
			resizeObserver.disconnect();
		}
	};
};
