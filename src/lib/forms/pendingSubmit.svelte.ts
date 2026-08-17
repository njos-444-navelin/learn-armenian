import type { ActionResult, SubmitFunction } from '@sveltejs/kit';

/**
 * Shared Conventions #8 pending-state wrapper for the common case across the
 * auth pages: set `pending` before the request, keep entered values on
 * screen while it's in flight (`update({ reset: false })` — see the
 * anti-pattern note in docs/CONVENTIONS.md #8), and always clear `pending`
 * once the request settles. Pass `resetOn` for the change-password-style
 * exception that resets its own (sensitive) fields on a
 * confirmed-successful submission — see Conventions #8's exception note.
 */
export function createPendingSubmit(resetOn?: (result: ActionResult) => boolean) {
	let pending = $state(false);

	const submit: SubmitFunction = () => {
		pending = true;
		return async ({ update, result }) => {
			try {
				await update({ reset: resetOn?.(result) ?? false });
			} finally {
				pending = false;
			}
		};
	};

	return {
		get pending() {
			return pending;
		},
		submit
	};
}
