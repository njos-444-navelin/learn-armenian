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
	import { withLocale } from '$lib/i18n/paths';
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
		myProgressHeading,
		alphabetCardLabel,
		alphabetMasteryLabel,
		vocabularyCardLabel,
		collectionCountLabel,
		dueNowLabel,
		allCaughtUpLabel,
		accountSettingsHeading,
		changePasswordButton,
		changeEmailButton,
		deleteAccountButton,
		authErrorGeneric,
		authErrorMessages,
		genericAuthError
	} from '$lib/i18n/dictionaries/account';
	import { switchLanguage } from '$lib/i18n/dictionaries/common';
	import { heading as contactHeading } from '$lib/i18n/dictionaries/contact';
	import type { SubmitFunction } from '@sveltejs/kit';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();

	let claims = $derived(page.data.claims);
	let signedIn = $derived(claims !== null);
	let alphabetMasteryPercent = $derived(signedIn ? (page.data.alphabetMasteryPercent ?? 0) : 0);
	let vocabularyWordCount = $derived(signedIn ? (page.data.vocabularyWordCount ?? 0) : 0);
	let vocabularyDueCount = $derived(signedIn ? (page.data.vocabularyDueCount ?? 0) : 0);
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
	let alphabetHref = $derived(withLocale(getLocale(), '/learn/alphabet'));
	let vocabularyHref = $derived(withLocale(getLocale(), '/learn/vocabulary'));

	let currentLocale = $derived(getLocale());
	let otherLocale = $derived(LOCALES.find((candidate) => candidate !== currentLocale));
	// Always /account, not a generic "current page" — unlike Seo.svelte's
	// hreflang alternates (which run on every page), this component only
	// ever renders on the account page itself, so the static route is more
	// precise than resolveRuntimePath()'s runtime-derived escape hatch.
	let switchLanguageHref = $derived(
		otherLocale !== undefined ? withLocale(otherLocale, '/account') : undefined
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
		<div class="dashboard">
			<p class="signed-in-as">{t(signedInAs)} {claims.email}</p>

			<div class="dash-section">
				<h2 class="section-heading">{t(myProgressHeading)}</h2>
				<div class="progress-grid">
					<a class="stat-card" href={alphabetHref}>
						<span class="stat-icon acc">
							<svg
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2.75"
								stroke-linecap="round"
								stroke-linejoin="round"
								aria-hidden="true"
								width="24"
								height="24"
							>
								<g transform="translate(0, 2)">
									<path d="M6.5 4V13.5A5 5 0 0 0 16.5 13.5V4" />
									<path d="M16.3 13.5Q19.7 13.7 19.6 15.9V18.2" />
								</g>
							</svg>
						</span>
						<span class="stat-copy">
							<span class="stat-title">{t(alphabetCardLabel)}</span>
							<span class="stat-sub">{t(alphabetMasteryLabel(alphabetMasteryPercent))}</span>
						</span>
						<span class="stat-progress-track">
							<span class="stat-progress-fill" style:width="{alphabetMasteryPercent}%"></span>
						</span>
					</a>

					<a class="stat-card" href={vocabularyHref}>
						<span class="stat-icon acc2">
							<svg
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2.75"
								stroke-linecap="round"
								stroke-linejoin="round"
								aria-hidden="true"
								width="24"
								height="24"
							>
								<rect x="3" y="5.4" width="12.5" height="15.4" rx="4" />
								<path d="M6.8 13.2h4.9" />
								<path d="M7 5.4A4 4 0 0 1 11 1.4h4.5a4 4 0 0 1 4 4V13a4 4 0 0 1-4 4" />
							</svg>
						</span>
						<span class="stat-copy">
							<span class="stat-title">{t(vocabularyCardLabel)}</span>
							<span class="stat-sub">{t(collectionCountLabel(vocabularyWordCount))}</span>
						</span>
						{#if vocabularyDueCount > 0}
							<span class="stat-badge due">{t(dueNowLabel(vocabularyDueCount))}</span>
						{:else}
							<span class="stat-badge caught-up">{t(allCaughtUpLabel)}</span>
						{/if}
					</a>
				</div>
			</div>

			<div class="dash-section">
				<h2 class="section-heading">{t(accountSettingsHeading)}</h2>
				<div class="settings-list">
					<Button href={changePasswordHref} variant="secondary">{t(changePasswordButton)}</Button>
					<Button href={changeEmailHref} variant="secondary">{t(changeEmailButton)}</Button>
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
				</div>
			</div>

			<div class="footer-links">
				<a href={contactHref}>{t(contactHeading)}</a>
				{#if otherLocale !== undefined && switchLanguageHref !== undefined}
					<a href={switchLanguageHref} onclick={() => persistPreferredLocale(otherLocale)}>
						{t(switchLanguage)}
						<span aria-hidden="true">{LOCALE_FLAGS[currentLocale]}/{LOCALE_FLAGS[otherLocale]}</span>
					</a>
				{/if}
			</div>

			<div class="delete-row">
				<Button href={deleteAccountHref} variant="error" size="sm">{t(deleteAccountButton)}</Button>
			</div>
		</div>
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

	.dashboard {
		display: flex;
		width: 100%;
		max-width: 26rem;
		flex-direction: column;
		align-items: stretch;
		gap: var(--space-5);
		text-align: left;
	}

	.signed-in-as {
		margin: 0;
		font-size: var(--font-size-sm);
		color: var(--color-text-secondary);
		text-align: center;
	}

	.dash-section {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.section-heading {
		font-size: var(--font-size-sm);
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: var(--color-text-secondary);
	}

	.progress-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
		gap: var(--space-3);
	}

	.stat-card {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		padding: var(--space-5);
		border-radius: var(--radius-lg);
		background: var(--color-surface);
		color: var(--color-text-primary);
		text-decoration: none;
		transition:
			background-color var(--transition-fast),
			outline-color var(--transition-fast);
	}

	.stat-card:hover {
		background: var(--color-surface-hover);
	}

	.stat-icon {
		display: grid;
		place-content: center;
		width: 3.25rem;
		height: 3.25rem;
		border-radius: 50%;
		background: var(--color-background);
		color: var(--color-accent-700);
	}

	.stat-icon.acc2 {
		color: var(--color-accent-2-700);
	}

	.stat-copy {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.stat-title {
		font-family: var(--font-heading);
		font-weight: var(--font-heading-weight);
		font-size: 1.15rem;
	}

	.stat-sub {
		font-size: var(--font-size-sm);
		color: var(--color-text-secondary);
	}

	.stat-progress-track {
		display: block;
		height: 6px;
		border-radius: var(--radius-pill);
		background: var(--color-neutral-100);
		overflow: hidden;
	}

	.stat-progress-fill {
		display: block;
		height: 100%;
		border-radius: var(--radius-pill);
		background: var(--color-accent-2-500);
	}

	/* A fully round --radius-pill looks right for a short single-line count
	   ("7 due now") but crowds the text once a longer translation ("40 на
	   повторение") wraps to two lines — --radius-md stays comfortably
	   pill-like on one line and doesn't eat into wrapped text on two,
	   without needing white-space: nowrap (which would just trade the
	   wrapping problem for an overflow one on an unusually long count). */
	.stat-badge {
		align-self: flex-start;
		max-width: 100%;
		padding: 0.15rem 0.7rem;
		border-radius: var(--radius-md);
		font-size: var(--font-size-sm);
		font-weight: 700;
	}

	/* Due words are framed the same way as "all caught up" — a light,
	   positive green rather than a warning tone — since having words ready
	   to review is the app doing its job, not a problem to flag. */
	.stat-badge.due,
	.stat-badge.caught-up {
		background: var(--color-accent-2-100);
		color: var(--color-accent-2-700);
	}

	.settings-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		width: 100%;
	}

	/* AuthForm's own <form> caps itself at max-width: 20rem for the
	   narrower forms it's normally used in — override that here so the
	   sign-out form matches the full width of its sibling Change
	   password/email buttons instead of shrinking on its own. */
	.settings-list :global(form) {
		max-width: none;
	}

	.footer-links {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: center;
		gap: var(--space-2) var(--space-4);
		font-size: var(--font-size-sm);
		text-align: center;
	}

	.footer-links a {
		white-space: nowrap;
	}

	.delete-row {
		display: flex;
		flex-direction: column;
		align-items: center;
		margin-top: var(--space-7);
	}
</style>
