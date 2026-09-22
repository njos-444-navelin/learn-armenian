import type { Word } from './types';

/**
 * The app-wide word library — id -> Word, one definition and one audio clip
 * per word, shared by every feature that shows or plays a word:
 *
 * - vocabulary decks (`vocabulary/decks/*.ts`) are ordered lists of ids into
 *   this library, resolved by `loadDeckWords()`;
 * - the alphabet trainer's "in a word" examples reference ids via
 *   `AlphabetLetter.exampleWordIds`;
 * - dialogues link each spoken token to the library word it's a form of
 *   (`DialogueToken.wordId`), so tapping "հա՞ցը" in a transcript opens and
 *   plays `hats`, the same entry a vocabulary card for "bread" would use.
 *
 * A word that appears in several places (`barev` is a greetings-deck word,
 * the alphabet's example for Բ, and the first word of the bread-shop
 * dialogue) is defined here exactly once, with exactly one clip at
 * `static/audio/words/<id>.m4a` — never re-declared or re-recorded per
 * feature. When a feature needs a word this file doesn't have yet, add it
 * here (and generate its clip — see docs/VOCABULARY_AUDIO.md), then
 * reference it by id from the feature.
 *
 * Not code-split: at this scale (low hundreds of short entries) one shared
 * module is a few KB gzipped, far cheaper than the duplication a per-feature
 * split would reintroduce. If the library ever grows large enough to matter,
 * split it into lazily-loaded shards keyed by id here — behind `getWord()` —
 * rather than letting features grow private copies again.
 *
 * A word can carry two comments, named for where they show. `global`
 * shows on every occurrence — the card, the trainer and every dialogue
 * popover — so it says what the word *is* (its case, its mood, an extra
 * sense, a look-alike to keep apart) and never quotes a phrase. `cardOnly`
 * shows on the card and in the trainer only: when and to whom the word is
 * said, the greeting it makes, where its mark sits. The rules for writing
 * either — one short sentence, lowercase examples, no restating the
 * translation, no naming a formal/informal counterpart (`register` is the
 * tag for that) — are in docs/DIALOGUES.md, "Word comments"; anything
 * about one line goes on that token's `here` instead. The check at the
 * bottom of this file catches the most common slip. And the `en` and `ru`
 * texts are written separately, each for its own reader — never one
 * translated from the other (see Եք: English has to explain the polite
 * plural "you"; Russian just says "like вы").
 *
 * Sections below are only for reading convenience; ids are a single flat
 * namespace and must be unique across the whole file (checked at module
 * load — see the bottom of this file).
 */
export const WORDS: readonly Word[] = [
	// --- Greetings (vocabulary deck `greetings`; several double as alphabet examples) ---
	{
		id: 'barev',
		armenian: 'Բարև',
		translation: { en: 'Hi', ru: 'Привет' },
		cardOnly: {
			en: 'Informal greeting. To a stranger, an elder or anyone serving you, it’s better to say բարև ձեզ.',
			ru: 'Неформальное приветствие. Незнакомому, старшему или тому, кто Вас обслуживает, лучше говорить բարև ձեզ.'
		}
	},
	{
		id: 'bari',
		armenian: 'Բարի',
		translation: { en: 'Kind', ru: 'Добрый' },
		cardOnly: {
			en: 'Often paired with a time of day to make a greeting, e.g. բարի լույս — “good morning”.',
			ru: 'Помимо прочего, используется в приветствиях вместе со временем суток, например, բարի լույս — «доброе утро».'
		}
	},
	// Ե is mid-word "eh" here — see `yech`'s exampleWordIds ordering in alphabet.ts.
	{
		id: 'dzez',
		armenian: 'Ձեզ',
		translation: { en: 'To you', ru: 'Вам' },
		global: {
			en: 'The dative case of դուք — “you”, polite or plural.',
			ru: 'Дательный падеж от դուք — «вы», вежливое или множественное.'
		}
	},
	// Neither word carries a `register`: the informal/formal split below is a
	// property of the two *greetings*, not of the words — Առավոտ by itself is
	// the neutral time-of-day word, and Լույս by itself just means light. And
	// it's `cardOnly`, not `global`: it explains the greetings, which is what
	// the Greetings deck's cards need and exactly what a dialogue popover doesn't
	// — someone tapping Լույս in a line about light shouldn't be told about
	// Բարի լույս. A dialogue that says Բարի լույս adds a `here` on the token.
	{
		id: 'luys',
		armenian: 'Լույս',
		translation: { en: 'Light', ru: 'Свет' },
		cardOnly: {
			en: 'In the informal greeting բարի լույս it stands for “morning”.',
			ru: 'В неформальном приветствии բարի լույս означает «утро».'
		}
	},
	{
		id: 'aravot',
		armenian: 'Առավոտ',
		translation: { en: 'Morning', ru: 'Утро' },
		cardOnly: {
			en: 'E.g. բարի առավոտ — a formal “good morning”.',
			ru: 'Например, բարի առավոտ — формальное «доброе утро».'
		}
	},
	{
		id: 'or',
		armenian: 'Օր',
		translation: { en: 'Day', ru: 'День' },
		cardOnly: {
			en: 'E.g. բարի օր — a formal “good day”.',
			ru: 'Например, բարի օր — формальное «добрый день».'
		}
	},
	{
		id: 'irikun',
		armenian: 'Իրիկուն',
		translation: { en: 'Evening', ru: 'Вечер' },
		register: 'informal',
		cardOnly: {
			en: 'E.g. բարի իրիկուն — an informal “good evening”.',
			ru: 'Например, բարի իրիկուն — неформальное «добрый вечер».'
		}
	},
	// The two night phrases sit together here, since the contrast between
	// them is the point.
	{
		id: 'gisher',
		armenian: 'Գիշեր',
		translation: { en: 'Night', ru: 'Ночь' },
		cardOnly: {
			en: 'Բարի գիշեր — “good night” — is a goodbye, not a greeting.',
			ru: 'Բարի գիշեր — «спокойной ночи» — это прощание, а не приветствие.'
		}
	},
	// Ու as a digraph is already correct as literally spelled — no ElevenLabs
	// respelling needed (see docs/VOCABULARY_AUDIO.md's own worked example).
	{
		id: 'ush',
		armenian: 'Ուշ',
		translation: { en: 'Late', ru: 'Поздно' },
		cardOnly: {
			en: 'E.g. բարի ուշ գիշեր — literally “good late night” — the late-night greeting.',
			ru: 'Например, բարի ուշ գիշեր — буквально «доброй поздней ночи» — ночное приветствие.'
		}
	},
	{
		id: 'hajogh',
		armenian: 'Հաջող',
		translation: { en: 'Bye!', ru: 'Пока!' },
		register: 'informal',
		global: {
			en: 'The casual goodbye — հաջողություն clipped to its first half.',
			ru: 'Разговорное «пока» — сокращённое հաջողություն.'
		}
	},
	{
		id: 'hajoghutyun',
		armenian: 'Հաջողություն',
		translation: { en: 'Good luck', ru: 'Удачи' },
		register: 'informal',
		global: {
			en: 'Literally “success”, and the casual way to say goodbye.',
			ru: 'Буквально «успех» — и неформальный способ попрощаться.'
		}
	},
	{
		id: 'tstesutyun',
		armenian: 'Ցտեսություն',
		translation: { en: 'Goodbye', ru: 'До свидания' },
		register: 'formal',
		global: {
			en: 'The formal goodbye — literally “until seeing”.',
			ru: 'Формальное прощание — буквально «до свидания».'
		}
	},
	{
		id: 'shnorhakalutyun',
		armenian: 'Շնորհակալություն',
		translation: { en: 'Thanks', ru: 'Спасибо' },
		register: 'formal'
	},
	{
		id: 'apres',
		armenian: 'Ապրես',
		translation: { en: 'Live', ru: 'Живи' },
		register: 'informal',
		global: {
			en: 'Imperative mood — literally “do live!” — but used as praise: “well done!”, “good job!”, to one person you’re on informal terms with.',
			ru: 'Повелительное наклонение — буквально «живи!», — но употребляется как похвала: «молодец!» тому, с кем на «ты».'
		}
	},
	{
		id: 'aprek',
		armenian: 'Ապրեք',
		translation: { en: 'Live', ru: 'Живите' },
		register: 'formal',
		global: {
			en: 'Imperative mood, formal or plural — literally “do live!” — but used as praise: “well done!”, to someone you address formally, or to several people.',
			ru: 'Повелительное наклонение, форма «вы» — буквально «живите!», — но употребляется как похвала: «молодец!» тому, с кем на «вы», или «молодцы!» нескольким.'
		}
	},
	// Ո is word-initial "vo" here, the second half of the vo/Ո pair in
	// alphabet.ts — same word VOCABULARY_AUDIO.md itself uses to document the
	// ElevenLabs "Ո"->"Վ" prompt-respelling workaround.
	{ id: 'vonts', armenian: 'Ոնց', translation: { en: 'How?', ru: 'Как?' }, register: 'informal' },
	{
		id: 'inchpes',
		armenian: 'Ինչպես',
		translation: { en: 'How?', ru: 'Как?' },
		register: 'formal'
	},
	{ id: 'lav', armenian: 'Լավ', translation: { en: 'Good', ru: 'Хорошо' } },
	{ id: 'vat', armenian: 'Վատ', translation: { en: 'Bad', ru: 'Плохо' } },
	{ id: 'normal', armenian: 'Նորմալ', translation: { en: 'Normal', ru: 'Нормально' } },

	// --- Essential verbs (vocabulary deck `verbs-1`) ---
	{ id: 'aprel', armenian: 'Ապրել', translation: { en: 'To live', ru: 'Жить' } },
	// Also the alphabet's example for Խ.
	{
		id: 'khaghal',
		armenian: 'Խաղալ',
		translation: { en: 'To play (a game)', ru: 'Играть (в игру)' }
	},
	{
		id: 'gnal',
		armenian: 'Գնալ',
		translation: { en: 'To go', ru: 'Идти' },
		global: {
			en: 'Any kind of going — on foot or by car, bus or train, etc. Not to be confused with գնել (“to buy”) — differs by one letter.',
			ru: 'Любой способ передвижения — пешком или на транспорте. Не путать с գնել («покупать») — отличается на одну букву.'
		}
	},
	{
		id: 'sovorel',
		armenian: 'Սովորել',
		translation: { en: 'To study', ru: 'Учиться' },
		global: {
			en: 'Also means “to learn” (words, a language) and “to get used to”.',
			ru: 'Также означает «учить» (слова, язык) и «привыкнуть».'
		}
	},
	{
		id: 'ashkhatel',
		armenian: 'Աշխատել',
		translation: { en: 'To work', ru: 'Работать' },
		global: {
			en: 'Also means “to earn” and, colloquially, “to try”.',
			ru: 'Также означает «зарабатывать» и, в разговорной речи, «постараться».'
		}
	},
	{ id: 'sirel', armenian: 'Սիրել', translation: { en: 'To love', ru: 'Любить' } },
	// The bread-shop dialogue's "ուզում եմ" ("I want") is this verb's present
	// participle — the dialogue token links back here.
	{
		id: 'uzel',
		armenian: 'Ուզել',
		translation: { en: 'To want', ru: 'Хотеть' }
	},
	{ id: 'utel', armenian: 'Ուտել', translation: { en: 'To eat', ru: 'Кушать' } },
	{ id: 'kardal', armenian: 'Կարդալ', translation: { en: 'To read', ru: 'Читать' } },
	{ id: 'grel', armenian: 'Գրել', translation: { en: 'To write', ru: 'Писать' } },
	{
		id: 'gnel',
		armenian: 'Գնել',
		translation: { en: 'To buy', ru: 'Покупать' },
		global: {
			en: 'Not to be confused with գնալ (“to go”) — differs by one letter.',
			ru: 'Не путать с գնալ («идти») — отличается на одну букву.'
		}
	},
	{ id: 'haskanal', armenian: 'Հասկանալ', translation: { en: 'To understand', ru: 'Понимать' } },
	{ id: 'asel', armenian: 'Ասել', translation: { en: 'To say', ru: 'Говорить' } },
	{ id: 'khosel', armenian: 'Խոսել', translation: { en: 'To speak', ru: 'Разговаривать' } },
	{ id: 'lsel', armenian: 'Լսել', translation: { en: 'To listen', ru: 'Слушать' } },
	{ id: 'nayel', armenian: 'Նայել', translation: { en: 'To watch', ru: 'Смотреть' } },
	{ id: 'tesnel', armenian: 'Տեսնել', translation: { en: 'To see', ru: 'Видеть' } },
	{ id: 'anel', armenian: 'Անել', translation: { en: 'To do', ru: 'Делать' } },
	{ id: 'linel', armenian: 'Լինել', translation: { en: 'To be', ru: 'Быть' } },
	{ id: 'khndrel', armenian: 'Խնդրել', translation: { en: 'To ask for', ru: 'Просить' } },

	// --- Family (vocabulary deck `family`) ---
	// The four -իկ words each explain the suffix on their own card: a card is
	// read alone in the trainer, so the repetition is deliberate (compare the
	// "E.g." time-of-day set in Greetings).
	{
		id: 'mayrik',
		armenian: 'Մայրիկ',
		translation: { en: 'Mum', ru: 'Мама' },
		global: {
			en: 'The ending -իկ makes the word մայր soft and affectionate.',
			ru: 'Суффикс -իկ делает слово մայր ласковым.'
		}
	},
	{
		id: 'hayrik',
		armenian: 'Հայրիկ',
		translation: { en: 'Dad', ru: 'Папа' },
		global: {
			en: 'The ending -իկ makes the word հայր soft and affectionate.',
			ru: 'Суффикс -իկ делает слово հայր ласковым.'
		}
	},
	{
		id: 'papik',
		armenian: 'Պապիկ',
		translation: { en: 'Grandpa', ru: 'Дедушка' },
		global: {
			en: 'The ending -իկ makes the word պապ soft and affectionate.',
			ru: 'Суффикс -իկ делает слово պապ ласковым. Не путать с պապա — это «папа».'
		},
		cardOnly: {
			en: 'Also used for any elderly man.',
			ru: 'Как и в русском, так называют и любого пожилого мужчину.'
		}
	},
	{
		id: 'tatik',
		armenian: 'Տատիկ',
		translation: { en: 'Grandma', ru: 'Бабушка' },
		global: {
			en: 'The ending -իկ makes the word տատ soft and affectionate.',
			ru: 'Суффикс -իկ делает слово տատ ласковым.'
		},
		cardOnly: {
			en: 'Also used for any elderly woman.',
			ru: 'Как и в русском, так называют и любую пожилую женщину.'
		}
	},
	// Քույր, Աղջիկ and Ընկեր are already in the library as alphabet examples
	// (next section) — the deck reuses those ids; their comments live there.
	{
		id: 'akhper',
		armenian: 'Ախպեր',
		translation: { en: 'Brother', ru: 'Брат' },
		register: 'informal',
		global: {
			en: 'Also a friendly way to address any man.',
			ru: 'Также дружеская форма обращения к любому мужчине.'
		}
	},
	{
		id: 'kin',
		armenian: 'Կին',
		translation: { en: 'Woman', ru: 'Женщина' },
		global: {
			en: 'Also means “wife”.',
			ru: 'Также значит «жена».'
		}
	},
	{ id: 'amusin', armenian: 'Ամուսին', translation: { en: 'Husband', ru: 'Муж' } },
	{
		id: 'mard',
		armenian: 'Մարդ',
		translation: { en: 'Person', ru: 'Человек' },
		global: {
			en: 'Any human being. In everyday speech, more often specifically a man.',
			ru: 'Человек любого пола. В быту чаще именно мужчина.'
		}
	},
	{
		id: 'tgha',
		armenian: 'Տղա',
		translation: { en: 'Boy', ru: 'Мальчик' },
		global: {
			en: 'Also means “son” and, loosely, “guy”.',
			ru: 'Также значит «сын» и иногда «парень» в более широком смысле.'
		}
	},
	{
		id: 'tghamard',
		armenian: 'Տղամարդ',
		translation: { en: 'Man', ru: 'Мужчина' },
		global: {
			en: 'Yes, literally “boy-person”.',
			ru: 'Да, буквально «мальчик-человек».'
		}
	},
	// Colloquial contractions of մորաքույր, հորաքույր and հորեղբայր — hence
	// the informal tag on these three; the comments don't name the long forms
	// (a new word explained by another new word). Քեռի is the standard word
	// and gets no tag.
	{
		id: 'morkur',
		armenian: 'Մորքուր',
		translation: { en: 'Aunt (mother’s sister)', ru: 'Тётя (сестра матери)' },
		register: 'informal',
		global: {
			en: 'Literally “mother’s sister”, said as one word.',
			ru: 'Буквально «сестра матери», в одно слово.'
		}
	},
	{
		id: 'horkur',
		armenian: 'Հորքուր',
		translation: { en: 'Aunt (father’s sister)', ru: 'Тётя (сестра отца)' },
		register: 'informal',
		global: {
			en: 'Literally “father’s sister”, said as one word.',
			ru: 'Буквально «сестра отца», в одно слово.'
		}
	},
	{
		id: 'hopar',
		armenian: 'Հոպար',
		translation: { en: 'Uncle (father’s brother)', ru: 'Дядя (брат отца)' },
		register: 'informal',
		global: {
			en: 'Literally “father’s brother”, worn down to two syllables.',
			ru: 'Буквально «брат отца», сократившееся до двух слогов.'
		}
	},
	{
		id: 'keri',
		armenian: 'Քեռի',
		translation: { en: 'Uncle (mother’s brother)', ru: 'Дядя (брат матери)' },
		cardOnly: {
			en: 'Also a friendly way to address an older man.',
			ru: 'Также обращение к незнакомому мужчине постарше.'
		}
	},
	{ id: 'yerekha', armenian: 'Երեխա', translation: { en: 'Child', ru: 'Ребёнок' } },
	{
		id: 'harazat',
		armenian: 'Հարազատ',
		translation: { en: 'One’s own', ru: 'Родной' },
		global: {
			en: 'Related by blood, or as close as if you were. Also “native”, of a town or a language.',
			ru: 'Как русское «родной» во всех смыслах.'
		}
	},
	{
		id: 'barekam',
		armenian: 'Բարեկամ',
		translation: { en: 'Relative', ru: 'Родственник' },
		global: {
			en: 'Literally “well-wisher”. In literary Armenian it means “friend”.',
			ru: 'Буквально «доброжелатель». В литературном языке означает «друг».'
		}
	},

	// --- Pronouns (vocabulary deck `pronouns`) ---
	// The personal pronouns and the demonstratives used on their own. Ես, Այս,
	// Այդ, Սա, Դա and Այն were already here as dialogue words (below) and the
	// deck reuses them. The lesson lists Նա and Նրանք twice — once as "he /
	// she" and "they", once as "that one" and "those" — because the same word
	// does both jobs; here each is one entry with both senses in its comment.
	{
		id: 'du',
		armenian: 'Դու',
		translation: { en: 'You (one person)', ru: 'Ты' },
		global: {
			en: 'To one person you are on first-name terms with.',
			ru: 'Как и в русском, одному человеку, с которым Вы на «ты».'
		}
	},
	{
		id: 'na',
		armenian: 'Նա',
		translation: { en: 'He, she', ru: 'Он, она' },
		global: {
			en: 'One word for “he” and “she”: the pronoun has no gender. Also means “that one”, away from both speakers.',
			ru: 'Одно слово для «он» и «она»: у местоимения нет рода. Также значит «тот», «та» — вдали от обоих собеседников.'
		}
	},
	{ id: 'menk', armenian: 'Մենք', translation: { en: 'We', ru: 'Мы' } },
	{
		id: 'duk',
		armenian: 'Դուք',
		translation: { en: 'You (plural or polite)', ru: 'Вы' },
		global: {
			en: 'To several people, or politely to one — a stranger, an elder, anyone serving you.',
			ru: 'Как и в русском, нескольким людям или вежливо одному.'
		}
	},
	{
		id: 'nrank',
		armenian: 'Նրանք',
		translation: { en: 'They', ru: 'Они' },
		global: {
			en: 'The plural of նա. Also means “those ones”, away from both speakers.',
			ru: 'Множественное число от նա. Также значит «те» — вдали от обоих собеседников.'
		}
	},
	{
		id: 'srank',
		armenian: 'Սրանք',
		translation: { en: 'These ones', ru: 'Эти' },
		global: {
			en: 'The plural of սա — near the speaker, used on its own without a noun.',
			ru: 'Множественное число от սա — рядом с говорящим, без существительного.'
		}
	},
	{
		id: 'drank',
		armenian: 'Դրանք',
		translation: { en: 'Those ones', ru: 'Те' },
		global: {
			en: 'The plural of դա — near the person being spoken to, used on its own without a noun.',
			ru: 'Множественное число от դա — рядом с собеседником, без существительного.'
		}
	},

	// --- Food (vocabulary deck `food`) ---
	// Everyday groceries, from a lesson. Nine of the twenty — Հաց, Կաթ, Պանիր,
	// Ձու, Միս, Ձուկ, Ջուր, Թեյ and Սուրճ — were already here as alphabet
	// examples and bread-shop words, and the deck reuses those ids.
	{ id: 'karag', armenian: 'Կարագ', translation: { en: 'Butter', ru: 'Сливочное масло' } },
	// The two kinds of meat are two-word phrases — the only multi-word entries
	// in the library so far — hence the hyphenated ids.
	{
		id: 'tavari-mis',
		armenian: 'Տավարի միս',
		translation: { en: 'Beef', ru: 'Говядина' },
		global: {
			en: 'Literally “cattle’s meat” — the -ի on տավար is the genitive ending.',
			ru: 'Буквально «мясо скота»: -ի на слове տավար — окончание родительного падежа.'
		}
	},
	{
		id: 'khozi-mis',
		armenian: 'Խոզի միս',
		translation: { en: 'Pork', ru: 'Свинина' },
		global: {
			en: 'Literally “pig’s meat” — the -ի on խոզ is the genitive ending.',
			ru: 'Буквально «мясо свиньи»: -ի на слове խոզ — окончание родительного падежа.'
		}
	},
	{
		id: 'hav',
		armenian: 'Հավ',
		translation: { en: 'Chicken', ru: 'Курица' },
		global: {
			en: 'As in English, both the bird and the meat.',
			ru: 'Как и в русском, и птица, и мясо.'
		}
	},
	{ id: 'brindz', armenian: 'Բրինձ', translation: { en: 'Rice', ru: 'Рис' } },
	{ id: 'alyur', armenian: 'Ալյուր', translation: { en: 'Flour', ru: 'Мука' } },
	{
		id: 'shakaravaz',
		armenian: 'Շաքարավազ',
		translation: { en: 'Sugar', ru: 'Сахар' },
		global: {
			en: 'Literally “sugar sand” — the granulated kind.',
			ru: 'Как и в русском, буквально «сахарный песок».'
		},
		cardOnly: {
			en: 'In everyday speech you will often hear the Russian պեսոկ — “sand” on its own.',
			ru: 'В быту часто говорят просто պեսոկ.'
		}
	},
	{ id: 'agh', armenian: 'Աղ', translation: { en: 'Salt', ru: 'Соль' } },
	{ id: 'dzet', armenian: 'Ձեթ', translation: { en: 'Vegetable oil', ru: 'Растительное масло' } },
	{
		id: 'ttvaser',
		armenian: 'Թթվասեր',
		translation: { en: 'Sour cream', ru: 'Сметана' },
		global: {
			en: 'Literally “sour cream”: թթու is “sour”, սեր is “cream”.',
			ru: 'Буквально «кислые сливки»: թթու — «кислый», սեր — «сливки».'
		},
		cardOnly: {
			en: 'In everyday speech you will often hear the Russian սմետանա.',
			ru: 'В быту часто говорят սմետանա.'
		}
	},
	{
		id: 'katnashor',
		armenian: 'Կաթնաշոռ',
		translation: { en: 'Cottage cheese', ru: 'Творог' },
		global: {
			en: 'Built on the word կաթ — “milk”.',
			ru: 'Образовано от слова կաթ — «молоко».'
		},
		cardOnly: {
			en: 'In everyday speech you will often hear the Russian տվարոգ.',
			ru: 'В быту часто говорят տվարոգ.'
		}
	},

	// --- Alphabet "in a word" examples not covered above ---
	{
		id: 'ayo',
		armenian: 'Այո',
		translation: { en: 'Yes', ru: 'Да' },
		register: 'formal',
		cardOnly: {
			en: 'Usually said to a stranger or an official, or used in writing.',
			ru: 'Обычно говорится незнакомому или официальному лицу, а также используется на письме.'
		}
	},
	{ id: 'dur', armenian: 'Դուռ', translation: { en: 'Door', ru: 'Дверь' } },
	// Ե is word-initial "yeh" here, the second half of the yech/Ե pair.
	{
		id: 'yereko',
		armenian: 'Երեկո',
		translation: { en: 'Evening', ru: 'Вечер' },
		register: 'formal'
	},
	{ id: 'zang', armenian: 'Զանգ', translation: { en: 'Call', ru: 'Звонок' } },
	{ id: 'ej', armenian: 'Էջ', translation: { en: 'Page', ru: 'Страница' } },
	// Also in the `family` deck.
	{
		id: 'ynker',
		armenian: 'Ընկեր',
		translation: { en: 'Friend', ru: 'Друг' }
	},
	{
		id: 'tey',
		armenian: 'Թեյ',
		translation: { en: 'Tea', ru: 'Чай' },
		cardOnly: {
			en: 'In everyday speech you will often hear the Russian չայ.',
			ru: 'В быту часто говорят չայ.'
		}
	},
	{ id: 'zham', armenian: 'Ժամ', translation: { en: 'Hour', ru: 'Час' } },
	{ id: 'im', armenian: 'Իմ', translation: { en: 'My', ru: 'Мой' } },
	{ id: 'tsaghik', armenian: 'Ծաղիկ', translation: { en: 'Flower', ru: 'Цветок' } },
	{ id: 'katu', armenian: 'Կատու', translation: { en: 'Cat', ru: 'Кот' } },
	// Also in the `food` deck.
	{
		id: 'hats',
		armenian: 'Հաց',
		translation: { en: 'Bread', ru: 'Хлеб' },
		global: {
			en: 'May also mean food or a meal in general.',
			ru: 'Может значить и еду, трапезу вообще.'
		}
	},
	{ id: 'dzuk', armenian: 'Ձուկ', translation: { en: 'Fish', ru: 'Рыба' } },
	// Also in the `family` deck.
	{
		id: 'aghjik',
		armenian: 'Աղջիկ',
		translation: { en: 'Girl', ru: 'Девочка' },
		global: {
			en: 'Also means “daughter” and, loosely, “young woman”.',
			ru: 'Также значит «дочь» и иногда «девушка» в более широком смысле.'
		}
	},
	{ id: 'chash', armenian: 'Ճաշ', translation: { en: 'Meal', ru: 'Обед' } },
	{ id: 'mayr', armenian: 'Մայր', translation: { en: 'Mother', ru: 'Мать' } },
	{ id: 'yot', armenian: 'Յոթ', translation: { en: 'Seven', ru: 'Семь' } },
	{ id: 'nor', armenian: 'Նոր', translation: { en: 'New', ru: 'Новый' } },
	{ id: 'shun', armenian: 'Շուն', translation: { en: 'Dog', ru: 'Собака' } },
	// Ո is mid-word plain "o" here — see `vo`'s exampleWordIds ordering.
	{ id: 'mot', armenian: 'Մոտ', translation: { en: 'Near', ru: 'Рядом' } },
	{ id: 'chors', armenian: 'Չորս', translation: { en: 'Four', ru: 'Четыре' } },
	{ id: 'panir', armenian: 'Պանիր', translation: { en: 'Cheese', ru: 'Сыр' } },
	{ id: 'jur', armenian: 'Ջուր', translation: { en: 'Water', ru: 'Вода' } },
	// Was "Ռուս" ("a Russian person"), chosen to sidestep the loanword-stress
	// ambiguity "Ռադիո" had — but the TTS voice consistently generated
	// "Ռուսական" ("Russian", adjective, e.g. "Russian cuisine") instead, no
	// matter how the prompt was adjusted. Renamed to match what's actually
	// spoken rather than keep fighting the model — same principle as the
	// kov->mot swap above, but the fix this time is "adopt the word the
	// audio already says" instead of "pick a different word from scratch".
	{ id: 'rusakan', armenian: 'Ռուսական', translation: { en: 'Russian', ru: 'Русский' } },
	{ id: 'seghan', armenian: 'Սեղան', translation: { en: 'Table', ru: 'Стол' } },
	{ id: 'tun', armenian: 'Տուն', translation: { en: 'House', ru: 'Дом' } },
	{ id: 'tsurt', armenian: 'Ցուրտ', translation: { en: 'Cold', ru: 'Холодно' } },
	{ id: 'pogh', armenian: 'Փող', translation: { en: 'Money', ru: 'Деньги' } },
	// Also in the `family` deck.
	{
		id: 'kuyr',
		armenian: 'Քույր',
		translation: { en: 'Sister', ru: 'Сестра' },
		cardOnly: {
			en: 'Քույրիկ, with the ending -իկ, is the affectionate form. It is also a friendly way to address a young woman you don’t know.',
			ru: 'Քույրիկ, с суффиксом -իկ, — ласковая форма. Так же дружелюбно обращаются к незнакомой девушке.'
		}
	},
	{ id: 'film', armenian: 'Ֆիլմ', translation: { en: 'Film', ru: 'Фильм' } },
	// Capital city name — a natural, already-capitalized way to show և
	// mid-word, sidestepping the ligature's own missing-uppercase quirk
	// (see AlphabetLetter's `yev` entry) rather than forcing one.
	{ id: 'yerevan', armenian: 'Երևան', translation: { en: 'Yerevan', ru: 'Ереван' } },

	// --- Dialogue words: function words and nouns first met in the bread-shop
	// dialogue (`dialogues/dialogues/bread-shop.ts`). No clips yet — their
	// audio is pending generation (see docs/DIALOGUES.md). ---
	// Word-initial Ե reads "yes" — hence the id, even though this is the
	// pronoun "I", not the answer "yes" (that's `ayo`).
	{
		id: 'yes',
		armenian: 'Ես',
		translation: { en: 'I', ru: 'Я' },
		global: {
			en: 'First-person pronoun, nominative. Often dropped — the auxiliary (եմ) already says who.',
			ru: 'Местоимение первого лица в именительном падеже. Часто опускается — вспомогательный глагол (եմ) и так показывает, о ком речь.'
		}
	},
	{
		id: 'em',
		armenian: 'Եմ',
		translation: { en: 'Am', ru: 'Есть (я)' },
		global: {
			en: 'The first-person auxiliary — it sits next to a participle and says who does it.',
			ru: 'Вспомогательный глагол первого лица — используется после причастия и показывает, кто совершает действие.'
		}
	},
	{
		id: 'yek',
		armenian: 'Եք',
		translation: { en: 'Are (you)', ru: 'Есть (Вы)' },
		global: {
			en: 'The plural “you” auxiliary — also the polite singular, for anyone you address formally.',
			ru: 'Вспомогательный глагол для «вы» — и множественного, и вежливого, как в русском.'
		}
	},
	{
		id: 'en',
		armenian: 'Են',
		translation: { en: 'Are (they)', ru: 'Есть (они)' },
		global: {
			en: 'The third-person plural auxiliary.',
			ru: 'Вспомогательный глагол третьего лица множественного числа.'
		}
	},
	{
		id: 'chem',
		armenian: 'Չեմ',
		translation: { en: 'Am not', ru: 'Не есть (я)' },
		global: {
			en: 'Չ- before եմ: in a negative sentence the negation lands on the auxiliary, not the participle.',
			ru: 'Չ- перед եմ: отрицательная частица добавляется к вспомогательному глаголу, а не к причастию.'
		}
	},
	{
		id: 'ays',
		armenian: 'Այս',
		translation: { en: 'This', ru: 'Этот' },
		global: {
			en: 'Near the speaker. Sits before the noun and never changes shape.',
			ru: 'Рядом с говорящим. Стоит перед существительным и не меняет форму.'
		}
	},
	{
		id: 'ayd',
		armenian: 'Այդ',
		translation: { en: 'That', ru: 'Тот' },
		global: {
			en: 'Near the person being spoken to — the second of Armenian’s three distances.',
			ru: 'Рядом с собеседником — вторая из трёх «дистанций» в армянском.'
		}
	},
	{
		id: 'sa',
		armenian: 'Սա',
		translation: { en: 'This one', ru: 'Это' },
		global: {
			en: 'Այս used on its own, without a noun.',
			ru: 'Այս без существительного.'
		}
	},
	{
		id: 'da',
		armenian: 'Դա',
		translation: { en: 'That one', ru: 'То' },
		global: {
			en: 'Այդ used on its own, without a noun.',
			ru: 'Այդ без существительного.'
		}
	},
	{
		id: 'ayn',
		armenian: 'Այն',
		translation: { en: 'That (over there)', ru: 'Тот (вон там)' },
		global: {
			en: 'Away from both speakers — the third of Armenian’s three distances.',
			ru: 'Далеко от обоих собеседников — третья из трёх «дистанций».'
		}
	},
	{
		id: 'e',
		armenian: 'Է',
		translation: { en: 'Is', ru: 'Есть (он, она, оно)' },
		global: {
			en: 'The third-person singular auxiliary — “is”.',
			ru: 'Глагол-связка «есть» для он/она/оно — в армянском, в отличие от русского, она не опускается.'
		}
	},
	{
		id: 'inch',
		armenian: 'Ինչ',
		translation: { en: 'What', ru: 'Что' },
		cardOnly: {
			en: 'In a question the ՞ rides inside it: ի՞նչ.',
			ru: 'В вопросе знак ՞ стоит прямо внутри него: ի՞նչ.'
		}
	},
	{
		id: 'urish',
		armenian: 'Ուրիշ',
		translation: { en: 'Other', ru: 'Другой' },
		global: {
			en: 'Indicates something not among what’s been offered, or simply not the same. Also carries the sense of “someone else’s”.',
			ru: 'Указывает на что-то, чего нет среди предложенных вариантов, или просто на что-то совершенно другое. Также имеет значение «чужой», «принадлежащий другому».'
		}
	},
	{
		id: 'ban',
		armenian: 'Բան',
		translation: { en: 'Thing', ru: 'Вещь' },
		global: {
			en: 'A “thing” in the vaguest sense — an object, a matter, a something. Armenians reach for it constantly, so you will meet it in many places and many meanings; think of it as a placeholder for whatever is being talked about.',
			ru: '«Вещь» в самом широком смысле — предмет, дело, нечто. Армяне говорят его постоянно, в самых разных значениях; это плейсхолдер для того, о чём идёт речь.'
		}
	},
	{
		id: 'el',
		armenian: 'Էլ',
		translation: { en: 'Else, more', ru: 'Ещё' },
		global: {
			en: 'Means “else” in a question and “too” after a noun.',
			ru: 'Означает «ещё» в вопросах и «тоже» после существительных.'
		}
	},
	{
		id: 'isk',
		armenian: 'Իսկ',
		translation: { en: 'And, as for', ru: 'А' },
		global: {
			en: 'Turns the conversation to something new — “and what about…”.',
			ru: 'Переводит разговор на что-то ещё — «а…?», «а как насчёт…?».'
		}
	},
	{
		id: 'te',
		armenian: 'Թե',
		translation: { en: 'Or', ru: 'Или' },
		global: {
			en: 'The “or” of a choice between different options.',
			ru: '«Или» при выборе из разных вариантов.'
		}
	},
	// և has no uppercase glyph of its own — capitalized as Ե+Վ, per the
	// alphabet's own note on the ligature.
	{
		id: 'u',
		armenian: 'Ու',
		translation: { en: 'And', ru: 'И' },
		global: {
			en: 'The spoken “and”, especially between two things that go together.',
			ru: 'Обычное «и» в устной речи, особенно между двумя существительными.'
		}
	},
	{
		id: 'yev',
		armenian: 'Եվ',
		translation: { en: 'And', ru: 'И' },
		global: {
			en: 'Written as the single ligature letter և in running text. The written and slightly more careful “and”.',
			ru: 'В тексте пишется одной буквой-лигатурой և. Письменное и чуть более аккуратное «и».'
		}
	},
	// Word-initial Ո: pronounced "voch" — needs the "Ո"->"Վ" prompt respelling
	// when its clip is generated (docs/VOCABULARY_AUDIO.md).
	{
		id: 'voch',
		armenian: 'Ոչ',
		translation: { en: 'No', ru: 'Нет' },
		register: 'formal',
		global: {
			en: 'The polite “no” — to a stranger, an official, or in writing.',
			ru: 'Вежливое «нет» — незнакомому, официальному лицу, на письме.'
		}
	},
	{ id: 'kat', armenian: 'Կաթ', translation: { en: 'Milk', ru: 'Молоко' } },
	{ id: 'dzu', armenian: 'Ձու', translation: { en: 'Egg', ru: 'Яйцо' } },
	{ id: 'mis', armenian: 'Միս', translation: { en: 'Meat', ru: 'Мясо' } },
	{
		id: 'surch',
		armenian: 'Սուրճ',
		translation: { en: 'Coffee', ru: 'Кофе' },
		cardOnly: {
			en: 'In everyday speech you will often hear the Russian կոֆե.',
			ru: 'В быту часто говорят կոֆե.'
		}
	}
];

const wordById: ReadonlyMap<string, Word> = new Map(WORDS.map((word) => [word.id, word]));

// A global comment shows on every occurrence of the word, in every
// dialogue, so it must be true of the word anywhere. Wording that only
// makes sense in one dialogue's situation belongs on that token's `here`
// instead (docs/DIALOGUES.md, "Word comments"). This catches the
// phrasings that slipped through in review — twice — before the rule was
// written down; it is a tripwire, not a definition of "general". A
// card-only comment never reaches a dialogue at all, but it's held to the
// same wording — it's about the word in general too, just a different
// side of it — so the same tripwire runs over it.
const SITUATIONAL = [
	/\b(here|this time|this line|again|as before|the shopkeeper|the customer|the counter)\b/i,
	/(здесь|на этот раз|в этой реплике|снова|как раньше|продав|покупател|прилав)/i
];
// A comment reads like a sentence in a book (docs/DIALOGUES.md, "Word
// comments", rules 6 and 13): whatever opens it is capitalized, an Armenian
// word included — "Մայր — “mother” — with…", not "մայր — …" — and it's set
// in ordinary punctuation, never arrows, plus signs or emoji ("տղա and
// մարդ", not "տղա + մարդ"; "as mother becomes mum", not "mother → mum").
// Both slipped into the first draft of the family deck.
const LOWERCASE_OPENING = /^[ա-ֆև]/u;
const NOT_BOOK_TYPOGRAPHY = /[→←↔⇒⇐+*<>=_|~^#@&\\]|\p{Extended_Pictographic}/u;
// A Latin letter inside a Cyrillic word («женщинy» with a Latin y) renders
// identically and is invisible in review; it happened once.
const MIXED_SCRIPT = /[а-яё][a-z]|[a-z][а-яё]/iu;
for (const word of WORDS) {
	for (const [field, text] of [
		['global', word.global?.en],
		['global', word.global?.ru],
		['cardOnly', word.cardOnly?.en],
		['cardOnly', word.cardOnly?.ru]
	] as const) {
		if (text === undefined) continue;
		if (SITUATIONAL.some((pattern) => pattern.test(text))) {
			throw new Error(`word "${word.id}": library ${field} reads as dialogue-specific — move it to the token's \`here\`: ${text}`);
		}
		if (LOWERCASE_OPENING.test(text)) {
			throw new Error(`word "${word.id}": library ${field} opens with a lowercase Armenian word — a comment is a sentence, capitalize its first word: ${text}`);
		}
		if (NOT_BOOK_TYPOGRAPHY.test(text)) {
			throw new Error(`word "${word.id}": library ${field} uses a symbol a book wouldn't (arrow, plus sign, emoji…) — write it out in words: ${text}`);
		}
		if (MIXED_SCRIPT.test(text)) {
			throw new Error(`word "${word.id}": library ${field} has a Latin letter inside a Cyrillic word — a look-alike typo: ${text}`);
		}
	}
}

// Ids are a single flat namespace — a duplicate would make one feature's
// word silently shadow another's. Cheap to check once at module load, and
// far easier to catch here than as a wrong translation on screen.
if (wordById.size !== WORDS.length) {
	const seen = new Set<string>();
	const duplicates = WORDS.map((word) => word.id).filter((id) => seen.size === seen.add(id).size);
	throw new Error(`words/entries.ts: duplicate word id(s): ${duplicates.join(', ')}`);
}

export function getWord(id: string): Word | undefined {
	return wordById.get(id);
}

/**
 * Resolves a list of ids in order, dropping any that don't exist — callers
 * that must know about a bad id (e.g. `loadDeckWords()`) check the lengths.
 */
export function getWords(ids: readonly string[]): Word[] {
	return ids.map(getWord).filter((word): word is Word => word !== undefined);
}
