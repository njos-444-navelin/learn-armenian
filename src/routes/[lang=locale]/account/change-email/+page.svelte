<script lang="ts">
	import AuthField from '$lib/components/AuthField.svelte';
	import AuthForm from '$lib/components/AuthForm.svelte';
	import Button from '$lib/components/Button.svelte';
	import FormError from '$lib/components/FormError.svelte';
	import PageShell from '$lib/components/PageShell.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import { createPendingSubmit } from '$lib/forms/pendingSubmit.svelte';
	import { t } from '$lib/i18n/current';
	import {
		changeEmailPageTitle,
		changeEmailPageDescription,
		changeEmailButton,
		newEmailLabel,
		changeEmailSuccess,
		sameEmailError,
		authErrorMessages,
		genericAuthError
	} from '$lib/i18n/dictionaries/account';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();

	const pendingSubmit = createPendingSubmit();

	function errorMessage(code: string | undefined) {
		if (code === 'same_email') return t(sameEmailError);
		return code !== undefined ? t(authErrorMessages[code] ?? genericAuthError) : undefined;
	}
</script>

<Seo title={changeEmailPageTitle} description={changeEmailPageDescription} />

<PageShell>
	<h1>{t(changeEmailButton)}</h1>

	<AuthForm action="?/changeEmail" submit={pendingSubmit.submit}>
		<AuthField
			label={newEmailLabel}
			type="email"
			name="email"
			autocomplete="email"
			value={form?.email ?? ''}
		/>
		{#if form?.errorCode}
			<FormError message={errorMessage(form.errorCode) ?? ''} />
		{/if}
		{#if form?.success}
			<p role="status">{t(changeEmailSuccess)}</p>
		{/if}
		<Button
			type="submit"
			variant="primary"
			loading={pendingSubmit.pending}
			disabled={pendingSubmit.pending}
		>
			{t(changeEmailButton)}
		</Button>
	</AuthForm>
</PageShell>
