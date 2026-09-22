import type { Locale } from './locale';

export type Translated = Record<Locale, string>;

/**
 * Text that may exist in only one language — for content whose point is made
 * to one reader and not the other. Never for UI chrome (a missing label is a
 * bug); it's for a word's comment, where "Russian already has вы" is worth
 * saying to a Russian reader and nothing needs saying in its place to an
 * English one. Resolve it with `tPartial()`, which returns `undefined` when
 * the current locale's text is absent, so the caller renders nothing rather
 * than a sentence written for somebody else.
 */
export type PartiallyTranslated = Partial<Translated>;
