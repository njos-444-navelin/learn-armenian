# Dialogues

Short two-person conversations, each built around one grammar rule. This covers the content model, the player, progress, and the line-audio checklist.

## The two characters

**Tereza** and **Dmitrii**, defined once in [`characters.ts`](../src/lib/content/dialogues/characters.ts). They are the same two people as the app's two ElevenLabs voices, so a line shown as Tereza's is spoken by Tereza's voice. Each has one drawn avatar in [`CharacterAvatar.svelte`](../src/lib/components/CharacterAvatar.svelte) — deliberately not photos. Every dialogue is between the two; there is no third speaker. Their names go through `Translated`, since they transliterate per locale.

## Content model — one word library, referenced by id

**A dialogue never defines or records a word** ([Conventions §10](CONVENTIONS.md#10-words-live-in-one-shared-library-decks-and-dialogues-reference-it-by-id)). It is two files:

- A catalog entry in [`catalog.ts`](../src/lib/content/dialogues/catalog.ts): id, title and translation, the rule's headline forms, duration, line count. Safe to import anywhere.
- A content file, `dialogues/<id>.ts`, exporting `RULE` and `LINES`. Loaded lazily through `loadDialogue()`, never imported directly (enforced by eslint).

Each line is a speaker, a translation and **tokens** — the words as spoken:

```ts
// text, library word id, gloss for this line, `here` remark for this line
tok(
	'հա՞ցը։',
	'hats',
	{ en: 'the bread', ru: 'хлеб (этот)' },
	{
		en: 'Definite -ը. The ՞ marks the syllable the voice lifts for a question.',
		ru: '...'
	}
);
```

- `text` is the surface form verbatim, in the line's real casing — the one place Armenian isn't capitalized, since this _is_ running text.
- `wordId` points at the library entry the token is a form of. The popover shows the base form and plays the library's one clip for it.
- `gloss` is optional and contextual: the meaning _in this line_, where it differs from the library translation. Falls back to that translation.

`loadDialogue()` throws on a `wordId` the library lacks and on a `lineCount` mismatch, so a content typo fails on first load rather than shipping as an untappable word.

**Adding a dialogue:** write the content file, add the catalog entry, add any missing library words (with their clips, per [VOCABULARY_AUDIO.md](VOCABULARY_AUDIO.md)), then record the lines.

### Word comments: global, card-only, and the "Here:" remark

|                | `Word.global`                                                              | `Word.cardOnly`                                   | `DialogueToken.here`                          |
| -------------- | -------------------------------------------------------------------------- | ------------------------------------------------- | --------------------------------------------- |
| **What it is** | What the word _is_: case, mood, an extra sense, a look-alike to keep apart | When and to whom it's said, the greeting it makes | This occurrence: why the -ը, where the ՞ sits |
| **Shows**      | Everywhere: card, trainer, every popover                                   | Card and trainer only, never a dialogue           | This token only, under an italic _Here:_      |

Card-only exists because the card is where the learner meets a word with no sentence around it, and a phrase is often the whole reason it's in the deck (Լույս is in greetings for բարի լույս). In a dialogue the line _is_ the usage, so a phrase the learner isn't reading right now is noise; when a line _is_ that phrase, it's a `here`.

The popover reads gloss → dictionary entry with its global comment → _Here:_. The play button sits on the entry row, because the clip says the base form.

There is no per-token override of a global comment. If it would mislead in some line, it's wrong — fix it, or it was card-only all along.

**Global or card-only?** Global holds in any sentence: a case, a mood, an auxiliary, an extra sense, a look-alike (Գնալ / Գնել differ by one letter everywhere). Card-only is when it's used. The test is the popover: would this help someone who just tapped the word in a line? Grammar does; advice on when to say it, and phrases it isn't in right now, don't.

**Rules for both library comments:**

1. **One sentence, two at most, one fact each.** Three facts stacked with dashes and semicolons is two comments or one fact fewer. Read the greetings and verbs decks before writing new ones; they should read as one hand.
   - Neutral register, no slang glosses — the translation carries the meaning.
   - Hedge a frequency claim: "more often specifically a man", not "often".
   - A comparison with the reader's language opens the sentence, and is made once: «Как и в русском, так называют и любого пожилого мужчину».
   - English and Russian mirror each other's _frame_ while staying written for their own reader (rule 12).
   - A fact about the language is not a comment on a word. "Armenian has no general word for aunt" is true of the family, not of Մորքուր.
   - A comment that's only a fun fact goes. Does it say something the translation doesn't _and_ that the learner needs?
2. **Don't restate the translation.** Start with what it doesn't say. A card-only comment about a phrase opens straight on it: "E.g. բարի օր — a formal "good day"".
3. **Name the grammar**: "the dative case of դուք", "imperative mood" — not "what makes բարև ձեզ polite".
4. **Extra senses read "Also means …"**, the senses in quotes, nothing about how many there are.
5. **Don't explain a word with another new word, and never name a formal/informal counterpart.** The other word may appear as the _object_, mid-sentence, once the sentence is already about this word: "The ending -իկ makes the word մայր soft and affectionate", never bare մայր as the subject. A cross-reference earns its place only when it _is_ the fact — a root, a look-alike, a clipped form. The `register` tag is the whole signal for a counterpart; a _phrase_'s register is stated inline with the article ("an informal "good evening""), and the word carries no `register` when the split belongs to the greeting rather than the word.
6. **Examples are lowercase; the sentence still starts with a capital** — an Armenian word included: "Բարի գիշեր — "good night" — is a goodbye". `entries.ts` throws on a comment opening with a lowercase Armenian letter. Russian keeps its own orthography for the polite address («кто Вас обслуживает»), which is not an example.
7. **No pronunciation.** How Ո reads word-initially is the alphabet trainer's lesson.
8. **No extra forms.** Don't introduce an inflection the learner hasn't met — an unseen imperative is a second lesson smuggled into a footnote. Forms of the word the learner is actually looking at are fine.
9. **True of the word in any sentence.** If it's only true here, it's a `here`. `entries.ts` throws on "here", "this time", "the shopkeeper" and the like — a tripwire for the phrasings that slipped through, not a definition of "general". The same check runs over `cardOnly`.
10. **A global comment never quotes a phrase.** The tapped line is the example, and a quoted phrase either coincides with a line — so the comment reads as a remark about that line — or brings in unmet words. Card-only may quote; that's its job. A comment describing the grammar of the _language_ rather than this word belongs on a `here` at the first token that shows it, or on a rule card.
11. **Only words the learner has**, and plain English/Russian around them.
12. **Write each language for its own reader, never translate one into the other.** English has no polite plural "you", so Եք's English spells it out where Russian only needs "как в русском". Russian drops the copula, so «է — есть» needs framing that "is" doesn't.

    **The sentence is traced as easily as the content.** «-ի на слове տավար» is English construction in Russian words; Russian says «в конце слова». It survives a read-through and only fails read aloud — so read the Russian aloud, without the English in front of you. `entries.ts` throws on «на слове» as a tripwire for the one calque that got through; it can't catch the next.

    **A comment may be written in one language only**, when a fact is worth stating to one reader and not the other — Թթվասեր's «Буквально «кислые сливки»» has no English counterpart worth writing. The other reader sees nothing, which beats a sentence written for somebody else. Half of a comment both readers want is unfinished, not this.

13. **Set like a sentence in a book.** Ordinary punctuation and words for everything else: "տղա and մարդ", not "տղա + մարդ"; "as mother becomes mum", not "mother → mum". `entries.ts` throws on arrows, plus signs and emoji; a slash between alternatives is ordinary typography.

Comments are read and edited on the review page, not in `entries.ts` — see [WORDS.md](WORDS.md).

**Rules for a `here` remark:**

1. It is about _this_ occurrence, and would be wrong or odd on another.
2. It is the place for phrases and idioms. Any Armenian phrase it quotes gets its translation in brackets right there — the reader may be on their first dialogue. Lowercase, both halves.
3. It doesn't restate the global comment; it adds the exception, the reason for the form in this line.

**Before adding a dialogue**, go through every token with a remark: _Is this true of the word everywhere?_ → global comment. _Does it quote a phrase or use words the learner lacks?_ → `here`, or cut. _Does the global comment now read as a remark about this line?_ → rewrite it.

## The player

[`DialoguePlayer.svelte`](../src/lib/components/DialoguePlayer.svelte), one [`DialogueLineBubble.svelte`](../src/lib/components/DialogueLineBubble.svelte) per line, [`DialogueRuleCard.svelte`](../src/lib/components/DialogueRuleCard.svelte) on top.

- **Listen vs Read.** Listen (the default) blurs each line's Armenian — present so revealing never reflows, but `aria-hidden` with its word buttons disabled — with a per-line eye button. Read shows everything. Once a line is readable its translation can be toggled and its words are tappable. Tappable words carry no resting mark, so a hint above the transcript says they're tappable; it never empties, because clearing it on the first tap shifted the transcript under the learner's finger. Tapping Listen re-blurs every line, eye-revealed ones included — hence a `click` listener, since an already-checked radio fires no `change`.
- **Playback** is [`DialoguePlayback`](../src/lib/dialogues/playback.svelte.ts): one `<audio>` per line, one playing at a time, every clip fetched as soon as the player is on the client and the tappable words' clips warmed into the HTTP cache. One element per line rather than a swapped `src`, which drops the buffer. "Play all" walks from the cursor to the end with a short gap. The bar switches to its in-progress layout on the first line played, keyed off `started` rather than `cursor > 0` — playing line 1 alone leaves the cursor at 0. A generation counter stops a stale `ended` advancing the cursor.
- **Missing line clips are fixed-length silence**, so the flow can be exercised before a dialogue's clips exist. Same fail-silently rule as `SpeakerButton`: a missing clip is found by listening, not by the app.
- **The word popover** hangs under its word and shifts to stay in the viewport. It closes on an outside click, on Escape, and on switching to Listen. Opened words are collected once each for the done screen's recap.
- **Motion** is fade-dominant and low-travel (4px rises, no slides), all of it collapsed under reduced motion.

## Design decisions

- **Avatars are drawn faces, not photos**, in two ramps only — skin from `--color-accent-300`, everything else neutral — so the pair reads as part of the palette rather than clip art on top of it.
- **Dmitrii is on the right with a tinted bubble, Tereza on the left on plain surface.** Which side a character takes is the player's call, not the line's.
- **Expanding sections animate height natively** (`interpolate-size: allow-keywords`), on an always-rendered element toggled by a class with `inert` while collapsed, so it animates closed too. Firefox and Safari snap; accepted, no JS fallback. Gotcha: a column flex item's `min-height: auto` silently beats `height: 0`.
- **The word popover animates out as well as in**, which needs a Svelte transition — a CSS entrance animation left it vanishing on close.
- **"Mark it done" lifts on hover** via `Button`'s `lift`, though it's a sage variant: it's the screen's one commit action. The mockup's 1.2° tilt was dropped so every lifting button behaves identically.
- **The commit button has two states, and only one commits.** Not done: the `success-soft` variant that posts `complete`. Done: solid `success`, no lift, and tapping it opens a confirm to take the dialogue back off the list. Both share one checkmark passed as `Button`'s `icon`, so the spinner replaces it rather than lining up beside it (see `Button.svelte`).
- **Under 420px the mode toggle is icons only** — a 360px phone can't fit two labels, the stop button and the counter, and «Читать» was clipped mid-word. Labels are kept for assistive tech.
- **The per-line reveal/translate buttons are 2rem, under the 44px floor.** Two stack inside a bubble sized by one line of text; the play button and the words are the line's real affordances and meet the floor. Don't "fix" it by growing the bubbles.
- **Signed-out learners can play everything.** Only "mark it done" is gated, and it resumes after sign-in rather than losing the tap.

## Progress

"Mark it done" upserts a row in `user_dialogue_progress`. Re-completing bumps `completions` rather than adding a row, so "N of M completed" is a row count, filtered to ids still in the catalog so a removed dialogue can't push completed past total. The confirm behind "Already done" posts `uncomplete`, which deletes the row — "no row = not completed" is the table's convention, and `completions` has a `>= 1` check. `uncomplete` isn't `resume`-gated: only a signed-in learner sees the button.

The done screen shows the tapped-word recap and a "Next" button for the following catalog entry.

## Line audio

A line is a unique recording — a whole sentence, one voice, sentence intonation — so it's stored per dialogue at `static/audio/dialogues/<dialogueId>/<nn>.m4a`, `nn` being the 1-based line number zero-padded. The words inside a line are never re-recorded.

### Record each speaker's whole part in ONE generation

Never generate a line at a time: every call is an independent draw of timbre and energy, so eleven separately-generated lines are eleven slightly different voices, and the dialogue sounds assembled from different sessions. Put all of one speaker's lines in a single prompt separated by blank lines, generate a couple of takes, and pick a _read_, not a line. Mixing lines from two reads of the same prompt is fine by ear.

A whole-part read also lands within ±1 dB of the speaker's shipped mean with a single gain; standalone takes came out ~3 dB hotter and needed per-take gain.

**Redoing one line: sandwich it.** Generate it as the middle line of a three-line prompt and cut the throwaways out, so the voice stays in its warmed-up mode. A line re-recorded truly standalone matches on paper — level, breath, format — and still reads as "slightly different quality".

Then cut the read into lines, which is the fiddly part:

- **Silence alone can't find the boundaries.** Sentence breaks inside a line are as long as the gaps between lines; in one read the longest gap of all was inside line 01.
- **`<break time="1.5s" />` does nothing** — it's an `eleven_v2` feature that `eleven_v3` silently ignores. Don't spend a generation on it.
- **What works:** pick the N−1 gaps that best fit known line lengths (a shipped clip's duration, or intercept + slope × letters fitted from the known lines — letters alone underestimates a short question badly enough to reject every combination), and **reject any combination putting a segment >45% off**. Three refinements, each of which fixed a real wrong cut:
  - Score by per-segment **relative** error, not cumulative position, which drags every later target once one line is mis-estimated.
  - **A two-sentence line must contain a gap that isn't a boundary** — its sentence break.
  - **Merge two silences separated by a blip under 50 ms**: that's a breath inside a pause, and a cut landing on it puts the breath on the next line.
  - Measure segments **speech-only**, not mid-pause to mid-pause.
- Detect gaps at `silencedetect=noise=-40dB:d=0.06`; `d=0.10` loses real boundaries in fast reads.
- **Transcription is a dead end** — `eleven_scribe_v1` returns the text, its language and one
  total duration, nothing per word, and the connector exposes no forced-alignment tool.
  Re-checked 2026-09-23.

Report the **relative per-segment RMS** with each read (~0.15 on accepted reads) and treat it as a gate, with the two-sentence check as the safety net. Cumulative-position RMS is only as good as the expectations: a correct cut once scored worse than a wrong one. Still listen for a clipped first or last word.

Finally, run each cut line through the trailing-breath trim from [VOCABULARY_AUDIO.md](VOCABULARY_AUDIO.md) — speakers inhale between lines, and that inhale lands at the end of the preceding clip.

### Questions read as statements when the pitch peak lands on the wrong word

Armenian marks a question _inside_ a word with `՞` on the stressed syllable; the sentence still ends in `։`. The natural guess — that the trailing `։` makes the voice fall and kills the question — **is wrong**: the accepted questions all fall at the end, by 0.9 to 5.2 semitones, exactly like the statements.

What separates them is **where the pitch peak sits**. Every accepted question peaks mid-line, on or beside its `՞`-marked word. A line that peaks on the final word carries a listing contour and reads as a statement.

The working rule: **a strong peak (+5 st or so) on the `՞` word is sufficient; failing that, a terminal rise is what rescues the line. Don't ship a question with neither.**

Steering it, in the order to try:

- **A Latin `?` as the terminal** (prompt only — the app text keeps `։`) is the one reliable lever toward a rise, and pulls the peak onto the question word. Caveat: a word-internal `՞` followed by `?` can make the model re-read the word's tail, so drop the `՞` from the prompt in that case. Latin terminal punctuation also weakens the model's commitment to an Armenian reading — re-check the vowels.
- **Doubling the `՞` onto the last word makes it worse.** Measured, twice.
- **`eleven_multilingual_v2` rises where v3 won't.** Three of four standalone v2 takes rose (+3.5 to +6 st) on a wh-question that fell in sixteen v3 takes. Untested caveats: v2 generated ~20 dB quiet, and whether its timbre sits beside v3 lines is unknown. Try it sandwiched first.
- **Wh-questions never rise in context.** Once warmed up, the voice reads `ի՞նչ` as peak-then-fall, which is the textbook Armenian contour; only cold standalone takes rise, and those don't match the read. Yes/no questions rise in most takes with the Latin `?`.
- **`[curious]`** slows the read down but never produced a rise. Useful for a line that's fast but already peaks correctly.
- **A tail pitch-bend (`bend.py`) is a last resort.** It's audible past ~4 st and can't add the shape of a question, only lift the tail.

All of this is prompt-only; the app's text stays orthographically correct, as with the "Ո"→"Վ" respelling.

### Tooling

[`scripts/audio/`](../scripts/audio/): `split_read.py` (gaps → boundaries → gain-matched line clips), `pitch.py` (the peak and terminal numbers), `bend.py` (the tail lift) and `review_page.py` (the single-file audition page). They need `numpy`, `ffmpeg`/`ffprobe`, and `rubberband` compiled into ffmpeg for `bend.py`.

### Steps

1. One `creative_generate_speech` per speaker, `model_id: "eleven_v3"`, `generations_count: 2`, prompt = that speaker's lines joined by blank lines, with the question handling above. Voices: Tereza jan (`B7DEF4tn54LpozCVN7ah`), Lazy Dmitrii (`oNYQkBHg8N8sOXiVNvyU`). The word-initial "Ո"→"Վ" respelling applies inside a line too. **Fire the two calls in separate messages** — five concurrent requests are allowed, and a batch over the limit fails individual generations while still billing them.
2. Split, trim, and transcode with the same `ffmpeg` command as words.
3. Save as `static/audio/dialogues/<dialogueId>/<nn>.m4a` and commit.
4. Listen to every line — nothing in the app reports a missing or wrong clip.
