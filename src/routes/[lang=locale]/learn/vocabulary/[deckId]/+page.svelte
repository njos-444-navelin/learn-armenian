<script lang="ts">
	import { enhance } from '$app/forms';
	import { replaceState } from '$app/navigation';
	import { page } from '$app/state';
	import Button from '$lib/components/Button.svelte';
	import FloatingActionBar from '$lib/components/FloatingActionBar.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import PageShell from '$lib/components/PageShell.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import VocabularyDeckIcon from '$lib/components/VocabularyDeckIcon.svelte';
	import VocabularyTrainCta from '$lib/components/VocabularyTrainCta.svelte';
	import VocabularyWordList from '$lib/components/VocabularyWordList.svelte';
	import { t } from '$lib/i18n/current';
	import { cancelLabel } from '$lib/i18n/dictionaries/common';
	import {
		addToCollectionLabel,
		deckPageDescription,
		deckPageTitle,
		deckSubtitle,
		myCollectionHeading,
		removeDeckFailedMessage,
		removeDeckHeading,
		removeDeckLabel,
		removeDeckMessage
	} from '$lib/i18n/dictionaries/vocabulary';
	import { pushToast } from '$lib/stores/toasts.svelte';
	import type { SubmitFunction } from '@sveltejs/kit';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// A local override so a just-submitted add/remove shows immediately
	// without waiting for a re-fetch of `data`. `undefined` defers to
	// `data.added`; reset on navigation to a different deck so it doesn't
	// leak that deck's state onto the next one.
	let addedOverride = $state<boolean | undefined>(undefined);
	let added = $derived(addedOverride ?? data.added);
	$effect(() => {
		data.deck.id;
		addedOverride = undefined;
	});

	let pending = $state(false);
	let removing = $state(false);
	let showRemoveModal = $state(false);
	let addForm = $state<HTMLFormElement | undefined>(undefined);

	/**
	 * Replays "Add to my collection" after a signed-out visitor gets sent to
	 * sign in and back — see requireSignedIn()'s `resume` option and the
	 * "resume after login" section in docs/AUTH.md. `resumeHandled` guards
	 * this to fire at most once per page load, set before `requestSubmit()`
	 * so a re-run of this effect (e.g. from `pending` changing as the
	 * replayed submit starts) can never double-submit.
	 */
	let resumeHandled = $state(false);
	$effect(() => {
		if (resumeHandled) return;
		if (page.url.searchParams.get('resume') !== 'addToCollection') return;
		if (page.data.claims === null || added) return;
		resumeHandled = true;
		addForm?.requestSubmit();

		const url = new URL(page.url);
		url.searchParams.delete('resume');
		// eslint-disable-next-line svelte/no-navigation-without-resolve -- shallow routing (SvelteKit's own pattern for this: replaceState(url: string | URL, ...)) mutating a copy of the already-valid page.url to drop a one-shot query param; the pathname itself never changes, so there's no route to check against resolve()'s route list.
		replaceState(url, page.state);
	});

	function submitAdd(): SubmitFunction {
		return () => {
			pending = true;
			return async ({ update, result }) => {
				try {
					await update({ reset: false });
					if (result.type === 'success') {
						addedOverride = true;
					}
				} finally {
					pending = false;
				}
			};
		};
	}

	function submitRemove(): SubmitFunction {
		return () => {
			removing = true;
			return async ({ update, result }) => {
				try {
					await update({ reset: false });
					if (result.type === 'success') {
						addedOverride = false;
						showRemoveModal = false;
					} else {
						pushToast(removeDeckFailedMessage, 'error');
					}
				} finally {
					removing = false;
				}
			};
		};
	}
</script>

<Seo title={deckPageTitle(data.deck.title)} description={deckPageDescription(data.deck.title)} />

<PageShell>
	<div class="hero">
		<VocabularyDeckIcon icon={data.deck.icon} size="lg" />
		<h1>{t(data.deck.title)}</h1>
		<p class="subtitle">{t(deckSubtitle(data.deck))}</p>

		{#if added}
			<div class="collection-status">
				<span class="chip">
					<svg viewBox="0 0 24 24" fill="none" aria-hidden="true" width="15" height="15">
						<path
							d="M20 6 9 17l-5-5"
							stroke="currentColor"
							stroke-width="2.75"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>
					{t(myCollectionHeading)}
				</span>
				<button type="button" class="remove-link" onclick={() => (showRemoveModal = true)}>
					{t(removeDeckLabel)}
				</button>
			</div>
		{/if}
	</div>

	<VocabularyWordList words={data.words} />

	{#if added}
		<VocabularyTrainCta />
	{:else}
		<FloatingActionBar>
			<form method="POST" action="?/addToCollection" use:enhance={submitAdd()} bind:this={addForm}>
				<Button type="submit" variant="primary" loading={pending} disabled={pending}>
					<svg viewBox="0 0 24 24" fill="none" aria-hidden="true" width="19" height="19">
						<path
							d="M5 12h14"
							stroke="currentColor"
							stroke-width="2.75"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
						<path
							d="M12 5v14"
							stroke="currentColor"
							stroke-width="2.75"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>
					{t(addToCollectionLabel)}
				</Button>
			</form>
		</FloatingActionBar>
	{/if}
</PageShell>

{#if showRemoveModal}
	<Modal labelledBy="remove-deck-heading" onClose={() => (showRemoveModal = false)}>
		<h2 id="remove-deck-heading">{t(removeDeckHeading)}</h2>
		<p>{t(removeDeckMessage(data.deck.title))}</p>
		<div class="modal-actions">
			<Button variant="secondary" onclick={() => (showRemoveModal = false)}>
				{t(cancelLabel)}
			</Button>
			<form method="POST" action="?/removeFromCollection" use:enhance={submitRemove()}>
				<Button type="submit" variant="error" loading={removing} disabled={removing}>
					{t(removeDeckLabel)}
				</Button>
			</form>
		</div>
	</Modal>
{/if}

<style>
	.hero {
		display: flex;
		width: 100%;
		flex-direction: column;
		align-items: center;
		gap: var(--space-3);
	}

	.subtitle {
		margin: 0;
		color: var(--color-text-secondary);
		font-size: var(--font-size-sm);
	}

	.collection-status {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: center;
		gap: var(--space-2);
	}

	.chip {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
		padding: var(--space-1) var(--space-3);
		border-radius: var(--radius-pill);
		background: var(--color-surface);
		color: var(--color-accent-700);
		font-size: var(--font-size-sm);
		font-weight: 600;
	}

	.remove-link {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
		min-height: var(--tap-target-min);
		padding: var(--space-1) var(--space-3);
		border: none;
		border-radius: var(--radius-pill);
		background: none;
		color: var(--color-text-secondary);
		font-size: var(--font-size-sm);
		text-decoration: underline;
		text-underline-offset: 3px;
		cursor: pointer;
		transition: color var(--transition-fast);
	}

	.remove-link:hover {
		color: var(--color-error);
	}

	#remove-deck-heading {
		margin: 0;
		font-size: var(--font-size-lg);
	}

	.modal-actions {
		display: flex;
		width: 100%;
		gap: var(--space-2);
	}

	.modal-actions :global(form),
	.modal-actions :global(.button) {
		flex: 1;
	}
</style>
