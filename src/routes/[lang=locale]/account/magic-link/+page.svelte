<script lang="ts">
	import AuthField from '$lib/components/AuthField.svelte';
	import AuthForm from '$lib/components/AuthForm.svelte';
	import Button from '$lib/components/Button.svelte';
	import FormError from '$lib/components/FormError.svelte';
	import PageShell from '$lib/components/PageShell.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import { createPendingSubmit } from '$lib/forms/pendingSubmit.svelte';
	import { t } from '$lib/i18n/current';
	import {
		emailLabel,
		magicLinkButton,
		magicLinkHint,
		magicLinkPageDescription,
		magicLinkPageTitle,
		magicLinkSent,
		authErrorMessages,
		genericAuthError
	} from '$lib/i18n/dictionaries/account';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();

	const pendingSubmit = createPendingSubmit();

	function errorMessage(code: string | undefined) {
		return code !== undefined ? t(authErrorMessages[code] ?? genericAuthError) : undefined;
	}
</script>

<Seo title={magicLinkPageTitle} description={magicLinkPageDescription} />

<PageShell>
	<h1>{t(magicLinkButton)}</h1>
	<p class="hint">{t(magicLinkHint)}</p>

	<AuthForm action="?/magiclink" submit={pendingSubmit.submit}>
		<AuthField
			label={emailLabel}
			type="email"
			name="email"
			autocomplete="email"
			value={form?.email ?? ''}
		/>
		{#if form?.errorCode}
			<FormError message={errorMessage(form.errorCode) ?? ''} />
		{/if}
		{#if form?.success}
			<p role="status">{t(magicLinkSent)}</p>
		{/if}
		<Button
			type="submit"
			variant="primary"
			loading={pendingSubmit.pending}
			disabled={pendingSubmit.pending}
		>
			{t(magicLinkButton)}
		</Button>
	</AuthForm>
</PageShell>

<style>
	.hint {
		color: var(--color-text-secondary);
		font-size: var(--font-size-sm);
	}
</style>
