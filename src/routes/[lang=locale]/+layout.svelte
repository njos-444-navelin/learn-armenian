<script lang="ts">
	import BackButton from '$lib/components/BackButton.svelte';
	import UserMenu from '$lib/components/UserMenu.svelte';
	import { skipToContent } from '$lib/i18n/dictionaries/common';
	import { getLocale, t } from '$lib/i18n/current';
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();
	let locale = $derived(getLocale());

	$effect(() => {
		document.documentElement.lang = locale;
	});
</script>

<a class="skip-link" href="#main">{t(skipToContent)}</a>

<BackButton />
<UserMenu />

{@render children()}

<style>
	.skip-link {
		position: absolute;
		left: -9999px;
		top: 0;
		z-index: var(--z-page-top);
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
