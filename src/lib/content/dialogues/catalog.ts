import type { DialogueSummary } from './types';

/**
 * Every dialogue, in the order they're meant to be taken — the list page
 * numbers them from this order, and the done screen's "Next" button is
 * simply the following entry. Carries no lines: those live one file per
 * dialogue under `dialogues/` and are loaded by `loadDialogue.ts`, the same
 * split as `vocabulary/catalog.ts` vs. `vocabulary/decks/`.
 */
export const DIALOGUE_CATALOG: readonly DialogueSummary[] = [
	{
		id: 'bread-shop',
		title: 'Հացի խանութում',
		titleTranslation: { en: 'At the bread shop', ru: 'В хлебной лавке' },
		ruleLabel: 'այս · այդ · այն',
		durationMinutes: 3,
		lineCount: 19
	}
];

export function getDialogueSummary(id: string): DialogueSummary | undefined {
	return DIALOGUE_CATALOG.find((dialogue) => dialogue.id === id);
}

/** The dialogue after `id` in catalog order, or `undefined` for the last one. */
export function getNextDialogueSummary(id: string): DialogueSummary | undefined {
	const index = DIALOGUE_CATALOG.findIndex((dialogue) => dialogue.id === id);
	return index === -1 ? undefined : DIALOGUE_CATALOG[index + 1];
}
