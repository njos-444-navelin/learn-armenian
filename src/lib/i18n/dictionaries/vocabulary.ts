import { brandName } from './common';
import type { Translated } from '../types';
import type { WordRegister } from '$lib/content/vocabulary/types';

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

export const addedBadgeLabel: Translated = {
	en: 'Added',
	ru: 'Добавлено'
};

export const catalogGrowingMessage: Translated = {
	en: 'New topics are added regularly — check back often.',
	ru: 'Новые темы добавляются регулярно — заглядывайте почаще.'
};

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

/** Register tag shown next to a word's translation — see `WordRegister`. */
export const registerLabels: Record<WordRegister, Translated> = {
	informal: { en: 'inf.', ru: 'разг.' },
	formal: { en: 'fml.', ru: 'лит.' }
};

export const addToCollectionLabel: Translated = {
	en: 'Add to my collection',
	ru: 'Добавить в мою коллекцию'
};

export const addedToCollectionLabel: Translated = {
	en: 'Added to your collection',
	ru: 'Добавлено в Вашу коллекцию'
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
