<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import AuthField from '$lib/components/AuthField.svelte';
	import Button from '$lib/components/Button.svelte';
	import PageShell from '$lib/components/PageShell.svelte';
	import Seo from '$lib/components/Seo.svelte';
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
	import type { SubmitFunction } from '@sveltejs/kit';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
	let pending = $state(false);
	let email = $derived(page.data.claims?.email ?? '');

	/** Reset the (sensitive) password fields only once the change has
	 * actually succeeded; on failure keep `reset:false` per Conventions #8
	 * so a typo'd current password doesn't force retyping both fields. */
	const submitChangePassword: SubmitFunction = () => {
		pending = true;
		return async ({ update, result }) => {
			try {
				await update({ reset: result.type === 'success' });
			} finally {
				pending = false;
			}
		};
	};

	function errorMessage(code: string | undefined) {
		return code !== undefined ? t(authErrorMessages[code] ?? genericAuthError) : undefined;
	}
</script>

<Seo title={changePasswordPageTitle} description={changePasswordPageDescription} />

<PageShell>
	<h1>{t(changePasswordButton)}</h1>

	<form method="POST" action="?/changePassword" use:enhance={submitChangePassword}>
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
			<p class="error" role="alert">{errorMessage(form.errorCode)}</p>
		{/if}
		{#if form?.success}
			<p role="status">{t(changePasswordSuccess)}</p>
		{/if}
		<Button type="submit" variant="primary" loading={pending} disabled={pending}>
			{t(changePasswordButton)}
		</Button>
	</form>
</PageShell>

<style>
	form {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		width: 100%;
		max-width: 20rem;
	}

	.error {
		color: var(--color-error);
		font-size: var(--font-size-sm);
	}

	/* A real, visually-hidden <input> rather than type="hidden" — some
	   password manager autofill parsers skip type="hidden" fields entirely. */
	.visually-hidden-field {
		display: none;
	}
</style>
