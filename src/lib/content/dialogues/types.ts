import type { Translated } from '$lib/i18n/types';

/**
 * The app has two voices, and so two dialogue characters — see
 * docs/VOCABULARY_AUDIO.md. Every dialogue is a conversation between them.
 */
export type CharacterId = 'tereza' | 'dmitrii';

/** Drawn by `CharacterAvatar.svelte`, which keys its two faces off `id`. */
export interface Character {
	id: CharacterId;
	name: Translated;
}

/**
 * One tappable word of a dialogue line as it's actually spoken: an inflected
 * form (հա՞ցը) linked back to the library word it's a form of (`hats`).
 */
export interface DialogueToken {
	/** The surface form exactly as it appears in the line, punctuation included. */
	text: string;
	/** The library word (`words/entries.ts`) this is a form of. Omitted only
	 * for a token with nothing to look up (a bare punctuation mark, a
	 * proper noun) — such a token renders as plain text, not a button. */
	wordId?: string | undefined;
	/** What the token means *in this line*, when that differs from the library
	 * word's translation. Falls back to the library translation. */
	gloss?: Translated | undefined;
	/** A remark about this occurrence specifically. Shown under a "Here:" label,
	 * separately from the library word's global comment. Anything true of the
	 * word in any sentence belongs on the library entry instead. */
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
 * Everything the list page and dashboard need, with none of the lines —
 * those are loaded per dialogue by `loadDialogue.ts`.
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
	/** Kept here rather than derived, so the list and dashboard never load the
	 * lines; must match the dialogue file, like a deck's `wordCount`
	 * (Conventions §10). */
	lineCount: number;
}

export interface Dialogue extends DialogueSummary {
	rule: DialogueRule;
	lines: readonly DialogueLine[];
}
