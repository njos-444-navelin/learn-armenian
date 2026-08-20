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

/** Wrapped in an object so the array can be reassigned (push/remove) while
 * every importer keeps a live reference — see Svelte 5 cross-module state:
 * exporting a bare `let $state(...)` array can't be reassigned from outside
 * this module, only mutated in place. */
export const toastState = $state<{ items: ToastEntry[] }>({ items: [] });

/** Queues a toast; it disappears on its own after 5s regardless of how many
 * others are showing (each has its own independent timer, not a shared
 * one-at-a-time queue). Pass `onClick` to make it actionable (e.g. a reload
 * prompt) — tapping it fires the callback and dismisses the toast early. */
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
 * Starts a toast's exit animation rather than removing it outright —
 * `Toast.svelte` actually drops it from `toastState` once that animation's
 * `animationend` fires, via `removeToast()` below. Reduced-motion visitors
 * get no exit animation (`.toast.closing` has `animation: none` — see
 * Toast.svelte), so `animationend` would never fire for them; skip straight
 * to `removeToast()` in that case rather than leaving the toast stuck on
 * screen forever waiting for an event that isn't coming.
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
