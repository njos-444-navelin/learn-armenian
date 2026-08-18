<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import NavigationProgress from '$lib/components/NavigationProgress.svelte';
	import Toast from '$lib/components/Toast.svelte';
	import { pwaInfo } from 'virtual:pwa-info';
	import { onMount } from 'svelte';
	import { invalidate, onNavigate } from '$app/navigation';

	let { data, children } = $props();
	let { claims, supabase } = $derived(data);

	onMount(() => {
		if (pwaInfo) {
			import('virtual:pwa-register').then(({ registerSW }) => registerSW({ immediate: true }));
		}
	});

	// Cross-fades between pages using the browser's native View Transitions
	// API — the UA default cross-fade is used as-is (see app.css for just a
	// duration tweak). Feature-detected: browsers without support just
	// navigate instantly, same as before. `::view-transition-*`
	// pseudo-elements live outside the regular DOM tree, so they aren't
	// reached by app.css's `*, *::before, *::after` reduced-motion rule —
	// checked directly here instead, same intent as that rule.
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
		{@html pwaInfo.webManifest.linkTag}
	{/if}
</svelte:head>

<NavigationProgress />

{@render children()}

<Toast />
