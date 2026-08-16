import type { VocabularyWord } from './types';
import type { CardState } from '$lib/srs/scheduler';

/** One entry in a training session's queue — a word paired with the deck it
 * came from (needed to key `user_vocabulary_progress`, since word ids are
 * only unique within a deck) and its current SRS state. */
export interface TrainingCard {
	deckId: string;
	word: VocabularyWord;
	state: CardState;
	isNew: boolean;
}
