<script lang="ts">
	import { enhance } from '$app/forms';
	import AuthField from '$lib/components/AuthField.svelte';
	import Button from '$lib/components/Button.svelte';
	import PageShell from '$lib/components/PageShell.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import { getLocale, t } from '$lib/i18n/current';
	import { withLocale } from '$lib/i18n/paths';
	import {
		registerPageTitle,
		registerPageDescription,
		emailLabel,
		passwordLabel,
		signUpButton,
		hasAccountPrompt,
		signInButton,
		authErrorMessages,
		genericAuthError
	} from '$lib/i18n/dictionaries/account';
	import type { SubmitFunction } from '@sveltejs/kit';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();

	let signInHref = $derived(withLocale(getLocale(), '/account'));

	let pending = $state(false);

	/** See Conventions #8 — keep entered values on screen and show a spinner
	 * for the duration of the request, instead of `use:enhance`'s default
	 * form-reset behavior. */
	const submitSignup: SubmitFunction = () => {
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
		return code !== undefined ? t(authErrorMessages[code] ?? genericAuthError) : undefined;
	}
</script>

<Seo title={registerPageTitle} description={registerPageDescription} />

<PageShell>
	<h1>{t(signUpButton)}</h1>

	<form method="POST" action="?/signup" use:enhance={submitSignup}>
		<AuthField
			label={emailLabel}
			type="email"
			name="email"
			autocomplete="email"
			value={form?.email ?? ''}
		/>
		<AuthField
			label={passwordLabel}
			type="password"
			name="password"
			autocomplete="new-password"
			minlength={6}
		/>
		{#if form?.errorCode}
			<p class="error" role="alert">{errorMessage(form.errorCode)}</p>
		{/if}
		<Button type="submit" variant="primary" loading={pending} disabled={pending}>
			{t(signUpButton)}
		</Button>
	</form>

	<p class="signin-prompt">
		{t(hasAccountPrompt)}
		<a href={signInHref}>{t(signInButton)}</a>
	</p>
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

	.signin-prompt {
		font-size: var(--font-size-sm);
		color: var(--color-text-secondary);
	}
</style>
