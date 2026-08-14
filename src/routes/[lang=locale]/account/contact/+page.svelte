<!-- Deliberately no +page.server.ts / requireSignedIn guard here, unlike its
     sibling account/ routes — support should stay reachable whether or not
     you can currently sign in. -->
<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import PageShell from '$lib/components/PageShell.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import { t } from '$lib/i18n/current';
	import { heading, pageTitle, pageDescription, body, supportEmail } from '$lib/i18n/dictionaries/contact';
</script>

<Seo title={pageTitle} description={pageDescription} />

<PageShell>
	<h1>{t(heading)}</h1>
	<p>{t(body)}</p>
	<Button href="mailto:{supportEmail}" variant="primary">{supportEmail}</Button>
</PageShell>
