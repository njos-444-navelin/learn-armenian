<script lang="ts">
	import AlphabetTrainer from '$lib/components/AlphabetTrainer.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import { ALPHABET } from '$lib/content/alphabet';
	import { pageDescription, pageTitle } from '$lib/i18n/dictionaries/alphabetTrainer';
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();
</script>

<Seo title={pageTitle} description={pageDescription} />

<AlphabetTrainer letters={ALPHABET} initialLevels={data.levels} signedIn={data.signedIn} />
