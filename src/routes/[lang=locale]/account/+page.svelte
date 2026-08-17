<script lang="ts">
	import { page } from '$app/state';
	import AuthField from '$lib/components/AuthField.svelte';
	import AuthForm from '$lib/components/AuthForm.svelte';
	import Button from '$lib/components/Button.svelte';
	import FormError from '$lib/components/FormError.svelte';
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
	import { heading as contactHeading } from '$lib/i18n/dictionaries/contact';
	import type { SubmitFunction } from '@sveltejs/kit';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();

	let claims = $derived(page.data.claims);
	let signedIn = $derived(claims !== null);
	let authErrorFromLink = $derived(page.url.searchParams.get('authError') !== null);
	/** A form's `action="?/login"` resolves relative to the current URL, and
	 * a query-only relative reference *replaces* the whole query string
	 * rather than appending to it — so a plain `?/login` would silently
	 * drop `?next=...` before the POST ever happens, and requireSignedIn()'s
	 * resume-after-login (see docs/AUTH.md) would never see it server-side.
	 * SvelteKit recognizes any query key that starts with `/` as the action
	 * name regardless of what else is in the query string, so re-attaching
	 * `next` here (when present) is enough to carry it through. */
	let loginActionHref = $derived.by(() => {
		const next = page.url.searchParams.get('next');
		return next !== null ? `?next=${encodeURIComponent(next)}&/login` : '?/login';
	});
	let registerHref = $derived(withLocale(getLocale(), '/account/register'));
	let changePasswordHref = $derived(withLocale(getLocale(), '/account/change-password'));
	let changeEmailHref = $derived(withLocale(getLocale(), '/account/change-email'));
	let contactHref = $derived(withLocale(getLocale(), '/account/contact'));
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
			<Button href={contactHref} variant="secondary">{t(contactHeading)}</Button>
			<Button href={deleteAccountHref} variant="error">{t(deleteAccountButton)}</Button>
		</nav>
		<AuthForm action="?/logout" submit={submitAction('logout')}>
			<Button
				type="submit"
				variant="secondary"
				loading={pending === 'logout'}
				disabled={pending !== null}
			>
				{t(signOutButton)}
			</Button>
		</AuthForm>
	{:else}
		{#if authErrorFromLink}
			<FormError message={t(authErrorGeneric)} />
		{/if}

		<AuthForm action={loginActionHref} submit={submitAction('login')}>
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
				<FormError message={errorMessage(form.errorCode) ?? ''} />
			{/if}
			<Button
				type="submit"
				variant="primary"
				loading={pending === 'login'}
				disabled={pending !== null}
			>
				{t(signInButton)}
			</Button>
		</AuthForm>

		<AuthForm action="?/magiclink" submit={submitAction('magiclink')}>
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
				<FormError message={errorMessage(form.errorCode) ?? ''} />
			{/if}
		</AuthForm>

		<p class="register-prompt">
			{t(registerPrompt)}
			<a href={registerHref}>{t(signUpButton)}</a>
		</p>
	{/if}
</PageShell>

<style>
	h2 {
		margin: 0;
		font-size: var(--font-size-lg);
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
