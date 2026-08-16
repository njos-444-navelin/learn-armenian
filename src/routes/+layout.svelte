<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import Toast from '$lib/components/Toast.svelte';
	import { pwaInfo } from 'virtual:pwa-info';
	import { onMount } from 'svelte';
	import { invalidate } from '$app/navigation';

	let { data, children } = $props();
	let { claims, supabase } = $derived(data);

	onMount(() => {
		if (pwaInfo) {
			import('virtual:pwa-register').then(({ registerSW }) => registerSW({ immediate: true }));
		}
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

{@render children()}

<Toast />
