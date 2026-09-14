<script lang="ts">
	import { page } from '$app/state';
	import FloatingActionBar from './FloatingActionBar.svelte';
	import PulseCta from './PulseCta.svelte';
	import { getLocale, t } from '$lib/i18n/current';
	import { withLocale } from '$lib/i18n/paths';
	import {
		nothingDueYetLabel,
		trainVocabularyMenuLabel,
		wordsToPracticeHint
	} from '$lib/i18n/dictionaries/vocabularyTraining';

	let locale = $derived(getLocale());
	// Reuses the same cheap boolean the account-menu badge already loads on
	// every page (see [lang=locale]/+layout.server.ts) rather than
	// re-computing an exact new/due count here — the training page itself is
	// the only place that needs (and pays for) that full breakdown.
	let hasWordsToPractice = $derived(page.data.hasWordsToPractice === true);
</script>

<FloatingActionBar bare>
	<PulseCta
		href={withLocale(locale, '/learn/vocabulary/train')}
		label={t(trainVocabularyMenuLabel)}
		subtitle={hasWordsToPractice ? t(wordsToPracticeHint) : t(nothingDueYetLabel)}
	/>
</FloatingActionBar>
