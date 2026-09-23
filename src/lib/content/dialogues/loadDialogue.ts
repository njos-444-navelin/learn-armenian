import { getWord } from '$lib/content/words/entries';
import { getDialogueSummary } from './catalog';
import type { Dialogue, DialogueLine, DialogueRule } from './types';

/** What a `dialogues/<id>.ts` file exports: the parts the catalog doesn't carry. */
export interface DialogueModule {
	RULE: DialogueRule;
	LINES: readonly DialogueLine[];
}

/**
 * One lazy import per dialogue file, so a dialogue's lines are downloaded only
 * by its own player page. Same shape as `vocabulary/loadDeck.ts`.
 */
const dialogueModules = import.meta.glob<DialogueModule>('./dialogues/*.ts');

/**
 * The catalog entry merged with its file, or `undefined` for an id in neither.
 * Throws for a `wordId` the library hasn't got, or a `lineCount` that doesn't
 * match the file: both are content bugs that should fail on first load.
 */
export async function loadDialogue(id: string): Promise<Dialogue | undefined> {
	const summary = getDialogueSummary(id);
	const importModule = dialogueModules[`./dialogues/${id}.ts`];
	if (summary === undefined || importModule === undefined) {
		return undefined;
	}
	const module = await importModule();

	if (module.LINES.length !== summary.lineCount) {
		throw new Error(
			`dialogue "${id}": catalog says ${summary.lineCount} lines, file has ${module.LINES.length}`
		);
	}
	for (const line of module.LINES) {
		for (const token of line.tokens) {
			if (token.wordId !== undefined && getWord(token.wordId) === undefined) {
				throw new Error(`dialogue "${id}": token "${token.text}" references unknown word id "${token.wordId}"`);
			}
		}
	}

	return { ...summary, rule: module.RULE, lines: module.LINES };
}
