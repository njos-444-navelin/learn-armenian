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
 * know. Every entry leads with the quoted equivalent sound itself (e.g.
 * `"t", aspirated — ...`), so a learner scanning the list sees the sound
 * first and the explanation second, not the other way around. For the
 * unaspirated/aspirated stop pairs, where one language's native
 * pronunciation already matches Armenian and the other doesn't (English
 * aspirates initial "k"/"p"/"t", Russian doesn't), the easy side just says
 * "like your normal X"; the other side gets a simple physical self-test (a
 * puff of air on the hand) instead of a foreign-word analogy — introduced
 * once in the study page's tip, then referenced tersely per letter. The two
 * letters whose sound depends on position in a word are called out
 * explicitly instead of collapsing both to one sound.
 */
export const ALPHABET: readonly AlphabetLetter[] = [
	{
		id: 'ayb',
		uppercase: 'Ա',
		lowercase: 'ա',
		voicing: { en: `"a" — as in "father"`, ru: '«а» — как в слове «мама»' }
	},
	{
		id: 'ben',
		uppercase: 'Բ',
		lowercase: 'բ',
		voicing: { en: `"b" — as in "boy"`, ru: '«б» — как в слове «бок»' }
	},
	{
		id: 'gim',
		uppercase: 'Գ',
		lowercase: 'գ',
		voicing: { en: `"g" — as in "go"`, ru: '«г» — как в слове «год»' }
	},
	{
		id: 'da',
		uppercase: 'Դ',
		lowercase: 'դ',
		voicing: { en: `"d" — as in "dog"`, ru: '«д» — как в слове «дом»' }
	},
	{
		id: 'yech',
		uppercase: 'Ե',
		lowercase: 'ե',
		voicing: {
			en: `"e" — as in "bed" (or "ye" as in "yes" at the start of a word)`,
			ru: '«э» — как в слове «этот» (в начале слова — «е», как в слове «ель»)'
		}
	},
	{
		id: 'za',
		uppercase: 'Զ',
		lowercase: 'զ',
		voicing: { en: `"z" — as in "zoo"`, ru: '«з» — как в слове «зима»' }
	},
	{
		id: 'e',
		uppercase: 'Է',
		lowercase: 'է',
		voicing: {
			en: `"e" — as in "bed" (always; unlike Ե, never "ye")`,
			ru: '«э» — как в слове «этот» (всегда; в отличие от Ե, никогда не «е»)'
		}
	},
	{
		id: 'uht',
		uppercase: 'Ը',
		lowercase: 'ը',
		voicing: {
			en: `"uh" — a quick, unstressed sound, like the "a" in "sofa"`,
			ru: '«а», кратко и безударно — как в конце слова «карта»'
		}
	},
	{
		id: 'to',
		uppercase: 'Թ',
		lowercase: 'թ',
		voicing: {
			en: `"t", aspirated — the normal English "t", like in "top"`,
			ru: '«т», придыхательное — с лёгким выдохом воздуха'
		}
	},
	{
		id: 'zhe',
		uppercase: 'Ժ',
		lowercase: 'ժ',
		voicing: {
			en: `"s" — as in "measure"`,
			ru: '«ж» — как в слове «жук»'
		}
	},
	{
		id: 'ini',
		uppercase: 'Ի',
		lowercase: 'ի',
		voicing: { en: `"ee" — as in "see"`, ru: '«и» — как в слове «мир»' }
	},
	{
		id: 'liwn',
		uppercase: 'Լ',
		lowercase: 'լ',
		voicing: { en: `"l" — as in "love"`, ru: '«л» — как в слове «лампа»' }
	},
	{
		id: 'xeh',
		uppercase: 'Խ',
		lowercase: 'խ',
		voicing: {
			en: `"h", raspy — a throat-clearing sound`,
			ru: '«х», гортанное — как в слове «хлеб», но более резкое'
		}
	},
	{
		id: 'ca',
		uppercase: 'Ծ',
		lowercase: 'ծ',
		voicing: {
			en: `"ts", unaspirated — no puff of air, like in "cats"`,
			ru: '«ц» — как обычное русское, без выдоха'
		}
	},
	{
		id: 'ken',
		uppercase: 'Կ',
		lowercase: 'կ',
		voicing: {
			en: `"k", unaspirated — no puff of air`,
			ru: '«к» — как обычное русское, без выдоха'
		}
	},
	{
		id: 'ho',
		uppercase: 'Հ',
		lowercase: 'հ',
		voicing: { en: `"h" — as in "house"`, ru: '«х», очень лёгкое — почти беззвучный выдох, мягче обычного русского «х»' }
	},
	{
		id: 'ja',
		uppercase: 'Ձ',
		lowercase: 'ձ',
		voicing: { en: `"dz" — as in "adze"`, ru: '«дз» — звонкое' }
	},
	{
		id: 'ghad',
		uppercase: 'Ղ',
		lowercase: 'ղ',
		voicing: {
			en: `"gh", gargled — a soft sound made in the back of the throat`,
			ru: '«гх», гортанное — мягкий звук, похожий на лёгкое полоскание горла'
		}
	},
	{
		id: 'cheh',
		uppercase: 'Ճ',
		lowercase: 'ճ',
		voicing: {
			en: `"ch", unaspirated — no puff of air`,
			ru: '«ч» — как обычное русское, без выдоха'
		}
	},
	{
		id: 'men',
		uppercase: 'Մ',
		lowercase: 'մ',
		voicing: { en: `"m" — as in "mom"`, ru: '«м» — как в слове «мама»' }
	},
	{
		id: 'yi',
		uppercase: 'Յ',
		lowercase: 'յ',
		voicing: { en: `"y" — as in "yes"`, ru: '«й» — как в слове «йод»' }
	},
	{
		id: 'nu',
		uppercase: 'Ն',
		lowercase: 'ն',
		voicing: { en: `"n" — as in "no"`, ru: '«н» — как в слове «нос»' }
	},
	{
		id: 'sha',
		uppercase: 'Շ',
		lowercase: 'շ',
		voicing: { en: `"sh" — as in "shop"`, ru: '«ш» — как в слове «шапка»' }
	},
	{
		id: 'vo',
		uppercase: 'Ո',
		lowercase: 'ո',
		voicing: {
			en: `"o" — as in "more" (or "vo" at the start of a word)`,
			ru: '«о» — как в слове «дом» (в начале слова — «во»)'
		}
	},
	{
		id: 'cha',
		uppercase: 'Չ',
		lowercase: 'չ',
		voicing: {
			en: `"ch", aspirated — the normal English "ch", like in "chair"`,
			ru: '«ч», придыхательное — с лёгким выдохом воздуха'
		}
	},
	{
		id: 'peh',
		uppercase: 'Պ',
		lowercase: 'պ',
		voicing: {
			en: `"p", unaspirated — no puff of air`,
			ru: '«п» — как обычное русское, без выдоха'
		}
	},
	{
		id: 'jheh',
		uppercase: 'Ջ',
		lowercase: 'ջ',
		voicing: { en: `"j" — as in "jazz"`, ru: '«дж» — как в слове «джаз»' }
	},
	{
		id: 'ra',
		uppercase: 'Ռ',
		lowercase: 'ռ',
		voicing: {
			en: `"r", strongly rolled — flutter your tongue tip against the roof of your mouth`,
			ru: '«р», раскатистое — как русское протяжное «р-р-р», только более чёткое'
		}
	},
	{
		id: 'seh',
		uppercase: 'Ս',
		lowercase: 'ս',
		voicing: { en: `"s" — as in "see"`, ru: '«с» — как в слове «сон»' }
	},
	{
		id: 'vev',
		uppercase: 'Վ',
		lowercase: 'վ',
		voicing: { en: `"v" — as in "van"`, ru: '«в» — как в слове «вода»' }
	},
	{
		id: 'tiwn',
		uppercase: 'Տ',
		lowercase: 'տ',
		voicing: {
			en: `"t", unaspirated — no puff of air`,
			ru: '«т» — как обычное русское, без выдоха'
		}
	},
	{
		id: 'reh',
		uppercase: 'Ր',
		lowercase: 'ր',
		voicing: {
			en: `"r", soft and quick — like the "tt" in "butter" (American pronunciation)`,
			ru: '«р», мягкое и лёгкое — как обычное русское «р» в быстрой речи'
		}
	},
	{
		id: 'tso',
		uppercase: 'Ց',
		lowercase: 'ց',
		voicing: {
			en: `"ts", aspirated — with a puff of air`,
			ru: '«ц», придыхательное — с лёгким выдохом'
		}
	},
	{
		id: 'hiwn',
		uppercase: 'Ւ',
		lowercase: 'ւ',
		voicing: {
			en: `"oo" — rarely stands alone; mostly seen combined with Ո as "ու", as in "moon"`,
			ru: '«у» — почти не встречается отдельно; обычно входит в сочетание «ու», которое звучит как в слове «улица»'
		}
	},
	{
		id: 'piwr',
		uppercase: 'Փ',
		lowercase: 'փ',
		voicing: {
			en: `"p", aspirated — the normal English "p", like in "pot"`,
			ru: '«п», придыхательное — с лёгким выдохом воздуха'
		}
	},
	{
		id: 'keh',
		uppercase: 'Ք',
		lowercase: 'ք',
		voicing: {
			en: `"k", aspirated — the normal English "k", like in "kit"`,
			ru: '«к», придыхательное — с лёгким выдохом воздуха'
		}
	},
	{
		id: 'o',
		uppercase: 'Օ',
		lowercase: 'օ',
		voicing: {
			en: `"o" — as in "more" (used mostly at the start of a word)`,
			ru: '«о» — как в слове «дом» (обычно в начале слова)'
		}
	},
	{
		id: 'feh',
		uppercase: 'Ֆ',
		lowercase: 'ֆ',
		voicing: { en: `"f" — as in "fun"`, ru: '«ф» — как в слове «флаг»' }
	}
];
