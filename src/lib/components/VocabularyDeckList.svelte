<script lang="ts">
	import { untrack } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import { enhance } from '$app/forms';
	import { replaceState } from '$app/navigation';
	import { page } from '$app/state';
	import Button from './Button.svelte';
	import Modal from './Modal.svelte';
	import VocabularyDeckIcon from './VocabularyDeckIcon.svelte';
	import VocabularyTrainCta from './VocabularyTrainCta.svelte';
	import type { VocabularyDeck } from '$lib/content/vocabulary/types';
	import { getLocale, t } from '$lib/i18n/current';
	import { withLocaleDeck } from '$lib/i18n/paths';
	import { cancelLabel } from '$lib/i18n/dictionaries/common';
	import {
		addDeckAriaLabel,
		catalogGrowingMessage,
		deckMetaLabel,
		moreTopicsHeading,
		myCollectionHeading,
		removeDeckAriaLabel,
		removeDeckFailedMessage,
		removeDeckHeading,
		removeDeckLabel,
		removeDeckMessage
	} from '$lib/i18n/dictionaries/vocabulary';
	import { pushToast } from '$lib/stores/toasts.svelte';
	import type { SubmitFunction } from '@sveltejs/kit';

	interface Props {
		decks: readonly VocabularyDeck[];
		addedDeckIds: ReadonlySet<string>;
	}

	let { decks, addedDeckIds }: Props = $props();
	let locale = $derived(getLocale());

	// A local, mutable mirror of `addedDeckIds` — this component owns
	// advancing it from here on (add/remove happen inline, without a full
	// page reload), same pattern as the deck page's own `addedOverride`.
	// `SvelteSet` (not a plain `Set` in `$state`) so `.add()`/`.delete()`
	// below are tracked mutations in place, not reassignments.
	let added = untrack(() => new SvelteSet(addedDeckIds));
	let collectionDecks = $derived(decks.filter((deck) => added.has(deck.id)));
	let otherDecks = $derived(decks.filter((deck) => !added.has(deck.id)));

	let addingId = $state<string | null>(null);
	let removingId = $state<string | null>(null);
	let confirmDeckId = $state<string | null>(null);
	let confirmDeck = $derived(decks.find((deck) => deck.id === confirmDeckId));

	// One "add" form per not-yet-added deck, keyed by deck id — bound so the
	// resume-after-login effect below can replay the right one. Plain object,
	// not `$state`: it only ever holds DOM refs read imperatively, never
	// rendered from.
	let addForms: Record<string, HTMLFormElement | undefined> = {};

	/**
	 * Replays "Add to my collection" after a signed-out visitor gets sent to
	 * sign in and back for a specific deck — see requireSignedIn()'s `resume`
	 * option, `?/addToCollection`'s `action: 'addToCollection:<deckId>'` in
	 * the list page's `+page.server.ts`, and the near-identical effect in
	 * `[deckId]/+page.svelte`. The deck id travels inside the resume action
	 * id (rather than a second query param) because this page can add any
	 * deck in the catalog, not just one.
	 */
	let resumeHandled = $state(false);
	$effect(() => {
		if (resumeHandled) return;
		const resume = page.url.searchParams.get('resume');
		if (resume === null || !resume.startsWith('addToCollection:')) return;
		const deckId = resume.slice('addToCollection:'.length);
		if (page.data.claims === null || added.has(deckId)) return;
		const form = addForms[deckId];
		if (form === undefined) return;
		resumeHandled = true;
		form.requestSubmit();

		const url = new URL(page.url);
		url.searchParams.delete('resume');
		// eslint-disable-next-line svelte/no-navigation-without-resolve -- shallow routing (SvelteKit's own pattern for this: replaceState(url: string | URL, ...)) mutating a copy of the already-valid page.url to drop a one-shot query param; the pathname itself never changes, so there's no route to check against resolve()'s route list.
		replaceState(url, page.state);
	});

	function submitAdd(deckId: string): SubmitFunction {
		return () => {
			addingId = deckId;
			return async ({ update, result }) => {
				try {
					await update({ reset: false });
					if (result.type === 'success') {
						added.add(deckId);
					}
				} finally {
					addingId = null;
				}
			};
		};
	}

	function submitRemove(deckId: string): SubmitFunction {
		return () => {
			removingId = deckId;
			return async ({ update, result }) => {
				try {
					await update({ reset: false });
					if (result.type === 'success') {
						added.delete(deckId);
						confirmDeckId = null;
					} else {
						pushToast(removeDeckFailedMessage, 'error');
					}
				} finally {
					removingId = null;
				}
			};
		};
	}
</script>

{#if collectionDecks.length > 0}
	<section class="decks-section">
		<h2>{t(myCollectionHeading)}</h2>
		<ul class="decks">
			{#each collectionDecks as deck (deck.id)}
				<li class="row">
					<a class="deck added" href={withLocaleDeck(locale, deck.id)}>
						<VocabularyDeckIcon icon={deck.icon} variant="filled" />
						<span class="info">
							<span class="title">{t(deck.title)}</span>
							<span class="desc">{t(deck.description)}</span>
							<span class="meta">{t(deckMetaLabel(deck.level, deck.wordCount))}</span>
						</span>
					</a>
					<button
						type="button"
						class="action remove"
						aria-label={t(removeDeckAriaLabel(deck.title))}
						onclick={() => (confirmDeckId = deck.id)}
					>
						<svg viewBox="0 0 24 24" fill="none" aria-hidden="true" width="19" height="19">
							<path
								d="M20 6 9 17l-5-5"
								stroke="currentColor"
								stroke-width="2.75"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>
					</button>
				</li>
			{/each}
		</ul>
	</section>
{/if}

{#if otherDecks.length > 0}
	<section class="decks-section">
		<h2>{t(moreTopicsHeading)}</h2>
		<ul class="decks">
			{#each otherDecks as deck (deck.id)}
				<li class="row">
					<a class="deck" href={withLocaleDeck(locale, deck.id)}>
						<VocabularyDeckIcon icon={deck.icon} variant="muted" />
						<span class="info">
							<span class="title">{t(deck.title)}</span>
							<span class="desc">{t(deck.description)}</span>
							<span class="meta">{t(deckMetaLabel(deck.level, deck.wordCount))}</span>
						</span>
					</a>
					<form
						method="POST"
						action="?/addToCollection"
						use:enhance={submitAdd(deck.id)}
						bind:this={addForms[deck.id]}
					>
						<input type="hidden" name="deckId" value={deck.id} />
						<button
							type="submit"
							class="action add"
							aria-label={t(addDeckAriaLabel(deck.title))}
							disabled={addingId === deck.id}
						>
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
						</button>
					</form>
				</li>
			{/each}
		</ul>
		<p class="catalog-note">{t(catalogGrowingMessage)}</p>
	</section>
{/if}

{#if confirmDeck !== undefined}
	<Modal labelledBy="remove-deck-heading" onClose={() => (confirmDeckId = null)}>
		<h2 id="remove-deck-heading">{t(removeDeckHeading)}</h2>
		<p>{t(removeDeckMessage(confirmDeck.title))}</p>
		<div class="modal-actions">
			<Button variant="secondary" onclick={() => (confirmDeckId = null)}>{t(cancelLabel)}</Button>
			<form method="POST" action="?/removeFromCollection" use:enhance={submitRemove(confirmDeck.id)}>
				<input type="hidden" name="deckId" value={confirmDeck.id} />
				<Button
					type="submit"
					variant="error"
					loading={removingId === confirmDeck.id}
					disabled={removingId === confirmDeck.id}
				>
					{t(removeDeckLabel)}
				</Button>
			</form>
		</div>
	</Modal>
{/if}

{#if added.size > 0}
	<VocabularyTrainCta />
{/if}

<style>
	.decks-section {
		display: flex;
		width: 100%;
		flex-direction: column;
		gap: var(--space-2);
	}

	.decks-section h2 {
		margin: 0 0 0 var(--space-4);
		text-align: start;
		font-family: var(--font-family-body);
		font-weight: 400;
		font-size: var(--font-size-sm);
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--color-text-secondary);
	}

	.decks {
		display: flex;
		width: 100%;
		flex-direction: column;
		gap: var(--space-2);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	/* Positioned (not flex) — `.action` below is an absolutely-positioned
	   sibling overlaid on top of `.deck`, not a flex item beside it. Keeping
	   the button and the link as siblings rather than nesting a <button>
	   inside an <a> (invalid — interactive elements can't nest) while still
	   making the button read as "part of the card" visually. This also
	   decouples the row's height entirely from the button's fixed 44px size:
	   flexing them side by side previously left the row's height following
	   whichever centered box happened to be tallest, which on a narrow
	   phone (more text wrapping, so a genuinely taller card) still visually
	   read as "the checkmark is squashing this" once the two were compared
	   side by side — overlaying removes that comparison entirely. */
	.row {
		position: relative;
	}

	.deck {
		display: flex;
		min-height: var(--tap-target-min);
		align-items: center;
		gap: var(--space-3);
		/* Right padding clears the absolutely-positioned .action circle
		   below (its own width plus a comfortable gap) so title/description
		   text never renders underneath it — see docs/DESIGN.md's
		   padding-vs-radius note. */
		padding: var(--space-3) calc(var(--tap-target-min) + var(--space-4)) var(--space-3) var(--space-4);
		border: 1.5px solid var(--color-border-soft);
		border-radius: var(--radius-lg);
		background: transparent;
		text-decoration: none;
		color: var(--color-text-primary);
		transition: background-color var(--transition-fast);
	}

	.deck.added {
		border-color: transparent;
		background: var(--color-surface);
	}

	.deck:hover {
		background: var(--color-background-hover);
	}

	.deck.added:hover {
		background: var(--color-surface-hover);
	}

	.info {
		display: flex;
		min-width: 0;
		flex-direction: column;
		gap: 0.1rem;
		text-align: start;
	}

	.title {
		font-family: var(--font-heading);
		font-weight: var(--font-heading-weight);
	}

	.desc {
		color: var(--color-text-secondary);
		font-size: var(--font-size-sm);
	}

	.meta {
		align-self: flex-start;
		margin-top: 0.275rem;
		padding: 0.05rem var(--space-2);
		border-radius: var(--radius-pill);
		background: var(--color-neutral-200);
		color: var(--color-neutral-700);
		font-size: 0.75rem;
	}

	.action {
		position: absolute;
		top: 50%;
		right: var(--space-2);
		display: flex;
		align-items: center;
		justify-content: center;
		width: var(--tap-target-min);
		height: var(--tap-target-min);
		border-radius: var(--radius-pill);
		cursor: pointer;
		transform: translateY(-50%);
		transition: background-color var(--transition-fast);
	}

	.action:disabled {
		cursor: not-allowed;
		opacity: 0.6;
	}

	.action.remove {
		border: 1.5px solid var(--color-border);
		background: transparent;
		color: var(--color-accent-700);
	}

	.action.remove:hover:not(:disabled) {
		background: var(--color-background);
	}

	.action.add {
		border: 1.5px solid var(--color-border);
		background: var(--color-background);
		color: var(--color-text-primary);
	}

	.action.add:hover:not(:disabled) {
		background: var(--color-background-hover);
	}

	.catalog-note {
		margin: 0.275rem 0 0 var(--space-4);
		color: var(--color-text-secondary);
		font-size: var(--font-size-sm);
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
