<script lang="ts">
	import { replaceState } from '$app/navigation';
	import { page } from '$app/state';
	import DialogueDone from '$lib/components/DialogueDone.svelte';
	import DialoguePlayer, { type TappedWord } from '$lib/components/DialoguePlayer.svelte';
	import PageShell from '$lib/components/PageShell.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import { playerPageDescription, playerPageTitle } from '$lib/i18n/dictionaries/dialogues';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	type Screen = 'player' | 'done';
	let screen = $state<Screen>('player');
	let tapped = $state<readonly TappedWord[]>([]);
	// The player remounts under a fresh key (= fresh reveal/translation/
	// playback state) on replay and when navigating between dialogues.
	let replayCount = $state(0);
	let playerKey = $derived(`${data.dialogue.id}:${replayCount}`);
	// Going from one dialogue's done screen to the next keeps this component
	// alive, so the screen resets itself. Only ever writes `screen`; reading
	// it here would loop.
	$effect(() => {
		data.dialogue.id;
		screen = 'player';
	});

	let completeForm = $state<HTMLFormElement | undefined>(undefined);

	/**
	 * Replays "mark it done" after a signed-out learner is sent to sign in and
	 * back — see requireSignedIn()'s `resume` option and the identical effect in
	 * learn/vocabulary/[deckId]/+page.svelte.
	 */
	let resumeHandled = $state(false);
	$effect(() => {
		if (resumeHandled) return;
		if (page.url.searchParams.get('resume') !== 'complete') return;
		if (page.data.claims === null) return;
		// Already done, so the form isn't rendered and there's nothing to
		// replay; just drop the param.
		if (!data.completed && completeForm === undefined) return;
		resumeHandled = true;
		if (!data.completed) completeForm?.requestSubmit();

		const url = new URL(page.url);
		url.searchParams.delete('resume');
		// eslint-disable-next-line svelte/no-navigation-without-resolve -- shallow routing (SvelteKit's own pattern for this: replaceState(url: string | URL, ...)) mutating a copy of the already-valid page.url to drop a one-shot query param; the pathname itself never changes, so there's no route to check against resolve()'s route list.
		replaceState(url, page.state);
	});

	function completed(words: readonly TappedWord[]): void {
		tapped = words;
		screen = 'done';
		window.scrollTo({ top: 0 });
	}

	function replay(): void {
		tapped = [];
		replayCount++;
		screen = 'player';
		window.scrollTo({ top: 0 });
	}
</script>

<Seo
	title={playerPageTitle(data.dialogue.titleTranslation)}
	description={playerPageDescription(data.dialogue.titleTranslation)}
/>

<PageShell>
	<div class="screen">
		{#if screen === 'player'}
			{#key playerKey}
				<DialoguePlayer
					dialogue={data.dialogue}
					number={data.number}
					completed={data.completed}
					bind:completeForm
					onCompleted={completed}
				/>
			{/key}
		{:else}
			<DialogueDone dialogue={data.dialogue} next={data.next} {tapped} onReplay={replay} />
		{/if}
	</div>
</PageShell>

<style>
	/* Narrower than PageShell's --measure: chat bubbles read best at phone-ish
	   widths, and DialoguePlayer's fixed bar caps itself to match. */
	.screen {
		display: flex;
		width: 100%;
		max-width: 26rem;
		flex-direction: column;
		align-items: stretch;
	}
</style>
