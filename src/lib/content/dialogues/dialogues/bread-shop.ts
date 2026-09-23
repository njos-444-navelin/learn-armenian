import type { DialogueLine, DialogueRule, DialogueToken } from '../types';

/**
 * Dialogue 1 — Dmitrii buys bread, milk, cheese, eggs, fish and coffee from
 * Tereza. Built around the three demonstratives (այս · այդ · այն) and the
 * definite -ը. Loaded lazily by `loadDialogue.ts`; never import it directly.
 *
 * Every token links to the shared word library by id, so its popover plays the
 * clip that word already has. A `gloss`/`here` is only set where the in-context
 * meaning differs from the library entry.
 */

/** Shorthand for the many tokens that are just a form of a library word. The
 * fourth argument is the occurrence's own `here` remark — a general point
 * belongs on the entry in words/entries.ts. */
function tok(
	text: string,
	wordId: string,
	gloss?: { en: string; ru: string },
	here?: { en: string; ru: string }
): DialogueToken {
	return { text, wordId, gloss, here };
}

const DEFINITE_ITEM = {
	en: 'Definite -ը: the specific one on the counter.',
	ru: 'С артиклем -ը — та самая рыба, что на прилавке.'
};

const INDEFINITE = {
	en: 'No article: an unspecified amount.',
	ru: 'Без артикля — продукт вообще, не какое-то количество.'
};

const DEFINITE = {
	en: 'Definite -ը: the specific loaf under discussion.',
	ru: 'С определённым артиклем -ը — конкретный хлеб, о котором говорит продавец.'
};

export const RULE: DialogueRule = {
	title: { en: 'One rule first: այս · այդ · այն', ru: 'Сначала одно правило: այս · այդ · այն' },
	summary: {
		en: 'Three distances of “this”. 40 seconds.',
		ru: 'Три «расстояния» слова «этот». 40 секунд.'
	},
	intro: {
		en: 'Armenian splits “this/that” three ways by who is near the thing: այս near me, այդ near you, այն away from both of us.',
		ru: 'В армянском «этот/тот» делится на три слова в зависимости от того, кто ближе к предмету: այս — рядом со мной, այդ — рядом с Вами, այն — далеко от нас обоих.'
	},
	examples: [
		{
			armenian: 'այս հացը',
			translation: { en: 'this bread', ru: 'этот хлеб' },
			hint: { en: 'by me', ru: 'у меня' }
		},
		{
			armenian: 'այդ հացը',
			translation: { en: 'that bread', ru: 'тот хлеб' },
			hint: { en: 'by you', ru: 'у Вас' }
		},
		{
			armenian: 'այն հացը',
			translation: { en: 'that bread', ru: 'тот хлеб' },
			hint: { en: 'over there', ru: 'вон там' }
		}
	],
	outro: {
		en: 'Used on their own, without a noun, they become սա · դա · նա (one thing) and սրանք · դրանք · նրանք (several).',
		ru: 'Без существительного они превращаются в սա · դա · նա (один предмет) и սրանք · դրանք · նրանք (несколько).'
	},
	aside: {
		en: 'In writing you will meet the question mark inside the word: հա՞ցը. The ՞ sits on the syllable the voice lifts, not at the end of the sentence.',
		ru: 'На письме вопросительный знак стоит внутри слова: հա՞ցը. Знак ՞ ставится на тот слог, на котором поднимается интонация, а не в конце предложения.'
	}
};

export const LINES: readonly DialogueLine[] = [
	{
		speaker: 'dmitrii',
		translation: { en: 'Hello. I want bread.', ru: 'Здравствуйте. Я хочу хлеб.' },
		tokens: [
			tok(
				'Բարև',
				'barev',
				{ en: 'hello', ru: 'здравствуйте' },
				{
					en: 'A shop, so the polite two-word form.',
					ru: 'Это магазин — поэтому вежливая форма из двух слов.'
				}
			),
			tok(
				'ձեզ։',
				'dzez',
				{ en: '(to) you', ru: '(вам)' },
				{
					en: 'Բարև ձեզ is literally “hello to you” — this ձեզ is what makes the greeting polite.',
					ru: 'Բարև ձեզ — буквально «привет вам»; именно это ձեզ делает приветствие вежливым.'
				}
			),
			tok('Ես', 'yes'),
			// On this first ուզում rather than the library entry: it's how every
			// verb works, so it isn't about Ուզել. The later remarks on ուզում
			// are follow-ons to this one.
			tok(
				'ուզում',
				'uzel',
				{ en: 'want', ru: 'хочу' },
				{
					en: 'A verb in speech: the participle ուզում (“wanting”) plus an auxiliary — here եմ — that says who wants. Every verb works this way.',
					ru: 'Глагол в речи: причастие ուզում («хотящий») плюс вспомогательный глагол — здесь եմ, — который показывает, кто именно хочет. Так устроен любой глагол.'
				}
			),
			tok('եմ', 'em', { en: 'am', ru: '(я)' }),
			tok(
				'հաց։',
				'hats',
				{ en: 'bread', ru: 'хлеб' },
				{
					en: 'No article, so an unspecified amount: “some bread”.',
					ru: 'Без артикля — просто «хлеба», без уточнения, какого и сколько.'
				}
			)
		]
	},
	{
		speaker: 'tereza',
		translation: { en: 'Hello. This bread?', ru: 'Здравствуйте. Этот хлеб?' },
		tokens: [
			tok(
				'Բարև',
				'barev',
				{ en: 'hello', ru: 'здравствуйте' },
				{
					en: 'Returned as given: polite for polite.',
					ru: 'Отвечают тем же: вежливо на вежливое.'
				}
			),
			tok('ձեզ։', 'dzez', { en: '(to) you', ru: '(вам)' }),
			tok('Այս', 'ays', { en: 'this', ru: 'этот' }),
			tok(
				'հա՞ցը։',
				'hats',
				{ en: 'the bread', ru: 'хлеб (этот)' },
				{
					en: 'Definite -ը. The ՞ marks the syllable the voice lifts for a question.',
					ru: 'С определённым артиклем -ը — конкретный хлеб, о котором говорит продавец. Знак ՞ отмечает слог, на котором поднимается интонация.'
				}
			)
		]
	},
	{
		speaker: 'dmitrii',
		translation: { en: 'Yes, this bread.', ru: 'Да, этот хлеб.' },
		tokens: [
			tok(
				'Այո՛,',
				'ayo',
				{ en: 'yes', ru: 'да' },
				{
					en: 'The ՛ is the emphasis mark: a firm, decided yes.',
					ru: 'Знак ՛ — знак подчёркивания: твёрдое, решительное «да».'
				}
			),
			tok(
				'այս',
				'ays',
				{ en: 'this', ru: 'этот' },
				{
					en: 'Near me: the bread I am pointing at.',
					ru: 'Рядом со мной: хлеб, на который я показываю.'
				}
			),
			tok('հացը։', 'hats', { en: 'the bread', ru: 'хлеб (этот)' }, DEFINITE)
		]
	},
	{
		speaker: 'tereza',
		translation: { en: 'What else do you want?', ru: 'Что ещё Вы хотите?' },
		tokens: [
			tok('Էլ', 'el', { en: 'else', ru: 'ещё' }),
			tok('ի՞նչ', 'inch', { en: 'what', ru: 'что' }),
			tok('եք', 'yek', { en: 'you are', ru: '(Вы)' }),
			tok(
				'ուզում։',
				'uzel',
				{ en: 'want', ru: 'хотите' },
				{
					en: 'Same participle; the auxiliary moved ahead of it here.',
					ru: 'То же причастие; вспомогательный глагол здесь встал перед ним.'
				}
			)
		]
	},
	{
		speaker: 'dmitrii',
		translation: { en: 'I want milk and cheese.', ru: 'Я хочу молоко и сыр.' },
		tokens: [
			tok('Ես', 'yes'),
			tok('ուզում', 'uzel', { en: 'want', ru: 'хочу' }),
			tok('եմ', 'em', { en: 'am', ru: '(я)' }),
			tok('կաթ', 'kat', { en: 'milk', ru: 'молоко' }, INDEFINITE),
			tok(
				'ու',
				'u',
				{ en: 'and', ru: 'и' },
				{
					en: 'Spoken Armenian joins two nouns with ու, not և — no special flavour, just the everyday form.',
					ru: 'В разговоре между двумя существительными обычно говорят ու, а не և — никакого оттенка, просто устная форма.'
				}
			),
			tok('պանիր։', 'panir', { en: 'cheese', ru: 'сыр' }, INDEFINITE)
		]
	},
	{
		speaker: 'tereza',
		translation: { en: 'This milk, or that milk?', ru: 'Это молоко или то молоко?' },
		tokens: [
			tok(
				'Այս',
				'ays',
				{ en: 'this', ru: 'это' },
				{
					en: 'The milk nearer the shopkeeper.',
					ru: 'Молоко, которое ближе к продавцу.'
				}
			),
			tok(
				'կա՞թը,',
				'kat',
				{ en: 'the milk', ru: 'молоко (это)' },
				{
					en: 'Definite -ը plus the question mark on the stressed syllable.',
					ru: 'С определённым артиклем -ը — конкретное молоко, на которое показывает продавец; знак ՞ на ударном слоге делает это вопросом.'
				}
			),
			tok(
				'թե՞',
				'te',
				{ en: 'or', ru: 'или' },
				{
					en: 'Carries a ՞ of its own: each half of the choice is asked.',
					ru: 'Знак ՞ стоит и здесь: в вопросе «это или то?» интонация поднимается на обоих вариантах.'
				}
			),
			tok('այդ', 'ayd', { en: 'that', ru: 'то' }),
			tok(
				'կաթը։',
				'kat',
				{ en: 'the milk', ru: 'молоко (то)' },
				{
					en: 'Definite -ը, no question mark this time.',
					ru: 'Тоже с артиклем -ը — второе, конкретное молоко; знака ՞ на нём уже нет.'
				}
			)
		]
	},
	{
		speaker: 'dmitrii',
		translation: { en: 'This milk and that cheese.', ru: 'Это молоко и тот сыр.' },
		tokens: [
			tok('Այս', 'ays', { en: 'this', ru: 'это' }),
			tok(
				'կաթը',
				'kat',
				{ en: 'the milk', ru: 'молоко (это)' },
				{
					en: 'Definite -ը.',
					ru: 'С артиклем -ը — то молоко, которое он выбрал.'
				}
			),
			tok('և', 'yev', { en: 'and', ru: 'и' }),
			tok(
				'այդ',
				'ayd',
				{ en: 'that', ru: 'тот' },
				{
					en: 'Near you — the cheese by the shopkeeper.',
					ru: 'Рядом с собеседником — сыр стоит у продавца.'
				}
			),
			tok(
				'պանիրը։',
				'panir',
				{ en: 'the cheese', ru: 'сыр (тот)' },
				{
					en: 'Definite -ը.',
					ru: 'С артиклем -ը — тот самый сыр.'
				}
			)
		]
	},
	{
		speaker: 'tereza',
		translation: { en: 'What else do you want?', ru: 'Что ещё Вы хотите?' },
		tokens: [
			tok(
				'Էլ',
				'el',
				{ en: 'else', ru: 'ещё' },
				{
					en: 'The same question as before — a shopkeeper’s refrain.',
					ru: 'Тот же вопрос, что и в начале: продавец задаёт его после каждой покупки.'
				}
			),
			tok('ի՞նչ', 'inch', { en: 'what', ru: 'что' }),
			tok('եք', 'yek', { en: 'you are', ru: '(Вы)' }),
			tok('ուզում։', 'uzel', { en: 'want', ru: 'хотите' })
		]
	},
	{
		speaker: 'dmitrii',
		translation: { en: 'Eggs, please.', ru: 'Яйца, пожалуйста.' },
		tokens: [
			tok(
				'Ձու,',
				'dzu',
				{ en: 'eggs', ru: 'яйца' },
				{
					en: 'Several eggs, but the noun stays singular: ձու, not ձվեր. Armenian uses the bare singular for a kind of thing or an unspecified amount, the way English does with “bread”.',
					ru: 'Яиц несколько, а слово стоит в единственном числе: ձու, а не ձվեր. Так в армянском говорят о продукте вообще, не считая штуки.'
				}
			),
			tok(
				'խնդրում',
				'khndrel',
				{ en: 'please', ru: 'пожалуйста' },
				{
					en: 'խնդրում եմ, literally “I ask” — the everyday “please”.',
					ru: 'խնդրում եմ, буквально «прошу» — обычное «пожалуйста».'
				}
			),
			tok('եմ։', 'em', { en: '(I)', ru: '(я)' })
		]
	},
	{
		speaker: 'tereza',
		translation: { en: 'And meat?', ru: 'А мясо?' },
		tokens: [
			tok('Իսկ', 'isk', { en: 'and', ru: 'а' }),
			tok(
				'մի՞ս։',
				'mis',
				{ en: 'meat', ru: 'мясо' },
				{
					en: 'A one-word question: the ՞ alone makes it “and meat?”.',
					ru: 'Вопрос из одного слова: достаточно знака ՞ — «а мясо?».'
				}
			)
		]
	},
	{
		speaker: 'dmitrii',
		translation: { en: "No, I don't want meat.", ru: 'Нет, я не хочу мясо.' },
		tokens: [
			tok('Ոչ,', 'voch', { en: 'no', ru: 'нет' }),
			tok('ես', 'yes'),
			tok('միս', 'mis', { en: 'meat', ru: 'мясо' }, INDEFINITE),
			tok('չեմ', 'chem', { en: 'am not', ru: 'не (я)' }),
			tok(
				'ուզում։',
				'uzel',
				{ en: 'want', ru: 'хочу' },
				{
					en: 'Negation lands on the auxiliary, not the participle.',
					ru: 'Отрицание — на вспомогательном глаголе (չեմ), а не на причастии.'
				}
			)
		]
	},
	{
		speaker: 'tereza',
		translation: { en: 'This fish is good. Do you want it?', ru: 'Эта рыба хорошая. Хотите?' },
		tokens: [
			tok('Այս', 'ays', { en: 'this', ru: 'эта' }),
			tok('ձուկը', 'dzuk', { en: 'the fish', ru: 'рыба (эта)' }, DEFINITE_ITEM),
			tok(
				'լավն',
				'lav',
				{ en: 'good', ru: 'хорошая' },
				{
					en: 'The article -ը sounds as -ն before a vowel — here է. It sits on the adjective because the subject is a specific fish: in Armenian, a predicate adjective often takes the article too. It changes nothing in translation — just “good”.',
					ru: 'Артикль -ը перед гласной (здесь է) звучит как -ն. А стоит он на прилагательном потому, что подлежащее конкретное — «эта рыба»: в армянском прилагательное-сказуемое часто тоже получает артикль. На перевод это не влияет — просто «хорошая».'
				}
			),
			tok('է։', 'e', { en: 'is', ru: '(она)' }),
			tok(
				'Ուզո՞ւմ',
				'uzel',
				{ en: 'want', ru: 'хотите' },
				{
					en: 'The ՞ sits on the verb this time: the whole question is “do you want (it)?”.',
					ru: 'Здесь ՞ стоит на глаголе — вопрос целиком «хотите?».'
				}
			),
			tok('եք։', 'yek', { en: 'you (do)', ru: '(Вы)' })
		]
	},
	{
		speaker: 'dmitrii',
		translation: { en: 'Yes, I want this fish.', ru: 'Да, я хочу эту рыбу.' },
		tokens: [
			tok(
				'Այո՛,',
				'ayo',
				{ en: 'yes', ru: 'да' },
				{
					en: 'With the emphasis mark again — he has made up his mind.',
					ru: 'Снова с ударным знаком ՛ — решительное «да».'
				}
			),
			tok('ես', 'yes'),
			tok('ուզում', 'uzel', { en: 'want', ru: 'хочу' }),
			tok('եմ', 'em', { en: 'am', ru: '(я)' }),
			tok('այս', 'ays', { en: 'this', ru: 'эту' }),
			tok('ձուկը։', 'dzuk', { en: 'the fish', ru: 'рыбу (эту)' }, DEFINITE_ITEM)
		]
	},
	{
		speaker: 'tereza',
		translation: { en: 'What else?', ru: 'Что ещё?' },
		tokens: [
			tok(
				'Էլ',
				'el',
				{ en: 'else', ru: 'ещё' },
				{
					en: 'The clipped form of էլ ի՞նչ եք ուզում (“what else do you want?”) — what you actually hear at a counter.',
					ru: 'Сокращённое էլ ի՞նչ եք ուզում («что ещё вы хотите?») — так обычно и говорят у прилавка.'
				}
			),
			tok('ի՞նչ։', 'inch', { en: 'what', ru: 'что' })
		]
	},
	{
		speaker: 'dmitrii',
		translation: { en: 'Coffee. I want coffee.', ru: 'Кофе. Я хочу кофе.' },
		tokens: [
			tok(
				'Սուրճ։',
				'surch',
				{ en: 'coffee', ru: 'кофе' },
				{
					en: 'One word is a full answer. No article: naming the kind of thing, like ձու above.',
					ru: 'Ответ одним словом. Без артикля — кофе вообще, как ձու выше.'
				}
			),
			tok('Ես', 'yes'),
			tok('ուզում', 'uzel', { en: 'want', ru: 'хочу' }),
			tok('եմ', 'em', { en: 'am', ru: '(я)' }),
			tok(
				'սուրճ։',
				'surch',
				{ en: 'coffee', ru: 'кофе' },
				{
					en: 'Indefinite again: “some coffee”.',
					ru: 'Снова без артикля — просто «кофе», без уточнения, сколько.'
				}
			)
		]
	},
	{
		speaker: 'tereza',
		translation: { en: 'Anything else?', ru: 'Что-нибудь ещё?' },
		tokens: [
			tok(
				'Ուրիշ',
				'urish',
				{ en: 'other', ru: 'другое' },
				{
					en: 'ուրիշ բան, “another thing” — together with ուզո՞ւմ եք, the shopkeeper’s “anything else?”.',
					ru: 'ուրիշ բան — «что-нибудь ещё»; вся фраза — обычный вопрос продавца «Что-нибудь ещё?».'
				}
			),
			tok('բան', 'ban', { en: 'thing', ru: 'что-нибудь' }),
			tok('ուզո՞ւմ', 'uzel', { en: 'want', ru: 'хотите' }),
			tok('եք։', 'yek', { en: 'you (do)', ru: '(Вы)' })
		]
	},
	{
		speaker: 'dmitrii',
		translation: { en: 'No, thank you.', ru: 'Нет, спасибо.' },
		tokens: [
			tok('Ոչ,', 'voch', { en: 'no', ru: 'нет' }),
			tok('շնորհակալություն։', 'shnorhakalutyun', { en: 'thank you', ru: 'спасибо' })
		]
	},
	{
		speaker: 'tereza',
		translation: { en: 'All right. Thank you too.', ru: 'Хорошо. И Вам спасибо.' },
		tokens: [
			tok(
				'Լավ։',
				'lav',
				{ en: 'all right', ru: 'хорошо' },
				{
					en: 'As a reply on its own: “fine, all right”.',
					ru: 'Как самостоятельный ответ: «хорошо, ладно».'
				}
			),
			tok('Ձեզ', 'dzez', { en: 'to you', ru: 'Вам' }),
			tok(
				'էլ',
				'el',
				{ en: 'too', ru: 'и (тоже)' },
				{
					en: '“Too”: thanks to you as well.',
					ru: '«Тоже» — «и вам спасибо».'
				}
			),
			tok('շնորհակալություն։', 'shnorhakalutyun', { en: 'thank you', ru: 'спасибо' })
		]
	},
	{
		speaker: 'dmitrii',
		translation: { en: 'Goodbye.', ru: 'До свидания.' },
		tokens: [tok('Ցտեսություն։', 'tstesutyun', { en: 'goodbye', ru: 'до свидания' })]
	}
];
