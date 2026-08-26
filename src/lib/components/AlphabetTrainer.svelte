<script lang="ts">
	import { untrack } from 'svelte';
	import { fade } from 'svelte/transition';
	import { browser } from '$app/environment';
	import { goto, replaceState } from '$app/navigation';
	import { page } from '$app/state';
	import { isAudioMuted } from '$lib/alphabet/audioMute';
	import { applyAnswer } from '$lib/alphabet/mastery';
	import { buildDrillQuestion, DRILL_QUESTION_TYPES, type DrillQuestion } from '$lib/alphabet/drillQuestion';
	import { buildSession } from '$lib/alphabet/session';
	import { setCloseAction } from '$lib/stores/topLeftAction.svelte';
	import type { AlphabetLetter } from '$lib/content/alphabet';
	import { getWord } from '$lib/content/words/entries';
	import type { Word } from '$lib/content/words/types';
	import { getLocale, t } from '$lib/i18n/current';
	import { withLocaleQuery } from '$lib/i18n/paths';
	import { heading, practiceLabel, practiceSignInHint, practiceSubtitleNew, practiceSubtitleWeakest } from '$lib/i18n/dictionaries/alphabetTrainer';
	import AlphabetDrillQuestion from './AlphabetDrillQuestion.svelte';
	import AlphabetLearnStep from './AlphabetLearnStep.svelte';
	import AlphabetLetterGrid from './AlphabetLetterGrid.svelte';
	import AlphabetLetterSheet from './AlphabetLetterSheet.svelte';
	import AlphabetSessionSummary from './AlphabetSessionSummary.svelte';
	import FloatingActionBar from './FloatingActionBar.svelte';
	import PageShell from './PageShell.svelte';

	interface Props {
		letters: readonly AlphabetLetter[];
		initialLevels: Readonly<Record<string, number>>;
		signedIn: boolean;
	}

	let { letters, initialLevels, signedIn }: Props = $props();

	// Screen-to-screen fade (home <-> learn <-> drill <-> summary) — a plain
	// Svelte transition on the `{#if}` block below, not the app's page-level
	// View Transition (see app.css / root +layout.svelte): that one is
	// wired to SvelteKit's `onNavigate` hook and fires on real route
	// changes, which switching `screen` here isn't — it's client-side state
	// inside one route. Reaching for it anyway would mean manually driving
	// `document.startViewTransition()` around a state update, fighting a
	// mechanism built for a different kind of transition (and risking it
	// sweeping in page-level chrome — the fixed back/account bubbles — that
	// isn't part of this screen switch at all). Svelte's own transition
	// directives are the right-sized tool for animating between states
	// inside a single component.
	//
	// `in:` only, deliberately not `transition:` (both directions): a true
	// two-way crossfade keeps the outgoing screen in the DOM, as a normal
	// flow sibling, until its own out-transition finishes — so for that
	// overlap window PageShell's centered column briefly contains *both*
	// screens stacked, doubling its height and visibly shifting everything
	// as the centering recalculates. Fading only the incoming screen in
	// means the outgoing one is removed the instant `screen` changes, so
	// only one is ever in the DOM — no overlap, no height doubling, no
	// shift. The swap still reads as soft rather than a jump-cut, since the
	// new content eases in; it just doesn't fade the old one out first.
	//
	// Computed once (not reactive) since a transition's params are read
	// when it's created, matching how the letter sheet's own reduced-motion
	// check works — guarded by `browser` here (unlike that click-triggered
	// check) because this one runs at component init, which also happens
	// during SSR, where `window` doesn't exist.
	const screenFadeMs = browser && window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 150;

	type Screen = 'home' | 'learn' | 'drill' | 'summary';

	// Read once at mount — this component owns advancing/persisting from here
	// on, same pattern as VocabularyTrainer's `activeQueue`.
	let levels = $state<Record<string, number>>(untrack(() => ({ ...initialLevels })));
	let screen = $state<Screen>('home');
	let caseDisplay = $state<'upper' | 'lower'>('upper');
	let sheetLetterId = $state<string | null>(null);

	let learnLetters = $state<readonly AlphabetLetter[]>([]);
	let learnIndex = $state(0);

	let drillLetters = $state<readonly AlphabetLetter[]>([]);
	let drillIndex = $state(0);
	let currentQuestion = $state<DrillQuestion | undefined>(undefined);

	interface LogEntry {
		letterId: string;
		before: number;
		after: number;
	}
	let sessionLog = $state<LogEntry[]>([]);

	let locale = $derived(getLocale());
	// buildSession shuffles which letters it picks, so this and the real
	// session built in startPractice() below normally land on different
	// letters — harmless, since this is only ever read for its *counts*
	// (learnLetters.length, drillLetters.length), never specific letters.
	let sessionPreview = $derived(buildSession(letters, levels));

	let openLetter = $derived(sheetLetterId === null ? undefined : letters.find((letter) => letter.id === sheetLetterId));
	function wordsFor(letter: AlphabetLetter | undefined): Word[] {
		if (letter === undefined) return [];
		return letter.exampleWordIds.map(getWord).filter((word): word is Word => word !== undefined);
	}
	let openLetterWords = $derived(wordsFor(openLetter));

	let currentLearnLetter = $derived(learnLetters[learnIndex]);
	let currentLearnWords = $derived(wordsFor(currentLearnLetter));

	function openLetterSheet(letterId: string): void {
		sheetLetterId = letterId;
	}

	function closeSheet(): void {
		sheetLetterId = null;
	}

	function toggleCase(value: 'upper' | 'lower'): void {
		caseDisplay = value;
	}

	function startPractice(): void {
		const session = buildSession(letters, levels);
		learnLetters = session.learnLetters;
		drillLetters = session.drillLetters;
		learnIndex = 0;
		drillIndex = 0;
		sessionLog = [];
		sheetLetterId = null;
		if (session.learnLetters.length > 0) {
			screen = 'learn';
		} else {
			enterDrill();
		}
	}

	function clickPractice(): void {
		if (!signedIn) {
			const resumeTarget = withLocaleQuery(locale, '/learn/alphabet', { resume: 'practice' });
			void goto(withLocaleQuery(locale, '/account', { next: resumeTarget }));
			return;
		}
		startPractice();
	}

	let resumeHandled = $state(false);
	$effect(() => {
		if (resumeHandled) return;
		if (page.url.searchParams.get('resume') !== 'practice') return;
		if (!signedIn) return;
		resumeHandled = true;
		startPractice();
		const url = new URL(page.url);
		url.searchParams.delete('resume');
		// eslint-disable-next-line svelte/no-navigation-without-resolve -- shallow routing (SvelteKit's own pattern for this: replaceState(url: string | URL, ...)) mutating a copy of the already-valid page.url to drop a one-shot query param; the pathname itself never changes, so there's no route to check against resolve()'s route list.
		replaceState(url, page.state);
	});

	function learnPrev(): void {
		if (learnIndex === 0) {
			screen = 'home';
			return;
		}
		learnIndex -= 1;
	}

	function learnNext(): void {
		if (learnIndex + 1 >= learnLetters.length) {
			enterDrill();
			return;
		}
		learnIndex += 1;
	}

	function buildQuestionFor(index: number): DrillQuestion | undefined {
		const letter = drillLetters[index];
		if (letter === undefined) return undefined;
		let type = DRILL_QUESTION_TYPES[index % DRILL_QUESTION_TYPES.length] ?? 'sound';
		// Muted via the audio question's own "I can't listen right now" —
		// falls back to 'sound' rather than skipping this letter outright,
		// same substitution buildDrillQuestion already does for 'yev' (which
		// has no case-type answer available at all).
		if (type === 'audio' && isAudioMuted()) type = 'sound';
		return buildDrillQuestion(letter, letters, type);
	}

	function enterDrill(): void {
		drillIndex = 0;
		currentQuestion = buildQuestionFor(0);
		screen = 'drill';
	}

	function handleAnswered(letterId: string, correct: boolean): void {
		const before = levels[letterId] ?? 0;
		const after = applyAnswer(before, correct);
		levels = { ...levels, [letterId]: after };
		sessionLog = [...sessionLog, { letterId, before, after }];
	}

	function handleDrillNext(): void {
		const next = drillIndex + 1;
		if (next >= drillLetters.length) {
			screen = 'summary';
			return;
		}
		drillIndex = next;
		currentQuestion = buildQuestionFor(next);
	}

	function backHome(): void {
		screen = 'home';
	}

	// Swaps the layout's top-left "Back" bubble for a "Close" (X) one for
	// every screen but 'home' — see topLeftAction.svelte.ts for why this
	// can't just be a prop. The cleanup (run before each re-run and on
	// unmount) always hands the bubble back, so navigating away mid-session
	// can't leave some other page stuck with this override.
	$effect(() => {
		if (screen === 'home') return;
		setCloseAction(backHome);
		return () => setCloseAction(null);
	});

	// Screen changes are client-side state, not real navigations, so the
	// browser never resets scroll position for them the way it would on an
	// actual page load. Without this, scrolling down on a tall screen (the
	// summary's rows list, most often) leaves the *next* screen scrolled to
	// that same spot, cutting off its own top content — e.g. "Practice
	// again" landing straight into an already-scrolled-down drill question.
	// `void screen` is what makes this effect track `screen` at all; the
	// scroll call itself doesn't read it.
	$effect(() => {
		void screen;
		if (browser) window.scrollTo(0, 0);
	});

	let summaryRows = $derived(
		sessionLog.flatMap((entry) => {
			const letter = letters.find((candidate) => candidate.id === entry.letterId);
			return letter === undefined ? [] : [{ letter, before: entry.before, after: entry.after }];
		})
	);
</script>

<PageShell>
	{#if screen === 'home'}
		<div class="screen" in:fade={{ duration: screenFadeMs }}>
			<h1>{t(heading)}</h1>
			<AlphabetLetterGrid {letters} {levels} {caseDisplay} onToggleCase={toggleCase} onOpenLetter={openLetterSheet} />
			<FloatingActionBar bare>
				<button type="button" class="practice-button" onclick={clickPractice}>
					<span class="practice-text">
						<span class="practice-label">{t(practiceLabel)}</span>
						<span class="practice-subtitle">
							{#if !signedIn}
								{t(practiceSignInHint)}
							{:else if sessionPreview.learnLetters.length > 0}
								{t(practiceSubtitleNew(sessionPreview.learnLetters.length))}
							{:else}
								{t(practiceSubtitleWeakest(sessionPreview.drillLetters.length))}
							{/if}
						</span>
					</span>
					<span class="practice-icon" aria-hidden="true">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.75" stroke-linecap="round" stroke-linejoin="round" width="22" height="22">
							<path d="M5 12h14" />
							<path d="m12 5 7 7-7 7" />
						</svg>
					</span>
				</button>
			</FloatingActionBar>
		</div>
	{:else if screen === 'learn' && currentLearnLetter !== undefined}
		<div class="screen" in:fade={{ duration: screenFadeMs }}>
			{#key learnIndex}
				<AlphabetLearnStep
					letter={currentLearnLetter}
					words={currentLearnWords}
					index={learnIndex}
					total={learnLetters.length}
					isLast={learnIndex + 1 === learnLetters.length}
					onPrev={learnPrev}
					onNext={learnNext}
				/>
			{/key}
		</div>
	{:else if screen === 'drill' && currentQuestion !== undefined}
		<div class="screen" in:fade={{ duration: screenFadeMs }}>
			{#key drillIndex}
				<AlphabetDrillQuestion
					question={currentQuestion}
					allLetters={letters}
					index={drillIndex}
					total={drillLetters.length}
					onAnswered={handleAnswered}
					onNext={handleDrillNext}
				/>
			{/key}
		</div>
	{:else if screen === 'summary'}
		<div class="screen" in:fade={{ duration: screenFadeMs }}>
			<AlphabetSessionSummary rows={summaryRows} onBackHome={backHome} onPracticeAgain={startPractice} />
		</div>
	{/if}
</PageShell>

{#if openLetter !== undefined}
	<AlphabetLetterSheet letter={openLetter} words={openLetterWords} onClose={closeSheet} />
{/if}

<style>
	/* Each screen becomes the single child PageShell's own flex column sees
	   (rather than several siblings), so it needs to reproduce that column's
	   own layout for its own children — `gap: inherit` copies PageShell's
	   `--space-5` gap rather than repeating the value, so the two can't
	   silently drift apart. This wrapper is also what `in:fade` attaches to
	   above: a transition needs one element to animate, and a
	   multi-root screen (home renders an h1 + grid + action bar as three
	   siblings) doesn't give it one on its own. */
	.screen {
		display: flex;
		width: 100%;
		flex-direction: column;
		align-items: center;
		gap: inherit;
	}

	.practice-button {
		display: flex;
		flex: 1;
		align-items: center;
		gap: var(--space-3);
		min-height: var(--tap-target-min);
		padding: var(--space-3) var(--space-6);
		border: none;
		border-radius: var(--radius-pill);
		background: var(--color-primary);
		color: var(--color-on-primary);
		cursor: pointer;
		box-shadow: var(--shadow-md), 0 0 0 0 color-mix(in srgb, var(--color-primary) 35%, transparent);
		transition:
			background-color var(--transition-fast),
			outline-color var(--transition-fast);
		animation: practice-pulse 2.6s ease-out infinite;
	}

	.practice-button:hover {
		background: var(--color-primary-hover);
	}

	/* Pings outward once, then holds still for the rest of the cycle rather
	   than breathing in and out continuously — a single attention pulse that
	   repeats every couple of seconds, not a constant throb. */
	@keyframes practice-pulse {
		0% {
			box-shadow: var(--shadow-md), 0 0 0 0 color-mix(in srgb, var(--color-primary) 35%, transparent);
		}
		40%,
		100% {
			box-shadow: var(--shadow-md), 0 0 0 14px color-mix(in srgb, var(--color-primary) 0%, transparent);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.practice-button {
			animation: none;
		}
	}

	.practice-text {
		display: flex;
		flex: 1;
		flex-direction: column;
		gap: 2px;
		text-align: left;
	}

	.practice-label {
		font-family: var(--font-heading);
		font-weight: var(--font-heading-weight);
		font-size: var(--font-size-lg);
	}

	.practice-subtitle {
		font-size: var(--font-size-sm);
		opacity: 0.8;
	}

	.practice-icon {
		display: flex;
		flex: none;
		align-items: center;
	}
</style>
