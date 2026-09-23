<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import NavigationProgress from '$lib/components/NavigationProgress.svelte';
	import Toast from '$lib/components/Toast.svelte';
	import { pwaInfo } from 'virtual:pwa-info';
	import { onMount } from 'svelte';
	import { invalidate, onNavigate } from '$app/navigation';
	import { pushToast } from '$lib/stores/toasts.svelte';
	import { newVersionAvailableMessage } from '$lib/i18n/dictionaries/common';

	let { data, children } = $props();
	let { claims, supabase } = $derived(data);

	onMount(() => {
		if (pwaInfo) {
			import('virtual:pwa-register').then(({ registerSW }) =>
				registerSW({
					immediate: true,
					// The default is an unprompted reload the moment the updated service
					// worker activates, including mid-navigation — which is what produced
					// the flash of unstyled content. Prompt, and let the user tap.
					onNeedReload() {
						pushToast(newVersionAvailableMessage, 'info', () => window.location.reload());
					}
				})
			);
		}
	});

	// The UA's default cross-fade, used as-is (app.css only tweaks the
	// duration). `::view-transition-*` pseudo-elements live outside the DOM tree,
	// so app.css's reduced-motion rule can't reach them — checked here instead.
	onNavigate((navigation) => {
		if (!document.startViewTransition) return;
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

		return new Promise((resolve) => {
			document.startViewTransition(async () => {
				resolve();
				await navigation.complete;
			});
		});
	});

	onMount(() => {
		const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
			if (newSession?.expires_at !== claims?.exp) invalidate('supabase:auth');
		});
		return () => sub.subscription.unsubscribe();
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	{#if pwaInfo}
		<!-- eslint-disable-next-line svelte/no-at-html-tags -- vite-plugin-pwa's own generated <link rel="manifest"> tag, never user-controlled -->
		{@html pwaInfo.webManifest.linkTag}
	{/if}
</svelte:head>

<NavigationProgress />

{@render children()}

<Toast />
