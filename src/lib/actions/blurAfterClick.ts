import type { Action } from 'svelte/action';

/**
 * Blurs the element after a pointer-triggered click, never after a keyboard
 * activation (which arrives as a `click` with `detail === 0`), so a keyboard
 * user keeps their `:focus-visible` ring.
 *
 * Works around a Firefox/Chrome quirk: an element that keeps focus after a
 * pointer click can have `:focus-visible` spuriously re-evaluated as matching
 * during a later, unrelated interaction. Nothing focused, nothing to re-paint.
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
