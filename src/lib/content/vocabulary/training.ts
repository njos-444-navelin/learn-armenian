import type { Word } from '$lib/content/words/types';
import type { CardState } from '$lib/srs/scheduler';

/** One entry in a training session's queue — a word paired with the deck it
 * came from (needed to key `user_vocabulary_progress`, which tracks a word's
 * SRS state per deck it was studied in) and its current SRS state. */
export interface TrainingCard {
	deckId: string;
	word: Word;
	state: CardState;
	isNew: boolean;
}
