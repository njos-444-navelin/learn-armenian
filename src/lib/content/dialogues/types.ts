import type { Translated } from '$lib/i18n/types';

/**
 * The app has exactly two voices, and so exactly two dialogue characters —
 * see docs/VOCABULARY_AUDIO.md's "Voices and model": Tereza (the app's main
 * voice) and Dmitrii (the second voice, used only where two speakers are
 * necessary — i.e. here). Every dialogue is a conversation between the two.
 */
export type CharacterId = 'tereza' | 'dmitrii';

/** Drawn by `CharacterAvatar.svelte`, which keys its two faces off `id`. */
export interface Character {
	id: CharacterId;
	name: Translated;
}

/**
 * One tappable word of a dialogue line, as it's actually spoken — an
 * inflected form (հա՞ցը) with its punctuation, linked back to the library
 * word it's a form of (`hats`), so the popover can show the base form,
 * play the shared clip, and reuse the library's translation and note.
 */
export interface DialogueToken {
	/** The surface form exactly as it appears in the line, punctuation included. */
	text: string;
	/** The library word (`words/entries.ts`) this is a form of. Omitted only
	 * for a token with nothing to look up (a bare punctuation mark, a
	 * proper noun) — such a token renders as plain text, not a button. */
	wordId?: string | undefined;
	/** What the token means *in this line* when that differs from the
	 * library word's translation — "the bread" for հացը where `hats` says
	 * "Bread", "want" for ուզում where `uzel` says "To want". Falls back to
	 * the library translation. */
	gloss?: Translated | undefined;
	/** A remark about this occurrence specifically (why the -ը, where the
	 * ՞ sits). Shown with the gloss, under a "Here:" label; the library
	 * word's own note is shown separately, with the dictionary entry, so
	 * the two never read as one text. Anything true of the word in any
	 * sentence belongs on the library entry, not here. The library's
	 * `usage` (the phrase a word is mostly met in) is never shown in a
	 * dialogue — so when a line *is* that phrase (Բարի լույս), this is
	 * where the learner is told so. */
	here?: Translated | undefined;
}

export interface DialogueLine {
	speaker: CharacterId;
	translation: Translated;
	tokens: readonly DialogueToken[];
}

/** One example row in a dialogue's rule card — an Armenian phrase, its
 * translation, and a short hint about the distinction being taught. */
export interface RuleExample {
	armenian: string;
	translation: Translated;
	hint: Translated;
}

/**
 * The "one rule first" card at the top of a dialogue — the single grammar
 * point the dialogue is built around, meant to take under a minute to read
 * before listening.
 */
export interface DialogueRule {
	title: Translated;
	/** One line under the title: what the rule is about, how long it takes. */
	summary: Translated;
	intro: Translated;
	examples: readonly RuleExample[];
	outro?: Translated | undefined;
	/** A side remark set apart from the main explanation (the ՞ inside a word). */
	aside?: Translated | undefined;
}

/**
 * The catalog entry for a dialogue — everything the list page and the
 * account dashboard need, with none of the lines. Safe to import anywhere;
 * the lines themselves are loaded per dialogue by `loadDialogue.ts`.
 */
export interface DialogueSummary {
	id: string;
	/** Armenian title, shown as the heading. */
	title: string;
	titleTranslation: Translated;
	/** The rule's headline forms, e.g. "այս · այդ · այն" — shown on the list card. */
	ruleLabel: string;
	/** Rough listening time, shown as "2 min" on the list card. */
	durationMinutes: number;
	/** Number of lines — kept here (not derived) so the list and dashboard
	 * never load the lines; must match the dialogue file, like a deck's
	 * `wordCount` (Conventions §10). */
	lineCount: number;
}

export interface Dialogue extends DialogueSummary {
	rule: DialogueRule;
	lines: readonly DialogueLine[];
}
