import { brandName } from './common';
import { ruWordForm } from '../ruPlural';
import type { Translated } from '../types';
import type { VocabularyDeck, VocabularyLevel } from '$lib/content/vocabulary/types';
import type { WordRegister } from '$lib/content/words/types';

// --- Deck list page (/learn/vocabulary) ---

export const pageTitle: Translated = {
	en: `${brandName} — vocabulary`,
	ru: `${brandName} — словарь`
};

export const pageDescription: Translated = {
	en: 'Pick a topic and learn its words before adding it to your collection.',
	ru: 'Выберите тему и изучите её слова, прежде чем добавить её в свою коллекцию.'
};

export const heading: Translated = {
	en: 'Vocabulary',
	ru: 'Словарь'
};

export const decksMenuAriaLabel: Translated = {
	en: 'Topics',
	ru: 'Темы'
};

export const catalogGrowingMessage: Translated = {
	en: 'New topics are added regularly — check back often.',
	ru: 'Новые темы добавляются регулярно — заглядывайте почаще.'
};

export const myCollectionHeading: Translated = {
	en: 'In your collection',
	ru: 'В Вашей коллекции'
};

export const moreTopicsHeading: Translated = {
	en: 'More topics',
	ru: 'Другие темы'
};

/** Difficulty tier shown alongside a deck's word count — see `deckMetaLabel`. */
export const levelLabels: Record<VocabularyLevel, Translated> = {
	beginner: { en: 'Beginner', ru: 'Начальный' }
};

/** Dynamic — see Conventions §1. Shown as the "Beginner · 20 words" chip on
 * a deck-list row — see `deckSubtitle()` below for the deck page's own,
 * differently-ordered combination of the same two facts. */
export function deckMetaLabel(level: VocabularyLevel, wordCount: number): Translated {
	const levelText = levelLabels[level];
	return {
		en: `${levelText.en} · ${wordCount} ${wordCount === 1 ? 'word' : 'words'}`,
		ru: `${levelText.ru} · ${wordCount} ${ruWordForm(wordCount)}`
	};
}

/** Dynamic — see Conventions §1. Aria-label for a deck-list row's inline
 * "add" button — spells out which deck, since a screen reader landing on
 * one of several identical-looking icon buttons in a list has no other way
 * to tell them apart. */
export function addDeckAriaLabel(deckTitle: Translated): Translated {
	return {
		en: `Add ${deckTitle.en} to your collection`,
		ru: `Добавить тему «${deckTitle.ru}» в Вашу коллекцию`
	};
}

/** Dynamic — see Conventions §1. Same reasoning as `addDeckAriaLabel()`, for
 * the inline "remove" button. */
export function removeDeckAriaLabel(deckTitle: Translated): Translated {
	return {
		en: `Remove ${deckTitle.en} from your collection`,
		ru: `Удалить тему «${deckTitle.ru}» из Вашей коллекции`
	};
}

// --- Shared between the deck page and the trainer card ---

/** Aria-label for the pronunciation button next to a word's Armenian text —
 * see `SpeakerButton.svelte`. Kept generic rather than interpolating the
 * word itself: a screen reader would otherwise have to attempt Armenian
 * script pronunciation on every single row of a word list. */
export const playPronunciationLabel: Translated = {
	en: 'Play pronunciation',
	ru: 'Прослушать произношение'
};

// --- Deck page (/learn/vocabulary/[deckId]) ---

export function deckPageTitle(deckTitle: Translated): Translated {
	return {
		en: `${brandName} — ${deckTitle.en}`,
		ru: `${brandName} — ${deckTitle.ru}`
	};
}

export function deckPageDescription(deckTitle: Translated): Translated {
	return {
		en: `Learn the words in "${deckTitle.en}" before adding them to your collection.`,
		ru: `Изучите слова из темы «${deckTitle.ru}», прежде чем добавить их в свою коллекцию.`
	};
}

/** Dynamic — see Conventions §1. The deck page's own subheading — its
 * description, word count and level in one line (a different order from
 * `deckMetaLabel`'s list-row chip, which has no separate description line
 * next to it and so leads with the level instead). */
export function deckSubtitle(deck: VocabularyDeck): Translated {
	const levelText = levelLabels[deck.level];
	return {
		en: `${deck.description.en} · ${deck.wordCount} ${deck.wordCount === 1 ? 'word' : 'words'} · ${levelText.en}`,
		ru: `${deck.description.ru} · ${deck.wordCount} ${ruWordForm(deck.wordCount)} · ${levelText.ru}`
	};
}

/** Register tag shown next to a word's translation — see `WordRegister`. */
export const registerLabels: Record<WordRegister, Translated> = {
	informal: { en: 'inf.', ru: 'разг.' },
	formal: { en: 'fml.', ru: 'лит.' }
};

export const addToCollectionLabel: Translated = {
	en: 'Add to my collection',
	ru: 'Добавить в мою коллекцию'
};

export const removeDeckHeading: Translated = {
	en: 'Remove this topic?',
	ru: 'Удалить эту тему?'
};

/** Dynamic — see Conventions §1 on why interpolated text is a function, not a literal. */
export function removeDeckMessage(deckTitle: Translated): Translated {
	return {
		en: `"${deckTitle.en}" is already in your vocabulary. Do you want to remove it from your collection?`,
		ru: `Тема «${deckTitle.ru}» уже в Вашем словаре. Удалить её из коллекции?`
	};
}

export const removeDeckLabel: Translated = {
	en: 'Remove',
	ru: 'Удалить'
};

export const removeDeckFailedMessage: Translated = {
	en: "Couldn't remove this topic — check your connection and try again",
	ru: 'Не удалось удалить тему — проверьте соединение и попробуйте снова'
};
