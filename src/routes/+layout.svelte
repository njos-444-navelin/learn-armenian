<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { pwaInfo } from 'virtual:pwa-info';
	import { onMount } from 'svelte';

	let { children } = $props();

	onMount(() => {
		if (pwaInfo) {
			import('virtual:pwa-register').then(({ registerSW }) => registerSW({ immediate: true }));
		}
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	{#if pwaInfo}
		{@html pwaInfo.webManifest.linkTag}
	{/if}
</svelte:head>

{@render children()}
