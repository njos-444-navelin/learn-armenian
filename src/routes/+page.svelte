<script lang="ts">
	import { continueLabel } from '$lib/i18n/dictionaries/common';
	import { t } from '$lib/i18n/current';
	import { DEFAULT_LOCALE } from '$lib/i18n/locale';
	import { withLocale } from '$lib/i18n/paths';
</script>

<noscript>
	<a href={withLocale(DEFAULT_LOCALE, '/')}>{t(continueLabel)}</a>
</noscript>
