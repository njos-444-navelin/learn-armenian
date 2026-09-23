import type { Character, CharacterId } from './types';

/**
 * The app's two characters, one per ElevenLabs voice, so a line attributed to
 * Tereza is spoken by Tereza's voice. Their names go through `Translated`
 * because they're transliterated per locale (Tereza/Тереза).
 */
export const CHARACTERS: Record<CharacterId, Character> = {
	tereza: { id: 'tereza', name: { en: 'Tereza', ru: 'Тереза' } },
	dmitrii: { id: 'dmitrii', name: { en: 'Dmitrii', ru: 'Дмитрий' } }
};
