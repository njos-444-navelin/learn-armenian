import type { Translated } from '../types';

export const heading: Translated = { en: 'Contact us', ru: 'Связаться с нами' };

export const pageTitle: Translated = {
	en: 'Contact us — Learn Armenian',
	ru: 'Связаться с нами — Учи армянский'
};

export const pageDescription: Translated = {
	en: 'Get in touch for support or questions.',
	ru: 'Свяжитесь с нами по вопросам поддержки.'
};

export const body: Translated = {
	en: 'For support or any questions, email us at:',
	ru: 'По любым вопросам и за поддержкой пишите нам на:'
};

/** Not a `Translated` — an email address is the same in every language, so
 * it isn't translatable text (same reasoning as `LOCALE_FLAGS` in
 * `locale.ts`), just a literal identifier. */
export const supportEmail = 'learnarmeniansupport.sustainer303@passmail.net';
