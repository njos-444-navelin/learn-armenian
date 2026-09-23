---
name: word-library
description: Adding or editing words, vocabulary decks and word comments in the Armenian word library. Use when adding an entry to entries.ts, building a new deck, writing or revising a word's global or cardOnly comment, or adding a dialogue token's here remark. Triggers - add a word, new deck, word comment, entries.ts, review page, wordCount, global comment, card-only.
---

# Adding and editing words

Read [docs/WORDS.md](../../../docs/WORDS.md) and [Conventions §10](../../../docs/CONVENTIONS.md) before writing anything. The thirteen rules for comment prose are in [DIALOGUES.md, "Word comments"](../../../docs/DIALOGUES.md#word-comments-global-card-only-and-the-here-remark) — read them in full the first time in a session; they are the part most often got wrong.

## The rule everything else hangs off

One word, one entry in `src/lib/content/words/entries.ts`, one clip. Decks, alphabet examples and dialogue tokens all point at it by id. **Never add a second entry to make a word available somewhere new** — a different meaning in context is a token `gloss` or a comment, not a new id.

So: before drafting, search `entries.ts` for the word. The alphabet examples already cover many everyday nouns, and a new deck's comment belongs on that existing entry.

## Adding words

On a branch named for the deck:

1. **Draft the entries** in `entries.ts` under a `// --- Section ---` header: `armenian`, `translation`, `register`, `global`, `cardOnly`. Read the greetings and verbs decks first and match their voice.
2. **Add the deck file** `content/vocabulary/decks/<id>.ts` (the ordered id list) and the catalog entry with its `wordCount`. The count is checked at load and the practice counts subtract from it, so a drifted number promises words that don't exist.
3. **Edit the comments on the review page**, not in the editor — they can only be judged next to the ones they sit between:

```sh
node scripts/words/notes.js    # http://localhost:4747/?deck=<id>
```

Its diff is the review. `armenian`, `register`, id and order stay edited in the file.

4. **Voice every new word** in the same change — see the `pronunciation-audio` skill. A word without its clip fails silently on tap; there is no fallback (Conventions §11).

## When a save is refused

`entries.ts` runs its own checks at module load, and the review page re-imports after every save and rolls back on a throw. A refusal is the file telling you the prose broke a rule — situational wording, a lowercase Armenian opening, an arrow or emoji, «на слове», a Latin letter inside a Cyrillic word. Read the message and fix the sentence; don't work around the check.

## Global, card-only, or here

- **global** — what the word _is_. Shows in every popover, so it must hold in any sentence and never quotes a phrase.
- **cardOnly** — when it's used, the phrase it makes. Card and trainer only; may quote.
- **here** — this one occurrence in this one line. Lives on the dialogue token.

The test is the popover: would this help someone who just tapped the word in a line? Grammar does. Advice on when to say it doesn't.
