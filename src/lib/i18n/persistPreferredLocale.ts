import type { Locale } from './locale';
import { preferredLocaleSaveFailedMessage } from './dictionaries/common';
import { pushToast } from '$lib/stores/toasts.svelte';

/**
 * Fire-and-forget: persists the chosen locale while navigation proceeds, the
 * same optimistic shape as grading a card (Conventions §8). Signed-in callers
 * only — there's nowhere to persist a signed-out visitor's choice.
 */
export function persistPreferredLocale(locale: Locale): void {
	fetch('/api/preferred-locale', {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({ locale })
	})
		.then((response) => {
			if (!response.ok) pushToast(preferredLocaleSaveFailedMessage, 'error');
		})
		.catch(() => pushToast(preferredLocaleSaveFailedMessage, 'error'));
}
