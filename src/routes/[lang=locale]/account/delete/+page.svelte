<script lang="ts">
	import AuthField from '$lib/components/AuthField.svelte';
	import AuthForm from '$lib/components/AuthForm.svelte';
	import Button from '$lib/components/Button.svelte';
	import FormError from '$lib/components/FormError.svelte';
	import PageShell from '$lib/components/PageShell.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import { createPendingSubmit } from '$lib/forms/pendingSubmit.svelte';
	import { getLocale, t } from '$lib/i18n/current';
	import { withLocale } from '$lib/i18n/paths';
	import {
		deletePageTitle,
		deletePageDescription,
		deleteAccountButton,
		deleteWarning,
		deleteConfirmEmailLabel,
		emailMismatchError,
		backToAccount,
		authErrorMessages,
		genericAuthError
	} from '$lib/i18n/dictionaries/account';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
	let accountHref = $derived(withLocale(getLocale(), '/account'));

	const pendingSubmit = createPendingSubmit();

	function errorMessage(code: string | undefined) {
		if (code === 'email_mismatch') return t(emailMismatchError);
		return code !== undefined ? t(authErrorMessages[code] ?? genericAuthError) : undefined;
	}
</script>

<Seo title={deletePageTitle} description={deletePageDescription} />

<PageShell>
	<h1>{t(deleteAccountButton)}</h1>
	<p class="warning">{t(deleteWarning)}</p>

	<AuthForm action="?/deleteAccount" submit={pendingSubmit.submit}>
		<AuthField label={deleteConfirmEmailLabel} type="email" name="email" autocomplete="email" />
		{#if form?.errorCode}
			<FormError message={errorMessage(form.errorCode) ?? ''} />
		{/if}
		<Button
			type="submit"
			variant="error"
			glow
			loading={pendingSubmit.pending}
			disabled={pendingSubmit.pending}
		>
			{t(deleteAccountButton)}
		</Button>
	</AuthForm>

	<a href={accountHref}>{t(backToAccount)}</a>
</PageShell>

<style>
	.warning {
		color: var(--color-text-secondary);
	}
</style>
