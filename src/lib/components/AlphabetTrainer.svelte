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
	import PulseCta from './PulseCta.svelte';
	import PageShell from './PageShell.svelte';

	interface Props {
		letters: readonly AlphabetLetter[];
		initialLevels: Readonly<Record<string, number>>;
		signedIn: boolean;
	}

	let { letters, initialLevels, signedIn }: Props = $props();

	// Screen-to-screen fade. A plain Svelte transition, not the app's page-level
	// View Transition: that one is wired to `onNavigate`, and switching `screen`
	// is client-side state inside one route, not a navigation.
	//
	// `in:` only, not `transition:`: a two-way crossfade keeps the outgoing
	// screen in the DOM as a flow sibling, so PageShell's column briefly holds
	// both and visibly shifts as its centring recalculates.
	//
	// Computed once, since a transition's params are read when it's created.
	// Guarded by `browser` because this runs at init, which also happens in SSR.
	const screenFadeMs = browser && window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 150;

	type Screen = 'home' | 'learn' | 'drill' | 'summary';

	// Read once at mount; this component owns advancing and persisting from here.
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
	// buildSession shuffles, so this and the real session in startPractice()
	// normally pick different letters — only its counts are ever read.
	let sessionPreview = $derived(buildSession(letters, levels));
	let practiceSubtitle = $derived(
		!signedIn
			? t(practiceSignInHint)
			: sessionPreview.learnLetters.length > 0
				? t(practiceSubtitleNew(sessionPreview.learnLetters.length))
				: t(practiceSubtitleWeakest(sessionPreview.drillLetters.length))
	);

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
		// Muted via the audio question's own "I can't listen right now".
		// Falls back to 'sound' rather than skipping the letter, the same
		// substitution buildDrillQuestion makes for 'yev'.
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

	// Swaps the layout's top-left "Back" bubble for a "Close" one outside the
	// home screen — see topLeftAction.svelte.ts for why this can't be a prop.
	// The cleanup always hands the bubble back, so navigating away mid-session
	// can't leave another page stuck with the override.
	$effect(() => {
		if (screen === 'home') return;
		setCloseAction(backHome);
		return () => setCloseAction(null);
	});

	// Screen changes are state, not navigations, so the browser never resets
	// scroll for them — without this the next screen opens already scrolled
	// down. `void screen` is what makes the effect track it.
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
				<PulseCta label={t(practiceLabel)} subtitle={practiceSubtitle} onclick={clickPractice} />
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
	/* Each screen is the single child PageShell's flex column sees, so it
	   reproduces that column's layout for its own children — `gap: inherit`
	   copies PageShell's gap rather than repeating the value. It's also what
	   `in:fade` attaches to: a multi-root screen gives a transition no single
	   element to animate. */
	.screen {
		display: flex;
		width: 100%;
		flex-direction: column;
		align-items: center;
		gap: inherit;
	}

</style>
