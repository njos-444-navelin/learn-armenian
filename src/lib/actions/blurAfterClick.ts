import type { Action } from 'svelte/action';

/**
 * Blurs the element right after a pointer/touch-triggered click — never
 * after a keyboard activation (Enter/Space), which the browser dispatches
 * as a `click` event with `detail === 0`, so a real keyboard user still
 * keeps their `:focus-visible` ring exactly as expected.
 *
 * Works around a real browser quirk, confirmed on Firefox (Linux and
 * Android) and Chrome (Android) — not one device or engine: a button that
 * keeps DOM focus after a pointer click (correctly showing no ring, since
 * `:focus-visible` doesn't match a pointer click) can have that same,
 * still-focused element's `:focus-visible` status spuriously re-evaluated
 * as *matching* for one style-recalc pass whenever a LATER, unrelated
 * interaction happens elsewhere on the page — e.g. tapping a "tap to
 * replay" button, then picking an answer option, briefly re-shows a ring on
 * the replay button. The app's own always-present, always-transitioning
 * outline (see app.css) is what turns that one-frame recalc glitch into a
 * visible fade-in/fade-out flash rather than an imperceptible blip.
 * Removing focus from the element the instant its own click finishes means
 * there's nothing left focused for a later, unrelated interaction to
 * spuriously re-paint.
 */
export const blurAfterClick: Action<HTMLElement> = (node) => {
	function handleClick(event: MouseEvent): void {
		if (event.detail === 0) return;
		node.blur();
	}

	node.addEventListener('click', handleClick);

	return {
		destroy() {
			node.removeEventListener('click', handleClick);
		}
	};
};
