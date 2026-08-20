import type { Translated } from '$lib/i18n/types';

export interface AlphabetLetter {
	id: string;
	/** Omitted for the one letter with no dedicated capital glyph of its
	 * own — see the և entry below. Every other entry has one. */
	uppercase?: string | undefined;
	lowercase: string;
	voicing: Translated;
	/** A tiny (1-3 character) phonetic hint shown under the glyph in the
	 * letter grid — not IPA, not the full `voicing` explanation, just enough
	 * to jog memory at a glance. An apostrophe marks the aspirated half of
	 * an aspirated/unaspirated pair (e.g. `to`'s "t'" vs `tiwn`'s "t"),
	 * mirroring how `voicing` explains the same distinction. Some pairs that
	 * are already genuinely confusable (see `alphabetConfusables.ts`) share
	 * a tag — `ho`/`xeh` both read "х" in Russian, which has no separate
	 * letter for either of Armenian's two "h" sounds; that's a real
	 * limitation of a 1-character hint, not a bug, and the full `voicing`
	 * text (and the sheet's audio) still disambiguates them properly. */
	transliteration: Translated;
	/** 1–2 ids into `words/entries.ts`'s `WORDS` registry — the "in a word"
	 * example(s) shown in the letter sheet. Almost always one; two only for
	 * the letters whose sound genuinely depends on position in a word (Ե:
	 * mid-word "eh" first, word-initial "yeh" second; Ո: mid-word "o" first,
	 * word-initial "vo" second) — order matters for those, so the sheet can
	 * show the more common/default pronunciation first. */
	exampleWordIds: readonly string[];
}

/**
 * The 39 letters of the modern Armenian alphabet (Ա–Ֆ, plus և). The
 * traditional 36 letters of the Mesrop Mashtots alphabet plus Օ/օ and Ֆ/ֆ,
 * added later, and two entries written with two characters but taught and
 * alphabetized as a single letter:
 * - ՈՒ/ու (the /u/ digraph) — modern Armenian has no standalone letter "ւ".
 * - և (the "yev" ligature) — has no dedicated uppercase glyph of its own, so
 *   its entry omits `uppercase` rather than fake one; real Armenian text
 *   capitalizes it as Ե+Վ (not the archaic Ե+Ւ) where needed, but that's a
 *   two-letter substitution, not a capital form of և itself.
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
		voicing: { en: `"a" — as in "father"`, ru: '«а» — как в слове «мама»' },
		transliteration: { en: 'a', ru: 'а' },
		exampleWordIds: ['ayo']
	},
	{
		id: 'ben',
		uppercase: 'Բ',
		lowercase: 'բ',
		voicing: { en: `"b" — as in "boy"`, ru: '«б» — как в слове «бок»' },
		transliteration: { en: 'b', ru: 'б' },
		exampleWordIds: ['barev']
	},
	{
		id: 'gim',
		uppercase: 'Գ',
		lowercase: 'գ',
		voicing: { en: `"g" — as in "go"`, ru: '«г» — как в слове «год»' },
		transliteration: { en: 'g', ru: 'г' },
		exampleWordIds: ['gisher']
	},
	{
		id: 'da',
		uppercase: 'Դ',
		lowercase: 'դ',
		voicing: { en: `"d" — as in "dog"`, ru: '«д» — как в слове «дом»' },
		transliteration: { en: 'd', ru: 'д' },
		exampleWordIds: ['dur']
	},
	{
		id: 'yech',
		uppercase: 'Ե',
		lowercase: 'ե',
		voicing: {
			en: `"e" — as in "bed" (or "ye" as in "yes" at the start of a word)`,
			ru: '«э» — как в слове «этот» (в начале слова — «е», как в слове «ель»)'
		},
		transliteration: { en: 'e', ru: 'е' },
		exampleWordIds: ['dzez', 'yereko']
	},
	{
		id: 'za',
		uppercase: 'Զ',
		lowercase: 'զ',
		voicing: { en: `"z" — as in "zoo"`, ru: '«з» — как в слове «зима»' },
		transliteration: { en: 'z', ru: 'з' },
		exampleWordIds: ['zang']
	},
	{
		id: 'e',
		uppercase: 'Է',
		lowercase: 'է',
		voicing: {
			en: `"e" — as in "bed" (always; unlike Ե, never "ye")`,
			ru: '«э» — как в слове «этот» (всегда; в отличие от Ե, никогда не «е»)'
		},
		// A macron distinguishes this from yech's plain "e" — the two letters
		// otherwise share a tag, which would defeat the point of a hint meant
		// to tell them apart at a glance.
		transliteration: { en: 'ē', ru: 'э' },
		exampleWordIds: ['ej']
	},
	{
		id: 'uht',
		uppercase: 'Ը',
		lowercase: 'ը',
		voicing: {
			en: `"uh" — a quick, unstressed sound, like the "a" in "sofa"`,
			ru: '«а», кратко и безударно — как в конце слова «карта»'
		},
		// IPA schwa — precise, and distinct from ayb's plain "a"/«а».
		transliteration: { en: 'ə', ru: 'ə' },
		exampleWordIds: ['ynker']
	},
	{
		id: 'to',
		uppercase: 'Թ',
		lowercase: 'թ',
		voicing: {
			en: `"t", aspirated — the normal English "t", like in "top"`,
			ru: '«т», придыхательное — с лёгким выдохом воздуха'
		},
		transliteration: { en: `t'`, ru: `т'` },
		exampleWordIds: ['tey']
	},
	{
		id: 'zhe',
		uppercase: 'Ժ',
		lowercase: 'ժ',
		voicing: {
			en: `"s" — as in "measure"`,
			ru: '«ж» — как в слове «жук»'
		},
		transliteration: { en: 'zh', ru: 'ж' },
		exampleWordIds: ['zham']
	},
	{
		id: 'ini',
		uppercase: 'Ի',
		lowercase: 'ի',
		voicing: { en: `"ee" — as in "see"`, ru: '«и» — как в слове «мир»' },
		transliteration: { en: 'i', ru: 'и' },
		exampleWordIds: ['im']
	},
	{
		id: 'liwn',
		uppercase: 'Լ',
		lowercase: 'լ',
		voicing: { en: `"l" — as in "love"`, ru: '«л» — как в слове «лампа»' },
		transliteration: { en: 'l', ru: 'л' },
		exampleWordIds: ['luys']
	},
	{
		id: 'xeh',
		uppercase: 'Խ',
		lowercase: 'խ',
		voicing: {
			en: `"h", raspy — a throat-clearing sound`,
			ru: '«х», гортанное — как в слове «хлеб», но более резкое'
		},
		transliteration: { en: 'kh', ru: 'х' },
		exampleWordIds: ['xaghal']
	},
	{
		id: 'ca',
		uppercase: 'Ծ',
		lowercase: 'ծ',
		voicing: {
			en: `"ts", unaspirated — no puff of air, like in "cats"`,
			ru: '«ц», без придыхания — твёрже и резче обычного русского «ц» (которое звучит с лёгким выдохом)'
		},
		transliteration: { en: 'ts', ru: 'ц' },
		exampleWordIds: ['tsaghik']
	},
	{
		id: 'ken',
		uppercase: 'Կ',
		lowercase: 'կ',
		voicing: {
			en: `"k", unaspirated — no puff of air`,
			ru: '«к» — как обычное русское, без выдоха'
		},
		transliteration: { en: 'k', ru: 'к' },
		exampleWordIds: ['katu']
	},
	{
		id: 'ho',
		uppercase: 'Հ',
		lowercase: 'հ',
		voicing: { en: `"h" — as in "house"`, ru: '«х», очень лёгкое — почти беззвучный выдох, без хрипа (в отличие от Խ)' },
		transliteration: { en: 'h', ru: 'х' },
		exampleWordIds: ['hats']
	},
	{
		id: 'ja',
		uppercase: 'Ձ',
		lowercase: 'ձ',
		voicing: { en: `"dz" — as in "adze"`, ru: '«дз» — звонкое' },
		transliteration: { en: 'dz', ru: 'дз' },
		exampleWordIds: ['dzuk']
	},
	{
		id: 'ghad',
		uppercase: 'Ղ',
		lowercase: 'ղ',
		voicing: {
			en: `"gh", gargled — a soft sound made in the back of the throat`,
			ru: '«гх», гортанное — мягкий звук, похожий на лёгкое полоскание горла'
		},
		transliteration: { en: 'gh', ru: 'гх' },
		exampleWordIds: ['aghjik']
	},
	{
		id: 'cheh',
		uppercase: 'Ճ',
		lowercase: 'ճ',
		voicing: {
			en: `"ch", unaspirated — no puff of air`,
			ru: '«ч», без придыхания — твёрже и резче обычного русского «ч» (которое звучит с лёгким выдохом)'
		},
		transliteration: { en: 'ch', ru: 'ч' },
		exampleWordIds: ['chash']
	},
	{
		id: 'men',
		uppercase: 'Մ',
		lowercase: 'մ',
		voicing: { en: `"m" — as in "mom"`, ru: '«м» — как в слове «мама»' },
		transliteration: { en: 'm', ru: 'м' },
		exampleWordIds: ['mayr']
	},
	{
		id: 'yi',
		uppercase: 'Յ',
		lowercase: 'յ',
		voicing: { en: `"y" — as in "yes"`, ru: '«й» — как в слове «йод»' },
		transliteration: { en: 'y', ru: 'й' },
		exampleWordIds: ['yot']
	},
	{
		id: 'nu',
		uppercase: 'Ն',
		lowercase: 'ն',
		voicing: { en: `"n" — as in "no"`, ru: '«н» — как в слове «нос»' },
		transliteration: { en: 'n', ru: 'н' },
		exampleWordIds: ['nor']
	},
	{
		id: 'sha',
		uppercase: 'Շ',
		lowercase: 'շ',
		voicing: { en: `"sh" — as in "shop"`, ru: '«ш» — как в слове «шапка»' },
		transliteration: { en: 'sh', ru: 'ш' },
		exampleWordIds: ['shun']
	},
	{
		id: 'vo',
		uppercase: 'Ո',
		lowercase: 'ո',
		voicing: {
			en: `"o" — as in "more" (or "vo" at the start of a word)`,
			ru: '«о» — как в слове «дом» (в начале слова — «во»)'
		},
		transliteration: { en: 'o', ru: 'о' },
		exampleWordIds: ['mot', 'vonts']
	},
	{
		id: 'cha',
		uppercase: 'Չ',
		lowercase: 'չ',
		voicing: {
			en: `"ch", aspirated — the normal English "ch", like in "chair"`,
			ru: '«ч», придыхательное — с лёгким выдохом воздуха'
		},
		transliteration: { en: `ch'`, ru: `ч'` },
		exampleWordIds: ['chors']
	},
	{
		id: 'peh',
		uppercase: 'Պ',
		lowercase: 'պ',
		voicing: {
			en: `"p", unaspirated — no puff of air`,
			ru: '«п», без придыхания — твёрже и резче обычного русского «п»'
		},
		transliteration: { en: 'p', ru: 'п' },
		exampleWordIds: ['panir']
	},
	{
		id: 'jheh',
		uppercase: 'Ջ',
		lowercase: 'ջ',
		voicing: { en: `"j" — as in "jazz"`, ru: '«дж» — как в слове «джаз»' },
		transliteration: { en: 'j', ru: 'дж' },
		exampleWordIds: ['jur']
	},
	{
		id: 'ra',
		uppercase: 'Ռ',
		lowercase: 'ռ',
		voicing: {
			en: `"r", strongly rolled — flutter your tongue tip against the roof of your mouth`,
			ru: '«р», раскатистое — как русское протяжное «р-р-р», только более чёткое'
		},
		transliteration: { en: 'rr', ru: 'рр' },
		exampleWordIds: ['rusakan']
	},
	{
		id: 'seh',
		uppercase: 'Ս',
		lowercase: 'ս',
		voicing: { en: `"s" — as in "see"`, ru: '«с» — как в слове «сон»' },
		transliteration: { en: 's', ru: 'с' },
		exampleWordIds: ['seghan']
	},
	{
		id: 'vev',
		uppercase: 'Վ',
		lowercase: 'վ',
		voicing: { en: `"v" — as in "van"`, ru: '«в» — как в слове «вода»' },
		transliteration: { en: 'v', ru: 'в' },
		exampleWordIds: ['vat']
	},
	{
		id: 'tiwn',
		uppercase: 'Տ',
		lowercase: 'տ',
		voicing: {
			en: `"t", unaspirated — no puff of air`,
			ru: '«т», без придыхания — твёрже и резче обычного русского «т»'
		},
		transliteration: { en: 't', ru: 'т' },
		exampleWordIds: ['tun']
	},
	{
		id: 'reh',
		uppercase: 'Ր',
		lowercase: 'ր',
		voicing: {
			en: `"r", soft and quick — like the "tt" in "butter" (American pronunciation)`,
			ru: '«р», мягкое и лёгкое — как обычное русское «р» в быстрой речи'
		},
		transliteration: { en: 'r', ru: 'р' },
		exampleWordIds: ['sirel']
	},
	{
		id: 'tso',
		uppercase: 'Ց',
		lowercase: 'ց',
		voicing: {
			en: `"ts", aspirated — with a puff of air`,
			ru: '«ц», придыхательное — с лёгким выдохом'
		},
		transliteration: { en: `ts'`, ru: `ц'` },
		exampleWordIds: ['tsurt']
	},
	{
		id: 'u',
		uppercase: 'ՈՒ',
		lowercase: 'ու',
		voicing: {
			en: `"oo" — as in "moon". Written with two characters, but treated as a single letter in the modern alphabet — there's no separate standalone "ւ".`,
			ru: '«у» — как в слове «улица». Пишется двумя знаками, но в современном алфавите считается одной буквой — отдельной буквы «ւ» не существует.'
		},
		transliteration: { en: 'u', ru: 'у' },
		exampleWordIds: ['ush']
	},
	{
		id: 'piwr',
		uppercase: 'Փ',
		lowercase: 'փ',
		voicing: {
			en: `"p", aspirated — the normal English "p", like in "pot"`,
			ru: '«п», придыхательное — с лёгким выдохом воздуха'
		},
		transliteration: { en: `p'`, ru: `п'` },
		exampleWordIds: ['pogh']
	},
	{
		id: 'keh',
		uppercase: 'Ք',
		lowercase: 'ք',
		voicing: {
			en: `"k", aspirated — the normal English "k", like in "kit"`,
			ru: '«к», придыхательное — с лёгким выдохом воздуха'
		},
		transliteration: { en: `k'`, ru: `к'` },
		exampleWordIds: ['kuyr']
	},
	{
		id: 'o',
		uppercase: 'Օ',
		lowercase: 'օ',
		voicing: {
			en: `"o" — as in "more" (used mostly at the start of a word)`,
			ru: '«о» — как в слове «дом» (обычно в начале слова)'
		},
		transliteration: { en: 'o', ru: 'о' },
		exampleWordIds: ['or']
	},
	{
		id: 'feh',
		uppercase: 'Ֆ',
		lowercase: 'ֆ',
		voicing: { en: `"f" — as in "fun"`, ru: '«ф» — как в слове «флаг»' },
		transliteration: { en: 'f', ru: 'ф' },
		exampleWordIds: ['film']
	},
	{
		id: 'yev',
		lowercase: 'և',
		voicing: {
			en: `"yev" — like "ye" in "yes" followed by "v".`,
			ru: '«йев» — «е», как в начале слова «ель», плюс «в».'
		},
		transliteration: { en: 'yev', ru: 'ев' },
		exampleWordIds: ['yerevan']
	}
];
