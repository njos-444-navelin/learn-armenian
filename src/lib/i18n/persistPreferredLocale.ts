import type { Locale } from './locale';
import { preferredLocaleSaveFailedMessage } from './dictionaries/common';
import { pushToast } from '$lib/stores/toasts.svelte';

/**
 * Fire-and-forget: persists the user's chosen locale in the background while
 * navigation to that locale proceeds immediately — the same optimistic,
 * no-rollback shape as grading a card (see Conventions §8). Only call when
 * the user is signed in; there's nowhere to persist a signed-out visitor's
 * choice.
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
