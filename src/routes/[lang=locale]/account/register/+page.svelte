<script lang="ts">
	import AuthField from '$lib/components/AuthField.svelte';
	import AuthForm from '$lib/components/AuthForm.svelte';
	import Button from '$lib/components/Button.svelte';
	import FormError from '$lib/components/FormError.svelte';
	import PageShell from '$lib/components/PageShell.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import { createPendingSubmit } from '$lib/forms/pendingSubmit.svelte';
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
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();

	let signInHref = $derived(withLocale(getLocale(), '/account'));

	const pendingSubmit = createPendingSubmit();

	function errorMessage(code: string | undefined) {
		return code !== undefined ? t(authErrorMessages[code] ?? genericAuthError) : undefined;
	}
</script>

<Seo title={registerPageTitle} description={registerPageDescription} />

<PageShell>
	<h1>{t(signUpButton)}</h1>

	<AuthForm action="?/signup" submit={pendingSubmit.submit}>
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
			<FormError message={errorMessage(form.errorCode) ?? ''} />
		{/if}
		<Button
			type="submit"
			variant="primary"
			loading={pendingSubmit.pending}
			disabled={pendingSubmit.pending}
		>
			{t(signUpButton)}
		</Button>
	</AuthForm>

	<p class="signin-prompt">
		{t(hasAccountPrompt)}
		<a href={signInHref}>{t(signInButton)}</a>
	</p>
</PageShell>

<style>
	.signin-prompt {
		font-size: var(--font-size-sm);
		color: var(--color-text-secondary);
	}
</style>
