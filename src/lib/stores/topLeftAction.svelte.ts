/**
 * Lets a multi-screen, single-route flow (the alphabet trainer today; any
 * future lesson type built the same way) swap the fixed top-left "Back"
 * bubble for a "Close" (X) one while showing an in-page screen the URL
 * doesn't reflect. `BackButton.svelte` is rendered once in the root
 * locale layout — a sibling of page content, not its ancestor — so a page
 * component can't hand it a callback via props or context; this is the
 * same "deeply nested component drives layout-owned UI" shape as
 * `toasts.svelte.ts`, just for the back/close bubble instead of a toast
 * stack.
 *
 * `BackButton`'s own parent-path logic would otherwise take over here: a
 * mid-flow screen change (e.g. `AlphabetTrainer.svelte`'s `screen` state)
 * isn't a URL change, so "back" would point at the route's parent page,
 * not back to the flow's own starting screen.
 */
export const topLeftActionState = $state<{ onClose: (() => void) | null }>({ onClose: null });

/** Pass a callback to take over the bubble as "Close" for as long as it's
 * active; pass `null` to hand it back to the normal Back behavior. Pair
 * this with an `$effect` whose cleanup calls `setCloseAction(null)`, so
 * leaving the screen (or the route entirely) can't leave it stuck. */
export function setCloseAction(onClose: (() => void) | null): void {
	topLeftActionState.onClose = onClose;
}
