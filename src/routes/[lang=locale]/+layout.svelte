<script lang="ts">
	import { page } from '$app/state';
	import BackButton from '$lib/components/BackButton.svelte';
	import LanguageSwitcher from '$lib/components/LanguageSwitcher.svelte';
	import { skipToContent } from '$lib/i18n/dictionaries/common';
	import { getLocale, t } from '$lib/i18n/current';
	import { getStoredLocale, setStoredLocale } from '$lib/i18n/preference';
	import { withLocale, withoutLocale } from '$lib/i18n/paths';
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();

	$effect(() => {
		const current = getLocale();
		const stored = getStoredLocale();
		if (stored !== null && stored !== current) {
			// A returning learner's remembered choice disagrees with whatever locale
			// this particular page load landed on (e.g. root's Accept-Language guess) —
			// honor the stored choice. Explicitly clicking the language switcher always
			// updates the stored value first, so this never fights that action.
			// A full navigation (not client-side goto) so <html lang> gets re-stamped
			// by hooks.server.ts, which only runs on real server-rendered page loads.
			window.location.replace(withLocale(stored, withoutLocale(page.url.pathname)));
		} else {
			setStoredLocale(current);
		}
	});
</script>

<a class="skip-link" href="#main">{t(skipToContent)}</a>

<BackButton />
<LanguageSwitcher />

{@render children()}

<style>
	.skip-link {
		position: absolute;
		left: -9999px;
		top: 0;
		z-index: 100;
		padding: var(--space-2) var(--space-4);
		background: var(--color-primary);
		color: var(--color-on-primary);
		border-radius: var(--radius-sm);
	}

	.skip-link:focus {
		left: var(--space-4);
		top: var(--space-4);
	}
</style>
