<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import Button from '$lib/components/Button.svelte';
	import PageShell from '$lib/components/PageShell.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import { t } from '$lib/i18n/current';
	import {
		pageTitle,
		pageDescription,
		emailLabel,
		passwordLabel,
		signInButton,
		signUpButton,
		magicLinkButton,
		magicLinkHint,
		magicLinkSent,
		signOutButton,
		signedInAs,
		authErrorGeneric,
		authErrorMessages,
		genericAuthError
	} from '$lib/i18n/dictionaries/account';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();

	let claims = $derived(page.data.claims);
	let signedIn = $derived(claims !== null);
	let authErrorFromLink = $derived(page.url.searchParams.get('authError') !== null);

	function errorMessage(code: string | undefined) {
		return code !== undefined ? t(authErrorMessages[code] ?? genericAuthError) : undefined;
	}
</script>

<Seo title={pageTitle} description={pageDescription} />

<PageShell>
	{#if signedIn && claims !== null}
		<h1>{t(signedInAs)}</h1>
		<p>{claims.email}</p>
		<form method="POST" action="?/logout" use:enhance>
			<Button type="submit" variant="secondary">{t(signOutButton)}</Button>
		</form>
	{:else}
		{#if authErrorFromLink}
			<p class="error" role="alert">{t(authErrorGeneric)}</p>
		{/if}

		<form method="POST" action="?/login" use:enhance>
			<label>
				{t(emailLabel)}
				<input
					type="email"
					name="email"
					required
					autocomplete="email"
					value={form?.email ?? ''}
				/>
			</label>
			<label>
				{t(passwordLabel)}
				<input
					type="password"
					name="password"
					required
					autocomplete="current-password"
					minlength="6"
				/>
			</label>
			{#if form?.errorCode && (form.action === 'login' || form.action === 'signup')}
				<p class="error" role="alert">{errorMessage(form.errorCode)}</p>
			{/if}
			<div class="actions">
				<Button type="submit" variant="primary">{t(signInButton)}</Button>
				<Button type="submit" formaction="?/signup" variant="secondary">{t(signUpButton)}</Button>
			</div>
		</form>

		<form method="POST" action="?/magiclink" use:enhance>
			<label>
				{t(emailLabel)}
				<input type="email" name="email" required autocomplete="email" />
			</label>
			<Button type="submit" variant="secondary">{t(magicLinkButton)}</Button>
			<p class="hint">{t(magicLinkHint)}</p>
			{#if form?.success && form.action === 'magiclink'}
				<p role="status">{t(magicLinkSent)}</p>
			{/if}
			{#if form?.errorCode && form.action === 'magiclink'}
				<p class="error" role="alert">{errorMessage(form.errorCode)}</p>
			{/if}
		</form>
	{/if}
</PageShell>

<style>
	form {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		width: 100%;
		max-width: 20rem;
	}

	label {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		font-size: var(--font-size-sm);
		color: var(--color-text-secondary);
		text-align: left;
	}

	input {
		min-height: var(--tap-target-min);
		padding: var(--space-2) var(--space-3);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		font-size: var(--font-size-md);
		font-family: var(--font-family-sans);
	}

	.actions {
		display: flex;
		gap: var(--space-3);
		flex-wrap: wrap;
	}

	.error {
		color: var(--color-error);
		font-size: var(--font-size-sm);
	}

	.hint {
		color: var(--color-text-secondary);
		font-size: var(--font-size-sm);
	}
</style>
