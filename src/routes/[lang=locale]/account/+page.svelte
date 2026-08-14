<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import AuthField from '$lib/components/AuthField.svelte';
	import Button from '$lib/components/Button.svelte';
	import PageShell from '$lib/components/PageShell.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import { getLocale, t } from '$lib/i18n/current';
	import { withLocale } from '$lib/i18n/paths';
	import {
		pageTitle,
		pageDescription,
		emailLabel,
		passwordLabel,
		signInButton,
		signUpButton,
		registerPrompt,
		magicLinkButton,
		magicLinkHint,
		magicLinkSent,
		signOutButton,
		signedInAs,
		changePasswordButton,
		changeEmailButton,
		deleteAccountButton,
		authErrorGeneric,
		authErrorMessages,
		genericAuthError
	} from '$lib/i18n/dictionaries/account';
	import type { SubmitFunction } from '@sveltejs/kit';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();

	let claims = $derived(page.data.claims);
	let signedIn = $derived(claims !== null);
	let authErrorFromLink = $derived(page.url.searchParams.get('authError') !== null);
	let registerHref = $derived(withLocale(getLocale(), '/account/register'));
	let changePasswordHref = $derived(withLocale(getLocale(), '/account/change-password'));
	let changeEmailHref = $derived(withLocale(getLocale(), '/account/change-email'));
	let deleteAccountHref = $derived(withLocale(getLocale(), '/account/delete'));

	type FormAction = 'login' | 'magiclink' | 'logout';
	let pending = $state<FormAction | null>(null);

	/** Drives the submitting button's spinner and, critically, passes
	 * `reset: false` — see Conventions #8. Without it, `use:enhance`'s default
	 * behavior clears the form on any non-redirect response, which reads as
	 * the app silently discarding what you just typed. */
	function submitAction(action: FormAction): SubmitFunction {
		return () => {
			pending = action;
			return async ({ update }) => {
				try {
					await update({ reset: false });
				} finally {
					pending = null;
				}
			};
		};
	}

	function errorMessage(code: string | undefined) {
		return code !== undefined ? t(authErrorMessages[code] ?? genericAuthError) : undefined;
	}
</script>

<Seo title={pageTitle} description={pageDescription} />

<PageShell>
	{#if signedIn && claims !== null}
		<h1>{t(signedInAs)}</h1>
		<p>{claims.email}</p>
		<nav class="account-actions">
			<Button href={changePasswordHref} variant="secondary">{t(changePasswordButton)}</Button>
			<Button href={changeEmailHref} variant="secondary">{t(changeEmailButton)}</Button>
			<Button href={deleteAccountHref} variant="error">{t(deleteAccountButton)}</Button>
		</nav>
		<form method="POST" action="?/logout" use:enhance={submitAction('logout')}>
			<Button
				type="submit"
				variant="secondary"
				loading={pending === 'logout'}
				disabled={pending !== null}
			>
				{t(signOutButton)}
			</Button>
		</form>
	{:else}
		{#if authErrorFromLink}
			<p class="error" role="alert">{t(authErrorGeneric)}</p>
		{/if}

		<form method="POST" action="?/login" use:enhance={submitAction('login')}>
			<h2>{t(signInButton)}</h2>
			<AuthField
				label={emailLabel}
				type="email"
				name="email"
				autocomplete="email"
				value={form?.action === 'login' ? (form?.email ?? '') : ''}
			/>
			<AuthField label={passwordLabel} type="password" name="password" autocomplete="current-password" />
			{#if form?.errorCode && form.action === 'login'}
				<p class="error" role="alert">{errorMessage(form.errorCode)}</p>
			{/if}
			<Button
				type="submit"
				variant="primary"
				loading={pending === 'login'}
				disabled={pending !== null}
			>
				{t(signInButton)}
			</Button>
		</form>

		<form method="POST" action="?/magiclink" use:enhance={submitAction('magiclink')}>
			<AuthField label={emailLabel} type="email" name="email" autocomplete="email" />
			<Button
				type="submit"
				variant="secondary"
				loading={pending === 'magiclink'}
				disabled={pending !== null}
			>
				{t(magicLinkButton)}
			</Button>
			<p class="hint">{t(magicLinkHint)}</p>
			{#if form?.success && form.action === 'magiclink'}
				<p role="status">{t(magicLinkSent)}</p>
			{/if}
			{#if form?.errorCode && form.action === 'magiclink'}
				<p class="error" role="alert">{errorMessage(form.errorCode)}</p>
			{/if}
		</form>

		<p class="register-prompt">
			{t(registerPrompt)}
			<a href={registerHref}>{t(signUpButton)}</a>
		</p>
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

	h2 {
		margin: 0;
		font-size: var(--font-size-lg);
	}

	.error {
		color: var(--color-error);
		font-size: var(--font-size-sm);
	}

	.hint {
		color: var(--color-text-secondary);
		font-size: var(--font-size-sm);
	}

	.register-prompt {
		font-size: var(--font-size-sm);
		color: var(--color-text-secondary);
	}

	.account-actions {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		width: 100%;
		max-width: 20rem;
	}
</style>
