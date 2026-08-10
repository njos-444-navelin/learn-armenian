import type { Translated } from '$lib/i18n/types';

export interface AlphabetLetter {
	id: string;
	uppercase: string;
	lowercase: string;
	voicing: Translated;
}

/**
 * The 38 letters of the modern Armenian alphabet (Ա–Ֆ). The traditional 36
 * letters of the Mesrop Mashtots alphabet plus Օ/օ and Ֆ/ֆ, added later.
 *
 * Deliberately excludes the և ligature ("yev"): it has no distinct uppercase
 * form of its own (ԵՎ is used instead), which would break the uniform
 * "capital + lowercase" pattern every other entry follows. A candidate for a
 * dedicated ligatures/digraphs lesson later, not an oversight here.
 *
 * Voicing text is a learner's approximation, not IPA, and deliberately only
 * compares each sound to words in the learner's own language (English for
 * `en`, Russian for `ru`) — never to a third language the learner may not
 * know. For the unaspirated/aspirated stop pairs, where one language's
 * native pronunciation already matches Armenian and the other doesn't
 * (English aspirates initial "k"/"p"/"t", Russian doesn't), the easy side
 * just says "like your normal X"; the other side gets a simple physical
 * self-test (a puff of air on the hand) instead of a foreign-word analogy —
 * introduced once in the study page's tip, then referenced tersely per
 * letter. The two letters whose sound depends on position in a word are
 * called out explicitly instead of collapsing both to one sound.
 */
export const ALPHABET: readonly AlphabetLetter[] = [
	{
		id: 'ayb',
		uppercase: 'Ա',
		lowercase: 'ա',
		voicing: { en: `like the "a" in "father"`, ru: 'как «а» в слове «мама»' }
	},
	{
		id: 'ben',
		uppercase: 'Բ',
		lowercase: 'բ',
		voicing: { en: `like the "b" in "boy"`, ru: 'как «б» в слове «бок»' }
	},
	{
		id: 'gim',
		uppercase: 'Գ',
		lowercase: 'գ',
		voicing: { en: `like the "g" in "go"`, ru: 'как «г» в слове «год»' }
	},
	{
		id: 'da',
		uppercase: 'Դ',
		lowercase: 'դ',
		voicing: { en: `like the "d" in "dog"`, ru: 'как «д» в слове «дом»' }
	},
	{
		id: 'yech',
		uppercase: 'Ե',
		lowercase: 'ե',
		voicing: {
			en: `like "e" in "bed" — sounds like "ye" in "yes" at the start of a word`,
			ru: 'как «э» в слове «этот» — в начале слова звучит как «е» в слове «ель»'
		}
	},
	{
		id: 'za',
		uppercase: 'Զ',
		lowercase: 'զ',
		voicing: { en: `like the "z" in "zoo"`, ru: 'как «з» в слове «зима»' }
	},
	{
		id: 'e',
		uppercase: 'Է',
		lowercase: 'է',
		voicing: {
			en: `like the "e" in "bed" (always — unlike Ե, never "ye")`,
			ru: 'как «э» в слове «этот» (всегда, в отличие от Ե, никогда не «е»)'
		}
	},
	{
		id: 'uht',
		uppercase: 'Ը',
		lowercase: 'ը',
		voicing: {
			en: `a quick, unstressed "uh", like the "a" in "sofa"`,
			ru: 'краткий безударный звук, как «а» в конце слова «карта»'
		}
	},
	{
		id: 'to',
		uppercase: 'Թ',
		lowercase: 'թ',
		voicing: {
			en: `like the "t" in "top" — a normal English "t"`,
			ru: 'придыхательное «т» — с лёгким выдохом воздуха'
		}
	},
	{
		id: 'zhe',
		uppercase: 'Ժ',
		lowercase: 'ժ',
		voicing: {
			en: `like the "s" in "measure"`,
			ru: 'как «ж» в слове «жук»'
		}
	},
	{
		id: 'ini',
		uppercase: 'Ի',
		lowercase: 'ի',
		voicing: { en: `like the "ee" in "see"`, ru: 'как «и» в слове «мир»' }
	},
	{
		id: 'liwn',
		uppercase: 'Լ',
		lowercase: 'լ',
		voicing: { en: `like the "l" in "love"`, ru: 'как «л» в слове «лампа»' }
	},
	{
		id: 'xeh',
		uppercase: 'Խ',
		lowercase: 'խ',
		voicing: {
			en: `a raspy, throat-clearing "h" sound`,
			ru: 'гортанное «х», как в слове «хлеб», но более резкое'
		}
	},
	{
		id: 'ca',
		uppercase: 'Ծ',
		lowercase: 'ծ',
		voicing: {
			en: `a sharp, unaspirated "ts" — no puff of air, like "ts" in "cats"`,
			ru: 'как обычное русское «ц», без выдоха'
		}
	},
	{
		id: 'ken',
		uppercase: 'Կ',
		lowercase: 'կ',
		voicing: {
			en: `a sharp, unaspirated "k" — no puff of air`,
			ru: 'как обычное русское «к», без выдоха'
		}
	},
	{
		id: 'ho',
		uppercase: 'Հ',
		lowercase: 'հ',
		voicing: { en: `like the "h" in "house"`, ru: 'лёгкий, почти беззвучный выдох — мягче русского «х»' }
	},
	{
		id: 'ja',
		uppercase: 'Ձ',
		lowercase: 'ձ',
		voicing: { en: `like "dz" in "adze"`, ru: 'звонкое «дз»' }
	},
	{
		id: 'ghad',
		uppercase: 'Ղ',
		lowercase: 'ղ',
		voicing: {
			en: `a soft, gargled sound made in the back of the throat`,
			ru: 'мягкий гортанный звук, похожий на лёгкое полоскание горла'
		}
	},
	{
		id: 'cheh',
		uppercase: 'Ճ',
		lowercase: 'ճ',
		voicing: {
			en: `a sharp, unaspirated "ch" — no puff of air`,
			ru: 'как обычное русское «ч», без выдоха'
		}
	},
	{
		id: 'men',
		uppercase: 'Մ',
		lowercase: 'մ',
		voicing: { en: `like the "m" in "mom"`, ru: 'как «м» в слове «мама»' }
	},
	{
		id: 'yi',
		uppercase: 'Յ',
		lowercase: 'յ',
		voicing: { en: `like the "y" in "yes"`, ru: 'как «й» в слове «йод»' }
	},
	{
		id: 'nu',
		uppercase: 'Ն',
		lowercase: 'ն',
		voicing: { en: `like the "n" in "no"`, ru: 'как «н» в слове «нос»' }
	},
	{
		id: 'sha',
		uppercase: 'Շ',
		lowercase: 'շ',
		voicing: { en: `like the "sh" in "shop"`, ru: 'как «ш» в слове «шапка»' }
	},
	{
		id: 'vo',
		uppercase: 'Ո',
		lowercase: 'ո',
		voicing: {
			en: `like the "o" in "more" — sounds like "vo" at the start of a word`,
			ru: 'как «о» в слове «дом» — в начале слова звучит как «во»'
		}
	},
	{
		id: 'cha',
		uppercase: 'Չ',
		lowercase: 'չ',
		voicing: {
			en: `like the "ch" in "chair" — a normal English "ch"`,
			ru: 'придыхательное «ч» — с лёгким выдохом воздуха'
		}
	},
	{
		id: 'peh',
		uppercase: 'Պ',
		lowercase: 'պ',
		voicing: {
			en: `a sharp, unaspirated "p" — no puff of air`,
			ru: 'как обычное русское «п», без выдоха'
		}
	},
	{
		id: 'jheh',
		uppercase: 'Ջ',
		lowercase: 'ջ',
		voicing: { en: `like the "j" in "jazz"`, ru: 'как «дж» в слове «джаз»' }
	},
	{
		id: 'ra',
		uppercase: 'Ռ',
		lowercase: 'ռ',
		voicing: {
			en: `a strongly rolled "r" — flutter your tongue tip against the roof of your mouth`,
			ru: 'раскатистое «р» — как русское протяжное «р-р-р», только более чёткое'
		}
	},
	{
		id: 'seh',
		uppercase: 'Ս',
		lowercase: 'ս',
		voicing: { en: `like the "s" in "see"`, ru: 'как «с» в слове «сон»' }
	},
	{
		id: 'vev',
		uppercase: 'Վ',
		lowercase: 'վ',
		voicing: { en: `like the "v" in "van"`, ru: 'как «в» в слове «вода»' }
	},
	{
		id: 'tiwn',
		uppercase: 'Տ',
		lowercase: 'տ',
		voicing: {
			en: `a sharp, unaspirated "t" — no puff of air`,
			ru: 'как обычное русское «т», без выдоха'
		}
	},
	{
		id: 'reh',
		uppercase: 'Ր',
		lowercase: 'ր',
		voicing: {
			en: `a soft, quick "r" — like the "tt" in "butter" (American pronunciation)`,
			ru: 'мягкое, лёгкое «р» — как обычное русское «р» в быстрой речи'
		}
	},
	{
		id: 'tso',
		uppercase: 'Ց',
		lowercase: 'ց',
		voicing: {
			en: `a breathy, aspirated "ts" — with a puff of air`,
			ru: 'придыхательное «ц», с лёгким выдохом'
		}
	},
	{
		id: 'hiwn',
		uppercase: 'Ւ',
		lowercase: 'ւ',
		voicing: {
			en: `rarely stands alone — mostly seen combined with Ո as "ու", sounding like the "oo" in "moon"`,
			ru: 'почти не встречается отдельно — обычно входит в сочетание «ու», которое звучит как «у» в слове «улица»'
		}
	},
	{
		id: 'piwr',
		uppercase: 'Փ',
		lowercase: 'փ',
		voicing: {
			en: `like the "p" in "pot" — a normal English "p"`,
			ru: 'придыхательное «п» — с лёгким выдохом воздуха'
		}
	},
	{
		id: 'keh',
		uppercase: 'Ք',
		lowercase: 'ք',
		voicing: {
			en: `like the "k" in "kit" — a normal English "k"`,
			ru: 'придыхательное «к» — с лёгким выдохом воздуха'
		}
	},
	{
		id: 'o',
		uppercase: 'Օ',
		lowercase: 'օ',
		voicing: {
			en: `like the "o" in "more" (used mostly at the start of a word)`,
			ru: 'как «о» в слове «дом» (обычно в начале слова)'
		}
	},
	{
		id: 'feh',
		uppercase: 'Ֆ',
		lowercase: 'ֆ',
		voicing: { en: `like the "f" in "fun"`, ru: 'как «ф» в слове «флаг»' }
	}
];
