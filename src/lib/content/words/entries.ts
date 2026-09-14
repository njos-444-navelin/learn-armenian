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
 * A `note` here is the word's general explanation and shows on every
 * occurrence, in every dialogue. The rules for writing one — true anywhere,
 * describes the word rather than one use of it, never quotes a phrase,
 * only words the learner has — are in docs/DIALOGUES.md, "Word notes";
 * anything about one line goes on that token's `here` instead. The check
 * at the bottom of this file catches the most common slip. A word with a
 * formal/informal counterpart always says so: `register` for the tag, the
 * note to name the counterpart (see Շնորհակալություն / մերսի). And the
 * `en` and `ru` texts are written separately, each for its own reader —
 * never one translated from the other (see Եք: English has to explain the
 * polite plural "you"; Russian just says "like вы").
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
		note: {
			en: 'On its own it’s for friends. To a stranger, an elder or anyone serving you, say Բարև ձեզ — bare բարև can come across as rude.',
			ru: 'Просто բարև — для друзей. Незнакомому, старшему или тому, кто Вас обслуживает, говорят Բարև ձեզ — одно բարև может прозвучать грубо.'
		}
	},
	{
		id: 'bari',
		armenian: 'Բարի',
		translation: { en: 'Kind', ru: 'Добрый' },
		usage: {
			en: 'Often paired with a time of day to make a greeting: Բարի լույս, Բարի օր, Բարի իրիկուն, Բարի գիշեր.',
			ru: 'Часто образует приветствие вместе со временем суток: Բարի լույս, Բարի օր, Բարի իրիկուն, Բարի գիշեր.'
		}
	},
	// Ե is mid-word "eh" here — see `yech`'s exampleWordIds ordering in alphabet.ts.
	{
		id: 'dzez',
		armenian: 'Ձեզ',
		translation: { en: 'To you', ru: 'Вам' },
		note: {
			en: 'The dative case of Դուք — “you”, polite or plural.',
			ru: 'Дательный падеж от Դուք — «вы», вежливое или множественное.'
		}
	},
	// Neither word carries a `register`: the informal/formal split below is a
	// property of the two *greetings*, not of the words — Առավոտ by itself is
	// the neutral time-of-day word, and Լույս by itself just means light. And
	// it's `usage`, not `note`: it explains the greetings, which is what the
	// Greetings deck's cards need and exactly what a dialogue popover doesn't
	// — someone tapping Լույս in a line about light shouldn't be told about
	// Բարի լույս. A dialogue that says Բարի լույս adds a `here` on the token.
	{
		id: 'luys',
		armenian: 'Լույս',
		translation: { en: 'Light', ru: 'Свет' },
		usage: {
			en: 'Literally “light”, but in the greeting Բարի լույս it stands for “morning” — this is the everyday “good morning”. The more formal greeting uses Առավոտ.',
			ru: 'Буквально «свет», но в приветствии Բարի լույս означает «утро» — это обычное «доброе утро». Более формальное приветствие — с Առավոտ.'
		}
	},
	{
		id: 'aravot',
		armenian: 'Առավոտ',
		translation: { en: 'Morning', ru: 'Утро' },
		usage: {
			en: 'The time of day. In the greeting Բարի առավոտ it makes the more formal “good morning”; the everyday one is Բարի լույս.',
			ru: 'Время суток. В приветствии Բարի առավոտ — более формальное «доброе утро»; обычное — Բարի լույս.'
		}
	},
	{
		id: 'or',
		armenian: 'Օր',
		translation: { en: 'Day', ru: 'День' },
		usage: {
			en: 'The time of day; it also makes the greeting Բարի օր — “good day”.',
			ru: 'Время суток; в приветствии — Բարի օր, «добрый день».'
		}
	},
	{
		id: 'irikun',
		armenian: 'Իրիկուն',
		translation: { en: 'Evening', ru: 'Вечер' },
		register: 'informal',
		usage: {
			en: 'The time of day; it also makes the greeting Բարի իրիկուն — “good evening”.',
			ru: 'Время суток; в приветствии — Բարի իրիկուն, «добрый вечер».'
		}
	},
	// The two night phrases sit together here, since the contrast between
	// them is the point; Ուշ just points back at this entry.
	{
		id: 'gisher',
		armenian: 'Գիշեր',
		translation: { en: 'Night', ru: 'Ночь' },
		usage: {
			en: 'The time of day. Բարի գիշեր — “good night” — is a goodbye, not a greeting. To greet someone late at night: Բարի ուշ գիշեր.',
			ru: 'Время суток. Բարի գիշեր — «спокойной ночи» — это прощание, а не приветствие. Поприветствовать кого-то поздно ночью: Բարի ուշ գիշեր.'
		}
	},
	// Ու as a digraph is already correct as literally spelled — no ElevenLabs
	// respelling needed (see docs/VOCABULARY_AUDIO.md's own worked example).
	{
		id: 'ush',
		armenian: 'Ուշ',
		translation: { en: 'Late', ru: 'Поздно' },
		usage: {
			en: 'E.g. Բարի ուշ գիշեր — the late-night greeting (see Գիշեր).',
			ru: 'Например, Բարի ուշ գիշեր — приветствие поздней ночью (см. Գիշեր).'
		}
	},
	{
		id: 'hajogh',
		armenian: 'Հաջող',
		translation: { en: 'Bye!', ru: 'Пока!' },
		register: 'informal',
		note: {
			en: 'The casual goodbye — Հաջողություն clipped to its first half. The formal one is Ցտեսություն.',
			ru: 'Разговорное «пока» — сокращённое Հաջողություն. Формальное прощание — Ցտեսություն.'
		}
	},
	{
		id: 'hajoghutyun',
		armenian: 'Հաջողություն',
		translation: { en: 'Good luck', ru: 'Удачи' },
		register: 'informal',
		note: {
			en: 'Literally “success”, and the casual way to say goodbye — often shortened to the even more informal Հաջող. The formal goodbye is Ցտեսություն.',
			ru: 'Буквально «успех», и разговорный способ попрощаться — часто сокращается до совсем неформального Հաջող. Формальное прощание — Ցտեսություն.'
		}
	},
	{
		id: 'tstesutyun',
		armenian: 'Ցտեսություն',
		translation: { en: 'Goodbye', ru: 'До свидания' },
		register: 'formal',
		note: {
			en: 'The formal goodbye — literally “until seeing”. Among friends people say Հաջողություն or just Հաջող.',
			ru: 'Формальное прощание — по смыслу ровно «до свидания». Между своими говорят Հաջողություն или просто Հաջող.'
		}
	},
	{
		id: 'shnorhakalutyun',
		armenian: 'Շնորհակալություն',
		translation: { en: 'Thanks', ru: 'Спасибо' },
		register: 'formal',
		note: {
			en: 'The formal “thank you”. In everyday speech people just as often say մերսի, from the French merci.',
			ru: 'Формальное «спасибо». В разговорной речи не реже говорят մերսի — от французского merci.'
		}
	},
	{
		id: 'apres',
		armenian: 'Ապրես',
		translation: { en: 'Live', ru: 'Живи' },
		register: 'informal',
		note: {
			en: 'Imperative mood — literally “Do live!” — but used as praise: “well done!”, “good job!”, to one person you’re on informal terms with. The formal or plural one is Ապրեք.',
			ru: 'Повелительное наклонение — буквально «живи!», — но употребляется как похвала: «молодец!» тому, с кем на «ты». Для «Вы» — Ապրեք.'
		}
	},
	{
		id: 'aprek',
		armenian: 'Ապրեք',
		translation: { en: 'Live', ru: 'Живите' },
		register: 'formal',
		note: {
			en: 'Imperative mood, formal or plural — literally “Do live!” — but used as praise: “well done!”, to someone you address formally, or to several people. The informal one is Ապրես.',
			ru: 'Повелительное наклонение, форма «Вы» — буквально «живите!», — но употребляется как похвала: «молодец!» тому, с кем на «Вы», или «молодцы!» нескольким. Неформальная форма — Ապրես.'
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
		note: {
			en: 'Any kind of going — on foot or by car, bus or train, it’s the same verb. Not to be confused with Գնել (“to buy”) — differs by one letter.',
			ru: 'Любое перемещение — пешком или на транспорте: в отличие от русских «идти»/«ехать», глагол один. Не путать с Գնել («покупать») — отличается на одну букву.'
		}
	},
	{
		id: 'sovorel',
		armenian: 'Սովորել',
		translation: { en: 'To study', ru: 'Учиться' },
		note: {
			en: 'Also “to learn” (words, a language) and “to get used to” — one verb for all three.',
			ru: 'Также «учить» (слова, язык) и «привыкнуть» — один глагол на все три.'
		}
	},
	{
		id: 'ashkhatel',
		armenian: 'Աշխատել',
		translation: { en: 'To work', ru: 'Работать' },
		note: {
			en: 'Also “to earn” (փող աշխատել — to earn money) and, colloquially, “to try” (աշխատիր — try to).',
			ru: 'Также «зарабатывать» (փող աշխատել — зарабатывать деньги) и, в разговорной речи, «постараться» (աշխատիր — постарайся).'
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
		note: {
			en: 'Not to be confused with Գնալ (“to go”) — differs by one letter.',
			ru: 'Не путать с Գնալ («идти») — отличается на одну букву.'
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

	// --- Alphabet "in a word" examples not covered above ---
	{
		id: 'ayo',
		armenian: 'Այո',
		translation: { en: 'Yes', ru: 'Да' },
		register: 'formal',
		note: {
			en: 'The polite “yes” — to a stranger, an official, or in writing. Among friends it’s հա.',
			ru: 'Вежливое «да» — незнакомому, официальному лицу, на письме. Между своими — հա.'
		}
	},
	{ id: 'dur', armenian: 'Դուռ', translation: { en: 'Door', ru: 'Дверь' } },
	// Ե is word-initial "yeh" here, the second half of the yech/Ե pair.
	{ id: 'yereko', armenian: 'Երեկո', translation: { en: 'Evening', ru: 'Вечер' } },
	{ id: 'zang', armenian: 'Զանգ', translation: { en: 'Call', ru: 'Звонок' } },
	{ id: 'ej', armenian: 'Էջ', translation: { en: 'Page', ru: 'Страница' } },
	{ id: 'ynker', armenian: 'Ընկեր', translation: { en: 'Friend', ru: 'Друг' } },
	{ id: 'tey', armenian: 'Թեյ', translation: { en: 'Tea', ru: 'Чай' } },
	{ id: 'zham', armenian: 'Ժամ', translation: { en: 'Hour', ru: 'Час' } },
	{ id: 'im', armenian: 'Իմ', translation: { en: 'My', ru: 'Мой' } },
	{ id: 'tsaghik', armenian: 'Ծաղիկ', translation: { en: 'Flower', ru: 'Цветок' } },
	{ id: 'katu', armenian: 'Կատու', translation: { en: 'Cat', ru: 'Кот' } },
	{ id: 'hats', armenian: 'Հաց', translation: { en: 'Bread', ru: 'Хлеб' } },
	{ id: 'dzuk', armenian: 'Ձուկ', translation: { en: 'Fish', ru: 'Рыба' } },
	{ id: 'aghjik', armenian: 'Աղջիկ', translation: { en: 'Girl', ru: 'Девочка' } },
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
	{ id: 'kuyr', armenian: 'Քույր', translation: { en: 'Sister', ru: 'Сестра' } },
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
		note: {
			en: 'First-person pronoun, nominative. Often dropped — the auxiliary (եմ) already says who.',
			ru: 'Местоимение первого лица в именительном падеже. Часто опускается — вспомогательный глагол (եմ) и так показывает, о ком речь.'
		}
	},
	{
		id: 'em',
		armenian: 'Եմ',
		translation: { en: 'Am', ru: 'Есть (я)' },
		note: {
			en: 'The first-person auxiliary — it sits next to a participle and says who does it.',
			ru: 'Вспомогательный глагол первого лица — используется после причастия и показывает, кто совершает действие.'
		}
	},
	{
		id: 'yek',
		armenian: 'Եք',
		translation: { en: 'Are (you)', ru: 'Есть (Вы)' },
		note: {
			en: 'The plural "you" auxiliary — also the polite singular, for anyone you address formally.',
			ru: 'Вспомогательный глагол для «вы» — и множественного, и вежливого, как в русском.'
		}
	},
	{
		id: 'en',
		armenian: 'Են',
		translation: { en: 'Are (they)', ru: 'Есть (они)' },
		note: {
			en: 'The third-person plural auxiliary.',
			ru: 'Вспомогательный глагол третьего лица множественного числа.'
		}
	},
	{
		id: 'chem',
		armenian: 'Չեմ',
		translation: { en: 'Am not', ru: 'Не есть (я)' },
		note: {
			en: 'չ- + եմ. In a negative sentence the negation lands on the auxiliary, not the participle.',
			ru: 'չ- + եմ: отрицательная частица приклеивается к вспомогательному глаголу, а не к причастию.'
		}
	},
	{
		id: 'ays',
		armenian: 'Այս',
		translation: { en: 'This', ru: 'Этот' },
		note: {
			en: 'Near the speaker. Sits before the noun and never changes shape.',
			ru: 'Рядом с говорящим. Стоит перед существительным и не меняет форму.'
		}
	},
	{
		id: 'ayd',
		armenian: 'Այդ',
		translation: { en: 'That', ru: 'Тот' },
		note: {
			en: 'Near the person being spoken to — the second of Armenian’s three distances.',
			ru: 'Рядом с собеседником — вторая из трёх «дистанций» в армянском.'
		}
	},
	{
		id: 'sa',
		armenian: 'Սա',
		translation: { en: 'This one', ru: 'Это' },
		note: {
			en: 'այս used on its own, without a noun. Plural: սրանք, "these".',
			ru: 'այս без существительного. Множественное число: սրանք — «эти».'
		}
	},
	{
		id: 'da',
		armenian: 'Դա',
		translation: { en: 'That one', ru: 'То' },
		note: {
			en: 'այդ used on its own, without a noun. Plural: դրանք, "those".',
			ru: 'այդ без существительного. Множественное число: դրանք — «те».'
		}
	},
	{
		id: 'ayn',
		armenian: 'Այն',
		translation: { en: 'That (over there)', ru: 'Тот (вон там)' },
		note: {
			en: 'Away from both speakers — the third of Armenian’s three distances. On its own: նա, "that one".',
			ru: 'Далеко от обоих собеседников — третья из трёх «дистанций». Без существительного: նա — «то».'
		}
	},
	{
		id: 'e',
		armenian: 'Է',
		translation: { en: 'Is', ru: 'Есть (он, она, оно)' },
		note: {
			en: 'The third-person singular auxiliary — “is”.',
			ru: 'Глагол-связка «есть» для он/она/оно — в армянском, в отличие от русского, она не опускается.'
		}
	},
	{
		id: 'inch',
		armenian: 'Ինչ',
		translation: { en: 'What', ru: 'Что' },
		note: {
			en: 'The question word. In a question the ՞ rides inside it: ի՞նչ.',
			ru: 'Вопросительное слово. В вопросе знак ՞ стоит прямо внутри него: ի՞նչ.'
		}
	},
	{
		id: 'urish',
		armenian: 'Ուրիշ',
		translation: { en: 'Other', ru: 'Другой' },
		note: {
			en: 'Other, another.',
			ru: 'Другой, ещё один.'
		}
	},
	{
		id: 'ban',
		armenian: 'Բան',
		translation: { en: 'Thing', ru: 'Вещь' },
		note: {
			en: 'A “thing” in the vaguest sense — an object, a matter, a something. Armenians reach for it constantly, so you will meet it in many places and many meanings; think of it as a placeholder for whatever is being talked about.',
			ru: '«Вещь» в самом широком смысле — предмет, дело, нечто. Армяне говорят его постоянно, в самых разных значениях; это плейсхолдер для того, о чём идёт речь.'
		}
	},
	{
		id: 'el',
		armenian: 'Էլ',
		translation: { en: 'Else, more', ru: 'Ещё' },
		note: {
			en: 'Means “else” in a question and “too” after a noun.',
			ru: 'Означает «ещё» в вопросах и «тоже» после существительных.'
		}
	},
	{
		id: 'isk',
		armenian: 'Իսկ',
		translation: { en: 'And, as for', ru: 'А' },
		note: {
			en: 'Turns the conversation to something new — “and what about…”.',
			ru: 'Переводит разговор на другое — «а…?», «а как насчёт…?».'
		}
	},
	{
		id: 'te',
		armenian: 'Թե',
		translation: { en: 'Or', ru: 'Или' },
		note: {
			en: 'The “or” of a choice between two options.',
			ru: '«Или» при выборе из двух вариантов.'
		}
	},
	// և has no uppercase glyph of its own — capitalized as Ե+Վ, per the
	// alphabet's own note on the ligature.
	{
		id: 'u',
		armenian: 'Ու',
		translation: { en: 'And', ru: 'И' },
		note: {
			en: 'The spoken “and”, especially between two things that go together. Its more careful, written counterpart is և.',
			ru: 'Обычное «и» в устной речи, особенно между двумя существительными. В письменной и более аккуратной речи — և.'
		}
	},
	{
		id: 'yev',
		armenian: 'Եվ',
		translation: { en: 'And', ru: 'И' },
		note: {
			en: 'Written as the single ligature letter և in running text. The written and slightly more careful “and”; in speech you will hear ու just as often, especially between two things that go together.',
			ru: 'В тексте пишется одной буквой-лигатурой և. Письменное и чуть более аккуратное «и»; в устной речи не реже услышите ու, особенно между двумя существительными.'
		}
	},
	// Word-initial Ո: pronounced "voch" — needs the "Ո"->"Վ" prompt respelling
	// when its clip is generated (docs/VOCABULARY_AUDIO.md).
	{
		id: 'voch',
		armenian: 'Ոչ',
		translation: { en: 'No', ru: 'Нет' },
		register: 'formal',
		note: {
			en: 'The polite “no” — to a stranger, an official, or in writing. Among friends it’s չէ. Pronounced “voch” — word-initial Ո reads as “vo”.',
			ru: 'Вежливое «нет» — незнакомому, официальному лицу, на письме. Между своими — չէ. Произносится «воч» — Ո в начале слова читается как «во».'
		}
	},
	{ id: 'kat', armenian: 'Կաթ', translation: { en: 'Milk', ru: 'Молоко' } },
	{ id: 'dzu', armenian: 'Ձու', translation: { en: 'Egg', ru: 'Яйцо' } },
	{ id: 'mis', armenian: 'Միս', translation: { en: 'Meat', ru: 'Мясо' } },
	{ id: 'surch', armenian: 'Սուրճ', translation: { en: 'Coffee', ru: 'Кофе' } }
];

const wordById: ReadonlyMap<string, Word> = new Map(WORDS.map((word) => [word.id, word]));

// A library note shows on every occurrence of the word, in every dialogue,
// so it must be true of the word anywhere. Wording that only makes sense
// in one dialogue's situation belongs on that token's `here` instead
// (docs/DIALOGUES.md, "Word notes"). This catches the
// phrasings that slipped through in review — twice — before the rule was
// written down; it is a tripwire, not a definition of "general". A
// `usage` never reaches a dialogue at all, but it's held to the same
// wording — it's about the word in general too, just a different side
// of it — so the same tripwire runs over it.
const SITUATIONAL = [
	/\b(here|this time|this line|again|as before|the shopkeeper|the customer|the counter)\b/i,
	/(здесь|на этот раз|в этой реплике|снова|как раньше|продав|покупател|прилав)/i
];
for (const word of WORDS) {
	for (const [field, text] of [
		['note', word.note?.en],
		['note', word.note?.ru],
		['usage', word.usage?.en],
		['usage', word.usage?.ru]
	] as const) {
		if (text !== undefined && SITUATIONAL.some((pattern) => pattern.test(text))) {
			throw new Error(`word "${word.id}": library ${field} reads as dialogue-specific — move it to the token's \`here\`: ${text}`);
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
