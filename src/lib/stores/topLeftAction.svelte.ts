/**
 * Lets a multi-screen, single-route flow swap the fixed top-left "Back" bubble
 * for a "Close" one while showing an in-page screen the URL doesn't reflect.
 * `BackButton.svelte` is rendered once in the locale layout, a sibling of page
 * content rather than its ancestor, so a page can't hand it a callback — the
 * same shape as `toasts.svelte.ts`.
 *
 * Without this, `BackButton`'s parent-path logic would point "back" at the
 * route's parent page, since a mid-flow screen change isn't a URL change.
 */
export const topLeftActionState = $state<{ onClose: (() => void) | null }>({ onClose: null });

/** Pass a callback to take over the bubble; pass `null` to hand it back. Pair
 * it with an `$effect` whose cleanup passes `null`, so leaving the screen
 * can't leave the bubble stuck. */
export function setCloseAction(onClose: (() => void) | null): void {
	topLeftActionState.onClose = onClose;
}
