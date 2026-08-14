<script lang="ts">
	import { enhance } from '$app/forms';
	import AuthField from '$lib/components/AuthField.svelte';
	import Button from '$lib/components/Button.svelte';
	import PageShell from '$lib/components/PageShell.svelte';
	import Seo from '$lib/components/Seo.svelte';
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
	import type { SubmitFunction } from '@sveltejs/kit';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
	let pending = $state(false);
	let accountHref = $derived(withLocale(getLocale(), '/account'));

	const submitDelete: SubmitFunction = () => {
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
		if (code === 'email_mismatch') return t(emailMismatchError);
		return code !== undefined ? t(authErrorMessages[code] ?? genericAuthError) : undefined;
	}
</script>

<Seo title={deletePageTitle} description={deletePageDescription} />

<PageShell>
	<h1>{t(deleteAccountButton)}</h1>
	<p class="warning">{t(deleteWarning)}</p>

	<form method="POST" action="?/deleteAccount" use:enhance={submitDelete}>
		<AuthField label={deleteConfirmEmailLabel} type="email" name="email" autocomplete="email" />
		{#if form?.errorCode}
			<p class="error" role="alert">{errorMessage(form.errorCode)}</p>
		{/if}
		<Button type="submit" variant="error" glow loading={pending} disabled={pending}>
			{t(deleteAccountButton)}
		</Button>
	</form>

	<a href={accountHref}>{t(backToAccount)}</a>
</PageShell>

<style>
	form {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		width: 100%;
		max-width: 20rem;
	}

	.warning {
		color: var(--color-text-secondary);
	}

	.error {
		color: var(--color-error);
		font-size: var(--font-size-sm);
	}
</style>
