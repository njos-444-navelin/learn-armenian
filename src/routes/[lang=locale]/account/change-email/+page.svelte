<script lang="ts">
	import { enhance } from '$app/forms';
	import AuthField from '$lib/components/AuthField.svelte';
	import Button from '$lib/components/Button.svelte';
	import PageShell from '$lib/components/PageShell.svelte';
	import Seo from '$lib/components/Seo.svelte';
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
	import type { SubmitFunction } from '@sveltejs/kit';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
	let pending = $state(false);

	const submitChangeEmail: SubmitFunction = () => {
		pending = true;
		return async ({ update }) => {
			try {
				await update({ reset: false });
			} finally {
				pending = false;
			}
		};
	};

	function errorMessage(code: string | undefined) {
		if (code === 'same_email') return t(sameEmailError);
		return code !== undefined ? t(authErrorMessages[code] ?? genericAuthError) : undefined;
	}
</script>

<Seo title={changeEmailPageTitle} description={changeEmailPageDescription} />

<PageShell>
	<h1>{t(changeEmailButton)}</h1>

	<form method="POST" action="?/changeEmail" use:enhance={submitChangeEmail}>
		<AuthField
			label={newEmailLabel}
			type="email"
			name="email"
			autocomplete="email"
			value={form?.email ?? ''}
		/>
		{#if form?.errorCode}
			<p class="error" role="alert">{errorMessage(form.errorCode)}</p>
		{/if}
		{#if form?.success}
			<p role="status">{t(changeEmailSuccess)}</p>
		{/if}
		<Button type="submit" variant="primary" loading={pending} disabled={pending}>
			{t(changeEmailButton)}
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
</style>
