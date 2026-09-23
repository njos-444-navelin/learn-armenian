import type { ActionResult, SubmitFunction } from '@sveltejs/kit';

/**
 * The shared Conventions #8 pending-state wrapper for the auth pages: set
 * `pending`, keep entered values on screen with `update({ reset: false })`,
 * and clear `pending` once the request settles. Pass `resetOn` for the
 * change-password-style exception that clears its own sensitive fields.
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
