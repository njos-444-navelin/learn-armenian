import type { Locale } from './locale';

export type Translated = Record<Locale, string>;

/**
 * Text that may exist in only one language, for content whose point is made to
 * one reader and not the other. Never for UI chrome, where a missing label is
 * a bug. Resolve it with `tPartial()`, which returns `undefined` rather than
 * the other language's text.
 */
export type PartiallyTranslated = Partial<Translated>;
