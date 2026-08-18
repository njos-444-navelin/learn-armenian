<script lang="ts">
	import { page } from '$app/state';
	import AuthField from '$lib/components/AuthField.svelte';
	import AuthForm from '$lib/components/AuthForm.svelte';
	import Button from '$lib/components/Button.svelte';
	import Flagmark from '$lib/components/Flagmark.svelte';
	import FormError from '$lib/components/FormError.svelte';
	import PageShell from '$lib/components/PageShell.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import { LOCALE_FLAGS, LOCALES } from '$lib/i18n/locale';
	import { getLocale, t } from '$lib/i18n/current';
	import { withLocale, withoutLocale } from '$lib/i18n/paths';
	import { persistPreferredLocale } from '$lib/i18n/persistPreferredLocale';
	import {
		pageTitle,
		pageDescription,
		emailLabel,
		passwordLabel,
		signInButton,
		signInSubheading,
		signUpButton,
		orDivider,
		registerPrompt,
		magicLinkButton,
		signOutButton,
		signedInAs,
		changePasswordButton,
		changeEmailButton,
		deleteAccountButton,
		authErrorGeneric,
		authErrorMessages,
		genericAuthError
	} from '$lib/i18n/dictionaries/account';
	import { switchLanguage } from '$lib/i18n/dictionaries/common';
	import { heading as contactHeading } from '$lib/i18n/dictionaries/contact';
	import {
		trainVocabularyCountLabel,
		trainVocabularyMenuLabel
	} from '$lib/i18n/dictionaries/vocabularyTraining';
	import type { SubmitFunction } from '@sveltejs/kit';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();

	let claims = $derived(page.data.claims);
	let signedIn = $derived(claims !== null);
	let trainableWordCount = $derived(signedIn ? (page.data.trainableWordCount ?? 0) : 0);
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
	let magicLinkHref = $derived(withLocale(getLocale(), '/account/magic-link'));
	let trainVocabularyHref = $derived(withLocale(getLocale(), '/learn/vocabulary/train'));

	let currentLocale = $derived(getLocale());
	let otherLocale = $derived(LOCALES.find((candidate) => candidate !== currentLocale));
	let switchLanguageHref = $derived(
		otherLocale !== undefined
			? withLocale(otherLocale, withoutLocale(page.url.pathname))
			: undefined
	);

	type FormAction = 'login' | 'logout';
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
			<Button href={trainVocabularyHref} variant={trainableWordCount > 0 ? 'primary' : 'secondary'}>
				{trainableWordCount > 0
					? t(trainVocabularyCountLabel(trainableWordCount))
					: t(trainVocabularyMenuLabel)}
			</Button>
			{#if otherLocale !== undefined && switchLanguageHref !== undefined}
				<Button
					href={switchLanguageHref}
					variant="secondary"
					onclick={() => persistPreferredLocale(otherLocale)}
				>
					{t(switchLanguage)}
					<span aria-hidden="true">{LOCALE_FLAGS[currentLocale]}/{LOCALE_FLAGS[otherLocale]}</span>
				</Button>
			{/if}
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
		<div class="acct-head">
			<Flagmark />
			<h1>{t(signInButton)}</h1>
			<p class="acct-sub">{t(signInSubheading)}</p>
		</div>

		{#if authErrorFromLink}
			<FormError message={t(authErrorGeneric)} />
		{/if}

		<AuthForm action={loginActionHref} submit={submitAction('login')}>
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

		<div class="divider-row">
			<hr class="hr" />
			<span>{t(orDivider)}</span>
			<hr class="hr" />
		</div>

		<Button href={magicLinkHref} variant="secondary">{t(magicLinkButton)}</Button>

		<p class="register-prompt">
			{t(registerPrompt)}
			<a href={registerHref}>{t(signUpButton)}</a>
		</p>
	{/if}
</PageShell>

<style>
	.acct-head {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-2);
	}

	.acct-sub {
		color: var(--color-text-secondary);
		font-size: var(--font-size-sm);
	}

	.divider-row {
		display: flex;
		width: 100%;
		max-width: 20rem;
		align-items: center;
		gap: var(--space-3);
	}

	.divider-row .hr {
		flex: 1;
		height: 1px;
		margin: 0;
		border: none;
		background: var(--color-border);
	}

	.divider-row span {
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
