import type { Translated } from '$lib/i18n/types';

export type ToastVariant = 'error' | 'info';

export interface ToastEntry {
	id: number;
	message: Translated;
	variant: ToastVariant;
	onClick?: () => void;
	/** True while the exit animation is playing — see `dismissToast()`. */
	closing: boolean;
}

const DISPLAY_MS = 5000;

let nextId = 0;

/** Wrapped in an object so the array can be reassigned while importers keep a
 * live reference: an exported bare `$state` array can only be mutated in
 * place from outside the module. */
export const toastState = $state<{ items: ToastEntry[] }>({ items: [] });

/** Queues a toast, which disappears after 5s on its own timer. Pass `onClick`
 * to make it actionable; tapping fires the callback and dismisses it. */
export function pushToast(
	message: Translated,
	variant: ToastVariant = 'error',
	onClick?: () => void
): void {
	const id = nextId++;
	const entry: ToastEntry = onClick
		? { id, message, variant, onClick, closing: false }
		: { id, message, variant, closing: false };
	toastState.items = [...toastState.items, entry];
	setTimeout(() => dismissToast(id), DISPLAY_MS);
}

/**
 * Starts the exit animation; `Toast.svelte` drops the toast on `animationend`
 * via `removeToast()`. Reduced motion has no exit animation, so that event
 * never fires and the toast is removed directly instead.
 */
export function dismissToast(id: number): void {
	if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
		removeToast(id);
		return;
	}
	toastState.items = toastState.items.map((toast) =>
		toast.id === id ? { ...toast, closing: true } : toast
	);
}

export function removeToast(id: number): void {
	toastState.items = toastState.items.filter((toast) => toast.id !== id);
}
