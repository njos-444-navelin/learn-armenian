# Words

Every word the app shows — vocabulary decks, the alphabet trainer's examples, dialogue tokens — is one entry in [`src/lib/content/words/entries.ts`](../src/lib/content/words/entries.ts), referenced by id (Conventions §10). Ids are one flat namespace.

A word can carry two comments, each in English and Russian:

- `global` — what the word _is_. Shown on its card and in every dialogue popover, so it must be true of the word in any sentence and never quotes a phrase.
- `cardOnly` — when it's used, the greeting it makes. Shown on the card and in the trainer only.

Either may be written in one language alone, when the fact is worth stating to one reader and not the other. Writing rules: [DIALOGUES.md, "Word comments"](DIALOGUES.md#word-comments-global-card-only-and-the-here-remark). Anything true of one line only goes on that token's `here` remark instead.

## The review page

Comments can only be judged next to the ones they sit between, and in `entries.ts` each sits in its own object literal. So they are read and edited on a local page:

```sh
node scripts/words/notes.js     # http://localhost:4747, PORT= to change it
```

Also the `word-comments` entry in [`.claude/launch.json`](../.claude/launch.json).

- Shows every word, grouped by the file's section comments, with six editable fields: translation, `global` and `cardOnly`, each in both languages. The filter box searches Armenian, translations, ids and comments; "Only words with a comment" is on by default. Dialogue `here` remarks belong to a line and are reviewed with the dialogue, so they aren't on the page.
- `?deck=<id>` lists one deck's words in the deck's own order, reused words included, with the comment filter off. The ids come from the deck file, so an id the library lacks is named in red rather than silently dropped.
- _Save_ per card, _Save all_ or <kbd>Ctrl</kbd>/<kbd>⌘</kbd>+<kbd>S</kbd> for the page. Only that entry's `translation`, `global` and `cardOnly` are rewritten. A comment emptied in both languages is removed; one added to a word that had none is inserted. Filling in only one language, or emptying a translation, is refused.
- Each save re-imports `entries.ts`, so the file's own checks run over the result — situational wording, duplicate ids, a lowercase Armenian opening, arrows or emoji, a Latin letter inside a Cyrillic word. If they throw, the write is rolled back and the message shows on the card.
- It binds to localhost, reads the library by importing it the way the app does, and ships nothing. Review its diff like any other content change.

## Adding words

On a branch named for the deck:

1. **Draft every entry** in `entries.ts` under its own `// --- Section ---` header: translation, `register`, `global`, `cardOnly`. Read the existing decks' comments first and match them — short plain statements about this word, one fact per sentence, neutral register, never opening with a different word. Check whether the word already exists before adding it: the alphabet examples already cover many everyday nouns, and a new deck's comment goes on that existing entry rather than on a near-duplicate id.
2. **Add the deck file** (`decks/<id>.ts`, the ordered id list) and the catalog entry, with its `wordCount`. A deck with no fitting icon adds one to `VocabularyDeckIconId` and `VocabularyDeckIcon.svelte`.
3. **Edit the draft** at `http://localhost:4747/?deck=<id>`, saving from the page. That is the editing step, and its diff is the review. The `armenian` spelling, `register`, id and order are edited in the file.
4. **Voice the new words** per [VOCABULARY_AUDIO.md](VOCABULARY_AUDIO.md), in the same branch. The deck can't merge without clips (Conventions §11).
