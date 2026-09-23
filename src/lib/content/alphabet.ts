import type { Translated } from '$lib/i18n/types';

export interface AlphabetLetter {
	id: string;
	/** Omitted only for և, which has no capital glyph of its own. */
	uppercase?: string | undefined;
	lowercase: string;
	/** The quoted sound itself, e.g. `"t", aspirated` — short enough to stand
	 * alone on the drill's option buttons. See `fullVoicing()`. */
	voicingLabel: Translated;
	/** The explanation half; never shown without `voicingLabel`. */
	voicingDetail: Translated;
	/** A 1–3 character hint shown under the glyph in the letter grid. An
	 * apostrophe marks the aspirated half of a pair. A few genuinely
	 * confusable pairs share a tag; the voicing text disambiguates them. */
	transliteration: Translated;
	/** 1–2 ids into `words/entries.ts`'s `WORDS`. Two only for the letters whose
	 * sound depends on position (Ե, Ո), commonest pronunciation first. */
	exampleWordIds: readonly string[];
}

/** Joins the two halves for the learn step and letter sheet, which have room
 * for both. */
export function fullVoicing(letter: AlphabetLetter): Translated {
	return {
		en: `${letter.voicingLabel.en} — ${letter.voicingDetail.en}`,
		ru: `${letter.voicingLabel.ru} — ${letter.voicingDetail.ru}`
	};
}

/**
 * The 39 letters of the modern alphabet. Two entries are written with two
 * characters but taught as one letter: ՈՒ/ու, and և, which has no capital
 * glyph and so omits `uppercase` rather than fake one.
 *
 * Voicing text is a learner's approximation, not IPA, and compares each sound
 * only to the learner's own language.
 */
export const ALPHABET: readonly AlphabetLetter[] = [
	{
		id: 'ayb',
		uppercase: 'Ա',
		lowercase: 'ա',
		voicingLabel: { en: `"a"`, ru: '«а»' },
		voicingDetail: { en: `as in "father"`, ru: 'как в слове «мама»' },
		transliteration: { en: 'a', ru: 'а' },
		exampleWordIds: ['ayo']
	},
	{
		id: 'ben',
		uppercase: 'Բ',
		lowercase: 'բ',
		voicingLabel: { en: `"b"`, ru: '«б»' },
		voicingDetail: { en: `as in "boy"`, ru: 'как в слове «бок»' },
		transliteration: { en: 'b', ru: 'б' },
		exampleWordIds: ['barev']
	},
	{
		id: 'gim',
		uppercase: 'Գ',
		lowercase: 'գ',
		voicingLabel: { en: `"g"`, ru: '«г»' },
		voicingDetail: { en: `as in "go"`, ru: 'как в слове «год»' },
		transliteration: { en: 'g', ru: 'г' },
		exampleWordIds: ['gisher']
	},
	{
		id: 'da',
		uppercase: 'Դ',
		lowercase: 'դ',
		voicingLabel: { en: `"d"`, ru: '«д»' },
		voicingDetail: { en: `as in "dog"`, ru: 'как в слове «дом»' },
		transliteration: { en: 'd', ru: 'д' },
		exampleWordIds: ['dur']
	},
	{
		id: 'yech',
		uppercase: 'Ե',
		lowercase: 'ե',
		// "ye", not the commoner mid-word "e": Է is this letter's listed
		// confusable (alphabetConfusables.ts), so a `sound` question testing
		// both showed the same label twice.
		voicingLabel: { en: `"ye"`, ru: '«е»' },
		voicingDetail: {
			en: `at the start of a word (elsewhere, just "e", as in "bed")`,
			ru: 'в начале слова, как в слове «ель» (в остальных случаях — просто «э», как в слове «этот»)'
		},
		transliteration: { en: 'e', ru: 'е' },
		exampleWordIds: ['dzez', 'yereko']
	},
	{
		id: 'za',
		uppercase: 'Զ',
		lowercase: 'զ',
		voicingLabel: { en: `"z"`, ru: '«з»' },
		voicingDetail: { en: `as in "zoo"`, ru: 'как в слове «зима»' },
		transliteration: { en: 'z', ru: 'з' },
		exampleWordIds: ['zang']
	},
	{
		id: 'e',
		uppercase: 'Է',
		lowercase: 'է',
		voicingLabel: { en: `"e"`, ru: '«э»' },
		voicingDetail: {
			en: `as in "bed" (always; unlike Ե, never "ye")`,
			ru: 'как в слове «этот» (всегда; в отличие от Ե, никогда не «е»)'
		},
		// A macron keeps this apart from yech's plain "e", which it shares a
		// confusable pairing with.
		transliteration: { en: 'ē', ru: 'э' },
		exampleWordIds: ['ej']
	},
	{
		id: 'uht',
		uppercase: 'Ը',
		lowercase: 'ը',
		voicingLabel: { en: `"uh"`, ru: '«а», кратко и безударно' },
		voicingDetail: {
			en: `a quick, unstressed sound, like the "a" in "sofa"`,
			ru: 'как в конце слова «карта»'
		},
		// IPA schwa — precise, and distinct from ayb's plain "a"/«а».
		transliteration: { en: 'ə', ru: 'ə' },
		exampleWordIds: ['ynker']
	},
	{
		id: 'to',
		uppercase: 'Թ',
		lowercase: 'թ',
		voicingLabel: { en: `"t", aspirated`, ru: '«т», придыхательное' },
		voicingDetail: {
			en: `the normal English "t", like in "top"`,
			ru: 'с лёгким выдохом воздуха'
		},
		transliteration: { en: `t'`, ru: `т'` },
		exampleWordIds: ['tey']
	},
	{
		id: 'zhe',
		uppercase: 'Ժ',
		lowercase: 'ժ',
		voicingLabel: { en: `"zh"`, ru: '«ж»' },
		voicingDetail: { en: `as in "measure"`, ru: 'как в слове «жук»' },
		transliteration: { en: 'zh', ru: 'ж' },
		exampleWordIds: ['zham']
	},
	{
		id: 'ini',
		uppercase: 'Ի',
		lowercase: 'ի',
		voicingLabel: { en: `"ee"`, ru: '«и»' },
		voicingDetail: { en: `as in "see"`, ru: 'как в слове «мир»' },
		transliteration: { en: 'i', ru: 'и' },
		exampleWordIds: ['im']
	},
	{
		id: 'liwn',
		uppercase: 'Լ',
		lowercase: 'լ',
		voicingLabel: { en: `"l"`, ru: '«л»' },
		voicingDetail: { en: `as in "love"`, ru: 'как в слове «лампа»' },
		transliteration: { en: 'l', ru: 'л' },
		exampleWordIds: ['luys']
	},
	{
		id: 'xeh',
		uppercase: 'Խ',
		lowercase: 'խ',
		voicingLabel: { en: `"h", raspy`, ru: '«х», гортанное' },
		voicingDetail: {
			en: `a throat-clearing sound`,
			ru: 'как в слове «хлеб», но более резкое'
		},
		// The apostrophe separates this from ho (Հ) in RU, where both would
		// otherwise render as the identical 'х'.
		transliteration: { en: 'kh', ru: "х'" },
		exampleWordIds: ['khaghal']
	},
	{
		id: 'ca',
		uppercase: 'Ծ',
		lowercase: 'ծ',
		voicingLabel: { en: `"ts", unaspirated`, ru: '«ц», без придыхания' },
		voicingDetail: {
			en: `no puff of air, like in "cats"`,
			ru: 'твёрже и резче обычного русского «ц» (которое звучит с лёгким выдохом)'
		},
		transliteration: { en: 'ts', ru: 'ц' },
		exampleWordIds: ['tsaghik']
	},
	{
		id: 'ken',
		uppercase: 'Կ',
		lowercase: 'կ',
		voicingLabel: { en: `"k", unaspirated`, ru: '«к»' },
		voicingDetail: {
			en: `no puff of air`,
			ru: 'как обычное русское, без выдоха'
		},
		transliteration: { en: 'k', ru: 'к' },
		exampleWordIds: ['katu']
	},
	{
		id: 'ho',
		uppercase: 'Հ',
		lowercase: 'հ',
		voicingLabel: { en: `"h"`, ru: '«х», очень лёгкое' },
		voicingDetail: {
			en: `as in "house"`,
			ru: 'почти беззвучный выдох, без хрипа (в отличие от Խ)'
		},
		transliteration: { en: 'h', ru: 'х' },
		exampleWordIds: ['hats']
	},
	{
		id: 'ja',
		uppercase: 'Ձ',
		lowercase: 'ձ',
		voicingLabel: { en: `"dz"`, ru: '«дз»' },
		voicingDetail: { en: `as in "adze"`, ru: 'звонкое' },
		transliteration: { en: 'dz', ru: 'дз' },
		exampleWordIds: ['dzuk']
	},
	{
		id: 'ghad',
		uppercase: 'Ղ',
		lowercase: 'ղ',
		voicingLabel: { en: `"gh", gargled`, ru: '«гх», гортанное' },
		voicingDetail: {
			en: `a soft sound made in the back of the throat`,
			ru: 'мягкий звук, похожий на лёгкое полоскание горла'
		},
		transliteration: { en: 'gh', ru: 'гх' },
		exampleWordIds: ['aghjik']
	},
	{
		id: 'cheh',
		uppercase: 'Ճ',
		lowercase: 'ճ',
		voicingLabel: { en: `"ch", unaspirated`, ru: '«ч», без придыхания' },
		voicingDetail: {
			en: `no puff of air`,
			ru: 'твёрже и резче обычного русского «ч» (которое звучит с лёгким выдохом)'
		},
		transliteration: { en: 'ch', ru: 'ч' },
		exampleWordIds: ['chash']
	},
	{
		id: 'men',
		uppercase: 'Մ',
		lowercase: 'մ',
		voicingLabel: { en: `"m"`, ru: '«м»' },
		voicingDetail: { en: `as in "mom"`, ru: 'как в слове «мама»' },
		transliteration: { en: 'm', ru: 'м' },
		exampleWordIds: ['mayr']
	},
	{
		id: 'yi',
		uppercase: 'Յ',
		lowercase: 'յ',
		voicingLabel: { en: `"y"`, ru: '«й»' },
		voicingDetail: { en: `as in "yes"`, ru: 'как в слове «йод»' },
		transliteration: { en: 'y', ru: 'й' },
		exampleWordIds: ['yot']
	},
	{
		id: 'nu',
		uppercase: 'Ն',
		lowercase: 'ն',
		voicingLabel: { en: `"n"`, ru: '«н»' },
		voicingDetail: { en: `as in "no"`, ru: 'как в слове «нос»' },
		transliteration: { en: 'n', ru: 'н' },
		exampleWordIds: ['nor']
	},
	{
		id: 'sha',
		uppercase: 'Շ',
		lowercase: 'շ',
		voicingLabel: { en: `"sh"`, ru: '«ш»' },
		voicingDetail: { en: `as in "shop"`, ru: 'как в слове «шапка»' },
		transliteration: { en: 'sh', ru: 'ш' },
		exampleWordIds: ['shun']
	},
	{
		id: 'vo',
		uppercase: 'Ո',
		lowercase: 'ո',
		// "vo", not the commoner mid-word "o": Օ is this letter's listed
		// confusable (alphabetConfusables.ts), so a `sound` question testing
		// both showed the same label twice. The mid-word case is covered by
		// voicingDetail and its own example word.
		voicingLabel: { en: `"vo"`, ru: '«во»' },
		voicingDetail: {
			en: `at the start of a word (elsewhere, just "o", as in "more")`,
			ru: 'в начале слова (в остальных случаях — просто «о», как в слове «дом»)'
		},
		// Same reason: 'o'/«о» is o (Օ)'s own tag, and this is meant to be
		// glance-able in the letter grid.
		transliteration: { en: 'vo', ru: 'во' },
		exampleWordIds: ['mot', 'vonts']
	},
	{
		id: 'cha',
		uppercase: 'Չ',
		lowercase: 'չ',
		voicingLabel: { en: `"ch", aspirated`, ru: '«ч», придыхательное' },
		voicingDetail: {
			en: `the normal English "ch", like in "chair"`,
			ru: 'с лёгким выдохом воздуха'
		},
		transliteration: { en: `ch'`, ru: `ч'` },
		exampleWordIds: ['chors']
	},
	{
		id: 'peh',
		uppercase: 'Պ',
		lowercase: 'պ',
		voicingLabel: { en: `"p", unaspirated`, ru: '«п», без придыхания' },
		voicingDetail: {
			en: `no puff of air`,
			ru: 'твёрже и резче обычного русского «п»'
		},
		transliteration: { en: 'p', ru: 'п' },
		exampleWordIds: ['panir']
	},
	{
		id: 'jheh',
		uppercase: 'Ջ',
		lowercase: 'ջ',
		voicingLabel: { en: `"j"`, ru: '«дж»' },
		voicingDetail: { en: `as in "jazz"`, ru: 'как в слове «джаз»' },
		transliteration: { en: 'j', ru: 'дж' },
		exampleWordIds: ['jur']
	},
	{
		id: 'ra',
		uppercase: 'Ռ',
		lowercase: 'ռ',
		voicingLabel: { en: `"r", strongly rolled`, ru: '«р», раскатистое' },
		voicingDetail: {
			en: `flutter your tongue tip against the roof of your mouth`,
			ru: 'как русское протяжное «р-р-р», только более чёткое'
		},
		transliteration: { en: 'rr', ru: 'рр' },
		exampleWordIds: ['rusakan']
	},
	{
		id: 'seh',
		uppercase: 'Ս',
		lowercase: 'ս',
		voicingLabel: { en: `"s"`, ru: '«с»' },
		voicingDetail: { en: `as in "see"`, ru: 'как в слове «сон»' },
		transliteration: { en: 's', ru: 'с' },
		exampleWordIds: ['seghan']
	},
	{
		id: 'vev',
		uppercase: 'Վ',
		lowercase: 'վ',
		voicingLabel: { en: `"v"`, ru: '«в»' },
		voicingDetail: { en: `as in "van"`, ru: 'как в слове «вода»' },
		transliteration: { en: 'v', ru: 'в' },
		exampleWordIds: ['vat']
	},
	{
		id: 'tiwn',
		uppercase: 'Տ',
		lowercase: 'տ',
		voicingLabel: { en: `"t", unaspirated`, ru: '«т», без придыхания' },
		voicingDetail: {
			en: `no puff of air`,
			ru: 'твёрже и резче обычного русского «т»'
		},
		transliteration: { en: 't', ru: 'т' },
		exampleWordIds: ['tun']
	},
	{
		id: 'reh',
		uppercase: 'Ր',
		lowercase: 'ր',
		voicingLabel: { en: `"r", soft and quick`, ru: '«р», мягкое и лёгкое' },
		voicingDetail: {
			en: `like the "tt" in "butter" (American pronunciation)`,
			ru: 'как обычное русское «р» в быстрой речи'
		},
		transliteration: { en: 'r', ru: 'р' },
		exampleWordIds: ['sirel']
	},
	{
		id: 'tso',
		uppercase: 'Ց',
		lowercase: 'ց',
		voicingLabel: { en: `"ts", aspirated`, ru: '«ц», придыхательное' },
		voicingDetail: { en: `with a puff of air`, ru: 'с лёгким выдохом' },
		transliteration: { en: `ts'`, ru: `ц'` },
		exampleWordIds: ['tsurt']
	},
	{
		id: 'u',
		uppercase: 'ՈՒ',
		lowercase: 'ու',
		voicingLabel: { en: `"oo"`, ru: '«у»' },
		voicingDetail: {
			en: `as in "moon". Written with two characters, treated as a single letter.`,
			ru: 'как в слове «улица». Пишется двумя знаками, считается одной буквой.'
		},
		transliteration: { en: 'u', ru: 'у' },
		exampleWordIds: ['ush']
	},
	{
		id: 'piwr',
		uppercase: 'Փ',
		lowercase: 'փ',
		voicingLabel: { en: `"p", aspirated`, ru: '«п», придыхательное' },
		voicingDetail: {
			en: `the normal English "p", like in "pot"`,
			ru: 'с лёгким выдохом воздуха'
		},
		transliteration: { en: `p'`, ru: `п'` },
		exampleWordIds: ['pogh']
	},
	{
		id: 'keh',
		uppercase: 'Ք',
		lowercase: 'ք',
		voicingLabel: { en: `"k", aspirated`, ru: '«к», придыхательное' },
		voicingDetail: {
			en: `the normal English "k", like in "kit"`,
			ru: 'с лёгким выдохом воздуха'
		},
		transliteration: { en: `k'`, ru: `к'` },
		exampleWordIds: ['kuyr']
	},
	{
		id: 'o',
		uppercase: 'Օ',
		lowercase: 'օ',
		voicingLabel: { en: `"o"`, ru: '«о»' },
		voicingDetail: {
			en: `as in "more" (used mostly at the start of a word)`,
			ru: 'как в слове «дом» (обычно в начале слова)'
		},
		transliteration: { en: 'o', ru: 'о' },
		exampleWordIds: ['or']
	},
	{
		id: 'feh',
		uppercase: 'Ֆ',
		lowercase: 'ֆ',
		voicingLabel: { en: `"f"`, ru: '«ф»' },
		voicingDetail: { en: `as in "fun"`, ru: 'как в слове «флаг»' },
		transliteration: { en: 'f', ru: 'ф' },
		exampleWordIds: ['film']
	},
	{
		id: 'yev',
		lowercase: 'և',
		voicingLabel: { en: `"yev"`, ru: '«йев»' },
		voicingDetail: {
			en: `like "ye" in "yes" followed by "v".`,
			ru: '«е», как в начале слова «ель», плюс «в».'
		},
		transliteration: { en: 'yev', ru: 'ев' },
		exampleWordIds: ['yerevan']
	}
];
