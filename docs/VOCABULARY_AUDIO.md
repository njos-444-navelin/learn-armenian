# Vocabulary pronunciation audio

Every [`VocabularyWord`](../src/lib/content/vocabulary/types.ts) is voiced —
a "loudspeaker" button next to its Armenian text
([`SpeakerButton.svelte`](../src/lib/components/SpeakerButton.svelte)) plays a
pre-generated audio clip of that exact word. It appears in two places: the
deck's word list ([`VocabularyWordList.svelte`](../src/lib/components/VocabularyWordList.svelte),
the "preview" a learner sees before adding a deck) and the flip-card trainer
([`VocabularyTrainer.svelte`](../src/lib/components/VocabularyTrainer.svelte)).

This doc exists because, like [`docs/AUTH.md`](AUTH.md), most of what makes
this feature actually work happens outside the codebase (an ElevenLabs
generation + an `ffmpeg` transcode) before a file ever reaches git. **If
you're adding a new word to any deck, you need the checklist at the bottom of
this doc — the code has no "missing audio" fallback.**

## Where the files live, and why

Audio ships as plain static files under
[`static/audio/vocabulary/<deckId>/<wordId>.m4a`](../static/audio/vocabulary/),
served straight off Netlify's CDN — the same pipeline that already serves
`static/icons/*`. Not Supabase Storage.

That's the cheaper option for this app specifically: Netlify bandwidth for
static assets is already fully paid for by the existing hosting plan, so a
few more small files cost nothing incremental. Supabase Storage would be a
*new* billable resource (storage + egress) that this project doesn't use for
anything else today, plus bucket/access-policy setup, for no benefit over
what's already free. At this catalog's scale (dozens to low hundreds of
words, a few KB each) the total either way is trivial — "cheaper" mostly
just resolves to "which pipeline is already free," and that's the static
route.

It also fits the app's existing shape better:
- Matches [Conventions §10](CONVENTIONS.md#10-vocabulary-decks-are-code-split-and-always-capitalized) —
  audio ships alongside its deck's code, reviewable in a PR diff, versioned
  in git like everything else under `src/lib/content/vocabulary/`.
- No auth/signed-URL complexity — a `<audio src>` just points straight at
  the file.
- **Deliberately not added to the PWA's offline precache list**
  (`workbox.globPatterns` in [`vite.config.ts`](../vite.config.ts)). That
  list is global — every file matching it gets downloaded on first install,
  for every visitor, regardless of which deck they ever open. Precaching
  audio would silently defeat the whole point of `loadDeckWords()`'s
  per-deck code-splitting (Conventions §10): a learner who never opens
  "Greetings" would still download all its pronunciation clips. Audio is
  fetched on demand instead, same as a deck's words — normal HTTP/browser
  caching handles repeat plays.

## Encoding

**AAC-LC in an `.m4a` container, mono, 24kHz, 32kbps CBR.** A ~1-second word
comes out to roughly 4–6KB.

```sh
ffmpeg -i <input> -ac 1 -ar 24000 -c:a aac -b:a 32k -movflags +faststart <deckId>/<wordId>.m4a
```

Why this over the obvious alternatives:
- **AAC over MP3**: at this low a bitrate, MP3 (LAME) shows audible
  "underwater"/swishy compression artifacts on speech; AAC-LC stays
  noticeably cleaner at the same bitrate — it's a better fit for "reasonably
  good, not pristine" than MP3 is.
- **AAC over Opus**: Opus is more efficient bit-for-bit, but has had
  inconsistent `<audio>` support in Safari/iOS historically. AAC/`.m4a` has
  universal support across every browser/OS this app targets, no fallback
  `<source>` needed.
- **Mono, 24kHz, 32kbps**: a single spoken word doesn't need stereo or a
  44.1kHz sample rate — halving/quartering those relative to "full quality"
  defaults costs nothing perceptible for speech-only content this short,
  while meaningfully shrinking every file.
- **No silence trimming**: tested (`silenceremove`) and rejected — at a
  threshold loose enough to be safe, it barely trims anything; at a
  threshold that trims meaningfully, it risks clipping soft
  leading/trailing consonants. Files are already ~5KB either way, so the
  byte savings aren't worth the quality risk.

## Voice and model

Generated via the ElevenLabs MCP connector's `creative_generate_speech`
tool, using the workspace's **"Temporary Armenian voice before we create one
with Tereza"** voice (`labels.language: hy`) — a placeholder until a proper
Armenian voice is recorded with Tereza. **Its voice `voice_id` is not
stable** — it's been regenerated at least twice already (each time by
deleting and redoing it in the ElevenLabs dashboard: once because an
English-language design prompt gave it a heavy English accent, once to
adjust the personality/pronunciation description). Always look it up by
name via `creative_list_voices` rather than hardcoding an id anywhere.

**Model: `eleven_v3`, not `eleven_multilingual_v2`.** The catalog was
originally generated with `eleven_multilingual_v2` (the connector's default
recommendation for multilingual text), but it turned out to mangle longer,
phonetically complex Armenian words — confirmed on `Հաջողություն`
("Good luck"), which came out badly garbled while short common words like
`Բարև` sounded fine. Regenerating that same word with the same voice but
`eleven_v3` fixed it, so the whole catalog was redone on `eleven_v3`. If a
future word sounds off, don't assume it's the voice — try `eleven_v3` first
(and if you're not already on it, that's the bug).

**When the permanent voice is recorded, every existing `.m4a` file needs
regenerating with the new `voice_id`** — there's no per-word tracking of
which voice generated which file, so treat a voice swap as "redo the whole
catalog," not an incremental migration. Same goes for any future accidental
deletion/recreation of the temporary voice in the dashboard — that also
silently changes the `voice_id`, even when the name and design prompt stay
identical.

## ⚠️ VERY IMPORTANT: word-initial "Ո" is pronounced "vo", not "o"

Armenian orthography has a rule ElevenLabs' TTS does not know: a
**word-initial "Ո" is pronounced /vo/, not /o/.** `Ոնց` ("how?", informal) is
pronounced "vonts" — not "onts". `Որ` ("which/that") is "vor", not "or". This
holds for essentially every word that starts with a standalone "Ո".

Two situations where that does **not** apply — leave these alone:
- **The digraph "Ու"** (Ո followed by ւ) is pronounced /u/, not /vo/ or
  /voo/ — e.g. `Ուշ` ("late") is "ush". If a word starts with "Ու" (two
  letters, not one), it's already fine as literally spelled.
- **A few lexical exceptions**: `ով` ("who") and its forms (`ովքեր`,
  "who, pl.") are pronounced "ov", not "vov".

**ElevenLabs reads the literal spelling and gets the general rule wrong** —
it renders a word-initial standalone "Ո" as a flat "o", silently dropping
the "v" sound. Confirmed on `Ոնց` (`vonts`), which first came out as "onts".

**Workaround — respell for the TTS prompt only, never for the word itself:**
when generating audio for a word starting with a standalone "Ո" (not "Ու",
not one of the `ով`/`ովքեր` exceptions), swap that first "Ո" for "Վ" in the
`prompt` you send to `creative_generate_speech` — e.g. generate `vonts`
with the prompt `Վոնց`, not `Ոնց`. Discard that respelling immediately
after — the deck file's `armenian` field and everything the learner sees
must keep the correct, real spelling (`Ոնց`). "Վ" is unambiguously /v/ to
the TTS engine and reliably restores the sound it otherwise drops.

**Always listen to the result of any word starting with "Ո"** before
treating its audio as done — this is a TTS engine bug, not something
catchable by reading the code or the source text.

## Adding audio for a new word

Do this every time a word is added to any deck file under
`src/lib/content/vocabulary/decks/`. Ask Claude to do it, or follow the same
steps by hand:

1. Look up the current voice: `creative_list_voices` (search
   `"Temporary Armenian"`), grab its `voice_id`.
2. Generate: `creative_generate_speech` with `prompt` = the word's exact
   `armenian` field value (capitalized, per Conventions §10) — **except
   words starting with a standalone "Ո", which need the "Ո"→"Վ" prompt
   respelling above** — `model_id: "eleven_v3"`, that `voice_id`,
   `generations_count: 1` (one take is enough — this is a fixed reference
   clip, not a creative pick).
3. Poll `creative_get_flow_run_status` with the returned `flow_id` +
   `session_ids` until `all_completed`, then take the `media[].url`.
4. Download it, then transcode with the exact `ffmpeg` command above.
5. Save as `static/audio/vocabulary/<deckId>/<wordId>.m4a` — `deckId` is the
   deck file's basename (e.g. `greetings`), `wordId` is the word's `id`
   field. No code change needed beyond the deck file itself —
   [`wordAudioSrc()`](../src/lib/content/vocabulary/audio.ts) derives the
   path from those two ids.
6. Commit the `.m4a` file alongside the deck data change.

**Known constraint:** the ElevenLabs workspace's free tier hit a very low
daily generation cap in practice (a handful of generations/day) before it
was upgraded to a paid plan — if generation starts failing with a
`free_tier_...` rate-limit error, that's the workspace plan, not a bug here.

### Current coverage

As of 2026-08-16, every word in `greetings.ts` (all 20) has its audio file,
generated with `eleven_v3` — that deck is complete. Any deck added after it
starts from zero and needs the same treatment before it's considered done.
