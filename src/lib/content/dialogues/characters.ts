import type { Character, CharacterId } from './types';

/**
 * The app's two characters — the same two people as its two ElevenLabs
 * voices (docs/VOCABULARY_AUDIO.md, "Voices and model"), so a line
 * attributed to Tereza on screen is spoken by Tereza's voice. Their faces
 * are the two drawn avatars in `CharacterAvatar.svelte`. Their names are
 * proper nouns but still go through `Translated`: they're transliterated
 * differently per locale (Tereza/Тереза), not left as-is like `brandName`.
 */
export const CHARACTERS: Record<CharacterId, Character> = {
	tereza: { id: 'tereza', name: { en: 'Tereza', ru: 'Тереза' } },
	dmitrii: { id: 'dmitrii', name: { en: 'Dmitrii', ru: 'Дмитрий' } }
};
