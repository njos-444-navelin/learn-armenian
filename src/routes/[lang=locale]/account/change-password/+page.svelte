<script lang="ts">
	import { page } from '$app/state';
	import AuthField from '$lib/components/AuthField.svelte';
	import AuthForm from '$lib/components/AuthForm.svelte';
	import Button from '$lib/components/Button.svelte';
	import FormError from '$lib/components/FormError.svelte';
	import PageShell from '$lib/components/PageShell.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import { createPendingSubmit } from '$lib/forms/pendingSubmit.svelte';
	import { t } from '$lib/i18n/current';
	import {
		changePasswordPageTitle,
		changePasswordPageDescription,
		changePasswordButton,
		currentPasswordLabel,
		newPasswordLabel,
		changePasswordSuccess,
		authErrorMessages,
		genericAuthError
	} from '$lib/i18n/dictionaries/account';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
	let email = $derived(page.data.claims?.email ?? '');

	/** Reset the (sensitive) password fields only once the change has
	 * actually succeeded; on failure keep `reset:false` per Conventions #8
	 * so a typo'd current password doesn't force retyping both fields. */
	const pendingSubmit = createPendingSubmit((result) => result.type === 'success');

	function errorMessage(code: string | undefined) {
		return code !== undefined ? t(authErrorMessages[code] ?? genericAuthError) : undefined;
	}
</script>

<Seo title={changePasswordPageTitle} description={changePasswordPageDescription} />

<PageShell>
	<h1>{t(changePasswordButton)}</h1>

	<AuthForm action="?/changePassword" submit={pendingSubmit.submit}>
		<!-- Not read by the action (the server already knows the signed-in
		     user's email) — password managers need it anyway to know which
		     saved credential a new password belongs to. See Conventions #8. -->
		<input
			class="visually-hidden-field"
			type="email"
			name="username"
			autocomplete="username"
			value={email}
			tabindex="-1"
			aria-hidden="true"
		/>
		<AuthField
			label={currentPasswordLabel}
			type="password"
			name="currentPassword"
			autocomplete="current-password"
		/>
		<AuthField
			label={newPasswordLabel}
			type="password"
			name="newPassword"
			autocomplete="new-password"
			minlength={6}
		/>
		{#if form?.errorCode}
			<FormError message={errorMessage(form.errorCode) ?? ''} />
		{/if}
		{#if form?.success}
			<p role="status">{t(changePasswordSuccess)}</p>
		{/if}
		<Button
			type="submit"
			variant="primary"
			loading={pendingSubmit.pending}
			disabled={pendingSubmit.pending}
		>
			{t(changePasswordButton)}
		</Button>
	</AuthForm>
</PageShell>

<style>
	/* A real, visually-hidden <input> rather than type="hidden" — some
	   password manager autofill parsers skip type="hidden" fields entirely. */
	.visually-hidden-field {
		display: none;
	}
</style>
